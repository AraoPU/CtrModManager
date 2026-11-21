'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, execFileSync } = require('node:child_process');
const { app } = require('electron');
const store = require('./store');
const profiles = require('./profiles');
const installer = require('./installer');
const loaders = require('./loaders');

const GAME_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/i;

// 以 Mod 方式启动时默认附加的 Doorstop 参数，{preloader} 会在启动时替换为预加载器路径
const DEFAULT_MOD_LAUNCH_ARGS = loaders.DEFAULT_BEPINEX_LAUNCH_ARGS;

function assertGame(game) {
  if (typeof game !== 'string' || !GAME_PATTERN.test(game)) {
    throw new Error('游戏标识无效');
  }
  return game;
}

function launchStateFile(game) {
  return path.join(app.getPath('userData'), 'launch-state', `${assertGame(game)}.json`);
}

function pathExists(target) {
  try {
    fs.lstatSync(target);
    return true;
  } catch {
    return false;
  }
}

function removeEntry(target) {
  let stat;
  try {
    stat = fs.lstatSync(target);
  } catch {
    return;
  }

  if (stat.isSymbolicLink()) {
    fs.unlinkSync(target);
  } else if (stat.isDirectory()) {
    fs.rmSync(target, { recursive: true, force: true });
  } else {
    fs.rmSync(target, { force: true });
  }
}

// 清理旧版本启动器遗留在游戏目录里的链接/备份文件。
function restoreLegacyLaunchState(game) {
  let state = null;
  try {
    state = JSON.parse(fs.readFileSync(launchStateFile(game), 'utf8'));
  } catch {
    return;
  }

  if (!state || typeof state.gameDir !== 'string' || !Array.isArray(state.entries)) return;

  for (const entry of state.entries) {
    const target = path.join(state.gameDir, entry.name);
    const backup = `${target}.ctr-backup`;

    try {
      removeEntry(target);
    } catch (error) {
      throw new Error(`无法清理旧的启动文件，请先关闭游戏后重试（${error.message}）`);
    }

    if (entry.backup && pathExists(backup)) {
      try {
        fs.renameSync(backup, target);
      } catch (error) {
        throw new Error(`无法恢复旧的游戏文件，请先关闭游戏后重试（${error.message}）`);
      }
    }
  }

  try {
    fs.rmSync(launchStateFile(game), { force: true });
  } catch {
    // Ignore.
  }
}

function findPreloader(profileDir) {
  const coreDir = path.join(profileDir, 'BepInEx', 'core');
  const candidates = [
    'BepInEx.Preloader.dll',
    'BepInEx.Unity.Mono.Preloader.dll',
    'BepInEx.Unity.IL2CPP.dll'
  ];

  for (const candidate of candidates) {
    const fullPath = path.join(coreDir, candidate);
    if (fs.existsSync(fullPath)) return fullPath;
  }

  let entries = [];
  try {
    entries = fs.readdirSync(coreDir);
  } catch {
    // Missing BepInEx.
  }

  const match = entries.find(
    (name) => /preloader.*\.dll$/i.test(name) || /^BepInEx\.Unity\..*\.dll$/i.test(name)
  );

  if (match) return path.join(coreDir, match);
  throw new Error('当前配置缺少 BepInEx 预加载器，请先安装 BepInExPack');
}

function detectSteamAppId(exePath) {
  try {
    let current = path.dirname(exePath);
    let commonDir = null;

    while (true) {
      if (path.basename(current).toLowerCase() === 'common') {
        commonDir = current;
        break;
      }
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }

    if (!commonDir) return null;

    const steamapps = path.dirname(commonDir);
    const gameFolder = path.relative(commonDir, path.dirname(exePath)).split(path.sep)[0];
    if (!gameFolder) return null;

    const manifests = fs
      .readdirSync(steamapps)
      .filter((name) => /^appmanifest_\d+\.acf$/i.test(name));

    for (const manifest of manifests) {
      const content = fs.readFileSync(path.join(steamapps, manifest), 'utf8');
      const installDir = content.match(/"installdir"\s+"([^"]+)"/i);
      if (installDir && installDir[1].toLowerCase() === gameFolder.toLowerCase()) {
        const appId = manifest.match(/(\d+)/);
        if (appId) return appId[1];
      }
    }
  } catch {
    // App ID can be entered manually.
  }

  return null;
}

function readRegistryValue(key, value) {
  try {
    const output = execFileSync('reg', ['query', key, '/v', value], {
      encoding: 'utf8',
      windowsHide: true
    });
    const match = output.match(new RegExp(`${value}\\s+REG_SZ\\s+(.+)`, 'i'));
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

function findSteamRoots() {
  const roots = [];
  const userPath = readRegistryValue('HKCU\\Software\\Valve\\Steam', 'SteamPath');
  if (userPath) roots.push(userPath);

  const machinePath = readRegistryValue(
    'HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam',
    'InstallPath'
  );
  if (machinePath) roots.push(machinePath);

  roots.push(
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Steam'),
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Steam')
  );

  return roots;
}

function findSteamExe() {
  for (const root of findSteamRoots()) {
    const exe = path.join(root, 'steam.exe');
    if (pathExists(exe)) return exe;
  }

  return null;
}

/* ---------- 自动检测游戏安装路径 ---------- */

function normalizeMatchKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function parseManifestField(content, key) {
  const match = content.match(new RegExp(`"${key}"\\s+"([^"]+)"`, 'i'));
  return match ? match[1] : '';
}

// Steam 可能装在任意磁盘，库目录记录在 libraryfolders.vdf 里
function readSteamLibraries() {
  const libraries = [];
  const seen = new Set();

  const add = (dir) => {
    if (!dir) return;
    const key = dir.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    libraries.push(dir);
  };

  for (const root of findSteamRoots()) {
    try {
      if (!fs.statSync(root).isDirectory()) continue;
    } catch {
      continue;
    }

    add(root);

    let content = '';
    try {
      content = fs.readFileSync(path.join(root, 'steamapps', 'libraryfolders.vdf'), 'utf8');
    } catch {
      continue;
    }

    const regex = /"path"\s+"([^"]+)"/gi;
    let match;
    while ((match = regex.exec(content))) {
      add(match[1].replace(/\\\\/g, '\\'));
    }
  }

  return libraries;
}

function steamInstalledApps() {
  const apps = [];

  for (const library of readSteamLibraries()) {
    const steamapps = path.join(library, 'steamapps');
    let names = [];
    try {
      names = fs.readdirSync(steamapps);
    } catch {
      continue;
    }

    for (const name of names) {
      if (!/^appmanifest_\d+\.acf$/i.test(name)) continue;

      let content = '';
      try {
        content = fs.readFileSync(path.join(steamapps, name), 'utf8');
      } catch {
        continue;
      }

      const installDir = parseManifestField(content, 'installdir');
      if (!installDir) continue;

      apps.push({
        name: parseManifestField(content, 'name'),
        dir: path.join(steamapps, 'common', installDir)
      });
    }
  }

  return apps;
}

function epicInstalledApps() {
  const apps = [];
  const manifest = 'C:\\ProgramData\\Epic\\UnrealEngineLauncher\\LauncherInstalled.dat';

  try {
    const data = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    for (const item of data.InstallationList || []) {
      if (!item || typeof item.InstallLocation !== 'string' || !item.InstallLocation) continue;
      apps.push({ name: String(item.AppName || ''), dir: item.InstallLocation });
    }
  } catch {
    // Epic 未安装或清单不可读时忽略
  }

  return apps;
}

const IGNORED_GAME_EXE =
  /^(unins\d*|unitycrashhandler(64)?|crashreportclient(editor)?|dxsetup|vcredist.*|ue4prereqsetup.*|notification_helper|launcherhelper)\.exe$/i;

function findGameExecutable(gameDir, keys) {
  let entries = [];
  try {
    entries = fs.readdirSync(gameDir, { withFileTypes: true });
  } catch {
    return null;
  }

  const exes = entries.filter(
    (entry) => entry.isFile() && /\.exe$/i.test(entry.name) && !IGNORED_GAME_EXE.test(entry.name)
  );
  if (exes.length === 0) return null;

  let best = null;
  let bestScore = -1;

  for (const entry of exes) {
    const key = normalizeMatchKey(entry.name.replace(/\.exe$/i, ''));
    if (!key) continue;

    let score = 0;
    if (keys.includes(key)) {
      score = 100;
    } else {
      for (const candidate of keys) {
        if (!candidate) continue;
        if (key.startsWith(candidate) || candidate.startsWith(key)) {
          score = Math.max(score, 60 - Math.abs(key.length - candidate.length));
        }
      }
    }

    if (score > bestScore) {
      best = entry.name;
      bestScore = score;
    }
  }

  if (!best) return null;
  // 目录里存在多个可执行文件且名称都对不上时，不猜测
  if (bestScore <= 0 && exes.length > 1) return null;
  return path.join(gameDir, best);
}

// 根据 Thunderstore 标识/名称在 Steam、Epic 的已安装游戏里匹配可执行文件
function detectGamePath(game, displayName) {
  const keys = [...new Set([normalizeMatchKey(game), normalizeMatchKey(displayName)])].filter(Boolean);
  if (keys.length === 0) return null;

  const apps = [...steamInstalledApps(), ...epicInstalledApps()];

  const exact = apps.filter((app) => {
    const folderKey = normalizeMatchKey(path.basename(app.dir));
    return keys.includes(folderKey) || keys.includes(normalizeMatchKey(app.name));
  });

  const candidates =
    exact.length > 0
      ? exact
      : apps.filter((app) => {
          const folderKey = normalizeMatchKey(path.basename(app.dir));
          const appKey = normalizeMatchKey(app.name);
          return keys.some(
            (key) =>
              (folderKey && (folderKey.startsWith(key) || key.startsWith(folderKey))) ||
              (appKey && (appKey.startsWith(key) || key.startsWith(appKey)))
          );
        });

  for (const app of candidates) {
    const exeKeys = [...keys, normalizeMatchKey(path.basename(app.dir))].filter(Boolean);
    const exe = findGameExecutable(app.dir, exeKeys);
    if (exe) return exe;
  }

  return null;
}

function fileHash(file) {
  try {
    return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  } catch {
    return null;
  }
}

// ============================================================
// 启动文件同步（参考 r2modman 的 ModLinker）
// 每次启动把 Profile 根目录的文件复制到游戏目录并记录清单；
// 下次启动删掉上一份清单里、当前 Profile 已不需要的文件。
// 这样 BepInEx / MelonLoader / 原版之间切换不会残留对方的注入 DLL。
// ============================================================

// 游戏目录里可能残留的注入文件名：即使没有清单（旧版本管理器），也参与清理
const KNOWN_LOADER_ROOT_FILES = [
  'version.dll',
  'dobby.dll',
  'winhttp.dll',
  'doorstop_config.ini',
  '.doorstop_version'
];
const LINK_IGNORED_ROOT_FILES = new Set([
  'mods.yml',
  '.ds_store',
  'readme.md',
  'changelog.md',
  'license',
  'license.md',
  'license.txt',
  'notice.txt'
]);

function linkedFilesPath(game) {
  return path.join(app.getPath('userData'), 'linked-files', `${game}.json`);
}

function readLinkedFiles(game) {
  try {
    const data = JSON.parse(fs.readFileSync(linkedFilesPath(game), 'utf8'));
    if (Array.isArray(data.files)) return data.files.filter((name) => typeof name === 'string');
  } catch {
    // 没有清单时按空处理
  }
  return [];
}

function writeLinkedFiles(game, files) {
  try {
    const file = linkedFilesPath(game);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ files }, null, 2), 'utf8');
  } catch {
    // 清单写入失败不影响启动
  }
}

// Profile 根目录的文件（目录由各自的加载器逻辑处理，不参与同步）
function profileRootFiles(profileDir) {
  if (!profileDir) return [];
  try {
    return fs
      .readdirSync(profileDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && !LINK_IGNORED_ROOT_FILES.has(entry.name.toLowerCase()))
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

// profileDir 传 null 表示原版启动：清掉上次同步进游戏目录的文件
// 返回失败的条目，调用方据此提示「文件被占用、本次可能加载不到 Mod」
function linkProfileFiles(game, gameDir, profileDir) {
  const desired = profileRootFiles(profileDir);
  const desiredKeys = new Set(desired.map((name) => name.toLowerCase()));
  const previous = readLinkedFiles(game);
  // 没有清单说明是旧版本管理器留下的文件：只在这种情况下额外清理已知注入文件，
  // 之后完全按清单精确清理，不误删游戏自己的文件
  const legacyMigration = !pathExists(linkedFilesPath(game));
  let changed = false;
  const failed = [];

  for (const name of desired) {
    const source = path.join(profileDir, name);
    const target = path.join(gameDir, name);
    try {
      if (pathExists(target) && fileHash(target) === fileHash(source)) continue;
      fs.copyFileSync(source, target);
      changed = true;
    } catch {
      // 单个文件失败不阻塞启动，但要记录下来提示用户
      failed.push(name);
    }
  }

  const cleanup = new Set(previous.map((name) => name.toLowerCase()));
  if (legacyMigration) {
    for (const name of KNOWN_LOADER_ROOT_FILES) cleanup.add(name);
  }

  for (const name of cleanup) {
    if (desiredKeys.has(name)) continue;
    const target = path.join(gameDir, name);
    // 清掉旧版本留下的标记/禁用文件
    removeEntry(`${target}.ctr-managed`);
    removeEntry(`${target}.ctr-disabled`);
    if (!pathExists(target)) continue;
    try {
      removeEntry(target);
      changed = true;
    } catch {
      // 文件被占用时忽略，下次启动再清
      failed.push(name);
    }
  }

  writeLinkedFiles(game, desired);
  return { changed, failed };
}

// 这些文件名可能被加载器注入，也可能是游戏自带的；只在确认归属后删除
const INJECTION_CANDIDATES = ['version.dll', 'dobby.dll', 'winhttp.dll', 'Doorstop.dll'];
const INJECTION_MARKERS = {
  'version.dll': ['melonloader', 'bootstrap.dll'],
  'dobby.dll': ['dobby'],
  'winhttp.dll': ['unitydoorstop', 'doorstop'],
  'Doorstop.dll': ['doorstop']
};

function fileContainsMarker(file, markers) {
  try {
    const stat = fs.statSync(file);
    if (!stat.isFile() || stat.size > 5 * 1024 * 1024) return false;

    const length = Math.min(stat.size, 512 * 1024);
    const buffer = Buffer.alloc(length);
    const fd = fs.openSync(file, 'r');
    try {
      fs.readSync(fd, buffer, 0, length, 0);
    } finally {
      fs.closeSync(fd);
    }
    const text = buffer.toString('latin1').toLowerCase();
    return markers.some((marker) => text.includes(marker.toLowerCase()));
  } catch {
    return false;
  }
}

// 清理不在清单里的历史注入文件（例如早期 MelonLoader 留下的 version.dll）。
// 判定依据：与任一 Profile 里的同名文件哈希一致，或文件内含对应加载器标记。
function cleanupStaleInjection(game, gameDir) {
  const knownHashes = new Set();
  try {
    for (const profile of profiles.listProfiles(game)) {
      const dir = profiles.getProfileDir(game, profile.id);
      for (const name of INJECTION_CANDIDATES) {
        const file = path.join(dir, name);
        if (!pathExists(file)) continue;
        const hash = fileHash(file);
        if (hash) knownHashes.add(hash);
      }
    }
  } catch {
    // Profile 读取失败时退化为只按文件标记判断
  }

  let removed = 0;
  for (const name of INJECTION_CANDIDATES) {
    const target = path.join(gameDir, name);
    if (!pathExists(target)) continue;

    try {
      const hash = fileHash(target);
      const owned = (hash && knownHashes.has(hash)) || fileContainsMarker(target, INJECTION_MARKERS[name] || []);
      if (!owned) continue;
      removeEntry(target);
      removed += 1;
    } catch {
      // 文件被占用时跳过
    }
  }
  return removed;
}

// 删除配置后调用：只清理「所有剩余配置根目录里都不存在」的同步文件
function pruneLinkedFiles(game, gameDir, remainingProfileDirs) {
  const keepKeys = new Set();
  for (const dir of remainingProfileDirs) {
    for (const name of profileRootFiles(dir)) keepKeys.add(name.toLowerCase());
  }

  const previous = readLinkedFiles(game);
  const keep = [];
  for (const name of previous) {
    if (keepKeys.has(name.toLowerCase())) {
      keep.push(name);
      continue;
    }
    const target = path.join(gameDir, name);
    if (pathExists(target)) {
      try {
        removeEntry(target);
      } catch {
        // 文件被占用时忽略
      }
    }
  }
  writeLinkedFiles(game, keep);
}

function ensureDoorstopProxy(gameDir, profileDir) {
  const proxy = path.join(gameDir, 'winhttp.dll');
  if (!pathExists(proxy)) {
    throw new Error('当前配置缺少 Doorstop 注入文件，请先安装 BepInExPack');
  }

  // doorstop_config.ini / .doorstop_version 属于根目录文件，linkProfileFiles 已同步；
  // 这里补 doorstop_libs 目录（目录不参与根文件同步）。
  // 每次启动都整体刷新：只补缺失会让游戏目录永远停留在旧版 Doorstop，与新版 core 混用会注入失败。
  const sourceLibs = path.join(profileDir, 'doorstop_libs');
  let libsSynced = true;
  if (pathExists(sourceLibs)) {
    const targetLibs = path.join(gameDir, 'doorstop_libs');
    const staging = `${targetLibs}.ctr-new`;
    try {
      removeEntry(staging);
      fs.cpSync(sourceLibs, staging, { recursive: true });
      removeEntry(targetLibs);
      fs.renameSync(staging, targetLibs);
    } catch {
      // 文件被占用时保留旧目录，注入仍有机会成功
      libsSynced = false;
      try {
        removeEntry(staging);
      } catch {
        // Ignore.
      }
    }
  }

  return { proxyPath: proxy, replacedProxy: false, libsSynced };
}

// ============================================================
// MelonLoader：用 version.dll 注入，核心和 Mods 留在 Profile
// ============================================================

// r2modman 的做法：--melonloader.basedir 指向 Profile，MelonLoader / Mods / UserData
// 全部直接从 Profile 读取，不需要拷贝进游戏目录
const MELON_BASEDIR_ARG = '--melonloader.basedir';
// 原版启动用官方参数禁用 Mod 加载，避免去改动游戏目录里的注入 DLL
const MELON_NO_MODS_ARG = '--no-mods';


function setIniValue(text, section, key, value) {
  const targetSection = section.toLowerCase();
  const lines = text.split(/\r?\n/);
  let currentSection = '';
  let sectionIndex = -1;
  let keyIndex = -1;

  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    const sectionMatch = trimmed.match(/^\[(.+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim().toLowerCase();
      if (currentSection === targetSection && sectionIndex < 0) sectionIndex = index;
      continue;
    }

    if (
      currentSection === targetSection &&
      new RegExp(`^\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*=`, 'i').test(lines[index])
    ) {
      keyIndex = index;
      break;
    }
  }

  if (sectionIndex < 0) {
    lines.push('', `[${section}]`, `${key}=${value}`);
    return lines.join('\n');
  }

  if (keyIndex >= 0) {
    lines[keyIndex] = `${key}=${value}`;
    return lines.join('\n');
  }

  lines.splice(sectionIndex + 1, 0, `${key}=${value}`);
  return lines.join('\n');
}

// 游戏目录里的 doorstop_config.ini 必须保持「关闭 + 相对路径」。
// 绝对预加载器路径只通过启动参数传入（与 r2modman 一致），否则从 Steam 直接启动也会加载 Mod。
function writeDoorstopConfig(gameDir, enabled) {
  const file = path.join(gameDir, 'doorstop_config.ini');
  let text = '';

  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    text = '';
  }

  // Doorstop 4
  text = setIniValue(text, 'General', 'enabled', enabled);

  // Doorstop 3
  text = setIniValue(text, 'UnityDoorstop', 'enabled', enabled);

  fs.writeFileSync(file, text, 'utf8');
  return file;
}

// 一次性迁移：旧版本把绝对预加载器路径写进了 ini，导致 Steam 直接启动也注入。
// 只处理指向自己 Profile 目录的绝对路径，避免误改其它工具的配置。
function disablePersistentInjection(gameDir) {
  const file = path.join(gameDir, 'doorstop_config.ini');
  if (!pathExists(file)) return false;

  let text = '';
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return false;
  }

  const profilesRoot = path.join(app.getPath('userData'), 'profiles').toLowerCase();
  // ini 里的路径可能用正斜杠（BepInEx 默认写法），比较前统一成反斜杠
  const normalized = text.toLowerCase().replace(/\//g, '\\');
  // 只处理指向自己 Profile 目录的绝对路径，避免误改其它工具的配置
  if (!normalized.includes(profilesRoot)) return false;
  const hasAbsoluteTarget = /target(?:_assembly|Assembly)\s*=\s*[A-Za-z]:[\\/]/i.test(text);
  if (!hasAbsoluteTarget) return false;

  text = setIniValue(text, 'General', 'enabled', 'false');
  text = setIniValue(text, 'UnityDoorstop', 'enabled', 'false');
  // 恢复成不存在的相对路径：即使 ini 被重新启用，也不会加载 Profile 里的 Mod
  text = setIniValue(text, 'General', 'target_assembly', 'BepInEx\\core\\BepInEx.Preloader.dll');
  text = setIniValue(text, 'UnityDoorstop', 'targetAssembly', 'BepInEx\\core\\BepInEx.Preloader.dll');

  try {
    fs.writeFileSync(file, text, 'utf8');
    return true;
  } catch {
    return false;
  }
}

function writeLaunchLog(data) {
  try {
    fs.writeFileSync(
      path.join(app.getPath('userData'), 'last-launch.log'),
      JSON.stringify(data, null, 2),
      'utf8'
    );
  } catch {
    // Logging is best effort.
  }
}

function launchSteam(steamExe, appId, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(steamExe, ['-applaunch', appId, ...args], {
      cwd: path.dirname(steamExe),
      detached: true,
      stdio: 'ignore',
      windowsHide: false
    });

    child.once('spawn', () => {
      child.unref();
      resolve();
    });
    child.once('error', reject);
  });
}

function splitArgs(text) {
  const args = [];
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match;
  while ((match = pattern.exec(String(text || ''))) !== null) {
    args.push(match[1] !== undefined ? match[1] : match[2] !== undefined ? match[2] : match[3]);
  }
  return args;
}

function launchViaCmd(program, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn('cmd.exe', ['/c', 'start', '""', program, ...args], {
      cwd,
      detached: true,
      stdio: 'ignore',
      windowsHide: false
    });

    child.once('spawn', () => {
      child.unref();
      resolve();
    });
    child.once('error', reject);
  });
}

// .exe 直接启动，避免 cmd 转发时把带空格的参数截断；
// .bat / .lnk 之类仍然需要 shell 处理。
function launchProgram(program, args, cwd) {
  if (!/\.exe$/i.test(program)) return launchViaCmd(program, args, cwd);

  return new Promise((resolve, reject) => {
    const child = spawn(program, args, {
      cwd,
      detached: true,
      stdio: 'ignore',
      windowsHide: false
    });

    child.once('spawn', () => {
      child.unref();
      resolve();
    });
    child.once('error', reject);
  });
}

async function launchGame(game, profileId, modded) {
  assertGame(game);

  const settings = store.readSettings();
  const exePath = settings.gamePaths[game];
  if (!exePath) throw new Error('请先设置游戏路径');
  if (!fs.existsSync(exePath)) throw new Error('游戏路径不存在，请重新设置');

  restoreLegacyLaunchState(game);

  const exeDir = path.dirname(exePath);
  let args = [];
  let preloader = null;
  let configFile = null;
  let proxyInfo = null;
  let loaderId = null;
  // 启动本身可能成功，但同步/清理失败会让 Mod 静默不加载，必须回传给界面提示
  const warnings = [];
  // 非错误类提示（例如自动修复了历史配置）
  const notices = [];

  if (modded) {
    const profileDir = profiles.getProfileDir(game, profileId);

    // 修复旧版本安装时被放到 Profile 根目录的扁平包文件，避免 BepInEx 扫不到。
    // 同时补齐缺失的文件清单，并让 enabled 与磁盘 .old 状态一致。
    try {
      const repair = await installer.repairProfile(game, profileId);
      if (repair && repair.recordsRepaired > 0) {
        notices.push(`已补全 ${repair.recordsRepaired} 个 Mod 的文件记录`);
      }
      if (repair && repair.toggled > 0) {
        notices.push(`已修正 ${repair.toggled} 个 Mod 的启用状态`);
      }
    } catch {
      // Repair is best effort; never block launching.
    }

    // 按 Profile 实际安装的 Loader 选择注入方式
    loaderId = loaders.detectProfileLoader(profileDir);
    const loader = loaders.getLoader(loaderId);

    const installedLoaders = loaders.detectProfileLoaders(profileDir);
    if (installedLoaders.length > 1) {
      const labels = installedLoaders.map((id) => loaders.getLoader(id).displayName).join(' 与 ');
      warnings.push(`当前配置同时存在 ${labels}，只有 ${loader.displayName} 会生效`);
    }

    // 先同步 Profile 根目录文件：会写入本配置需要的注入 DLL，
    // 同时删掉上一份清单里其它加载器残留的文件
    const linkResult = linkProfileFiles(game, exeDir, profileDir);
    for (const name of linkResult.failed) {
      warnings.push(`游戏目录中的 ${name} 未能同步（可能被游戏占用），请关闭游戏后重试`);
    }

    if (loaderId === 'melonloader') {
      if (!pathExists(path.join(exeDir, 'version.dll'))) {
        throw new Error('当前配置缺少 MelonLoader 注入文件（version.dll），请重新安装 MelonLoader');
      }
      proxyInfo = { proxyPath: path.join(exeDir, 'version.dll'), replacedProxy: false };

      // winhttp 一般已被清理；极端情况下删不掉时关掉 Doorstop，避免双加载器
      if (pathExists(path.join(exeDir, 'winhttp.dll'))) {
        configFile = writeDoorstopConfig(exeDir, false);
        warnings.push('游戏目录仍残留 winhttp.dll（BepInEx 注入文件），已尽量关闭 Doorstop 以免冲突');
      }

      // 与 r2modman 一致：让 MelonLoader 直接从 Profile 读核心、Mods 和 UserData
      const modArgsTemplate =
        (settings.modLaunchArgs || {})[game] || loader.defaultLaunchArgs || '';
      args = [
        MELON_BASEDIR_ARG,
        profileDir,
        ...splitArgs(modArgsTemplate.replace(/\{preloader\}/gi, ''))
      ];
    } else {
      proxyInfo = ensureDoorstopProxy(exeDir, profileDir);
      if (proxyInfo.libsSynced === false) {
        warnings.push('doorstop_libs 未能更新（可能被游戏占用），Doorstop 可能仍是旧版本');
      }
      preloader = findPreloader(profileDir).replace(/\\/g, '/');

      // ini 保持关闭，绝对路径只走启动参数：这样从 Steam 直接启动仍然是原版
      configFile = writeDoorstopConfig(exeDir, false);

      // MelonLoader 的 version.dll 若没能清掉，会和 BepInEx 同时注入
      if (pathExists(path.join(exeDir, 'version.dll'))) {
        warnings.push('游戏目录仍残留 version.dll（MelonLoader 注入文件），可能与 BepInEx 冲突');
      }

      // 用户可以在游戏设置里自定义 Mod 启动参数，{preloader} 会替换为当前配置的预加载器路径
      const modArgsTemplate =
        (settings.modLaunchArgs || {})[game] || loader.defaultLaunchArgs || DEFAULT_MOD_LAUNCH_ARGS;
      args = splitArgs(modArgsTemplate.replace(/\{preloader\}/gi, preloader));
    }
  } else {
    // 原版启动：清掉上次同步进游戏目录的注入文件
    const linkResult = linkProfileFiles(game, exeDir, null);
    for (const name of linkResult.failed) {
      warnings.push(`原版启动清理游戏目录中的 ${name} 失败（可能被游戏占用）`);
    }

    // 文件删不掉（比如被占用）时仍用开关参数兜底
    if (pathExists(path.join(exeDir, 'winhttp.dll'))) {
      configFile = writeDoorstopConfig(exeDir, false);
      args = [
        '--doorstop-enabled',
        'false',
        '--doorstop-enable',
        'false'
      ];
    }
    if (pathExists(path.join(exeDir, 'version.dll'))) args.push(MELON_NO_MODS_ARG);
  }

  const launchMode = settings.launchMode || 'steam';
  // 用户在游戏设置里填写的启动参数，Steam / 直接 / 自定义启动都会附加
  const userArgs = splitArgs((settings.launchArgs || {})[game]);
  let appId = null;
  let steamExe = null;
  let targetProgram = exePath;
  let launchArgs = args;
  let customArgs = [];

  if (launchMode === 'steam') {
    appId = String(detectSteamAppId(exePath) || settings.steamAppIds[game] || '');
    if (!/^\d+$/.test(appId)) {
      throw new Error('未识别到 Steam App ID，请重新启动并按提示输入');
    }

    steamExe =
      settings.steamPath && fs.existsSync(settings.steamPath)
        ? settings.steamPath
        : findSteamExe();
    if (!steamExe) throw new Error('未找到 Steam，请确认 Steam 已安装');
  } else if (launchMode === 'custom') {
    targetProgram = settings.customLaunchPath;
    if (!targetProgram || !fs.existsSync(targetProgram)) {
      throw new Error('未设置自定义启动程序，请在全局设置中配置');
    }
    customArgs = splitArgs(settings.customLaunchArgs);
    // 自定义程序可能是转发型启动器：把注入 / 关闭注入的参数一并交给它，
    // 否则 Mod 模式不会注入、原版模式也失去「文件被占用时」的兜底
    launchArgs = [...customArgs, ...args];
  }

  let configPreview = null;
  try {
    if (configFile) configPreview = fs.readFileSync(configFile, 'utf8');
  } catch {
    // Ignore.
  }

  writeLaunchLog({
    time: new Date().toISOString(),
    game,
    profileId,
    modded: Boolean(modded),
    loaderId,
    launchMode,
    exePath,
    exeDir,
    preloader,
    configFile,
    configPreview,
    proxyInfo,
    args,
    targetProgram,
    launchArgs,
    customArgs,
    userArgs,
    steamExe,
    appId,
    warnings,
    notices
  });

  if (launchMode === 'steam') {
    await launchSteam(steamExe, appId, [...args, ...userArgs]);
  } else {
    await launchProgram(targetProgram, [...launchArgs, ...userArgs], path.dirname(targetProgram));
  }

  return {
    ok: true,
    modded: Boolean(modded),
    launchMode,
    warnings: [...new Set(warnings)],
    notices: [...new Set(notices)]
  };
}

module.exports = {
  DEFAULT_MOD_LAUNCH_ARGS,
  detectGamePath,
  detectSteamAppId,
  findPreloader,
  findSteamExe,
  launchGame,
  ensureDoorstopProxy,
  disablePersistentInjection,
  cleanupStaleInjection,
  linkProfileFiles,
  pruneLinkedFiles
};

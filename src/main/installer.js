'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const AdmZip = require('adm-zip');
const profiles = require('./profiles');
const loaders = require('./loaders');
const installRules = require('./installRules');
const { withProfileLock } = require('./profileLock');
const { fetchPackageVersions, resolveLatestPackage } = require('./thunderstore');

const tasks = new Map();
const queue = [];
let processing = false;
let taskSequence = 0;
let lastEmitAt = 0;
let notifier = {
  onDownloads: null,
  onProfileUpdated: null
};

// 根目录的文档文件不需要进游戏目录
const ROOT_DOCS = new Set(['readme.md', 'changelog.md', 'license', 'license.md', 'license.txt']);

// 解压上限：防止恶意 / 损坏的压缩包（zip 炸弹）把磁盘撑爆或拖死主进程
const MAX_UNPACK_ENTRIES = 30000;
const MAX_UNPACK_TOTAL_BYTES = 4 * 1024 * 1024 * 1024;

const PROTECTED_ROOTS = new Set([
  'bepinex',
  'plugins',
  'patchers',
  'config',
  'core',
  'doorstop_libs',
  'mono',
  'dotnet',
  'melonloader',
  'mods',
  'userdata',
  'userlibs'
]);

function configure(callbacks) {
  notifier = { ...notifier, ...(callbacks || {}) };
}

function emit(force) {
  const now = Date.now();
  if (!force && now - lastEmitAt < 120) return;
  lastEmitAt = now;
  if (notifier.onDownloads) notifier.onDownloads(getTasks());
}

function notifyProfileUpdated(game, profileId) {
  if (notifier.onProfileUpdated) notifier.onProfileUpdated({ game, profileId });
}

function publicTask(task) {
  return {
    id: task.id,
    kind: task.type || 'install',
    game: task.game,
    profileId: task.profileId,
    title: task.title,
    version: task.version,
    status: task.status,
    progress: Math.max(0, Math.min(1, task.progress || 0)),
    currentLabel: task.currentLabel || '',
    error: task.error || null,
    steps: task.steps.map((step) => ({
      key: step.key,
      name: step.name,
      version: step.version,
      status: step.status,
      progress: Math.max(0, Math.min(1, step.progress || 0)),
      operationProgress: Math.max(0, Math.min(1, step.operationProgress || 0)),
      error: step.error || null
    }))
  };
}

function getTasks() {
  return [...tasks.values()].map(publicTask);
}

function computeProgress(task) {
  if (task.steps.length === 0) return 0;
  let total = 0;
  for (const step of task.steps) {
    if (step.status === 'done' || step.status === 'skipped' || step.status === 'error') total += 1;
    else total += step.progress || 0;
  }
  return total / task.steps.length;
}

// 新增子项时以当前总进度为起点，避免总进度条因为发现新依赖而倒退
function ensureStep(task, info) {
  let step = task.steps.find((item) => item.key === info.fullName);
  if (!step) {
    const base = Math.max(0, Math.min(1, task.progress || 0));
    step = {
      key: info.fullName,
      name: info.name || info.fullName,
      version: info.version || '',
      status: 'pending',
      progress: base,
      baseProgress: base,
      operationProgress: 0,
      error: null
    };
    task.steps.push(step);
  }
  return step;
}

function parseDependency(value) {
  if (typeof value !== 'string') return null;
  const fullName = value.trim();
  const lastDash = fullName.lastIndexOf('-');
  if (lastDash <= 0 || lastDash >= fullName.length - 1) return null;

  const beforeVersion = fullName.slice(0, lastDash);
  const version = fullName.slice(lastDash + 1);
  const firstDash = beforeVersion.indexOf('-');
  if (firstDash <= 0 || firstDash >= beforeVersion.length - 1) return null;

  const namespace = beforeVersion.slice(0, firstDash);
  const name = beforeVersion.slice(firstDash + 1);

  return {
    fullName,
    namespace,
    name,
    version,
    packageName: `${namespace}-${name}`
  };
}

function buildDownloadUrl(item) {
  return `https://thunderstore.io/package/download/${encodeURIComponent(item.namespace)}/${encodeURIComponent(
    item.name
  )}/${encodeURIComponent(item.version)}/`;
}

function parseVersionNumber(value) {
  const match = String(value || '').match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return { major: 0, minor: 0, patch: 0 };
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3])
  };
}

function stateFilePath(profileDir) {
  return path.join(profileDir, '.ctr', 'installed.json');
}

async function readState(profileDir) {
  try {
    const data = JSON.parse(await fs.promises.readFile(stateFilePath(profileDir), 'utf8'));
    if (data && typeof data === 'object' && data.mods && typeof data.mods === 'object') return data;
  } catch {
    // No usable state file.
  }
  return { version: 1, mods: {} };
}

function loaderInfoPath(profileDir) {
  return path.join(profileDir, '.ctr', 'loader.json');
}

async function readLoaderInfo(profileDir) {
  try {
    const data = JSON.parse(await fs.promises.readFile(loaderInfoPath(profileDir), 'utf8'));
    if (data && typeof data === 'object' && typeof data.version === 'string') return data;
  } catch {
    // 没有记录时按新版布局处理
  }
  return null;
}

async function writeLoaderInfo(profileDir, loaderId, version) {
  const file = loaderInfoPath(profileDir);
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  await fs.promises.writeFile(
    file,
    JSON.stringify({ loader: loaderId, version }, null, 2),
    'utf8'
  );
}

// MelonLoader 0.6 及更早版本不会扫描 Mods 子目录，必须平铺安装
function isLegacyMelonLoader(version) {
  const match = String(version || '').match(/^(\d+)\.(\d+)/);
  if (!match) return false;
  return Number(match[1]) === 0 && Number(match[2]) < 7;
}

// MelonLoader 0.7 起把核心 DLL 放进 MelonLoader/net6、MelonLoader/net35 等子目录，
// 0.6 及更早版本则把 MelonLoader.dll 直接放在 MelonLoader/ 根目录。
// 手动安装（没有 .ctr/loader.json）的 Profile 靠这个结构特征判断大版本。
function inferMelonLoaderVersion(profileDir) {
  const root = path.join(profileDir, 'MelonLoader');
  let entries = [];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return null;
  }

  if (entries.some((entry) => entry.isFile() && /^melonloader\.dll$/i.test(entry.name))) {
    return '0.6.0';
  }
  if (
    entries.some(
      (entry) => entry.isDirectory() && /^(net6|net35|net472|netstandard)$/i.test(entry.name)
    )
  ) {
    return '0.7.0';
  }
  return null;
}

// 只有压缩包里确实包含该 Loader 的核心文件时才清理旧核心目录，避免误删
function loaderPackageHasCore(strippedNames, loaderId) {
  if (loaderId === 'melonloader') {
    return strippedNames.some((name) => /^melonloader\//i.test(name));
  }
  return strippedNames.some((name) => /^bepinex\/core\//i.test(name));
}

// 升级 Loader 时先清掉旧核心目录：残留的旧版 DLL 与新版混在一起会导致注入失败。
// 只删「由 Loader 独占」的目录，plugins / config / Mods 等用户数据不受影响。
async function removeLoaderCoreDirs(profileDir, loaderId) {
  const targets = loaderId === 'melonloader' ? ['MelonLoader'] : ['BepInEx/core', 'doorstop_libs'];
  for (const relative of targets) {
    const target = safeJoin(profileDir, relative);
    if (!target) continue;
    try {
      await fs.promises.rm(target, { recursive: true, force: true });
    } catch {
      // 文件被占用时保留，本次安装仍会尽力覆盖
    }
  }
}

async function writeState(profileDir, state) {
  const file = stateFilePath(profileDir);
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp`;
  await fs.promises.writeFile(temp, JSON.stringify(state, null, 2), 'utf8');
  await fs.promises.rename(temp, file);
}

function safeJoin(profileDir, relativePath) {
  const normalized = path.posix
    .normalize(String(relativePath).replace(/\\/g, '/'))
    .replace(/^\/+/, '');
  if (!normalized || normalized.startsWith('..') || normalized.includes('\u0000')) return null;
  const target = path.resolve(profileDir, ...normalized.split('/'));
  const root = path.resolve(profileDir);
  if (target !== root && !target.startsWith(root + path.sep)) return null;
  return target;
}

function removeFileSafe(file) {
  try {
    fs.rmSync(file, { force: true });
  } catch {
    // Ignore.
  }
}

function packageFolderName(packageName) {
  return (
    String(packageName || 'package')
      .replace(/[\\/:*?"<>|]+/g, '-')
      .trim() || 'package'
  );
}

// Windows 文件系统不区分大小写，包名比较也必须保持一致
function samePackageName(left, right) {
  return String(left || '').toLowerCase() === String(right || '').toLowerCase();
}

const PACKAGE_SCAN_ROOTS = ['plugins', 'patchers', 'core', 'mods'];

function collectFilesRecursive(dir, result) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return result;
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFilesRecursive(full, result);
    else if (entry.isFile()) result.push(full);
  }
  return result;
}

// 扫描磁盘上属于该包的目录（<loader 根>/<包名>/…）。
// 用于修复历史版本或外部迁移来的配置：它们只有 mods.yml，没有 .ctr/installed.json，
// 导致禁用/启用/卸载都找不到要操作的文件。
function scanPackageFiles(profileDir, packageName) {
  const folderName = packageFolderName(packageName);
  const files = [];
  const seen = new Set();
  const loaderIds = loaders.detectProfileLoaders(profileDir);

  for (const loaderId of loaderIds) {
    const loader = loaders.getLoader(loaderId);
    for (const key of PACKAGE_SCAN_ROOTS) {
      const root = loader.installPaths[key];
      if (!root) continue;
      const target = safeJoin(profileDir, `${root}/${folderName}`);
      if (!target || !fs.existsSync(target)) continue;

      for (const absolute of collectFilesRecursive(target, [])) {
        const relative = path.relative(profileDir, absolute).split(path.sep).join('/');
        // 记录里存原始路径，.old 只表示「当前被禁用」
        const normalized = relative.endsWith('.old') ? relative.slice(0, -4) : relative;
        if (!normalized || seen.has(normalized)) continue;
        seen.add(normalized);
        files.push(normalized);
      }
    }
  }

  return files;
}

// 加载器本体（BepInExPack / MelonLoader）不能参与启用/禁用，否则会把注入层改名。
// 只认加载器的标志性文件：翻译包之类自带 BepInEx/core/*.dll 的普通 Mod 不能被误判。
const LOADER_MARKERS = [
  /^bepinex\/core\/bepinex\.preloader\.dll$/i,
  /^bepinex\/core\/bepinex\.dll$/i,
  /^bepinex\/core\/bepinex\.unity\./i,
  /^melonloader\/melonloader\.dll$/i,
  /^melonloader\/net(6|35|472)\/melonloader\.dll$/i,
  /^(winhttp|version|dobby|doorstop)\.dll$/i
];

function isLoaderPackageFiles(files) {
  return files.some((file) => LOADER_MARKERS.some((pattern) => pattern.test(file)));
}

// 文件清单 = 安装记录 ∪ 磁盘扫描，两者取并集，避免记录缺失或路径漂移导致漏操作
function resolvePackageFiles(profileDir, packageName, state, scannedFiles) {
  const files = new Set();
  for (const record of Object.values((state && state.mods) || {})) {
    if (!samePackageName(record.packageName, packageName)) continue;
    for (const file of record.files || []) files.add(String(file));
  }
  const scanned = Array.isArray(scannedFiles)
    ? scannedFiles
    : scanPackageFiles(profileDir, packageName);
  for (const file of scanned) files.add(file);
  return [...files];
}

// 被其它包同时引用的路径：禁用/卸载时不能动，否则会破坏别的 Mod
function sharedFileKeys(state, packageName) {
  const keys = new Set();
  for (const record of Object.values((state && state.mods) || {})) {
    if (samePackageName(record.packageName, packageName)) continue;
    for (const file of record.files || []) keys.add(String(file).toLowerCase());
  }
  return keys;
}

// 统一的启用/禁用实现：失败时回滚已改名的文件
async function applyPackageEnabled(profileDir, packageName, enabled, state, scannedFiles) {
  const files = resolvePackageFiles(profileDir, packageName, state, scannedFiles);
  if (files.length === 0 || isLoaderPackageFiles(files)) return 0;

  const shared = sharedFileKeys(state, packageName);
  const actions = [];

  try {
    for (const relative of files) {
      const file = safeJoin(profileDir, relative);
      if (!file) continue;
      // 共享文件在禁用时保持现状，交给实际使用它的包决定
      if (!enabled && shared.has(String(relative).toLowerCase())) continue;
      const oldFile = `${file}.old`;

      if (enabled) {
        if (fs.existsSync(oldFile) && !fs.existsSync(file)) {
          await fs.promises.rename(oldFile, file);
          actions.push({ from: file, to: oldFile });
        } else if (fs.existsSync(oldFile) && fs.existsSync(file)) {
          // 两份都存在说明上次切换中断，保留正在加载的那份
          removeFileSafe(oldFile);
        }
      } else if (fs.existsSync(file)) {
        // 残留的 .old 会让重命名失败，结果就是「界面已禁用但文件还在加载」
        removeFileSafe(oldFile);
        await fs.promises.rename(file, oldFile);
        actions.push({ from: oldFile, to: file });
      }
    }
  } catch (error) {
    for (const action of actions.reverse()) {
      try {
        await fs.promises.rename(action.from, action.to);
      } catch {
        // Best effort rollback.
      }
    }
    throw new Error(`切换 Mod 状态失败：${error.message}`);
  }

  return actions.length;
}

/* ---------- 未跟踪文件（孤儿文件） ---------- */

// 这些目录不参与孤儿扫描：管理器自身数据、r2modman 残留状态、加载器运行时数据
const UNTRACKED_SKIP_PREFIXES = ['.ctr/', '_state/', 'bepinex/cache/', 'doorstop_libs/'];
// 管理器自己的清单文件与加载器注入层，永远不能被当作孤儿删除
const UNTRACKED_SKIP_FILES = new Set([
  'mods.yml',
  'profile.json',
  'doorstop_config.ini',
  '.doorstop_version',
  'winhttp.dll',
  'version.dll',
  'dobby.dll',
  'doorstop.dll'
]);
// BepInEx 自动生成，删了也会重建
const UNTRACKED_SKIP_KEYS = ['bepinex/plugins/mmhook'];
// 这些目录下一层的子目录才是「包目录」，直接放在里面的文件属于加载器本身
const LOADER_SUBDIRS = new Set([
  'plugins',
  'patchers',
  'core',
  'mods',
  'userdata',
  'userlibs',
  'melonloader'
]);

function collectTrackedKeys(state) {
  const keys = new Set();
  for (const record of Object.values((state && state.mods) || {})) {
    for (const file of record.files || []) keys.add(String(file).toLowerCase());
  }
  return keys;
}

function classifyUntracked(relative) {
  const lower = relative.toLowerCase();

  if (lower.startsWith('bepinex/config/')) return { kind: 'config', key: 'BepInEx/config' };

  if (/^(bepinex|melonloader)\//.test(lower)) {
    const parts = relative.split('/');
    const root = parts[0];
    const sub = parts[1] || '';
    // BepInEx/Lethal Company_Data 这类不是标准加载器目录，整段作为一组
    if (!LOADER_SUBDIRS.has(sub.toLowerCase())) return { kind: 'dir', key: `${root}/${sub}` };
    // 包目录本身（BepInEx/plugins/<包名>/…）
    if (parts.length >= 4) return { kind: 'dir', key: `${root}/${sub}/${parts[2]}` };
    // 直接躺在 plugins/core 根下的文件：属于加载器或扁平安装，默认不勾选
    return { kind: 'loose', key: `${root}/${sub}` };
  }

  const parts = relative.split('/');
  return { kind: 'other', key: parts.length > 1 ? `${parts[0]}/${parts[1]}` : parts[0] };
}

// 扫描没有被任何安装记录引用的文件，供用户确认后清理
async function scanUntracked(game, profileId) {
  const profileDir = profiles.getProfileDir(game, profileId);
  const state = await readState(profileDir);
  const tracked = collectTrackedKeys(state);
  const packageDirs = new Set(
    Object.values(state.mods).map((record) => packageFolderName(record.packageName).toLowerCase())
  );

  const groups = new Map();

  for (const absolute of collectFilesRecursive(profileDir, [])) {
    const relative = path.relative(profileDir, absolute).split(path.sep).join('/');
    const lower = relative.toLowerCase();

    if (tracked.has(lower) || tracked.has(lower.replace(/\.old$/, ''))) continue;
    if (UNTRACKED_SKIP_PREFIXES.some((prefix) => lower.startsWith(prefix))) continue;
    if (UNTRACKED_SKIP_KEYS.some((key) => lower === key || lower.startsWith(`${key}/`))) continue;
    if (UNTRACKED_SKIP_FILES.has(lower)) continue;
    // 日志与数据库属于运行时数据（含 LogOutput.sqlite.1 这类滚动文件），不参与清理
    if (/\.(log|sqlite)(\.\d+)?(-shm|-wal)?$/i.test(lower)) continue;
    if (/(^|\/)logoutput/i.test(relative)) continue;

    // 包目录内的文件属于该包（可能是运行时生成的），不算孤儿
    const parts = relative.split('/');
    if (parts.length >= 3 && /^(bepinex|melonloader)$/i.test(parts[0])) {
      if (packageDirs.has(String(parts[2] || '').toLowerCase())) continue;
    }

    const { kind, key } = classifyUntracked(relative);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        kind,
        // 只默认勾选「加载器 Mod 目录下的孤儿包目录」，其余都需要手动确认
        suggested:
          kind === 'dir' && /^(bepinex|melonloader)\/(plugins|patchers|core|mods)\//i.test(key),
        size: 0,
        files: []
      });
    }

    const group = groups.get(key);
    let size = 0;
    try {
      size = fs.statSync(absolute).size;
    } catch {
      size = 0;
    }
    group.size += size;
    group.files.push({ path: relative, size });
  }

  const list = [...groups.values()].sort((a, b) => b.size - a.size);
  return {
    total: list.reduce((sum, group) => sum + group.files.length, 0),
    groups: list
  };
}

async function cleanUntracked(game, profileId, relativePaths) {
  const profileDir = profiles.getProfileDir(game, profileId);

  // 删除前核对与删除本身要在锁内完成，否则安装任务刚写入的文件可能被当成孤儿删掉
  return withProfileLock(profileDir, async () => {
    const state = await readState(profileDir);
    const tracked = collectTrackedKeys(state);
    let removed = 0;
    let skipped = 0;

    for (const relative of Array.isArray(relativePaths) ? relativePaths : []) {
      const text = String(relative || '');
      if (!text) continue;
      const lower = text.toLowerCase();

      // 删除前重新核对，避免扫描后又被安装的包被误删
      if (tracked.has(lower) || tracked.has(lower.replace(/\.old$/, ''))) {
        skipped += 1;
        continue;
      }
      if (UNTRACKED_SKIP_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
        skipped += 1;
        continue;
      }
      if (UNTRACKED_SKIP_FILES.has(lower) || /\.(log|sqlite)(\.\d+)?(-shm|-wal)?$/i.test(lower)) {
        skipped += 1;
        continue;
      }

      const file = safeJoin(profileDir, text);
      if (!file) {
        skipped += 1;
        continue;
      }
      removeFileSafe(file);
      if (!fs.existsSync(file)) removed += 1;
    }

    // 清掉清理后变空的包目录
    for (const root of ['BepInEx/plugins', 'BepInEx/patchers', 'BepInEx/core', 'Mods', 'Plugins']) {
      const absolute = safeJoin(profileDir, root);
      if (absolute && fs.existsSync(absolute)) pruneEmptyDirs(absolute, absolute);
    }

    return { removed, skipped };
  });
}

/* ---------- 文件冲突 ---------- */

const SHARED_BACKUP_DIR = '.ctr/shared';

function sharedBackupPath(profileDir, packageName, relative) {
  return safeJoin(
    profileDir,
    `${SHARED_BACKUP_DIR}/${packageFolderName(packageName)}/${relative}`
  );
}

// 新包要覆盖别人已在用的同名文件时，先把现有内容备份到该包名下，
// 这样冲突解决时可以「以某包为准」而不必重新下载。
// 返回可用于回滚的备份文件路径（没有备份时返回 null）。
async function backupOverwrittenFile(profileDir, relative, packageName, state) {
  const active = safeJoin(profileDir, relative);
  if (!active || !fs.existsSync(active)) return null;

  const lower = String(relative).toLowerCase();
  let owner = null;
  for (const record of Object.values(state.mods)) {
    if (samePackageName(record.packageName, packageName)) continue;
    if ((record.files || []).some((file) => String(file).toLowerCase() === lower)) {
      owner = record.packageName;
      break;
    }
  }
  if (!owner) return null;

  const backup = sharedBackupPath(profileDir, owner, relative);
  if (!backup) return null;
  if (fs.existsSync(backup)) return backup;

  try {
    await fs.promises.mkdir(path.dirname(backup), { recursive: true });
    await fs.promises.copyFile(active, backup);
    return backup;
  } catch {
    // 备份失败不影响安装
    return null;
  }
}

// 列出被多个包声明了同一路径的文件（参考 r2modman 的冲突表）
async function getConflicts(game, profileId) {
  const profileDir = profiles.getProfileDir(game, profileId);
  const state = await readState(profileDir);
  const owners = new Map();

  for (const record of Object.values(state.mods)) {
    for (const file of record.files || []) {
      const key = String(file).toLowerCase();
      if (!owners.has(key)) owners.set(key, { path: String(file), packages: new Set() });
      owners.get(key).packages.add(record.packageName);
    }
  }

  const conflicts = [];
  for (const info of owners.values()) {
    if (info.packages.size < 2) continue;
    conflicts.push({
      path: info.path,
      packages: [...info.packages].map((name) => {
        const backup = sharedBackupPath(profileDir, name, info.path);
        return { name, hasBackup: Boolean(backup && fs.existsSync(backup)) };
      })
    });
  }

  return conflicts;
}

// 让指定包重新拥有该路径：优先用安装时留下的备份恢复
async function setConflictWinner(game, profileId, relativePath, packageName) {
  const profileDir = profiles.getProfileDir(game, profileId);

  return withProfileLock(profileDir, async () => {
    const state = await readState(profileDir);
    const relative = String(relativePath || '');
    const lower = relative.toLowerCase();

    const owner = Object.values(state.mods).find(
      (record) =>
        samePackageName(record.packageName, packageName) &&
        (record.files || []).some((file) => String(file).toLowerCase() === lower)
    );
    if (!owner) throw new Error('该 Mod 没有这个文件');

    const source = sharedBackupPath(profileDir, owner.packageName, relative);
    if (!source || !fs.existsSync(source)) {
      return { applied: false, needsReinstall: true };
    }

    const target = safeJoin(profileDir, relative);
    if (!target) throw new Error('路径无效');

    // 先把当前内容备份到现有拥有者名下，保证可以来回切换
    await backupOverwrittenFile(profileDir, relative, owner.packageName, state);

    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    await fs.promises.copyFile(source, target);
    return { applied: true, needsReinstall: false };
  });
}

/* ---------- 启动扫描缓存 ---------- */

function repairCachePath(profileDir) {
  return path.join(profileDir, '.ctr', 'repair.json');
}

function fileStamp(file) {
  try {
    const stat = fs.statSync(file);
    return `${stat.size}:${stat.mtimeMs}`;
  } catch {
    return '';
  }
}

async function readRepairCache(profileDir) {
  try {
    return JSON.parse(await fs.promises.readFile(repairCachePath(profileDir), 'utf8'));
  } catch {
    return null;
  }
}

async function writeRepairCache(profileDir, data) {
  try {
    const file = repairCachePath(profileDir);
    await fs.promises.mkdir(path.dirname(file), { recursive: true });
    await fs.promises.writeFile(file, JSON.stringify(data), 'utf8');
  } catch {
    // 缓存写入失败不影响启动
  }
}

async function writePackageMeta(folderAbs, meta, iconBuffer) {
  let changed = false;

  // 更新 Mod 时要覆盖旧版本的 manifest/icon，否则 LethalConfig 仍显示旧版本号
  const iconTarget = path.join(folderAbs, 'icon.png');
  if (iconBuffer) {
    let current = null;
    try {
      current = await fs.promises.readFile(iconTarget);
    } catch {
      current = null;
    }
    if (!current || !current.equals(iconBuffer)) {
      await fs.promises.writeFile(iconTarget, iconBuffer);
      changed = true;
    }
  }

  const manifestTarget = path.join(folderAbs, 'manifest.json');
  if (meta) {
    const text = JSON.stringify(meta, null, 2);
    let current = null;
    try {
      current = await fs.promises.readFile(manifestTarget, 'utf8');
    } catch {
      current = null;
    }
    if (current !== text) {
      await fs.promises.writeFile(manifestTarget, text, 'utf8');
      changed = true;
    }
  }

  return changed;
}

function findCachedIcon(profileDir, packageName, version) {
  const dir = path.join(profileDir, '.ctr', 'icons');
  const safeName = String(packageName || '').replace(/[^a-z0-9._-]+/gi, '-');
  const target = `${safeName}-${version}`.toLowerCase();

  let entries = [];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return null;
  }

  const match = entries.find((name) => name.replace(/\.[^.]+$/, '').toLowerCase() === target);
  return match ? path.join(dir, match) : null;
}

// 把旧安装记录里的路径迁移到 TSM 的 <BepInEx>/plugins/<PackageFullName>/ 布局，
// 这样 BepInEx 能扫到 DLL，LethalConfig 也能在 DLL 所在目录找到 icon.png / manifest.json。
function relocateToPackage(relative, folderName) {
  const name = String(relative || '').replace(/\\/g, '/');
  const pluginPrefix = 'BepInEx/plugins/';
  const patcherPrefix = 'BepInEx/patchers/';

  if (/^bepinex\/plugins\//i.test(name)) {
    const rest = name.slice(pluginPrefix.length);
    if (!rest || rest.toLowerCase().startsWith(`${folderName.toLowerCase()}/`)) return null;
    return `${pluginPrefix}${folderName}/${rest}`;
  }

  if (/^bepinex\/patchers\//i.test(name)) {
    const rest = name.slice(patcherPrefix.length);
    if (!rest || rest.toLowerCase().startsWith(`${folderName.toLowerCase()}/`)) return null;
    return `${patcherPrefix}${folderName}/${rest}`;
  }

  if (/^bepinex\//i.test(name)) return null;
  // 注入 DLL / Doorstop 配置属于加载器本体，不能被挪进插件目录
  if (
    /^(winhttp\.dll|version\.dll|dobby\.dll|doorstop\.dll|doorstop_config\.ini|\.doorstop_version)$/i.test(
      name
    )
  ) {
    return null;
  }
  if (/^doorstop_libs\//i.test(name)) return null;

  return `${pluginPrefix}${folderName}/${name}`;
}

// 旧版扁平安装路径迁移（只对 BepInEx）：把文件挪进 <BepInEx/plugins>/<包名>/ 布局
async function relocateLegacyLayout(profileDir, state, modsByKey) {
  let changed = false;

  for (const record of Object.values(state.mods)) {
    const folderName = packageFolderName(record.packageName);
    const nextFiles = [];

    for (const relative of record.files || []) {
      const relocated = relocateToPackage(relative, folderName);
      if (!relocated) {
        nextFiles.push(relative);
        continue;
      }

      const from = safeJoin(profileDir, relative);
      const to = safeJoin(profileDir, relocated);
      if (!from || !to) {
        nextFiles.push(relative);
        continue;
      }

      const oldFrom = `${from}.old`;
      const oldTo = `${to}.old`;
      const hasActive = fs.existsSync(from);
      const hasDisabled = fs.existsSync(oldFrom);
      if (!hasActive && !hasDisabled) {
        nextFiles.push(relative);
        continue;
      }

      await fs.promises.mkdir(path.dirname(to), { recursive: true });

      if (hasActive) {
        if (fs.existsSync(to)) removeFileSafe(from);
        else fs.renameSync(from, to);
      }
      if (hasDisabled) {
        if (fs.existsSync(oldTo)) removeFileSafe(oldFrom);
        else fs.renameSync(oldFrom, oldTo);
      }

      nextFiles.push(relocated);
      changed = true;
    }

    record.files = nextFiles;
  }

  for (const record of Object.values(state.mods)) {
    const folderAbs = safeJoin(
      profileDir,
      `BepInEx/plugins/${packageFolderName(record.packageName)}`
    );
    if (!folderAbs || !fs.existsSync(folderAbs)) continue;

    const entry = modsByKey.get(String(record.packageName || '').toLowerCase()) || null;
    // 禁用中的包不要重写 icon/manifest：写完又会被启停逻辑改回 .old，造成每次启动都写盘
    if (entry && entry.enabled === false) continue;

    const iconPath = findCachedIcon(profileDir, record.packageName, record.version);
    let iconBuffer = null;
    if (iconPath) {
      try {
        iconBuffer = await fs.promises.readFile(iconPath);
      } catch {
        iconBuffer = null;
      }
    }

    const meta = entry
      ? {
          name: String(entry.displayName || entry.name || record.packageName),
          version_number: String(record.version || profiles.versionToString(entry.versionNumber)),
          website_url: String(entry.websiteUrl || ''),
          description: String(entry.description || ''),
          dependencies: Array.isArray(entry.dependencies) ? entry.dependencies : []
        }
      : null;

    if (await writePackageMeta(folderAbs, meta, iconBuffer)) changed = true;
  }

  return changed;
}

// 启动时修复 Profile：补齐文件清单，并让 mods.yml 的 enabled 与磁盘 .old 状态一致。
// 用 mods.yml / installed.json 的「大小+mtime」做缓存键，没变就跳过整轮扫描。
async function repairProfile(game, profileId, options) {
  const profileDir = profiles.getProfileDir(game, profileId);
  // 修复会扫描磁盘、重命名 .old 并重写状态文件，必须与安装/启停串行
  return withProfileLock(profileDir, () => repairProfileLocked(profileDir, options));
}

async function repairProfileLocked(profileDir, options) {
  const force = Boolean(options && options.force);
  const modsFile = path.join(profileDir, 'mods.yml');
  const modsStamp = fileStamp(modsFile);
  const stateStamp = fileStamp(stateFilePath(profileDir));

  if (!force) {
    const cache = await readRepairCache(profileDir);
    if (cache && cache.mods === modsStamp && cache.state === stateStamp) {
      return { skipped: true, changed: false, recordsRepaired: 0, toggled: 0 };
    }
  }

  const profileLoader = loaders.detectProfileLoader(profileDir);
  const state = await readState(profileDir);
  const modEntries = profiles.readModsYml(profileDir);
  const modsByKey = new Map(
    modEntries.map((entry) => [String(entry.name || '').toLowerCase(), entry])
  );

  let changed = false;
  if (profileLoader === 'bepinex') {
    if (await relocateLegacyLayout(profileDir, state, modsByKey)) changed = true;
  }

  // 每个包只扫一次盘，两轮循环（补记录 + 对齐启停）共用结果
  const scans = new Map();
  for (const entry of modEntries) {
    const name = String(entry.name || '');
    if (!name) continue;
    scans.set(name, scanPackageFiles(profileDir, name));
  }

  // 用磁盘扫描补全缺失的文件清单：历史版本或外部迁移的配置只有 mods.yml，
  // 没有 .ctr/installed.json，导致禁用/启用/卸载都找不到要操作的文件。
  let recordsRepaired = 0;
  for (const entry of modEntries) {
    const name = String(entry.name || '');
    if (!name) continue;

    const scanned = scans.get(name) || [];
    if (scanned.length === 0) continue;

    const records = Object.values(state.mods).filter((record) =>
      samePackageName(record.packageName, name)
    );
    const known = new Set();
    for (const record of records) {
      for (const file of record.files || []) known.add(String(file));
    }
    const missing = scanned.filter((file) => !known.has(file));
    if (records.length > 0 && missing.length === 0) continue;

    const version = profiles.versionToString(entry.versionNumber) || '0.0.0';
    if (records.length === 0) {
      state.mods[`${name}-${version}`] = {
        packageName: name,
        version,
        loader: profileLoader,
        files: scanned,
        installedAt: Number(entry.installedAtTime) || Date.now()
      };
    } else {
      records[0].files = [...new Set([...(records[0].files || []), ...missing])];
    }
    recordsRepaired += 1;
    changed = true;
  }

  // enabled 与磁盘 .old 对齐，修复「界面显示已禁用但文件仍在加载」
  let toggled = 0;
  for (const entry of modEntries) {
    const name = String(entry.name || '');
    if (!name) continue;
    try {
      const count = await applyPackageEnabled(
        profileDir,
        name,
        entry.enabled !== false,
        state,
        scans.get(name) || []
      );
      if (count > 0) toggled += 1;
    } catch {
      // 单个包失败不影响其它包
    }
  }

  if (changed) await writeState(profileDir, state);

  // 写入后再取 state 的戳，避免缓存一写就失效
  await writeRepairCache(profileDir, {
    mods: fileStamp(modsFile),
    state: fileStamp(stateFilePath(profileDir)),
    at: Date.now()
  });

  return { skipped: false, changed: changed || toggled > 0, recordsRepaired, toggled };
}

async function removeInstalledPackage(profileDir, packageName) {
  const mods = profiles.readModsYml(profileDir);
  const state = await readState(profileDir);
  const loaderIds = new Set();
  let stateChanged = false;

  // 被其它包同时引用的文件不能删，否则会把别人的 Mod 弄坏
  const shared = sharedFileKeys(state, packageName);
  const files = resolvePackageFiles(profileDir, packageName, state);

  for (const relative of files) {
    if (shared.has(String(relative).toLowerCase())) continue;
    const file = safeJoin(profileDir, relative);
    if (!file) continue;
    removeFileSafe(file);
    removeFileSafe(`${file}.old`);
  }

  for (const [key, value] of Object.entries(state.mods)) {
    if (!samePackageName(value.packageName, packageName)) continue;
    if (value.loader) loaderIds.add(value.loader);
    delete state.mods[key];
    stateChanged = true;
  }

  const filtered = mods.filter((entry) => !samePackageName(entry.name, packageName));
  if (filtered.length !== mods.length) await profiles.writeModsYml(profileDir, filtered);
  if (stateChanged) await writeState(profileDir, state);

  // 每个包独占 Mod 目录下的一个子目录，连同 icon.png / manifest.json 一起清掉。
  if (loaderIds.size === 0) loaderIds.add(loaders.detectProfileLoader(profileDir));
  const folderName = packageFolderName(packageName);
  for (const loaderId of loaderIds) {
    const loader = loaders.getLoader(loaderId);
    const roots = new Set(
      [
        loader.installPaths.plugins,
        loader.installPaths.patchers,
        loader.installPaths.mods,
        // BepInEx 的 core 目录也可能被包占用（例如翻译包自带的 core DLL），一并清理
        loaderId === 'bepinex' ? loader.installPaths.core : null
      ].filter(Boolean)
    );
    for (const root of roots) {
      const dir = safeJoin(profileDir, `${root}/${folderName}`);
      if (!dir) continue;
      // 目录里有被其它包共享的文件时，保留目录，交给上面的逐文件逻辑
      const prefix = `${root}/${folderName}/`.toLowerCase();
      if ([...shared].some((file) => file.startsWith(prefix))) continue;
      try {
        await fs.promises.rm(dir, { recursive: true, force: true });
      } catch {
        // Ignore.
      }
    }
  }
}

function normalizeConfigKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function pruneEmptyDirs(dir, root) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) pruneEmptyDirs(path.join(dir, entry.name), root);
  }

  if (dir === root) return;
  try {
    if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
  } catch {
    // Ignore.
  }
}

function removeModConfigs(root, candidates) {
  const keys = new Set();
  for (const value of candidates) {
    const key = normalizeConfigKey(value);
    if (key.length < 3) continue;
    keys.add(key);
  }
  if (keys.size === 0) return 0;

  // 只做归一化后的完全相等匹配：后缀匹配会把 MyLethalLib.cfg 这类其它 Mod 的配置误删
  const matches = (name, segments) =>
    keys.has(name) || segments.some((segment) => keys.has(normalizeConfigKey(segment)));

  let removed = 0;

  const walk = (dir) => {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    const relativeDir = path.relative(root, dir);
    const segments = relativeDir ? relativeDir.split(path.sep).filter(Boolean) : [];

    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.cfg$/i.test(entry.name)) continue;

      const base = normalizeConfigKey(path.basename(entry.name, path.extname(entry.name)));
      if (!matches(base, segments)) continue;

      removeFileSafe(full);
      if (!fs.existsSync(full)) removed += 1;
    }
  };

  walk(root);
  pruneEmptyDirs(root, root);
  return removed;
}

function removeModIcons(profileDir, packageName) {
  const dir = path.join(profileDir, '.ctr', 'icons');
  const prefix = String(packageName || '')
    .replace(/[^a-z0-9._-]+/gi, '-')
    .toLowerCase();
  if (!prefix) return;

  let entries = [];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return;
  }

  for (const name of entries) {
    const base = name.replace(/\.[^.]+$/, '').toLowerCase();
    if (base !== prefix && !base.startsWith(`${prefix}-`)) continue;
    const suffix = base.slice(prefix.length + 1);
    if (base !== prefix && !/^\d/.test(suffix)) continue;
    removeFileSafe(path.join(dir, name));
  }
}

function findInstalledEntry(profileDir, packageName) {
  const target = String(packageName || '').toLowerCase();
  return (
    profiles
      .readModsYml(profileDir)
      .find((entry) => String(entry.name || '').toLowerCase() === target) || null
  );
}

function normalizeEntryName(name) {
  return String(name || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
}

function findArchiveEntry(entries, predicate) {
  return entries.find((entry) => !entry.isDirectory && predicate(normalizeEntryName(entry.entryName)));
}

function readZipManifest(zip) {
  const entries = zip.getEntries().filter((entry) => !entry.isDirectory);
  const manifestEntry =
    findArchiveEntry(entries, (name) => name === 'manifest.json') ||
    findArchiveEntry(entries, (name) => /^[^/]+\/manifest\.json$/i.test(name));
  if (!manifestEntry) return {};

  try {
    return JSON.parse(zip.readAsText(manifestEntry));
  } catch {
    return {};
  }
}

// 解压失败时回滚本次写入：被覆盖的文件从备份恢复，新建的文件删除。
// 这样磁盘不会留下「有文件、无记录」的孤儿，重试时可以干净重装。
async function rollbackWrittenFiles(written) {
  for (const item of [...written].reverse()) {
    try {
      if (item.backup) {
        await fs.promises.mkdir(path.dirname(item.absolute), { recursive: true });
        await fs.promises.copyFile(item.backup, item.absolute);
      } else if (!item.existed) {
        await fs.promises.rm(item.absolute, { force: true });
      }
    } catch {
      // 回滚尽力而为，失败的文件留给「未跟踪文件」扫描兜底
    }
  }
}

async function unpackZip(zip, profileDir, item, game, overrides = null) {
  const packageName = overrides && overrides.packageName ? overrides.packageName : item.packageName;
  const authorName =
    overrides && overrides.authorName ? overrides.authorName : item.namespace;
  const entries = zip.getEntries().filter((entry) => !entry.isDirectory);
  if (entries.length === 0) throw new Error('压缩包为空');

  const manifest = readZipManifest(zip);

  const isRootMeta = (name) => {
    if (name.includes('/')) return false;
    const lower = name.toLowerCase();
    return ROOT_DOCS.has(lower) || lower === 'manifest.json' || /^icon\.(png|jpe?g)$/i.test(lower);
  };

  // 用于识别单层包装目录，根目录的文档/元数据不参与判断
  const structureNames = entries
    .map((entry) => normalizeEntryName(entry.entryName))
    .filter((name) => !isRootMeta(name));

  const roots = new Set(structureNames.map((name) => name.split('/')[0]));
  let wrapper = null;
  if (roots.size === 1) {
    const root = [...roots][0];
    const isDirectory = structureNames.some((name) => name.startsWith(`${root}/`));
    if (root && isDirectory && !PROTECTED_ROOTS.has(root.toLowerCase())) wrapper = root;
  }

  const stripWrapper = (name) =>
    wrapper && name.startsWith(`${wrapper}/`) ? name.slice(wrapper.length + 1) : name;

  // 先按 Profile 当前 Loader 兜底，再看压缩包本身是不是某个 Loader 本体：
  // 往空配置里装 MelonLoader 时 Profile 还没装任何 Loader，必须以包内容为准。
  const strippedNames = structureNames.map(stripWrapper);
  const profileLoaderId = loaders.detectProfileLoader(profileDir);
  const loaderId = loaders.detectPackageLoader(strippedNames, profileLoaderId);
  const loader = loaders.getLoader(loaderId);
  // 加载器包必须保持原结构（BepInEx/core、MelonLoader/、version.dll 等），
  // 其余包裹进对应 Loader 的 Mod 目录，与 TSM / r2modman 一致。
  const isLoaderPackage = loader.isLoaderPackage(strippedNames);

  const pluginPrefix = `${loader.installPaths.plugins}/`;
  const modsPrefix = loader.installPaths.mods ? `${loader.installPaths.mods}/` : pluginPrefix;
  const folderName = packageFolderName(packageName);

  // MelonLoader 0.6 不扫描 Mods 子目录，只有 0.7+ 才支持按包名建子目录
  let loaderInfo = loaderId === 'melonloader' ? await readLoaderInfo(profileDir) : null;
  // 手动安装的 MelonLoader 没有 loader.json，按目录结构推断，避免把 0.6 当成 0.7 装错布局
  if (loaderId === 'melonloader' && !loaderInfo && !isLoaderPackage) {
    const inferred = inferMelonLoaderVersion(profileDir);
    if (inferred) {
      loaderInfo = { loader: 'melonloader', version: inferred };
      try {
        await writeLoaderInfo(profileDir, 'melonloader', inferred);
      } catch {
        // 写入失败不影响本次安装布局
      }
    }
  }
  const legacyMelonLayout = Boolean(
    loaderId === 'melonloader' &&
      loaderInfo &&
      loaderInfo.loader === 'melonloader' &&
      isLegacyMelonLoader(loaderInfo.version)
  );

  // 安装 Loader 本体前清掉旧核心目录，避免新旧版本文件混杂导致注入失败
  if (isLoaderPackage && loaderPackageHasCore(strippedNames, loaderId)) {
    await removeLoaderCoreDirs(profileDir, loaderId);
  }

  // 解压前先做体量检查，避免 zip 炸弹把磁盘撑爆或拖死主进程
  if (entries.length > MAX_UNPACK_ENTRIES) {
    throw new Error('压缩包文件数量异常，已中止安装');
  }

  // 只用于备份归属判断的快照；真正的安装记录在锁内重新读取后合并写入
  const stateSnapshot = await readState(profileDir);

  const files = [];
  // 本次写入的文件，失败时用于回滚
  const written = [];
  let unpackedBytes = 0;

  try {
    for (const entry of entries) {
      let relative = normalizeEntryName(entry.entryName);
      if (wrapper) {
        if (!relative.startsWith(`${wrapper}/`)) continue;
        relative = relative.slice(wrapper.length + 1);
      }
      if (!relative) continue;

      const parts = relative.split('/');
      if (parts.some((part) => part === '..' || part === '')) continue;

      // 根目录的 README/LICENSE 之类不需要进游戏目录
      if (!relative.includes('/') && ROOT_DOCS.has(relative.toLowerCase())) continue;

      // 加载器包不往 Profile 根目录塞 manifest/icon，避免覆盖
      if (
        isLoaderPackage &&
        !relative.includes('/') &&
        (relative.toLowerCase() === 'manifest.json' || /^icon\.(png|jpe?g)$/i.test(relative))
      ) {
        continue;
      }

      // 路径路由交给 installRules：每种加载器一个策略，便于后续扩展
      const target = isLoaderPackage
        ? relative
        : installRules.resolveTarget({
            game,
            loaderId,
            relative,
            folderName,
            legacyMelonLayout,
            paths: loader.installPaths
          });

      const absolute = safeJoin(profileDir, target);
      if (!absolute) continue;

      unpackedBytes += Number(entry.header && entry.header.size) || 0;
      if (unpackedBytes > MAX_UNPACK_TOTAL_BYTES) {
        throw new Error('压缩包解压后体积异常，已中止安装');
      }

      // 单个大文件（资源包类 Mod）读取也是同步的：读之前先让出事件循环，
      // 保证下载进度和窗口至少能刷新一次
      if ((Number(entry.header && entry.header.size) || 0) > 8 * 1024 * 1024) {
        await new Promise((resolve) => setImmediate(resolve));
      }

      // 覆盖别人也在用的同名文件时先备份，冲突解决时可以「以某包为准」恢复
      const backup = await backupOverwrittenFile(
        profileDir,
        target,
        packageName,
        stateSnapshot
      );
      const existed = fs.existsSync(absolute);

      await fs.promises.mkdir(path.dirname(absolute), { recursive: true });
      await fs.promises.writeFile(absolute, zip.readFile(entry));
      written.push({ absolute, backup, existed });
      files.push(target);

      // AdmZip 的读取是同步的：每处理几个文件让出一次事件循环，
      // 避免大 Mod 解压期间窗口和下载进度整体卡死
      if (written.length % 8 === 0) {
        await new Promise((resolve) => setImmediate(resolve));
      }
    }
  } catch (error) {
    await rollbackWrittenFiles(written);
    throw error;
  }

  if (files.length === 0) throw new Error('压缩包中没有可安装的文件');

  const iconEntry =
    findArchiveEntry(entries, (name) => /^icon\.(png|jpe?g)$/i.test(name)) ||
    findArchiveEntry(entries, (name) => /^[^/]+\/icon\.(png|jpe?g)$/i.test(name));

  let iconPath = null;
  if (iconEntry) {
    // 图标只是展示用：写入失败不应让整个安装失败
    try {
      const safeName = packageName.replace(/[^a-z0-9._-]+/gi, '-');
      const extension = path.extname(normalizeEntryName(iconEntry.entryName)) || '.png';
      const iconsDir = path.join(profileDir, '.ctr', 'icons');
      await fs.promises.mkdir(iconsDir, { recursive: true });
      const resolvedVersion = String(
        (overrides && overrides.version) || manifest.version_number || item.version
      );
      const target = path.join(iconsDir, `${safeName}-${resolvedVersion}${extension}`);
      await fs.promises.writeFile(target, zip.readFile(iconEntry));
      iconPath = target.replace(/\\/g, '/');
    } catch {
      iconPath = null;
    }
  }

  const displayName = String(
    (overrides && overrides.displayName) || manifest.name || item.name || packageName
  );
  const version = String(
    (overrides && overrides.version) || manifest.version_number || item.version
  );

  // 记录 Loader 版本，后续安装 Mod 时据此选择 0.6（平铺）/ 0.7+（子目录）布局
  if (isLoaderPackage) {
    await writeLoaderInfo(profileDir, loaderId, version);
  }
  const dependencies =
    Array.isArray(manifest.dependencies) && manifest.dependencies.length > 0
      ? manifest.dependencies.filter((dep) => typeof dep === 'string')
      : [];

  let websiteUrl = null;
  if (overrides && 'websiteUrl' in overrides) {
    websiteUrl = overrides.websiteUrl;
  } else if (typeof manifest.website_url === 'string' && manifest.website_url) {
    websiteUrl = manifest.website_url;
  } else {
    websiteUrl = `https://thunderstore.io/c/${game}/p/${authorName}/${item.name}/`;
  }

  const entry = {
    manifestVersion: 1,
    name: packageName,
    authorName,
    websiteUrl,
    displayName,
    description: String(manifest.description || ''),
    gameVersion: '0',
    networkMode: 'both',
    packageType: 'other',
    installMode: 'managed',
    installedAtTime: Date.now(),
    loaders: [loaderId],
    dependencies,
    incompatibilities: [],
    optionalDependencies: [],
    versionNumber: parseVersionNumber(version),
    enabled: true,
    icon: iconPath
  };

  // 记录写入放在 Profile 锁内：解压期间用户可能启停或卸载了别的 Mod，
  // 这里重新读取最新状态再合并，避免用旧快照覆盖对方的变更
  await withProfileLock(profileDir, async () => {
    const fresh = await readState(profileDir);
    for (const [stateKey, record] of Object.entries(fresh.mods || {})) {
      if (samePackageName(record.packageName, packageName)) delete fresh.mods[stateKey];
    }
    fresh.mods[`${packageName}-${version}`] = {
      packageName,
      version,
      loader: loaderId,
      files,
      installedAt: Date.now()
    };
    await writeState(profileDir, fresh);

    const mods = profiles
      .readModsYml(profileDir)
      .filter((existing) => !samePackageName(existing.name, packageName));
    mods.push(entry);
    await profiles.writeModsYml(profileDir, mods);
  });

  // 把 icon.png / manifest.json 放进 Mod 目录，LethalConfig 会从 DLL 所在目录向上找这两个文件。
  const modFolder =
    loaderId === 'melonloader' ? `${modsPrefix}${folderName}` : `${pluginPrefix}${folderName}`;
  const hasPluginFiles = files.some((file) => file.startsWith(`${modFolder}/`));
  if (!isLoaderPackage && hasPluginFiles) {
    const folderAbs = safeJoin(profileDir, modFolder);
    if (folderAbs) {
      await fs.promises.mkdir(folderAbs, { recursive: true });
      await writePackageMeta(
        folderAbs,
        {
          name: displayName,
          version_number: version,
          website_url: websiteUrl || '',
          description: entry.description,
          dependencies
        },
        iconEntry ? zip.readFile(iconEntry) : null
      );
    }
  }

  return { manifest, entry, files, dependencies };
}

const DOWNLOAD_TIMEOUT_MS = 600000;
const DOWNLOAD_ATTEMPTS = 5;
// 单个子项里「下载」占总进度的 90%，解压/落盘占最后 10%
const STEP_DOWNLOAD_SHARE = 0.9;

function isRetryableDownloadError(error) {
  const message = String((error && error.message) || '');
  const match = message.match(/下载失败（(\d{3})）/);
  if (match) {
    const status = Number(match[1]);
    return status >= 500 || status === 408 || status === 429;
  }
  // 超时、连接中断之类都可以重试
  return true;
}

async function downloadTempDir() {
  const dir = path.join(os.tmpdir(), 'ctr-mod-downloads');
  await fs.promises.mkdir(dir, { recursive: true });
  return dir;
}

async function removeFileQuietly(filePath) {
  if (!filePath) return;
  try {
    await fs.promises.rm(filePath, { force: true });
  } catch {
    // 清理失败不影响安装流程
  }
}

function contentRangeTotal(header) {
  const match = String(header || '').match(/\/(\d+)\s*$/);
  return match ? Number(match[1]) : 0;
}

// 下载到系统临时目录，直接流式写盘；失败重试时用 Range 断点续传。
// 返回临时文件路径，调用方解压完必须自行删除。
async function downloadZip(url, onProgress) {
  const tempFile = path.join(await downloadTempDir(), `${crypto.randomUUID()}.zip`);
  let lastError = null;
  let downloadedBytes = 0;
  let totalBytes = 0;

  try {
    for (let attempt = 1; attempt <= DOWNLOAD_ATTEMPTS; attempt += 1) {
      try {
        try {
          downloadedBytes = (await fs.promises.stat(tempFile)).size;
        } catch {
          downloadedBytes = 0;
        }

        const headers = { 'User-Agent': 'CtrModManager/0.1' };
        if (downloadedBytes > 0) headers.Range = `bytes=${downloadedBytes}-`;

        const response = await fetch(url, {
          redirect: 'follow',
          headers,
          signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS)
        });

        // 416 说明本地文件已经不小于服务器文件：下完了就直接用，否则清空重下
        if (response.status === 416) {
          const remoteTotal = contentRangeTotal(response.headers.get('content-range'));
          if (remoteTotal > 0 && downloadedBytes >= remoteTotal) {
            onProgress(downloadedBytes, remoteTotal);
            return tempFile;
          }

          await removeFileQuietly(tempFile);
          downloadedBytes = 0;
          totalBytes = 0;
          lastError = new Error('下载失败（416）');
          if (attempt >= DOWNLOAD_ATTEMPTS) break;
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          continue;
        }

        if (!response.ok && response.status !== 206) {
          throw new Error(`下载失败（${response.status}）`);
        }

        if (response.status === 206) {
          const remoteTotal = contentRangeTotal(response.headers.get('content-range'));
          if (remoteTotal > 0) totalBytes = remoteTotal;
        } else {
          totalBytes = Number(response.headers.get('content-length')) || 0;
        }

        if (!response.body) throw new Error('响应体为空');

        // 服务器不支持 Range 时会返回 200，此时必须从头写，否则 ZIP 会损坏
        const append = response.status === 206 && downloadedBytes > 0;
        if (!append) {
          downloadedBytes = 0;
          await removeFileQuietly(tempFile);
        }

        const source = Readable.fromWeb(response.body);
        let lastUpdate = 0;
        source.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          const now = Date.now();
          if (now - lastUpdate > 100) {
            lastUpdate = now;
            onProgress(downloadedBytes, totalBytes);
          }
        });

        await pipeline(source, fs.createWriteStream(tempFile, { flags: append ? 'a' : 'w' }));

        onProgress(downloadedBytes, totalBytes || downloadedBytes);
        return tempFile;
      } catch (error) {
        lastError = error;
        if (attempt >= DOWNLOAD_ATTEMPTS || !isRetryableDownloadError(error)) break;
        // 保留当前进度，等下一次尝试续传
        onProgress(downloadedBytes, totalBytes);
        await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
      }
    }
  } catch (error) {
    await removeFileQuietly(tempFile);
    throw error;
  }

  await removeFileQuietly(tempFile);
  throw lastError || new Error('下载失败');
}

// 与 r2modman 一致：普通 Mod 的依赖默认装最新版——压缩包里写死的依赖版本经常已被作者下架。
// 只有拿不到社区清单时才退回清单声明的版本；任一侧下载 404 时再换另一个版本重试。
async function installDependency(task, parsed, seen) {
  const key = String(parsed.packageName || '').toLowerCase();
  if (!key || seen.has(key)) return;

  const latest = await resolveLatestPackage(task.game, parsed.packageName).catch(() => null);
  const primary = latest || parsed;

  try {
    await installPackage(task, primary, seen, false);
  } catch (error) {
    const message = String((error && error.message) || '');
    if (!message.includes('404')) throw error;
    const fallback = String(primary.version) === String(parsed.version) ? latest : parsed;
    if (!fallback || String(fallback.version) === String(primary.version)) throw error;
    await installPackage(task, fallback, seen, false);
  }
}

async function installPackage(task, item, seen, isRoot) {
  const key = String(item.packageName || '').toLowerCase();
  if (!key || seen.has(key)) return;
  seen.add(key);

  const step = ensureStep(task, item);
  const installedEntry = findInstalledEntry(task.profileDir, item.packageName);
  const installedVersion = installedEntry
    ? profiles.versionToString(installedEntry.versionNumber)
    : null;
  // 更新已禁用的 Mod 时保持禁用状态，不要因为重新解压而把它重新启用
  const wasDisabled = Boolean(installedEntry && installedEntry.enabled === false);

  // 已安装的依赖无需再次下载，避免把用户已更新的版本退回旧版。
  // 只有用户明确选择安装的根 Mod 才允许切换版本。
  if (installedEntry && (!isRoot || installedVersion === item.version)) {
    step.status = 'skipped';
    step.progress = 1;
    step.operationProgress = 1;
    task.currentLabel = `${item.name} ${installedVersion || item.version}`;
    emit(true);
    return;
  }

  step.status = 'downloading';
  step.progress = step.baseProgress || 0;
  step.operationProgress = 0;
  task.currentLabel = `${item.name} ${item.version}`;
  emit(true);

  let tempFilePath = null;

  try {
    const url = item.downloadUrl || buildDownloadUrl(item);
    tempFilePath = await downloadZip(url, (downloaded, total) => {
      const ratio = total > 0 ? Math.min(1, downloaded / total) : step.operationProgress || 0;
      step.operationProgress = ratio;
      // 大进度条看的是总进度：下载只占该子项的 90%，剩余留给解压落盘
      const base = step.baseProgress || 0;
      step.progress = base + (1 - base) * ratio * STEP_DOWNLOAD_SHARE;
      task.progress = computeProgress(task);
      emit(false);
    });

    // 直接传临时文件路径给 AdmZip，避免把压缩包整体读进内存
    const zip = new AdmZip(tempFilePath);
    const manifest = readZipManifest(zip);
    const dependencies = Array.isArray(manifest.dependencies)
      ? manifest.dependencies.filter((dependency) => typeof dependency === 'string')
      : [];

    // 先装依赖再落盘：这样中途关闭管理器时，列表里不会出现「已安装但缺少依赖」的 Mod。
    for (const dependency of dependencies) {
      const parsed = parseDependency(dependency);
      if (!parsed) continue;
      await installDependency(task, parsed, seen);
    }

    // 删旧版本同样要在 Profile 锁内：此时可能有一个启停/卸载操作正在改同一份状态
    await withProfileLock(task.profileDir, () =>
      removeInstalledPackage(task.profileDir, item.packageName)
    );

    step.status = 'extracting';
    step.operationProgress = 1;
    const stepBase = step.baseProgress || 0;
    step.progress = stepBase + (1 - stepBase) * STEP_DOWNLOAD_SHARE;
    task.progress = computeProgress(task);
    emit(true);

    await unpackZip(zip, task.profileDir, item, task.game);

    if (wasDisabled) await disablePackage(task.profileDir, item.packageName);

    step.status = 'done';
    step.progress = 1;
    step.operationProgress = 1;
    task.progress = computeProgress(task);
    emit(true);
  } catch (error) {
    // 失败后要放开 seen，否则重试时这个包（以及它的依赖）会被直接跳过，装出缺依赖的残缺结果
    seen.delete(key);
    step.status = 'error';
    step.error = error.message || '安装失败';
    if (!task.error) task.error = step.error;
    task.progress = computeProgress(task);
    emit(true);
    throw error;
  } finally {
    await removeFileQuietly(tempFilePath);
  }
}

async function processTask(task) {
  task.status = 'downloading';
  task.error = null;
  emit(true);

  try {
    const meta = await fetchPackageVersions(task.game, task.uuid);
    const rootVersion = meta.versions.find((version) => version.versionNumber === task.version);

    if (!rootVersion) throw new Error('所选版本已不可用，请重新选择');

    task.title = meta.name || task.title;
    task.version = rootVersion.versionNumber;

    const rootParsed = parseDependency(rootVersion.fullName) || {
      namespace: meta.namespace,
      name: meta.name,
      packageName: `${meta.namespace}-${meta.name}`
    };

    const rootItem = {
      fullName: rootVersion.fullName,
      namespace: rootParsed.namespace,
      name: rootParsed.name,
      version: rootVersion.versionNumber,
      packageName: rootParsed.packageName,
      downloadUrl: rootVersion.downloadUrl,
      isRoot: true
    };

    const seen = new Set();
    ensureStep(task, rootItem);
    task.progress = computeProgress(task);
    emit(true);

    await installPackage(task, rootItem, seen, true);

    task.status = 'done';
    task.progress = 1;
    task.currentLabel = '';
  } catch (error) {
    task.status = 'error';
    task.error = error.message || '下载失败';
    task.currentLabel = '';
  }

  emit(true);

  if (task.status === 'done') {
    notifyProfileUpdated(task.game, task.profileId);
    setTimeout(() => {
      const current = tasks.get(task.id);
      if (current && current.status === 'done') {
        tasks.delete(task.id);
        emit(true);
      }
    }, 2200);
  } else if (task.status === 'error') {
    notifyProfileUpdated(task.game, task.profileId);
  }
}

// 只重试失败任务里的某一个 Mod（含它的依赖），不影响其它已完成/失败的项目
async function processStepRetry(task) {
  const stepKey = task.retryStepKey;
  const step = task.steps.find((item) => item.key === stepKey);
  task.retryStepKey = null;

  if (!step) {
    task.status = 'error';
    emit(true);
    return;
  }

  task.status = 'downloading';
  task.error = null;
  step.status = 'downloading';
  step.progress = step.baseProgress || 0;
  step.operationProgress = 0;
  step.error = null;
  task.currentLabel = step.name || step.key;
  emit(true);

  try {
    const parsed = parseDependency(step.key);
    if (!parsed) throw new Error('无法识别该 Mod 的版本信息');

    await installPackage(
      task,
      {
        fullName: step.key,
        namespace: parsed.namespace,
        name: parsed.name,
        version: parsed.version,
        packageName: parsed.packageName,
        downloadUrl: buildDownloadUrl(parsed)
      },
      new Set(),
      true
    );
  } catch (error) {
    // installPackage 已把失败信息写进 step
    if (step.status !== 'error') {
      step.status = 'error';
      step.error = error.message || '安装失败';
    }
  }

  const failedStep = task.steps.find((item) => item.status === 'error');
  task.status = failedStep ? 'error' : 'done';
  task.error = failedStep ? failedStep.error || '安装失败' : null;
  task.currentLabel = '';
  task.progress = failedStep ? computeProgress(task) : 1;
  emit(true);

  notifyProfileUpdated(task.game, task.profileId);

  if (task.status === 'done') {
    setTimeout(() => {
      const current = tasks.get(task.id);
      if (current && current.status === 'done') {
        tasks.delete(task.id);
        emit(true);
      }
    }, 2200);
  }
}

async function processQueue() {
  if (processing) return;
  processing = true;

  try {
    while (queue.length > 0) {
      const task = queue.shift();
      if (!task || !tasks.has(task.id)) continue;
      if (task.retryStepKey) await processStepRetry(task);
      else if (task.type === 'local') await processLocalTask(task);
      else if (task.type === 'import') await processImportTask(task);
      else await processTask(task);
    }
  } finally {
    processing = false;
  }
}

async function installImportItem(task, item, seen) {
  const step = ensureStep(task, {
    fullName: `${item.packageName}-${item.version}`,
    name: item.name,
    version: item.version
  });

  try {
    const meta = await fetchPackageVersions(task.game, item.uuid);
    const versionInfo =
      meta.versions.find((version) => version.versionNumber === item.version) ||
      (item.version ? null : meta.versions[0]);

    if (!versionInfo) throw new Error(`版本 ${item.version} 不可用`);

    if (versionInfo.versionNumber !== item.version) {
      step.version = versionInfo.versionNumber;
      emit(true);
    }

    await installPackage(
      task,
      {
        fullName: step.key,
        namespace: item.namespace || meta.namespace,
        name: item.name || meta.name,
        version: versionInfo.versionNumber,
        packageName: item.packageName,
        downloadUrl: versionInfo.downloadUrl,
        isRoot: true
      },
      seen,
      true
    );

    return true;
  } catch (error) {
    step.status = 'error';
    step.error = error.message || '安装失败';
    if (!task.error) task.error = step.error;
    emit(true);
    return false;
  }
}

// 按 .r2z 清单逐个安装指定版本；缺依赖会被顺带补齐，已安装的包不会重复下载。
async function processImportTask(task) {
  task.status = 'downloading';
  task.error = null;
  emit(true);

  const seen = new Set();
  const disabled = [];
  const allItems = task.importMods || [];
  // 重试时只处理上次失败的项目，避免把已装好的再跑一遍
  const items = task.retryKeys
    ? allItems.filter((item) => task.retryKeys.has(`${item.packageName}-${item.version}`))
    : allItems;
  task.retryKeys = null;
  const failed = [];

  for (const item of items) {
    const ok = await installImportItem(task, item, seen);
    if (!ok) failed.push(item);
    else if (item.enabled === false) disabled.push(item.packageName);
  }

  // 网络抖动导致失败的 Mod 再整体重试一轮
  if (failed.length > 0) {
    for (const item of failed) {
      seen.delete(String(item.packageName).toLowerCase());
      const step = ensureStep(task, {
        fullName: `${item.packageName}-${item.version}`,
        name: item.name,
        version: item.version
      });
      step.status = 'pending';
      step.error = null;
    }
    emit(true);

    for (const item of failed) {
      const ok = await installImportItem(task, item, seen);
      if (ok) {
        if (item.enabled === false) disabled.push(item.packageName);
      } else if (!task.error) {
        task.error = `部分 Mod 安装失败：${item.name}`;
      }
    }
  }

  for (const packageName of disabled) {
    try {
      await disablePackage(task.profileDir, packageName);
    } catch {
      // Ignore single mod disable failures; the profile is still usable.
    }
  }

  let restoreError = null;
  if (task.afterInstall) {
    try {
      await task.afterInstall();
    } catch (error) {
      restoreError = error.message || '配置还原失败';
    }
  }

  const hasError = Boolean(restoreError) || task.steps.some((step) => step.status === 'error');
  task.status = hasError ? 'error' : 'done';
  task.currentLabel = '';
  if (hasError) {
    const firstError = task.steps.find((step) => step.status === 'error');
    task.error = restoreError || (firstError ? firstError.error : task.error);
  } else {
    task.error = null;
    task.progress = 1;
  }
  emit(true);

  notifyProfileUpdated(task.game, task.profileId);

  if (task.status === 'done') {
    setTimeout(() => {
      const current = tasks.get(task.id);
      if (current && current.status === 'done') {
        tasks.delete(task.id);
        emit(true);
      }
    }, 2200);
  }
}

async function disablePackage(profileDir, packageName) {
  return withProfileLock(profileDir, async () => {
    const mods = profiles.readModsYml(profileDir);
    const target = mods.find((entry) => samePackageName(entry.name, packageName));
    if (!target) return;

    const state = await readState(profileDir);
    await applyPackageEnabled(profileDir, packageName, false, state);

    target.enabled = false;
    await profiles.writeModsYml(profileDir, mods);
  });
}

function startProfileImport(game, profileId, mods, options) {
  const profileDir = profiles.getProfileDir(game, profileId);
  const items = (Array.isArray(mods) ? mods : [])
    .filter((mod) => mod && mod.uuid && mod.packageName)
    .map((mod) => ({
      uuid: String(mod.uuid),
      packageName: String(mod.packageName),
      namespace: String(mod.namespace || ''),
      name: String(mod.name || mod.packageName),
      version: String(mod.version || ''),
      enabled: mod.enabled !== false
    }));

  taskSequence += 1;
  const task = {
    id: `${Date.now().toString(36)}-${taskSequence}`,
    type: 'import',
    game,
    profileId,
    profileDir,
    title: '导入配置',
    version: '',
    status: 'queued',
    progress: 0,
    currentLabel: '',
    error: null,
    steps: [],
    importMods: items,
    // Mod 装完后再还原用户配置，避免被压缩包里的默认 cfg 覆盖
    afterInstall:
      options && typeof options.afterInstall === 'function' ? options.afterInstall : null
  };

  for (const item of items) {
    ensureStep(task, {
      fullName: `${item.packageName}-${item.version}`,
      name: item.name,
      version: item.version
    });
  }

  tasks.set(task.id, task);
  queue.push(task);
  emit(true);
  processQueue().catch(() => {});

  return publicTask(task);
}

function startInstall(request) {
  if (!request || typeof request !== 'object') throw new Error('安装参数无效');

  const game = String(request.game || '');
  const profileId = String(request.profileId || '');
  const uuid = String(request.uuid || '');
  const version = String(request.versionNumber || '');
  const name = String(request.name || 'Mod');

  const profileDir = profiles.getProfileDir(game, profileId);
  if (!version) throw new Error('请选择要安装的版本');

  taskSequence += 1;
  const task = {
    id: `${Date.now().toString(36)}-${taskSequence}`,
    type: 'install',
    game,
    profileId,
    profileDir,
    uuid,
    title: name,
    version,
    status: 'queued',
    progress: 0,
    currentLabel: '',
    error: null,
    steps: []
  };

  tasks.set(task.id, task);
  queue.push(task);
  emit(true);
  processQueue().catch(() => {});

  return publicTask(task);
}

function resetStep(step) {
  step.status = 'pending';
  step.progress = 0;
  step.baseProgress = 0;
  step.operationProgress = 0;
  step.error = null;
}

// 重试整个失败任务
function retryTask(id) {
  const task = tasks.get(String(id));
  if (!task) throw new Error('下载任务不存在');
  if (task.status !== 'error') throw new Error('任务没有失败，无需重试');

  task.error = null;
  task.currentLabel = '';
  task.retryStepKey = null;

  if (task.type === 'install') {
    // 重新走一遍完整安装流程，已装好的依赖会自动跳过
    task.steps = [];
    task.progress = 0;
  } else if (task.type === 'import') {
    const failedKeys = new Set(
      task.steps.filter((step) => step.status === 'error').map((step) => step.key)
    );
    // 允许「Mod 都装好了、只是配置还原失败」的任务重试：此时只需要再跑一次还原
    for (const step of task.steps) {
      if (failedKeys.has(step.key)) resetStep(step);
    }
    task.retryKeys = failedKeys;
    task.progress = computeProgress(task);
  } else {
    for (const step of task.steps) {
      if (step.status === 'error') resetStep(step);
    }
    task.progress = computeProgress(task);
  }

  task.status = 'queued';
  emit(true);
  queue.push(task);
  processQueue().catch(() => {});

  return publicTask(task);
}

// 只重试失败任务中的某个 Mod（子 Mod）
function retryStep(id, stepKey) {
  const task = tasks.get(String(id));
  if (!task) throw new Error('下载任务不存在');
  if (task.status !== 'error') throw new Error('任务正在重试中');
  if (task.type === 'local') throw new Error('该任务不支持单独重试');

  const step = task.steps.find((item) => item.key === String(stepKey));
  if (!step || step.status !== 'error') throw new Error('该 Mod 没有失败记录');
  if (!parseDependency(step.key)) throw new Error('该任务不支持单独重试');

  task.retryStepKey = step.key;
  task.error = null;
  task.status = 'queued';
  emit(true);
  queue.push(task);
  processQueue().catch(() => {});

  return publicTask(task);
}

function dismiss(id) {
  const task = tasks.get(String(id));
  if (!task) return false;
  if (task.status !== 'done' && task.status !== 'error') {
    throw new Error('下载进行中，暂时不能移除');
  }
  tasks.delete(task.id);
  emit(true);
  return true;
}

async function setModEnabled(game, profileId, packageName, enabled) {
  const profileDir = profiles.getProfileDir(game, profileId);

  // 启停会同时改 mods.yml、installed.json 和磁盘上的 .old 文件名，
  // 必须与安装任务、卸载操作串行，否则会读到中间状态或丢失写回
  return withProfileLock(profileDir, async () => {
    const mods = profiles.readModsYml(profileDir);
    const target = mods.find((entry) => samePackageName(entry.name, packageName));
    if (!target) throw new Error('未找到该 Mod 记录');

    const state = await readState(profileDir);
    const trackedFiles = resolvePackageFiles(profileDir, packageName, state);
    // 没有可切换文件时不能只改标志位，否则又会出现「显示已禁用/启用但磁盘没变」
    if (trackedFiles.length === 0) {
      throw new Error('未找到该 Mod 的可切换文件，可能是加载器本体或安装已损坏');
    }
    if (isLoaderPackageFiles(trackedFiles)) {
      throw new Error('加载器本体不能启用/禁用，请重装对应的 BepInEx / MelonLoader 包');
    }

    // 没有安装记录的历史 Mod 也能通过磁盘扫描找到文件，不会再出现「点了禁用但没生效」
    const count = await applyPackageEnabled(profileDir, packageName, enabled, state);

    target.enabled = Boolean(enabled);
    await profiles.writeModsYml(profileDir, mods);
    notifyProfileUpdated(game, profileId);

    return { enabled: target.enabled, files: count };
  });
}

function validateLocalMetadata(metadata) {
  const name = String((metadata && metadata.name) || '').trim();
  const author = String((metadata && metadata.author) || '').trim();
  const version = String((metadata && metadata.version) || '').trim();

  if (!name || name.length > 60 || /[\\/:*?"<>|\u0000-\u001f]/.test(name)) {
    throw new Error('Mod 名称无效');
  }
  if (!author || author.length > 60 || /[\\/:*?"<>|\u0000-\u001f]/.test(author)) {
    throw new Error('作者名称无效');
  }
  if (!/^\d+(\.\d+){0,3}([+-][0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error('版本号格式无效，例如 1.0.0');
  }

  return {
    name,
    author,
    version,
    packageName: `${author}-${name}`
  };
}

async function processLocalTask(task) {
  const step = task.steps[0];

  try {
    task.status = 'downloading';
    task.currentLabel = '读取本地压缩包…';
    step.status = 'downloading';
    step.progress = 0.2;
    step.operationProgress = 0.2;
    task.progress = 0.2;
    emit(true);

    if (!fs.existsSync(task.zipPath)) throw new Error('压缩包不存在');
    // 直接传路径给 AdmZip，避免把整个压缩包读进内存
    const zip = new AdmZip(task.zipPath);
    step.progress = 0.5;
    step.operationProgress = 0.5;
    task.progress = 0.5;
    emit(true);

    task.status = 'extracting';
    task.currentLabel = '解压文件…';
    step.status = 'extracting';
    step.progress = 0.6;
    step.operationProgress = 0.6;
    task.progress = 0.6;
    emit(true);

    await withProfileLock(task.profileDir, () =>
      removeInstalledPackage(task.profileDir, task.metadata.packageName)
    );

    const item = {
      fullName: `${task.metadata.packageName}-${task.metadata.version}`,
      namespace: task.metadata.author,
      name: task.metadata.name,
      version: task.metadata.version,
      packageName: task.metadata.packageName
    };

    await unpackZip(zip, task.profileDir, item, task.game, {
      packageName: task.metadata.packageName,
      authorName: task.metadata.author,
      displayName: task.metadata.name,
      version: task.metadata.version,
      websiteUrl: null
    });

    step.status = 'done';
    step.progress = 1;
    step.operationProgress = 1;
    task.status = 'done';
    task.progress = 1;
    task.currentLabel = '';
    emit(true);
    notifyProfileUpdated(task.game, task.profileId);

    setTimeout(() => {
      const current = tasks.get(task.id);
      if (current && current.status === 'done') {
        tasks.delete(task.id);
        emit(true);
      }
    }, 2200);
  } catch (error) {
    step.status = 'error';
    step.error = error.message || '导入失败';
    task.status = 'error';
    task.error = step.error;
    task.currentLabel = '';
    emit(true);
    notifyProfileUpdated(task.game, task.profileId);
  }
}

function startLocalImport(game, profileId, zipPath, metadata) {
  const profileDir = profiles.getProfileDir(game, profileId);
  if (typeof zipPath !== 'string' || !fs.existsSync(zipPath)) {
    throw new Error('压缩包不存在');
  }

  const info = validateLocalMetadata(metadata);
  taskSequence += 1;

  const task = {
    id: `${Date.now().toString(36)}-${taskSequence}`,
    type: 'local',
    game,
    profileId,
    profileDir,
    zipPath,
    metadata: info,
    title: info.name,
    version: info.version,
    status: 'queued',
    progress: 0,
    currentLabel: '',
    error: null,
    steps: [
      {
        key: info.packageName,
        name: info.name,
        version: info.version,
        status: 'pending',
        progress: 0,
        error: null
      }
    ]
  };

  tasks.set(task.id, task);
  queue.push(task);
  emit(true);
  processQueue().catch(() => {});

  return publicTask(task);
}

async function removeMod(game, profileId, packageName) {
  const profileDir = profiles.getProfileDir(game, profileId);

  // 卸载要删文件、改 mods.yml 和 installed.json，必须与安装/启停串行
  return withProfileLock(profileDir, async () => {
    const target = findInstalledEntry(profileDir, packageName);
    if (!target) throw new Error('未找到该 Mod 记录');

    const packageKey = String(target.name || packageName);
    const dash = packageKey.indexOf('-');
    const namePart = dash > 0 ? packageKey.slice(dash + 1) : '';

    await removeInstalledPackage(profileDir, packageKey);
    removeModIcons(profileDir, packageKey);

    // 按 Mod 记录的 Loader 清理对应配置目录（BepInEx/config 或 UserData）
    const entryLoaders =
      Array.isArray(target.loaders) && target.loaders.length > 0
        ? target.loaders
        : [loaders.detectProfileLoader(profileDir)];
    const configRoots = [
      ...new Set(entryLoaders.map((id) => loaders.getLoader(id).installPaths.config))
    ];
    const configCandidates = [packageKey, namePart, target.displayName];
    let configs = 0;
    for (const configRoot of configRoots) {
      configs += removeModConfigs(path.join(profileDir, configRoot), configCandidates);
    }

    notifyProfileUpdated(game, profileId);
    return { configs };
  });
}

// 汇总 Profile 内跨包共享的文件，供界面提示「卸载不会删除这些文件」
async function getSharedFiles(game, profileId) {
  const profileDir = profiles.getProfileDir(game, profileId);
  const state = await readState(profileDir);
  const owners = new Map();

  for (const record of Object.values(state.mods)) {
    const name = String(record.packageName || '');
    if (!name) continue;
    for (const file of record.files || []) {
      const key = String(file).toLowerCase();
      if (!owners.has(key)) owners.set(key, new Set());
      owners.get(key).add(name);
    }
  }

  const result = new Map();
  for (const names of owners.values()) {
    if (names.size < 2) continue;
    for (const name of names) {
      if (!result.has(name)) result.set(name, { count: 0, packages: new Set() });
      const info = result.get(name);
      info.count += 1;
      for (const other of names) {
        if (other !== name) info.packages.add(other);
      }
    }
  }

  return Object.fromEntries(
    [...result.entries()].map(([name, info]) => [
      name,
      { count: info.count, packages: [...info.packages] }
    ])
  );
}

module.exports = {
  configure,
  getTasks,
  startInstall,
  dismiss,
  retryTask,
  retryStep,
  setModEnabled,
  startLocalImport,
  startProfileImport,
  removeMod,
  repairProfile,
  getSharedFiles,
  scanUntracked,
  cleanUntracked,
  getConflicts,
  setConflictWinner
};

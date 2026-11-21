'use strict';

const fs = require('node:fs');
const path = require('node:path');
const AdmZip = require('adm-zip');
const yaml = require('js-yaml');
const { dialog, app } = require('electron');
const profiles = require('./profiles');

// r2modman 导出时只会带上这些文本类型的配置文件（见 r2modmanPlus ProfileModList.createExport）。
const EXPORT_TEXT_EXTENSIONS = ['.cfg', '.txt', '.json', '.yml', '.yaml', '.ini'];

function sanitizeFileName(name) {
  return String(name || 'profile')
    .replace(/[\\/:*?"<>|]/g, '-')
    .trim() || 'profile';
}

function versionParts(entry) {
  const text = profiles.versionToString(entry.versionNumber) || '0.0.0';
  const numbers = text
    .split('.')
    .map((part) => Number.parseInt(part, 10))
    .filter((value) => Number.isFinite(value));

  return {
    major: numbers[0] || 0,
    minor: numbers[1] || 0,
    patch: numbers[2] || 0
  };
}

// export.r2x 是 r2modman 的 YAML 清单：profileName + mods[{ name, version{major,minor,patch}, enabled }]
function buildExportDocument(profileName, mods) {
  return {
    profileName,
    mods: mods
      .filter((entry) => entry && entry.name)
      .map((entry) => ({
        name: String(entry.name),
        version: versionParts(entry),
        enabled: entry.enabled !== false
      }))
  };
}

function collectTextFiles(zip, profileDir) {
  const configRoot = path.join(profileDir, 'BepInEx', 'config');

  const walk = (dir) => {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      const relative = path.relative(profileDir, full).split(path.sep).join('/');

      if (entry.isDirectory()) {
        if (relative === '.ctr' || relative.startsWith('.ctr/')) continue;
        if (full === configRoot) continue;
        walk(full);
        continue;
      }

      if (!entry.isFile()) continue;
      if (relative === 'profile.json') continue;
      if (/(^|\/)mods\.yml$/i.test(relative)) continue;
      // 各加载器包目录里的 manifest.json 是安装时写入的元数据，不需要进导出包
      if (
        /^(BepInEx\/(plugins|patchers)|Mods|Plugins)\/[^/]+\/manifest\.json$/i.test(relative)
      ) {
        continue;
      }

      const lower = relative.toLowerCase();
      if (!EXPORT_TEXT_EXTENSIONS.some((extension) => lower.endsWith(extension))) continue;

      const zipDir = path.posix.dirname(relative);
      zip.addLocalFile(full, zipDir === '.' ? '' : zipDir);
    }
  };

  walk(profileDir);
}

async function exportProfile(game, profileId, win) {
  const profileDir = profiles.getProfileDir(game, profileId);
  const profile = profiles.listProfiles(game).find((item) => item.id === profileId);
  const profileName = profile ? profile.name : path.basename(profileDir);
  const defaultName = `${sanitizeFileName(profileName)}.r2z`;

  const options = {
    title: '导出 Mod 配置',
    defaultPath: path.join(app.getPath('documents'), defaultName),
    filters: [{ name: 'r2modman Profile', extensions: ['r2z'] }]
  };

  const result = win ? await dialog.showSaveDialog(win, options) : await dialog.showSaveDialog(options);
  if (result.canceled || !result.filePath) return null;

  const target = result.filePath.toLowerCase().endsWith('.r2z')
    ? result.filePath
    : `${result.filePath}.r2z`;

  const zip = new AdmZip();

  const document = buildExportDocument(profileName, profiles.readModsYml(profileDir));
  zip.addFile('export.r2x', Buffer.from(yaml.dump(document, { noRefs: true, lineWidth: -1 }), 'utf8'));

  // r2modman 约定：配置文件以 config/ 前缀打包，导入时会还原到 BepInEx/config/
  const configDir = path.join(profileDir, 'BepInEx', 'config');
  if (fs.existsSync(configDir)) {
    zip.addLocalFolder(configDir, 'config');
  }

  collectTextFiles(zip, profileDir);
  zip.writeZip(target);

  return { path: target };
}

const BLOCKED_EXTENSIONS = [
  '.dll', '.exe', '.scr', '.com', '.pif',
  '.bat', '.cmd', '.ps1', '.vbs', '.vbe',
  '.js', '.jse', '.wsf', '.wsh', '.hta',
  '.msi', '.msix', '.sys', '.drv', '.cpl',
  '.ocx', '.lnk', '.reg', '.inf', '.jar', '.sh'
];

// .r2z 只应包含配置文件，正常体积远小于这个上限；超过说明压缩包异常
const MAX_PROFILE_IMPORT_ENTRIES = 5000;
const MAX_PROFILE_IMPORT_BYTES = 512 * 1024 * 1024;

function resolveInside(root, relative) {
  const normalized = String(relative || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
  if (!normalized) return null;

  const parts = normalized.split('/');
  if (parts.some((part) => part === '..' || part === '')) return null;

  const target = path.resolve(root, ...parts);
  const rootResolved = path.resolve(root);
  if (target !== rootResolved && !target.startsWith(rootResolved + path.sep)) return null;
  return target;
}

function normalizeExportVersion(version) {
  if (typeof version === 'string') return version.trim();
  if (!version || typeof version !== 'object') return '';

  const parts = [version.major, version.minor, version.patch].filter(
    (part) => part !== undefined && part !== null
  );
  return parts.join('.');
}

async function chooseProfileArchive(win) {
  const options = {
    title: '选择要导入的 .r2z 配置',
    properties: ['openFile'],
    filters: [{ name: 'r2modman Profile', extensions: ['r2z'] }]
  };

  const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);
  if (result.canceled || result.filePaths.length === 0) return null;

  const archivePath = result.filePaths[0];
  let zip;
  try {
    zip = new AdmZip(archivePath);
  } catch (error) {
    throw new Error(`无法读取压缩包：${error.message}`);
  }

  const entry = zip
    .getEntries()
    .find(
      (item) =>
        !item.isDirectory && item.entryName.replace(/\\/g, '/').toLowerCase() === 'export.r2x'
    );

  if (!entry) throw new Error('压缩包中缺少 export.r2x，不是有效的 .r2z 配置');

  let parsed;
  try {
    parsed = yaml.load(zip.readAsText(entry));
  } catch (error) {
    throw new Error(`export.r2x 解析失败：${error.message}`);
  }

  if (!parsed || typeof parsed !== 'object') throw new Error('export.r2x 内容无效');
  if (typeof parsed.profileName !== 'string' || !parsed.profileName.trim()) {
    throw new Error('export.r2x 缺少 profileName 字段');
  }
  if (!Array.isArray(parsed.mods)) throw new Error('export.r2x 的 Mod 列表无效');

  const mods = parsed.mods
    .filter((item) => item && typeof item.name === 'string' && item.name.trim())
    .map((item) => ({
      name: item.name.trim(),
      version: normalizeExportVersion(item.version),
      enabled: item.enabled !== false
    }));

  return {
    path: archivePath,
    profileName: parsed.profileName.trim(),
    mods
  };
}

// 按 r2modman 的规则还原配置里的文本文件：config/ 前缀落到 BepInEx/config，其它保持相对路径。
async function extractProfileFiles(game, profileId, archivePath) {
  const profileDir = profiles.getProfileDir(game, profileId);
  const zip = new AdmZip(archivePath);

  // 先整体校验再落盘：异常压缩包不会留下写了一半的配置
  const entries = zip.getEntries().filter((entry) => !entry.isDirectory);
  if (entries.length > MAX_PROFILE_IMPORT_ENTRIES) {
    throw new Error('配置包文件数量异常，已中止导入');
  }
  const totalBytes = entries.reduce(
    (sum, entry) => sum + (Number(entry.header && entry.header.size) || 0),
    0
  );
  if (totalBytes > MAX_PROFILE_IMPORT_BYTES) {
    throw new Error('配置包解压后体积异常，已中止导入');
  }

  for (const entry of entries) {
    const name = entry.entryName.replace(/\\/g, '/');
    const lower = name.toLowerCase();
    if (lower === 'export.r2x' || lower.endsWith('/mods.yml') || lower === 'mods.yml') continue;
    if (BLOCKED_EXTENSIONS.some((extension) => lower.endsWith(extension))) continue;

    const target = name.toLowerCase().startsWith('config/') ? `BepInEx/${name}` : name;
    const absolute = resolveInside(profileDir, target);
    if (!absolute) continue;

    await fs.promises.mkdir(path.dirname(absolute), { recursive: true });
    await fs.promises.writeFile(absolute, zip.readFile(entry));
  }
}

async function chooseModArchive(win) {
  const options = {
    title: '选择本地 Mod 压缩包',
    properties: ['openFile'],
    filters: [{ name: 'Mod 压缩包', extensions: ['zip'] }]
  };

  const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);
  if (result.canceled || result.filePaths.length === 0) return null;

  const zipPath = result.filePaths[0];
  let name = '';
  let author = '';
  let version = '';

  try {
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();
    const manifestEntry = entries.find(
      (entry) =>
        !entry.isDirectory &&
        (entry.entryName === 'manifest.json' || /^[^/]+\/manifest\.json$/i.test(entry.entryName))
    );

    if (manifestEntry) {
      const manifest = JSON.parse(zip.readAsText(manifestEntry));
      name = String(manifest.name || '');
      version = String(manifest.version_number || '');
      author = String(manifest.author || manifest.namespace || '');
    }
  } catch {
    // Fall back to the file name.
  }

  if (!name || !author || !version) {
    const base = path.basename(zipPath, path.extname(zipPath));
    const match = base.match(/^([^-]+)-(.+)-(\d+(?:\.\d+){0,3}(?:[+-].+)?)$/);
    if (match) {
      author = author || match[1];
      name = name || match[2];
      version = version || match[3];
    } else if (!name) {
      name = base;
    }
  }

  return {
    path: zipPath,
    name,
    author,
    version
  };
}

module.exports = {
  exportProfile,
  chooseProfileArchive,
  extractProfileFiles,
  chooseModArchive
};

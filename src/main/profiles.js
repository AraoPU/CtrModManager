'use strict';

const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const { app } = require('electron');
const loaders = require('./loaders');

const GAME_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/i;
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;

function profilesRoot() {
  return path.join(app.getPath('userData'), 'profiles');
}

function assertGame(game) {
  if (typeof game !== 'string' || !GAME_PATTERN.test(game)) {
    throw new Error('游戏标识无效');
  }
  return game;
}

function gameDir(game) {
  return path.join(profilesRoot(), assertGame(game));
}

function sanitizeId(name) {
  let id = name
    .normalize('NFC')
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '')
    .slice(0, 60)
    .trim();

  if (!id || id === '.' || id === '..') id = 'profile';
  if (WINDOWS_RESERVED.test(id)) id = `_${id}`;
  return id;
}

function uniqueId(dir, base) {
  let id = base;
  let index = 2;
  while (fs.existsSync(path.join(dir, id))) {
    id = `${base} ${index}`;
    index += 1;
  }
  return id;
}

function profileFile(game, id) {
  return path.join(gameDir(game), id, 'profile.json');
}

function modsFile(dir) {
  return path.join(dir, 'mods.yml');
}

function validateId(id) {
  if (typeof id !== 'string' || !id || id === '.' || id === '..' || /[\\/]/.test(id)) {
    throw new Error('配置标识无效');
  }
  return id;
}

function versionToString(versionNumber) {
  if (typeof versionNumber === 'string') return versionNumber;
  if (!versionNumber || typeof versionNumber !== 'object') return '';

  return [versionNumber.major, versionNumber.minor, versionNumber.patch]
    .filter((part) => part !== undefined && part !== null)
    .join('.');
}

function readModsYml(dir) {
  const file = modsFile(dir);
  try {
    const raw = yaml.load(fs.readFileSync(file, 'utf8'));
    return Array.isArray(raw) ? raw.filter((entry) => entry && typeof entry === 'object') : [];
  } catch {
    // 解析失败时先备份原文件，避免后续写入把用户数据覆盖成空列表
    backupBrokenModsYml(file);
    return [];
  }
}

function backupBrokenModsYml(file) {
  try {
    if (!fs.existsSync(file)) return;
    if (fs.statSync(file).size === 0) return;
    const backup = `${file}.bak`;
    if (fs.existsSync(backup)) return;
    fs.copyFileSync(file, backup);
  } catch {
    // 备份失败不影响读取
  }
}

async function writeModsYml(dir, entries) {
  await fs.promises.mkdir(dir, { recursive: true });
  const file = modsFile(dir);
  const temp = `${file}.tmp`;
  const data = Array.isArray(entries) ? entries : [];
  // yaml.dump 是 CPU 密集型操作，但写盘必须异步，避免阻塞主进程事件循环。
  const text = yaml.dump(data, { noRefs: true, lineWidth: -1 });
  await fs.promises.writeFile(temp, text, 'utf8');
  await fs.promises.rename(temp, file);
}

function normalizeProfileName(value) {
  return String(value || '')
    .normalize('NFC')
    .trim()
    .toLowerCase();
}

function toUiMod(entry) {
  return {
    key: String(entry.name || ''),
    name: String(entry.displayName || entry.name || ''),
    author: String(entry.authorName || ''),
    version: versionToString(entry.versionNumber),
    enabled: entry.enabled !== false,
    description: String(entry.description || ''),
    websiteUrl: typeof entry.websiteUrl === 'string' ? entry.websiteUrl : '',
    icon: typeof entry.icon === 'string' ? entry.icon : null,
    dependencies: Array.isArray(entry.dependencies) ? entry.dependencies : [],
    installedAtTime: Number(entry.installedAtTime) || 0,
    loaders: Array.isArray(entry.loaders) ? entry.loaders : []
  };
}

function readProfile(game, id) {
  const dir = path.join(gameDir(game), validateId(id));
  let raw = null;

  try {
    raw = JSON.parse(fs.readFileSync(path.join(dir, 'profile.json'), 'utf8'));
  } catch {
    // Profiles created by other Thunderstore managers only need mods.yml.
  }

  if (!raw) {
    if (!fs.existsSync(modsFile(dir))) throw new Error('配置不存在');

    let createdAt = new Date(0).toISOString();
    try {
      createdAt = fs.statSync(dir).birthtime.toISOString();
    } catch {
      // Keep the fallback date.
    }
    raw = {
      schemaVersion: 1,
      id,
      name: id,
      game,
      createdAt,
      updatedAt: createdAt
    };
  }

  const mods = readModsYml(dir).map(toUiMod);
  // 两个加载器同时存在时只有一个能生效，需要让界面提示出来
  const detectedLoaders = loaders.detectProfileLoaders(dir);
  const loader = detectedLoaders[0] || 'bepinex';

  return {
    schemaVersion: raw.schemaVersion || 1,
    id,
    name: raw.name || id,
    game,
    createdAt: raw.createdAt || new Date(0).toISOString(),
    updatedAt: raw.updatedAt || raw.createdAt || new Date(0).toISOString(),
    mods,
    dir,
    loader,
    loaderConflicts: detectedLoaders.filter((id) => id !== loader)
  };
}

function listProfiles(game) {
  const dir = gameDir(game);
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const result = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      result.push(readProfile(game, entry.name));
    } catch {
      // Ignore folders without a readable profile manifest.
    }
  }

  return result.sort((a, b) => {
    const byDate = String(a.createdAt).localeCompare(String(b.createdAt));
    return byDate !== 0 ? byDate : a.name.localeCompare(b.name);
  });
}

async function createProfile(game, name) {
  const displayName = String(name).trim();
  if (!displayName) throw new Error('配置名称不能为空');
  if (displayName.length > 40) throw new Error('配置名称不能超过 40 个字符');

  const targetName = normalizeProfileName(displayName);
  const existing = listProfiles(game);
  if (existing.some((profile) => normalizeProfileName(profile.name) === targetName)) {
    throw new Error('已存在同名配置');
  }

  const dir = gameDir(game);
  // 目录名再查一次：即使某个配置的清单读取失败，也不会再建出同名配置
  const baseId = sanitizeId(displayName);
  let folderNames = [];
  try {
    folderNames = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name.normalize('NFC').toLowerCase());
  } catch {
    // 目录还不存在，说明是第一次创建
  }
  if (folderNames.includes(baseId.normalize('NFC').toLowerCase())) {
    throw new Error('已存在同名配置');
  }

  const id = uniqueId(dir, baseId);
  const now = new Date().toISOString();
  const profile = {
    schemaVersion: 1,
    id,
    name: displayName,
    game,
    createdAt: now,
    updatedAt: now,
    mods: []
  };

  const profileDir = path.join(dir, id);
  await fs.promises.mkdir(profileDir, { recursive: true });
  await fs.promises.writeFile(profileFile(game, id), JSON.stringify(profile, null, 2), 'utf8');
  await writeModsYml(profileDir, []);

  return readProfile(game, id);
}

function getProfileDir(game, id) {
  const root = profilesRoot();
  const dir = path.join(gameDir(game), validateId(id));
  if (!dir.startsWith(root + path.sep)) throw new Error('配置路径无效');
  if (!fs.existsSync(dir)) throw new Error('配置不存在');
  return dir;
}

async function renameProfile(game, id, name) {
  const displayName = String(name || '').trim();
  if (!displayName) throw new Error('配置名称不能为空');
  if (displayName.length > 40) throw new Error('配置名称不能超过 40 个字符');

  const profile = readProfile(game, id);
  const targetName = normalizeProfileName(displayName);
  const duplicate = listProfiles(game).some(
    (item) => item.id !== id && normalizeProfileName(item.name) === targetName
  );
  if (duplicate) throw new Error('已存在同名配置');
  if (normalizeProfileName(profile.name) === targetName && profile.name === displayName) {
    return profile;
  }

  const dir = gameDir(game);
  const baseId = sanitizeId(displayName);
  const nextId = baseId.toLowerCase() === id.toLowerCase() ? id : uniqueId(dir, baseId);

  if (nextId !== id) {
    try {
      fs.renameSync(path.join(dir, id), path.join(dir, nextId));
    } catch (error) {
      throw new Error(`重命名配置目录失败：${error.message}`);
    }
  }

  const data = {
    schemaVersion: profile.schemaVersion || 1,
    id: nextId,
    name: displayName,
    game,
    createdAt: profile.createdAt,
    updatedAt: new Date().toISOString()
  };

  const file = profileFile(game, nextId);
  const temp = `${file}.tmp`;
  await fs.promises.writeFile(temp, JSON.stringify(data, null, 2), 'utf8');
  await fs.promises.rename(temp, file);

  return readProfile(game, nextId);
}

function deleteProfile(game, id) {
  const dir = getProfileDir(game, id);
  fs.rmSync(dir, { recursive: true, force: true });
}

module.exports = {
  listProfiles,
  createProfile,
  renameProfile,
  deleteProfile,
  getProfileDir,
  readModsYml,
  writeModsYml,
  versionToString
};

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { shell } = require('electron');
const profiles = require('./profiles');
const loaders = require('./loaders');

function configRoot(game, profileId) {
  const profileDir = profiles.getProfileDir(game, profileId);
  const loader = loaders.getLoader(loaders.detectProfileLoader(profileDir));
  return path.join(profileDir, loader.installPaths.config);
}

function collectConfigs(dir, base, result) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relative = base ? `${base}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      collectConfigs(fullPath, relative, result);
    } else if (entry.isFile() && /\.cfg$/i.test(entry.name)) {
      try {
        const stat = fs.statSync(fullPath);
        result.push({
          path: relative,
          name: entry.name,
          size: stat.size,
          modifiedAt: stat.mtimeMs
        });
      } catch {
        // Ignore unreadable files.
      }
    }
  }
}

function listConfigs(game, profileId) {
  const root = configRoot(game, profileId);
  const result = [];
  collectConfigs(root, '', result);
  return result.sort((a, b) => a.path.localeCompare(b.path));
}

function resolveConfig(game, profileId, relativePath) {
  const root = path.resolve(configRoot(game, profileId));
  if (typeof relativePath !== 'string' || !relativePath.trim()) {
    throw new Error('配置文件路径无效');
  }
  if (relativePath.includes('\u0000')) {
    throw new Error('配置文件路径无效');
  }

  // 统一成 POSIX 风格并逐段校验，防止 Windows 下 \ 与 / 混用绕过前缀检查
  const normalized = path.posix.normalize(relativePath.replace(/\\/g, '/'));
  const parts = normalized.split('/');
  if (
    normalized.startsWith('/') ||
    /^[a-z]:/i.test(normalized) ||
    parts.some((part) => part === '..')
  ) {
    throw new Error('配置文件路径无效');
  }

  const target = path.resolve(root, ...parts);
  if (!target.startsWith(root + path.sep)) {
    throw new Error('配置文件路径无效');
  }
  if (!/\.cfg$/i.test(target)) {
    throw new Error('只能编辑 .cfg 配置文件');
  }
  if (!fs.existsSync(target)) {
    throw new Error('配置文件不存在');
  }

  return target;
}

function readConfig(game, profileId, relativePath) {
  const target = resolveConfig(game, profileId, relativePath);
  return {
    path: relativePath,
    name: path.basename(target),
    content: fs.readFileSync(target, 'utf8')
  };
}

async function writeConfig(game, profileId, relativePath, content) {
  const target = resolveConfig(game, profileId, relativePath);
  if (typeof content !== 'string') throw new Error('配置内容无效');
  await fs.promises.writeFile(target, content, 'utf8');
  return true;
}

async function openConfig(game, profileId, relativePath) {
  const target = resolveConfig(game, profileId, relativePath);
  const error = await shell.openPath(target);
  if (error) throw new Error(error);
  return true;
}

module.exports = {
  listConfigs,
  readConfig,
  writeConfig,
  openConfig
};

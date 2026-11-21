'use strict';

// 安装路径路由：决定「压缩包内的相对路径 → Profile 内的落点」。
// 每种加载器一个策略；新增加载器（例如 ShimLoader / Rivet）时只需在这里加一项，
// 不必再改动 installer.js 里的解压流程。
//
// paths 直接复用 loaders.js 的 installPaths，避免两处定义漂移。

function withSlash(value) {
  return value ? `${String(value).replace(/\/+$/, '')}/` : '';
}

// BepInEx：插件/补丁器按包名建子目录，config 平铺，其余 BepInEx/ 下路径保持原样
function resolveBepInExTarget(context) {
  const { relative, folderName } = context;
  const pluginPrefix = withSlash(context.paths.plugins);
  const patcherPrefix = withSlash(context.paths.patchers) || pluginPrefix;
  const configPrefix = withSlash(context.paths.config);

  if (/^bepinex\/plugins\//i.test(relative)) {
    return `${pluginPrefix}${folderName}/${relative.slice('bepinex/plugins/'.length)}`;
  }
  if (/^bepinex\/patchers\//i.test(relative)) {
    return `${patcherPrefix}${folderName}/${relative.slice('bepinex/patchers/'.length)}`;
  }
  if (/^bepinex\//i.test(relative)) return relative;
  if (/^plugins\//i.test(relative)) {
    return `${pluginPrefix}${folderName}/${relative.slice('plugins/'.length)}`;
  }
  if (/^patchers\//i.test(relative)) {
    return `${patcherPrefix}${folderName}/${relative.slice('patchers/'.length)}`;
  }
  if (/^config\//i.test(relative)) {
    return `${configPrefix}${relative.slice('config/'.length)}`;
  }
  return `${pluginPrefix}${folderName}/${relative}`;
}

// MelonLoader：0.6 及更早不支持子目录，必须平铺；0.7+ 按包名隔离
function resolveMelonLoaderTarget(context) {
  const { relative, folderName, legacyMelonLayout } = context;
  const pluginPrefix = withSlash(context.paths.plugins);
  const modsPrefix = withSlash(context.paths.mods) || pluginPrefix;
  const userLibsPrefix = 'UserLibs/';

  if (legacyMelonLayout) {
    if (/^userdata\//i.test(relative)) return `UserData/${relative.slice('userdata/'.length)}`;
    if (/^mods\//i.test(relative)) return `${modsPrefix}${relative.slice('mods/'.length)}`;
    if (/^plugins\//i.test(relative)) return `${pluginPrefix}${relative.slice('plugins/'.length)}`;
    if (/^userlibs\//i.test(relative)) return `UserLibs/${relative.slice('userlibs/'.length)}`;
    return `${modsPrefix}${relative}`;
  }

  // 0.7+：与 r2modman 的生态安装规则对齐——plugins 落 Plugins/<包名>/，
  // userlibs 落 UserLibs/<包名>/，mods 落 Mods/<包名>/，UserData 同样按包隔离
  if (/^userdata\//i.test(relative)) {
    return `UserData/${folderName}/${relative.slice('userdata/'.length)}`;
  }
  if (/^userlibs\//i.test(relative)) {
    return `${userLibsPrefix}${folderName}/${relative.slice('userlibs/'.length)}`;
  }
  if (/^plugins\//i.test(relative)) {
    return `${pluginPrefix}${folderName}/${relative.slice('plugins/'.length)}`;
  }
  if (/^mods\//i.test(relative)) {
    return `${modsPrefix}${folderName}/${relative.slice('mods/'.length)}`;
  }
  return `${modsPrefix}${folderName}/${relative}`;
}

const STRATEGIES = {
  bepinex: resolveBepInExTarget,
  melonloader: resolveMelonLoaderTarget
};

const fs = require('node:fs');
const path = require('node:path');
const { app } = require('electron');

// 可选的自定义规则文件：<userData>/install-rules.json
// 结构与 r2modman 的 InstallationRules 对齐（route / trackingMethod / defaultFileExtensions），
// 例如：
// {
//   "games": {
//     "some-community": {
//       "rules": [
//         { "route": "BepInEx/plugins", "trackingMethod": "subdir", "defaultFileExtensions": [".dll"] }
//       ]
//     }
//   }
// }
function gameRulesFile() {
  try {
    return path.join(app.getPath('userData'), 'install-rules.json');
  } catch {
    return null;
  }
}

let cachedStamp = null;
let cachedFile = null;
let cachedGames = null;

function loadGameRules(file) {
  if (!file) return null;

  let stamp = '';
  try {
    const stat = fs.statSync(file);
    stamp = `${stat.size}:${stat.mtimeMs}`;
  } catch {
    return null;
  }

  if (cachedGames && cachedFile === file && cachedStamp === stamp) return cachedGames;

  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    const games = parsed && typeof parsed.games === 'object' && parsed.games ? parsed.games : null;
    cachedStamp = stamp;
    cachedFile = file;
    cachedGames = games;
    return games;
  } catch {
    return null;
  }
}

// subdir：<route>/<包名>/<原路径>；flatten / state：<route>/<原路径>
function matchCustomRule(rules, relative, folderName) {
  const extension = path.posix.extname(relative).toLowerCase();

  for (const rule of Array.isArray(rules) ? rules : []) {
    if (!rule || typeof rule.route !== 'string' || !rule.route.trim()) continue;

    const extensions = Array.isArray(rule.defaultFileExtensions)
      ? rule.defaultFileExtensions.map((item) => String(item).toLowerCase())
      : [];
    if (extensions.length > 0 && !extensions.includes(extension)) continue;

    const route = rule.route.replace(/^\/+|\/+$/g, '');
    if (!route) continue;
    const trackingMethod = String(rule.trackingMethod || 'subdir').toLowerCase();

    if (trackingMethod === 'flatten' || trackingMethod === 'state' || trackingMethod === 'none') {
      return `${route}/${relative}`;
    }
    return `${route}/${folderName}/${relative}`;
  }

  return null;
}

function resolveTarget(context) {
  const game = context && context.game;
  if (game) {
    const games = loadGameRules(gameRulesFile());
    const custom = games && games[game];
    if (custom && Array.isArray(custom.rules)) {
      const routed = matchCustomRule(custom.rules, context.relative, context.folderName);
      if (routed) return routed;
    }
  }

  const strategy = STRATEGIES[context.loaderId] || STRATEGIES.bepinex;
  return strategy(context);
}

module.exports = {
  resolveTarget,
  resolveBepInExTarget,
  resolveMelonLoaderTarget,
  matchCustomRule,
  STRATEGIES
};

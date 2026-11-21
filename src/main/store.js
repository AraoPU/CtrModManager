'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { app } = require('electron');

const SETTINGS_FILE = 'settings.json';
const GAMES_CACHE_FILE = 'games-cache.json';
const SEEN_GAMES_FILE = 'seen-games.json';
// 新游戏徽章保留 3 天，和 r2modman 的 EcosystemGameStatus 一致
const NEW_GAME_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

const DEFAULT_SETTINGS = {
  favorites: [],
  defaultGame: null,
  activeProfiles: {},
  gamePaths: {},
  steamAppIds: {},
  launchArgs: {},
  modLaunchArgs: {},
  ignoredUpdates: {},
  launchMode: 'steam',
  steamPath: '',
  customLaunchPath: '',
  customLaunchArgs: '',
  gameView: 'icon',
  theme: 'system',
  showDownloadDialog: true,
  collapsedSections: []
};

function userDataPath(name) {
  return path.join(app.getPath('userData'), name);
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempPath, filePath);
}

// 让路径按磁盘上的真实大小写显示（Windows 本身不区分大小写），盘符统一大写
function normalizePathCasing(value) {
  const text = String(value || '').trim();
  if (!text) return '';

  let result = text;
  try {
    const absolute = path.resolve(text);
    const root = path.parse(absolute).root;
    let current = root;
    const segments = absolute.slice(root.length).split(path.sep).filter(Boolean);

    for (const segment of segments) {
      const entries = fs.readdirSync(current);
      const match = entries.find((name) => name.toLowerCase() === segment.toLowerCase());
      current = path.join(current, match || segment);
    }
    result = current;
  } catch {
    // 路径不存在或无法读取时保留原样
  }

  return result.replace(/^([a-z]):/, (_, letter) => `${letter.toUpperCase()}:`);
}

function normalizeSettings(raw) {
  const settings = {
    ...DEFAULT_SETTINGS,
    favorites: [],
    activeProfiles: {},
    gamePaths: {},
    steamAppIds: {},
    launchArgs: {},
    modLaunchArgs: {},
    ignoredUpdates: {},
    collapsedSections: []
  };

  if (raw && typeof raw === 'object') {
    if (Array.isArray(raw.favorites)) {
      settings.favorites = [...new Set(raw.favorites.filter((item) => typeof item === 'string'))];
    }
    if (typeof raw.defaultGame === 'string' && raw.defaultGame) {
      settings.defaultGame = raw.defaultGame;
    }
    if (raw.activeProfiles && typeof raw.activeProfiles === 'object' && !Array.isArray(raw.activeProfiles)) {
      for (const [game, profile] of Object.entries(raw.activeProfiles)) {
        if (typeof profile === 'string' && profile) settings.activeProfiles[game] = profile;
      }
    }
    if (raw.gamePaths && typeof raw.gamePaths === 'object' && !Array.isArray(raw.gamePaths)) {
      for (const [game, exePath] of Object.entries(raw.gamePaths)) {
        // 读取时不再逐段扫盘归一化大小写（readSettings 调用频繁，
        // 游戏多时是一笔可观的主进程同步 IO）；写入路径时已经归一化过
        if (typeof exePath === 'string' && exePath) {
          settings.gamePaths[game] = exePath;
        }
      }
    }
    if (raw.steamAppIds && typeof raw.steamAppIds === 'object' && !Array.isArray(raw.steamAppIds)) {
      for (const [game, appId] of Object.entries(raw.steamAppIds)) {
        if (typeof appId === 'string' && appId) settings.steamAppIds[game] = appId;
      }
    }
    if (raw.launchArgs && typeof raw.launchArgs === 'object' && !Array.isArray(raw.launchArgs)) {
      for (const [game, args] of Object.entries(raw.launchArgs)) {
        if (typeof args === 'string' && args.trim()) settings.launchArgs[game] = args;
      }
    }
    if (
      raw.modLaunchArgs &&
      typeof raw.modLaunchArgs === 'object' &&
      !Array.isArray(raw.modLaunchArgs)
    ) {
      for (const [game, args] of Object.entries(raw.modLaunchArgs)) {
        if (typeof args === 'string' && args.trim()) settings.modLaunchArgs[game] = args;
      }
    }
    if (
      raw.ignoredUpdates &&
      typeof raw.ignoredUpdates === 'object' &&
      !Array.isArray(raw.ignoredUpdates)
    ) {
      for (const [key, value] of Object.entries(raw.ignoredUpdates)) {
        if (!Array.isArray(value)) continue;
        const list = [...new Set(value.filter((item) => typeof item === 'string' && item))];
        if (list.length > 0) settings.ignoredUpdates[key] = list;
      }
    }
    if (raw.launchMode === 'steam' || raw.launchMode === 'direct' || raw.launchMode === 'custom') {
      settings.launchMode = raw.launchMode;
    }
    if (typeof raw.steamPath === 'string') settings.steamPath = raw.steamPath;
    if (typeof raw.customLaunchPath === 'string') {
      settings.customLaunchPath = raw.customLaunchPath;
    }
    if (typeof raw.customLaunchArgs === 'string') settings.customLaunchArgs = raw.customLaunchArgs;
    if (raw.gameView === 'cover' || raw.gameView === 'icon') settings.gameView = raw.gameView;
    if (raw.theme === 'light' || raw.theme === 'dark' || raw.theme === 'system') {
      settings.theme = raw.theme;
    }
    if (typeof raw.showDownloadDialog === 'boolean') {
      settings.showDownloadDialog = raw.showDownloadDialog;
    }
    if (Array.isArray(raw.collapsedSections)) {
      settings.collapsedSections = [
        ...new Set(raw.collapsedSections.filter((item) => typeof item === 'string' && item))
      ];
    }
  }

  return settings;
}

function readSettings() {
  return normalizeSettings(readJson(userDataPath(SETTINGS_FILE), null));
}

function updateSettings(patch) {
  const current = readSettings();
  const next = {
    favorites: current.favorites,
    defaultGame: current.defaultGame,
    activeProfiles: { ...current.activeProfiles },
    gamePaths: { ...current.gamePaths },
    steamAppIds: { ...current.steamAppIds },
    launchArgs: { ...current.launchArgs },
    modLaunchArgs: { ...current.modLaunchArgs },
    ignoredUpdates: Object.fromEntries(
      Object.entries(current.ignoredUpdates || {}).map(([key, value]) => [key, [...value]])
    ),
    launchMode: current.launchMode,
    steamPath: current.steamPath,
    customLaunchPath: current.customLaunchPath,
    customLaunchArgs: current.customLaunchArgs,
    gameView: current.gameView,
    theme: current.theme,
    showDownloadDialog: current.showDownloadDialog !== false,
    collapsedSections: [...(current.collapsedSections || [])]
  };

  if (Array.isArray(patch.favorites)) {
    next.favorites = [...new Set(patch.favorites.filter((item) => typeof item === 'string' && item))];
  }

  if (patch.defaultGame === null) {
    next.defaultGame = null;
  } else if (typeof patch.defaultGame === 'string' && patch.defaultGame) {
    next.defaultGame = patch.defaultGame;
  }

  if (patch.activeProfiles && typeof patch.activeProfiles === 'object' && !Array.isArray(patch.activeProfiles)) {
    for (const [game, profile] of Object.entries(patch.activeProfiles)) {
      if (profile === null) {
        delete next.activeProfiles[game];
      } else if (typeof profile === 'string' && profile) {
        next.activeProfiles[game] = profile;
      }
    }
  }

  if (patch.gamePaths && typeof patch.gamePaths === 'object' && !Array.isArray(patch.gamePaths)) {
    for (const [game, exePath] of Object.entries(patch.gamePaths)) {
      if (exePath === null) {
        delete next.gamePaths[game];
      } else if (typeof exePath === 'string' && exePath) {
        next.gamePaths[game] = normalizePathCasing(exePath);
      }
    }
  }

  if (patch.steamAppIds && typeof patch.steamAppIds === 'object' && !Array.isArray(patch.steamAppIds)) {
    for (const [game, appId] of Object.entries(patch.steamAppIds)) {
      if (appId === null) {
        delete next.steamAppIds[game];
      } else if (typeof appId === 'string' && appId) {
        next.steamAppIds[game] = appId;
      }
    }
  }

  if (patch.launchArgs && typeof patch.launchArgs === 'object' && !Array.isArray(patch.launchArgs)) {
    for (const [game, args] of Object.entries(patch.launchArgs)) {
      if (args === null || args === '') {
        delete next.launchArgs[game];
      } else if (typeof args === 'string') {
        next.launchArgs[game] = args;
      }
    }
  }

  if (
    patch.modLaunchArgs &&
    typeof patch.modLaunchArgs === 'object' &&
    !Array.isArray(patch.modLaunchArgs)
  ) {
    for (const [game, args] of Object.entries(patch.modLaunchArgs)) {
      if (args === null || args === '') {
        delete next.modLaunchArgs[game];
      } else if (typeof args === 'string') {
        next.modLaunchArgs[game] = args;
      }
    }
  }

  if (
    patch.ignoredUpdates &&
    typeof patch.ignoredUpdates === 'object' &&
    !Array.isArray(patch.ignoredUpdates)
  ) {
    for (const [key, value] of Object.entries(patch.ignoredUpdates)) {
      if (value === null) {
        delete next.ignoredUpdates[key];
        continue;
      }
      if (!Array.isArray(value)) continue;
      const list = [...new Set(value.filter((item) => typeof item === 'string' && item))];
      if (list.length > 0) next.ignoredUpdates[key] = list;
      else delete next.ignoredUpdates[key];
    }
  }

  if (patch.launchMode === 'steam' || patch.launchMode === 'direct' || patch.launchMode === 'custom') {
    next.launchMode = patch.launchMode;
  }
  if (typeof patch.steamPath === 'string') next.steamPath = normalizePathCasing(patch.steamPath);
  if (typeof patch.customLaunchPath === 'string') {
    next.customLaunchPath = normalizePathCasing(patch.customLaunchPath);
  }
  if (typeof patch.customLaunchArgs === 'string') next.customLaunchArgs = patch.customLaunchArgs;
  if (patch.gameView === 'cover' || patch.gameView === 'icon') next.gameView = patch.gameView;
  if (patch.theme === 'light' || patch.theme === 'dark' || patch.theme === 'system') {
    next.theme = patch.theme;
  }
  if (typeof patch.showDownloadDialog === 'boolean') {
    next.showDownloadDialog = patch.showDownloadDialog;
  }

  if (Array.isArray(patch.collapsedSections)) {
    next.collapsedSections = [
      ...new Set(patch.collapsedSections.filter((item) => typeof item === 'string' && item))
    ];
  }

  writeJson(userDataPath(SETTINGS_FILE), next);
  return next;
}

function readGamesCache() {
  const cache = readJson(userDataPath(GAMES_CACHE_FILE), null);
  if (!cache || !Array.isArray(cache.games) || cache.games.length === 0) return null;
  // 旧缓存没有 recentSlugs：按接口顺序补一份
  if (!Array.isArray(cache.recentSlugs)) {
    cache.recentSlugs = cache.games
      .slice(0, 12)
      .map((game) => game && game.identifier)
      .filter(Boolean);
  }
  return cache;
}

function writeGamesCache(games) {
  // Thunderstore 社区接口按收录时间倒序返回，前几个就是最新上架的游戏
  const recentSlugs = (Array.isArray(games) ? games : [])
    .slice(0, 12)
    .map((game) => game && game.identifier)
    .filter(Boolean);
  const cache = { games, fetchedAt: Date.now(), recentSlugs };
  writeJson(userDataPath(GAMES_CACHE_FILE), cache);
  return cache;
}

function readSeenGames() {
  const data = readJson(userDataPath(SEEN_GAMES_FILE), null);
  if (!data || typeof data.seen !== 'object' || !data.seen) return null;
  return data.seen;
}

function writeSeenGames(seen) {
  writeJson(userDataPath(SEEN_GAMES_FILE), { seen, updatedAt: Date.now() });
}

function newGamesFrom(seen, slugs, now) {
  return slugs.filter((slug) => {
    const firstSeen = Number(seen[slug]);
    // 0 表示「基线里的老游戏」，永远不算新
    return Number.isFinite(firstSeen) && firstSeen > 0 && now - firstSeen < NEW_GAME_WINDOW_MS;
  });
}

// 用已有缓存做基线：第一次启用这个功能时，不把整页游戏都标成新
function seedSeenGames(slugs) {
  if (readSeenGames()) return;
  const seen = {};
  for (const slug of slugs || []) seen[String(slug)] = 0;
  writeSeenGames(seen);
}

// 刷新列表时登记：没见过的游戏记为「现在」；首次运行则全部按基线处理
function registerGames(slugs) {
  const unique = [...new Set((slugs || []).map(String).filter(Boolean))];
  let seen = readSeenGames();

  if (!seen) {
    seen = {};
    for (const slug of unique) seen[slug] = 0;
    writeSeenGames(seen);
    return [];
  }

  const now = Date.now();
  let changed = false;
  for (const slug of unique) {
    if (seen[slug] === undefined) {
      seen[slug] = now;
      changed = true;
    }
  }
  if (changed) writeSeenGames(seen);
  return newGamesFrom(seen, unique, now);
}

function getNewGames(slugs) {
  const seen = readSeenGames();
  if (!seen) return [];
  return newGamesFrom(seen, (slugs || []).map(String), Date.now());
}

module.exports = {
  readSettings,
  updateSettings,
  readGamesCache,
  writeGamesCache,
  seedSeenGames,
  registerGames,
  getNewGames
};

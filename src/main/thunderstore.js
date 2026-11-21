'use strict';

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { promisify } = require('node:util');
const { app } = require('electron');

const gunzipAsync = promisify(zlib.gunzip);

const COMMUNITY_ENDPOINT = 'https://thunderstore.io/api/experimental/community/';
const BASE_URL = 'https://thunderstore.io';
const MAX_PAGES = 20;
const FRESH_MS = 5 * 60 * 1000;
const PACKAGES_CACHE_VERSION = 5;
const GAME_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/i;

const packagesMemoryCache = new Map();
const packagesInflight = new Map();

async function requestJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'CtrModManager/0.1'
    },
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) {
    throw new Error(`Thunderstore 返回状态 ${response.status}`);
  }

  return response.json();
}

async function fetchCommunities() {
  let url = `${COMMUNITY_ENDPOINT}?page=1`;
  const games = new Map();

  for (let page = 0; page < MAX_PAGES && url; page += 1) {
    const data = await requestJson(url);
    const results = Array.isArray(data && data.results) ? data.results : [];

    for (const community of results) {
      if (!community || typeof community.identifier !== 'string') continue;
      const identifier = community.identifier;
      if (games.has(identifier)) continue;
      games.set(identifier, {
        identifier,
        name: String(community.name || identifier),
        wikiUrl: community.wiki_url || null,
        discordUrl: community.discord_url || null
      });
    }

    url = data && data.pagination ? data.pagination.next_link : null;
    if (results.length === 0) break;
  }

  if (games.size === 0) {
    throw new Error('Thunderstore 未返回游戏列表');
  }

  return [...games.values()];
}

async function fetchGzipJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'CtrModManager/0.1'
    },
    signal: AbortSignal.timeout(60000)
  });

  if (!response.ok) {
    throw new Error(`Thunderstore 返回状态 ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const raw =
    buffer.length > 2 && buffer[0] === 0x1f && buffer[1] === 0x8b
      ? await gunzipAsync(buffer) // 异步解压，避免阻塞主进程事件循环
      : buffer;

  return JSON.parse(raw.toString('utf8'));
}

// 与 r2modman 的 modExclusions.md 保持同步（一行一个 full_name）。
// 这些是 Mod 管理器本体、开发工具等「不能当作游戏 Mod 安装」的包，
// r2modman 在拉取包列表时按 full_name 精确过滤它们。
// Thunderstore 的 Tools / Libraries 分类里其实包含大量真实 Mod（如 LethalSponge），不能整类过滤。
const EXCLUDED_FULL_NAMES = new Set(
  [
    'ebkr-r2modman',
    'ebkr-r2modman_dsp',
    'ebkr-BT2TS',
    'Harb-AttributeFinder',
    'ethanbrews-RiskOfRainModManager',
    'scottbot95-RoR2ModManager',
    'HoodedDeath-RiskOfDeathModManager',
    'Elaviers-GCManager',
    'MythicManiac-MythicModManager',
    'Higgs1-Lighthouse',
    'ethanbrews-Forecast_Mod_Manager',
    '3c079bcb4f34402f-BepInExPack',
    'Dasvcx-Enforcer',
    'SgtPopNFresh-BepInExPack',
    'TheLamiaLover-MobileTurretFungus',
    'Squidy-RogueWisp',
    'TheLamiaLover-ItemStatsMod',
    'Foldex-r2mod_cli',
    'gnonme-CustomItemsSDK',
    'gnonme-ModThatIsNotMod_Unity_Tools',
    'L4rs-QuickFSR',
    'MPModTeam-Boneworks_MP',
    'MADH95Mods-JSONRenameUtility',
    'GamefaceGamers-Mod_Sync',
    'codengine-SOTFEdit',
    'DevLeon-SonsOfTheForestMap',
    'Kesomannen-GaleModManager',
    'Pyoid-Hook_Line_and_Sinker',
    'GardenGals-Hatchery'
  ].map((name) => name.toLowerCase())
);

// API 有时返回空的 full_name（例如 GaleModManager），必须用 owner-name 兜底拼接后再匹配
function packageFullName(pkg) {
  const owner = String(pkg.owner || '').trim();
  const name = String(pkg.name || '').trim();
  const raw = String(pkg.full_name || pkg.fullName || '')
    .trim()
    .toLowerCase();
  if (raw) return raw;
  return owner && name ? `${owner}-${name}`.toLowerCase() : '';
}

function isExcludedPackage(pkg) {
  const fullName = packageFullName(pkg);
  if (fullName && EXCLUDED_FULL_NAMES.has(fullName)) return true;

  const name = String(pkg.name || '')
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
  return name === 'r2modman' || name === 'thunderstoremodmanager' || name === 'galemodmanager';
}

// 版本列表只缓存 UI 实际用到的字段：
// 完整缓存 dependencies 会让 Lethal Company 这类社区膨胀到 300MB+，
// 而下载地址可以在安装时用 owner/name/version 直接拼出来。
function normalizeVersion(version) {
  return {
    versionNumber: String(version.version_number || ''),
    downloads: Number(version.downloads) || 0,
    dateCreated: version.date_created || null
  };
}

function buildVersionList(versions) {
  return (Array.isArray(versions) ? versions : [])
    .filter((version) => version && version.is_active !== false)
    .map(normalizeVersion)
    .sort((a, b) => String(b.dateCreated || '').localeCompare(String(a.dateCreated || '')));
}

function buildVersionUrl(owner, name, versionNumber) {
  return `https://thunderstore.io/package/download/${encodeURIComponent(owner)}/${encodeURIComponent(
    name
  )}/${encodeURIComponent(versionNumber)}/`;
}

// 缓存里只存轻量字段，返回给调用方时再补上安装需要的 fullName / downloadUrl
function enrichVersionList(pkg, versions) {
  const baseFullName = String(pkg.fullName || `${pkg.owner || ''}-${pkg.name || ''}`);
  return versions.map((version) => ({
    ...version,
    fullName: `${baseFullName}-${version.versionNumber}`,
    downloadUrl: buildVersionUrl(pkg.owner || '', pkg.name || '', version.versionNumber)
  }));
}

// 图标只接受 Thunderstore 自己的 CDN：渲染层的 CSP 也只放行了这些域名，
// 提前过滤可以省掉一次必然失败的图片请求（少数包把 icon 指向其它站点）
function safeIconUrl(value) {
  if (typeof value !== 'string' || !value.startsWith('https://')) return null;
  try {
    const host = new URL(value).hostname.toLowerCase();
    if (host === 'thunderstore.io' || host.endsWith('.thunderstore.io')) return value;
  } catch {
    // 非法 URL 直接丢弃
  }
  return null;
}

function normalizePackage(pkg) {
  if (!pkg || !Array.isArray(pkg.versions) || pkg.versions.length === 0) return null;
  if (isExcludedPackage(pkg)) return null;
  const categories = Array.isArray(pkg.categories) ? pkg.categories : [];

  const latest = pkg.versions.find((version) => version.is_active) || pkg.versions[0];
  let downloads = 0;
  for (const version of pkg.versions) {
    downloads += Number(version.downloads) || 0;
  }

  // 列表接口本身就带完整版本信息，直接全部缓存，用户点开时零网络请求
  const versions = buildVersionList(pkg.versions);
  if (versions.length === 0) return null;

  const owner = String(pkg.owner || '');
  const name = String(pkg.name || '');

  return {
    uuid: String(pkg.uuid4 || ''),
    name,
    fullName: String(pkg.full_name || (owner && name ? `${owner}-${name}` : '')),
    owner,
    description: String(latest.description || ''),
    icon: safeIconUrl(latest.icon),
    version: String(latest.version_number || ''),
    downloads,
    updated: pkg.date_updated || latest.date_created || null,
    deprecated: Boolean(pkg.is_deprecated),
    pinned: Boolean(pkg.is_pinned),
    categories,
    versions
  };
}

// 版本列表只留在主进程缓存里，发给渲染层的包列表去掉 versions，避免几十 MB 的 IPC 传输
function toUiPackage(pkg) {
  const { versions, ...ui } = pkg;
  return ui;
}

function toUiPayload(payload) {
  return {
    ...payload,
    packages: Array.isArray(payload.packages) ? payload.packages.map(toUiPackage) : []
  };
}

function comparePackages(a, b) {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  if (a.deprecated !== b.deprecated) return a.deprecated ? 1 : -1;
  if (a.downloads !== b.downloads) return b.downloads - a.downloads;
  return a.fullName.localeCompare(b.fullName);
}

function cacheFile(community) {
  return path.join(app.getPath('userData'), 'mods-cache', `${community}.json`);
}

async function readDiskCache(community) {
  try {
    const data = JSON.parse(await fs.promises.readFile(cacheFile(community), 'utf8'));
    if (
      data.version === PACKAGES_CACHE_VERSION &&
      Array.isArray(data.packages) &&
      typeof data.fetchedAt === 'number'
    ) {
      // 缓存可能在排除规则更新前写入（例如 GaleModManager），读取时再过滤一遍，
      // 让这类包不必等下次网络刷新才从列表里消失
      data.packages = data.packages.filter((pkg) => !isExcludedPackage(pkg));
      return data;
    }
  } catch {
    // No usable cache.
  }
  return null;
}

async function writeDiskCache(community, payload) {
  try {
    const file = cacheFile(community);
    await fs.promises.mkdir(path.dirname(file), { recursive: true });
    const temp = `${file}.tmp`;
    await fs.promises.writeFile(temp, JSON.stringify(payload), 'utf8');
    await fs.promises.rename(temp, file);
  } catch {
    // Cache is best effort only.
  }
}

async function getCachedCommunityPackages(community) {
  const cachedMemory = packagesMemoryCache.get(community);
  if (cachedMemory && cachedMemory.version === PACKAGES_CACHE_VERSION) {
    return cachedMemory;
  }

  const cachedDisk = await readDiskCache(community);
  if (cachedDisk) {
    packagesMemoryCache.set(community, cachedDisk);
    return cachedDisk;
  }

  return null;
}

async function listCommunityPackages(game) {
  if (typeof game !== 'string' || !GAME_PATTERN.test(game)) {
    throw new Error('游戏标识无效');
  }

  const cached = await getCachedCommunityPackages(game);
  if (cached) {
    return {
      ...toUiPayload(cached),
      cached: true,
      stale: Date.now() - cached.fetchedAt > FRESH_MS
    };
  }

  return refreshCommunityPackages(game, true);
}

async function refreshCommunityPackages(game, force) {
  if (typeof game !== 'string' || !GAME_PATTERN.test(game)) {
    throw new Error('游戏标识无效');
  }

  const community = game;

  if (!force) {
    const cached = await getCachedCommunityPackages(community);
    if (cached && Date.now() - cached.fetchedAt < FRESH_MS) {
      return { ...toUiPayload(cached), cached: true, stale: false };
    }
  }

  if (packagesInflight.has(community)) {
    const data = await packagesInflight.get(community);
    return { ...toUiPayload(data), cached: false, stale: false };
  }

  const request = (async () => {
    const index = await fetchGzipJson(
      `${BASE_URL}/c/${encodeURIComponent(community)}/api/v1/package-listing-index/`
    );

    if (!Array.isArray(index) || index.length === 0) {
      throw new Error('Thunderstore 未返回 Mod 列表');
    }

    const shards = await Promise.all(index.map((url) => fetchGzipJson(url)));
    const packages = [];

    for (const shard of shards) {
      if (!Array.isArray(shard)) continue;
      for (const pkg of shard) {
        const normalized = normalizePackage(pkg);
        if (normalized) packages.push(normalized);
      }
    }

    if (packages.length === 0) {
      throw new Error('Thunderstore 未返回 Mod 列表');
    }

    packages.sort(comparePackages);
    const payload = {
      version: PACKAGES_CACHE_VERSION,
      packages,
      fetchedAt: Date.now()
    };
    packagesMemoryCache.set(community, payload);
    await writeDiskCache(community, payload);

    return { ...payload, cached: false, stale: false };
  })();

  packagesInflight.set(community, request);

  try {
    return toUiPayload(await request);
  } finally {
    packagesInflight.delete(community);
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VERSIONS_TTL = 10 * 60 * 1000;
const VERSIONS_CACHE_LIMIT = 200;
const versionsCache = new Map();

function rememberVersions(key, entry) {
  // 列表缓存已经覆盖绝大多数请求，这里只兜底网络查询结果。
  // 仍然加 FIFO 上限，避免长时间浏览后 Map 无限增长
  if (versionsCache.size >= VERSIONS_CACHE_LIMIT) {
    const oldest = versionsCache.keys().next().value;
    if (oldest !== undefined) versionsCache.delete(oldest);
  }
  versionsCache.set(key, entry);
}

async function fetchPackageVersions(community, uuid) {
  if (typeof community !== 'string' || !GAME_PATTERN.test(community)) {
    throw new Error('游戏标识无效');
  }
  if (typeof uuid !== 'string' || !UUID_PATTERN.test(uuid)) {
    throw new Error('Mod 标识无效');
  }

  // 列表缓存里已经带轻量版本列表，命中就直接返回，不发网络请求
  const listing = await getCachedCommunityPackages(community);
  if (listing && Array.isArray(listing.packages)) {
    const pkg = listing.packages.find((item) => item.uuid === uuid);
    if (pkg && Array.isArray(pkg.versions) && pkg.versions.length > 0) {
      return {
        uuid,
        namespace: String(pkg.owner || ''),
        name: String(pkg.name || ''),
        fullName: String(pkg.fullName || ''),
        owner: String(pkg.owner || ''),
        versions: enrichVersionList(pkg, pkg.versions)
      };
    }
  }

  const cacheKey = `${community}:${uuid}`;
  const cached = versionsCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < VERSIONS_TTL) {
    return cached.data;
  }

  const url = `${BASE_URL}/c/${encodeURIComponent(community)}/api/v1/package/${uuid}/`;
  let response = null;
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'CtrModManager/0.1'
        },
        signal: AbortSignal.timeout(45000)
      });

      // 只有网络错误、超时和 5xx/429 才值得重试
      if (response.ok || (response.status < 500 && response.status !== 429)) break;
    } catch (error) {
      lastError = error;
      response = null;
      if (attempt === 3) throw error;
    }

    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
    }
  }

  if (!response) throw lastError || new Error('Thunderstore 请求失败');
  if (!response.ok) {
    throw new Error(`Thunderstore 返回状态 ${response.status}`);
  }

  const pkg = await response.json();
  const versions = enrichVersionList(
    { fullName: pkg.full_name, owner: pkg.owner, name: pkg.name },
    buildVersionList(pkg.versions)
  );

  if (versions.length === 0) {
    throw new Error('该 Mod 没有可用版本');
  }

  const data = {
    uuid,
    namespace: String(pkg.namespace || ''),
    name: String(pkg.name || ''),
    fullName: String(pkg.full_name || ''),
    owner: String(pkg.owner || ''),
    versions
  };

  rememberVersions(cacheKey, { data, fetchedAt: Date.now() });
  return data;
}

// 安装依赖时用：按包名（Author-ModName）在社区清单里查最新版本。
// 只读缓存，避免安装途中触发几十 MB 的列表下载；没有缓存时返回 null，调用方退回声明版本。
async function resolveLatestPackage(community, packageName) {
  if (typeof community !== 'string' || !GAME_PATTERN.test(community)) return null;

  const target = String(packageName || '')
    .trim()
    .toLowerCase();
  if (!target) return null;

  const listing = await getCachedCommunityPackages(community);
  const packages = listing && Array.isArray(listing.packages) ? listing.packages : null;
  if (!packages) return null;

  const pkg = packages.find((item) => String(item.fullName || '').toLowerCase() === target);
  if (!pkg || !pkg.uuid) return null;

  const meta = await fetchPackageVersions(community, pkg.uuid);
  const latest = Array.isArray(meta.versions) ? meta.versions[0] : null;
  if (!latest || !latest.versionNumber) return null;

  return {
    uuid: pkg.uuid,
    namespace: meta.namespace || pkg.owner || '',
    name: meta.name || pkg.name || '',
    version: String(latest.versionNumber),
    fullName: latest.fullName,
    downloadUrl: latest.downloadUrl,
    packageName: String(pkg.fullName || meta.fullName || '')
  };
}

module.exports = {
  fetchCommunities,
  listCommunityPackages,
  refreshCommunityPackages,
  fetchPackageVersions,
  resolveLatestPackage
};

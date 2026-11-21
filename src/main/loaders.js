'use strict';

const fs = require('node:fs');
const path = require('node:path');

// BepInEx 以 Mod 方式启动时默认附加的 Doorstop 参数，{preloader} 会在启动时替换
const DEFAULT_BEPINEX_LAUNCH_ARGS =
  '--doorstop-enabled true --doorstop-target-assembly {preloader} --doorstop-enable true --doorstop-target {preloader}';

/**
 * 每种 Loader 的完整定义：
 * - installPaths：安装文件相对 Profile 根目录的目标路径
 * - proxyDlls：启动时需要复制到游戏目录的注入 DLL
 * - defaultLaunchArgs：用户没有自定义时的启动参数模板
 * - isLoaderPackage：判断一个压缩包是不是该 Loader 本体
 * - detectInProfile：判断 Profile 目录里是否装了该 Loader
 */
const LOADER_DEFINITIONS = {
  bepinex: {
    id: 'bepinex',
    displayName: 'BepInEx',
    installPaths: {
      plugins: 'BepInEx/plugins',
      patchers: 'BepInEx/patchers',
      config: 'BepInEx/config',
      core: 'BepInEx/core'
    },
    proxyDlls: ['winhttp.dll'],
    usesDoorstop: true,
    defaultLaunchArgs: DEFAULT_BEPINEX_LAUNCH_ARGS,
    preloaderCandidates: [
      'BepInEx.Preloader.dll',
      'BepInEx.Unity.Mono.Preloader.dll',
      'BepInEx.Unity.IL2CPP.dll'
    ],
    isLoaderPackage: (entryNames) =>
      entryNames.some(
        (name) =>
          /^bepinex\/core\//i.test(name) ||
          /^(winhttp\.dll|doorstop_config\.ini)$/i.test(name)
      ),
    detectInProfile: (profileDir) =>
      fs.existsSync(path.join(profileDir, 'BepInEx', 'core')) ||
      fs.existsSync(path.join(profileDir, 'winhttp.dll'))
  },

  melonloader: {
    id: 'melonloader',
    displayName: 'MelonLoader',
    installPaths: {
      mods: 'Mods',
      plugins: 'Plugins',
      config: 'UserData',
      core: 'MelonLoader'
    },
    proxyDlls: ['version.dll', 'dobby.dll', 'Doorstop.dll'],
    usesDoorstop: false,
    defaultLaunchArgs: '',
    preloaderCandidates: [],
    isLoaderPackage: (entryNames) =>
      entryNames.some(
        (name) => /^melonloader\//i.test(name) || /^(version\.dll|dobby\.dll)$/i.test(name)
      ),
    detectInProfile: (profileDir) =>
      fs.existsSync(path.join(profileDir, 'MelonLoader')) ||
      fs.existsSync(path.join(profileDir, 'version.dll'))
  }
};

// 检测优先级：先 MelonLoader（version.dll 很常见，避免被 BepInEx 的默认值吞掉）
const DETECT_PRIORITY = ['melonloader', 'bepinex'];

function getLoader(id) {
  return LOADER_DEFINITIONS[id] || LOADER_DEFINITIONS.bepinex;
}

// 检测 Profile 里存在的所有 Loader，用于提示「两个加载器同时存在」这类冲突
function detectProfileLoaders(profileDir) {
  return DETECT_PRIORITY.filter((id) => LOADER_DEFINITIONS[id].detectInProfile(profileDir));
}

// 检测 Profile 当前使用的 Loader，默认 BepInEx
function detectProfileLoader(profileDir) {
  return detectProfileLoaders(profileDir)[0] || 'bepinex';
}

// 安装时优先按压缩包本身判断（例如往空配置里装 MelonLoader 本体），
// 不是 Loader 本体则沿用 Profile 当前使用的 Loader。
function detectPackageLoader(entryNames, fallbackId) {
  for (const id of DETECT_PRIORITY) {
    if (LOADER_DEFINITIONS[id].isLoaderPackage(entryNames)) return id;
  }
  return fallbackId || 'bepinex';
}

module.exports = {
  DEFAULT_BEPINEX_LAUNCH_ARGS,
  LOADER_DEFINITIONS,
  getLoader,
  detectProfileLoader,
  detectProfileLoaders,
  detectPackageLoader
};

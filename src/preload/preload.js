'use strict';

const { contextBridge, ipcRenderer } = require('electron');

function subscribe(channel, callback) {
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

contextBridge.exposeInMainWorld('ctr', {
  games: {
    cache: () => ipcRenderer.invoke('games:cache'),
    refresh: () => ipcRenderer.invoke('games:refresh')
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (patch) => ipcRenderer.invoke('settings:update', patch),
    detectSteamPath: () => ipcRenderer.invoke('settings:detect-steam-path'),
    chooseSteamPath: () => ipcRenderer.invoke('settings:choose-steam-path'),
    chooseLaunchProgram: () => ipcRenderer.invoke('settings:choose-launch-program')
  },
  mods: {
    list: (game) => ipcRenderer.invoke('mods:list', game),
    refresh: (game) => ipcRenderer.invoke('mods:refresh', game),
    prefetch: (game) => ipcRenderer.invoke('mods:prefetch', game),
    versions: (game, uuid) => ipcRenderer.invoke('mods:versions', game, uuid)
  },
  downloads: {
    list: () => ipcRenderer.invoke('downloads:list'),
    start: (request) => ipcRenderer.invoke('downloads:start', request),
    dismiss: (id) => ipcRenderer.invoke('downloads:dismiss', id),
    retry: (id, stepKey) => ipcRenderer.invoke('downloads:retry', id, stepKey),
    onUpdate: (callback) => subscribe('downloads:update', callback)
  },
  profiles: {
    list: (game) => ipcRenderer.invoke('profiles:list', game),
    create: (game, name) => ipcRenderer.invoke('profiles:create', game, name),
    rename: (game, id, name) => ipcRenderer.invoke('profiles:rename', game, id, name),
    remove: (game, id) => ipcRenderer.invoke('profiles:delete', game, id),
    reveal: (game, id) => ipcRenderer.invoke('profiles:reveal', game, id),
    copyPath: (game, id) => ipcRenderer.invoke('profiles:copy-path', game, id),
    toggleMod: (game, id, packageName, enabled) =>
      ipcRenderer.invoke('profiles:toggle-mod', game, id, packageName, enabled),
    exportProfile: (game, id) => ipcRenderer.invoke('profiles:export', game, id),
    chooseProfileArchive: (game) => ipcRenderer.invoke('profiles:choose-profile-archive', game),
    importProfile: (game, archivePath, payload) =>
      ipcRenderer.invoke('profiles:import-profile', game, archivePath, payload),
    chooseModArchive: () => ipcRenderer.invoke('profiles:choose-mod-archive'),
    importLocalMod: (game, id, zipPath, metadata) =>
      ipcRenderer.invoke('profiles:import-local-mod', game, id, zipPath, metadata),
    uninstallMod: (game, id, packageName) =>
      ipcRenderer.invoke('profiles:uninstall-mod', game, id, packageName),
    sharedFiles: (game, id) => ipcRenderer.invoke('profiles:shared-files', game, id),
    repair: (game, id) => ipcRenderer.invoke('profiles:repair', game, id),
    scanUntracked: (game, id) => ipcRenderer.invoke('profiles:scan-untracked', game, id),
    cleanUntracked: (game, id, paths) =>
      ipcRenderer.invoke('profiles:clean-untracked', game, id, paths),
    conflicts: (game, id) => ipcRenderer.invoke('profiles:conflicts', game, id),
    setConflictWinner: (game, id, relativePath, packageName) =>
      ipcRenderer.invoke('profiles:set-conflict-winner', game, id, relativePath, packageName),
    onUpdated: (callback) => subscribe('profiles:updated', callback)
  },
  app: {
    openExternal: (url) => ipcRenderer.invoke('app:open-external', url),
    copyText: (text) => ipcRenderer.invoke('app:copy-text', text),
    version: () => ipcRenderer.invoke('app:version'),
    previewTheme: (theme) => ipcRenderer.invoke('app:preview-theme', theme)
  },
  icons: {
    read: (filePath) => ipcRenderer.invoke('icons:read', filePath)
  },
  game: {
    chooseExecutable: (game) => ipcRenderer.invoke('game:choose-executable', game),
    detectPath: (game, name) => ipcRenderer.invoke('game:detect-path', game, name),
    pathExists: (filePath) => ipcRenderer.invoke('game:path-exists', filePath),
    detectSteamAppId: (game) => ipcRenderer.invoke('game:detect-steam-app-id', game),
    modLaunchArgsDefault: (game, profileId) =>
      ipcRenderer.invoke('game:mod-launch-args-default', game, profileId),
    preloaderPath: (game, profileId) => ipcRenderer.invoke('game:preloader-path', game, profileId),
    detectLoader: (game, profileId) => ipcRenderer.invoke('game:detect-loader', game, profileId),
    launch: (request) => ipcRenderer.invoke('game:launch', request)
  },
  configs: {
    list: (game, id) => ipcRenderer.invoke('configs:list', game, id),
    read: (game, id, relativePath) => ipcRenderer.invoke('configs:read', game, id, relativePath),
    write: (game, id, relativePath, content) =>
      ipcRenderer.invoke('configs:write', game, id, relativePath, content),
    open: (game, id, relativePath) => ipcRenderer.invoke('configs:open', game, id, relativePath)
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
    onMaximizeChange: (callback) => subscribe('window:maximized', callback),
    close: () => ipcRenderer.send('window:close')
  }
});

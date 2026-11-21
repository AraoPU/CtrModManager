'use strict';

const { app, BrowserWindow, ipcMain, shell, clipboard, Menu, dialog, nativeTheme } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const APP_NAME = 'CtrModManager';

app.setName(APP_NAME);
// Keep all user data in %APPDATA%\CtrModManager
app.setPath('userData', path.join(app.getPath('appData'), APP_NAME));

const store = require('./store');
const profiles = require('./profiles');
const installer = require('./installer');
const launcher = require('./launcher');
const profileTransfer = require('./profileTransfer');
const configService = require('./configService');
const loaders = require('./loaders');
const {
  fetchCommunities,
  listCommunityPackages,
  refreshCommunityPackages,
  fetchPackageVersions
} = require('./thunderstore');

let mainWindow = null;
const iconCache = new Map();

const ICON_CACHE_LIMIT = 400;

function rememberIcon(key, value) {
  // 简单 FIFO 淘汰：Map 的迭代顺序就是插入顺序，超限时删最旧的一条，
  // 避免长时间使用后 base64 图标把内存越吃越多
  if (iconCache.size >= ICON_CACHE_LIMIT) {
    const oldest = iconCache.keys().next().value;
    if (oldest !== undefined) iconCache.delete(oldest);
  }
  iconCache.set(key, value);
}

const hasLock = app.requestSingleInstanceLock();

if (!hasLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    await migratePersistentInjection();
    registerIpc();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}

function createWindow() {
  const theme = store.readSettings().theme || 'system';
  nativeTheme.themeSource = theme === 'light' || theme === 'dark' ? theme : 'system';
  const dark = theme === 'dark' || (theme === 'system' && nativeTheme.shouldUseDarkColors);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 960,
    minHeight: 620,
    show: false,
    frame: false,
    icon: path.join(__dirname, '..', '..', 'build', 'icon.png'),
    backgroundColor: dark ? '#1a1a18' : '#f4f4ef',
    title: APP_NAME,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());

  // 最大化状态变化时通知渲染层切换标题栏按钮图标
  mainWindow.on('maximize', () => {
    if (mainWindow) mainWindow.webContents.send('window:maximized', true);
  });
  mainWindow.on('unmaximize', () => {
    if (mainWindow) mainWindow.webContents.send('window:maximized', false);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event) => event.preventDefault());
}

function windowFrom(event) {
  return BrowserWindow.fromWebContents(event.sender);
}

// 旧版本把绝对预加载器路径写进了游戏目录的 doorstop_config.ini，
// 导致从 Steam 直接启动也会注入 Mod。启动时做一次清理迁移。
async function migratePersistentInjection() {
  try {
    const settings = store.readSettings();
    for (const [slug, exePath] of Object.entries(settings.gamePaths || {})) {
      if (!exePath || !fs.existsSync(exePath)) continue;
      const gameDir = path.dirname(exePath);
      try {
        launcher.disablePersistentInjection(gameDir);
      } catch {
        // 单个游戏失败不影响启动
      }
      try {
        // 只有确实存在注入文件时才清理，避免每次启动都扫一遍游戏目录
        const hasInjection = ['winhttp.dll', 'version.dll', 'doorstop_config.ini'].some((name) =>
          fs.existsSync(path.join(gameDir, name))
        );
        if (hasInjection) {
          // 游戏运行中时文件被占用，删除会失败，忽略即可
          launcher.linkProfileFiles(slug, gameDir, null);
          launcher.cleanupStaleInjection(slug, gameDir);
        }
      } catch {
        // 清理失败下次启动再试
      }
    }
  } catch {
    // 设置读取失败时跳过迁移
  }
}

function assertString(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label}无效`);
  }
  return value;
}

async function createUniqueProfile(game, rawName) {
  const base = String(rawName || '导入配置').trim().slice(0, 32) || '导入配置';

  try {
    return await profiles.createProfile(game, base);
  } catch (error) {
    for (let index = 2; index <= 30; index += 1) {
      try {
        return await profiles.createProfile(game, `${base} (${index})`);
      } catch {
        // Try the next available name.
      }
    }
    throw error;
  }
}

function registerIpc() {
  installer.configure({
    onDownloads: (tasks) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('downloads:update', tasks);
      }
    },
    onProfileUpdated: (info) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('profiles:updated', info);
      }
    }
  });

  ipcMain.on('window:minimize', (event) => {
    const win = windowFrom(event);
    if (win) win.minimize();
  });

  ipcMain.handle('window:toggle-maximize', (event) => {
    const win = windowFrom(event);
    if (!win) return false;
    if (win.isMaximized()) {
      win.unmaximize();
      return false;
    }
    win.maximize();
    return true;
  });

  ipcMain.handle('window:is-maximized', (event) => {
    const win = windowFrom(event);
    return Boolean(win && win.isMaximized());
  });

  ipcMain.on('window:close', async (event) => {
    const win = windowFrom(event);
    if (!win) return;

    const active = installer
      .getTasks()
      .some((task) => ['queued', 'downloading', 'extracting'].includes(task.status));

    if (active) {
      // 用异步对话框：同步版本会挂起主进程事件循环，把下载/解压任务一起卡住
      const { response } = await dialog.showMessageBox(win, {
        type: 'warning',
        buttons: ['继续安装', '仍要关闭'],
        defaultId: 0,
        cancelId: 0,
        noLink: true,
        title: '安装任务进行中',
        message: '还有 Mod 正在下载或安装，关闭后这些任务会中断。',
        detail:
          '已完成的 Mod 不受影响；正在安装的 Mod 可能残留部分文件，重新打开后可在「未跟踪文件」里扫描清理，或重试安装。'
      });
      if (response !== 1) return;
    }

    win.close();
  });

  ipcMain.handle('games:cache', () => {
    const cache = store.readGamesCache();
    if (!cache) return null;
    const slugs = cache.games.map((game) => game.identifier);
    // 已有缓存作为基线：第一次启用「新游戏」功能时不把整页都标成新
    store.seedSeenGames(slugs);
    return { ...cache, newGames: store.getNewGames(slugs) };
  });

  ipcMain.handle('games:refresh', async () => {
    const games = await fetchCommunities();
    const cache = store.writeGamesCache(games);
    const newGames = store.registerGames(games.map((game) => game.identifier));
    return { ...cache, newGames };
  });

  ipcMain.handle('mods:list', (_event, game) => {
    return listCommunityPackages(assertString(game, '游戏标识'));
  });

  ipcMain.handle('mods:refresh', (_event, game) => {
    return refreshCommunityPackages(assertString(game, '游戏标识'), true);
  });

  ipcMain.handle('mods:prefetch', async (_event, game) => {
    try {
      await refreshCommunityPackages(assertString(game, '游戏标识'), false);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('mods:versions', (_event, game, uuid) => {
    return fetchPackageVersions(assertString(game, '游戏标识'), assertString(uuid, 'Mod 标识'));
  });

  ipcMain.handle('downloads:list', () => installer.getTasks());

  ipcMain.handle('downloads:start', (_event, request) => installer.startInstall(request));

  ipcMain.handle('downloads:dismiss', (_event, id) => installer.dismiss(assertString(id, '下载标识')));

  ipcMain.handle('downloads:retry', (_event, id, stepKey) => {
    const taskId = assertString(id, '下载标识');
    if (stepKey === undefined || stepKey === null || stepKey === '') {
      return installer.retryTask(taskId);
    }
    return installer.retryStep(taskId, assertString(stepKey, 'Mod 标识'));
  });

  ipcMain.handle('profiles:toggle-mod', (_event, game, id, packageName, enabled) => {
    return installer.setModEnabled(
      assertString(game, '游戏标识'),
      assertString(id, '配置标识'),
      assertString(packageName, 'Mod 标识'),
      Boolean(enabled)
    );
  });

  ipcMain.handle('profiles:uninstall-mod', (_event, game, id, packageName) => {
    return installer.removeMod(
      assertString(game, '游戏标识'),
      assertString(id, '配置标识'),
      assertString(packageName, 'Mod 标识')
    );
  });

  ipcMain.handle('profiles:shared-files', (_event, game, id) => {
    return installer.getSharedFiles(
      assertString(game, '游戏标识'),
      assertString(id, '配置标识')
    );
  });

  ipcMain.handle('profiles:repair', (_event, game, id) => {
    return installer.repairProfile(
      assertString(game, '游戏标识'),
      assertString(id, '配置标识'),
      { force: true }
    );
  });

  ipcMain.handle('profiles:scan-untracked', (_event, game, id) => {
    return installer.scanUntracked(
      assertString(game, '游戏标识'),
      assertString(id, '配置标识')
    );
  });

  ipcMain.handle('profiles:clean-untracked', (_event, game, id, paths) => {
    if (!Array.isArray(paths)) throw new Error('清理列表无效');
    return installer.cleanUntracked(
      assertString(game, '游戏标识'),
      assertString(id, '配置标识'),
      paths
    );
  });

  ipcMain.handle('profiles:conflicts', (_event, game, id) => {
    return installer.getConflicts(
      assertString(game, '游戏标识'),
      assertString(id, '配置标识')
    );
  });

  ipcMain.handle('profiles:set-conflict-winner', (_event, game, id, relativePath, packageName) => {
    return installer.setConflictWinner(
      assertString(game, '游戏标识'),
      assertString(id, '配置标识'),
      assertString(relativePath, '文件路径'),
      assertString(packageName, 'Mod 标识')
    );
  });

  ipcMain.handle('app:open-external', async (_event, url) => {
    const target = assertString(url, '链接');
    if (!/^https?:\/\//i.test(target)) throw new Error('链接无效');
    await shell.openExternal(target);
    return true;
  });

  ipcMain.handle('app:copy-text', (_event, text) => {
    if (typeof text !== 'string') throw new Error('复制内容无效');
    clipboard.writeText(text);
    return true;
  });

  ipcMain.handle('app:version', () => app.getVersion());

  // 主题预览：立即同步 nativeTheme，让「跟随系统」在保存前也能生效
  ipcMain.handle('app:preview-theme', (_event, theme) => {
    const value = theme === 'light' || theme === 'dark' ? theme : 'system';
    nativeTheme.themeSource = value;
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  });

  ipcMain.handle('icons:read', (_event, filePath) => {
    const target = assertString(filePath, '图标路径');
    if (iconCache.has(target)) return iconCache.get(target);

    const resolved = path.resolve(target);
    const profilesRoot = path.join(app.getPath('userData'), 'profiles');
    // 只允许读 Profile 目录内 .ctr/icons 下的图片，避免渲染层借这个通道读任意文件
    if (!resolved.toLowerCase().startsWith(`${profilesRoot.toLowerCase()}${path.sep}`)) {
      return null;
    }
    if (!/[\\/]\.ctr[\\/]icons[\\/]/i.test(resolved) || !/\.(png|jpe?g)$/i.test(resolved)) {
      return null;
    }

    try {
      const buffer = fs.readFileSync(resolved);
      const mime = /\.jpe?g$/i.test(resolved) ? 'image/jpeg' : 'image/png';
      const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`;
      rememberIcon(target, dataUrl);
      return dataUrl;
    } catch {
      return null;
    }
  });

  ipcMain.handle('profiles:export', (event, game, id) => {
    return profileTransfer.exportProfile(
      assertString(game, '游戏标识'),
      assertString(id, '配置标识'),
      windowFrom(event)
    );
  });

  ipcMain.handle('profiles:choose-profile-archive', async (event, game) => {
    const slug = assertString(game, '游戏标识');
    const parsed = await profileTransfer.chooseProfileArchive(windowFrom(event));
    if (!parsed) return null;

    const data = await listCommunityPackages(slug);
    const byName = new Map();
    for (const pkg of data && Array.isArray(data.packages) ? data.packages : []) {
      byName.set(String(pkg.fullName || '').toLowerCase(), pkg);
    }

    return {
      path: parsed.path,
      profileName: parsed.profileName,
      mods: parsed.mods.map((mod) => {
        const pkg = byName.get(mod.name.toLowerCase()) || null;
        return {
          name: pkg ? pkg.name : mod.name,
          version: mod.version,
          enabled: mod.enabled,
          matched: Boolean(pkg),
          uuid: pkg ? pkg.uuid : null,
          packageName: pkg ? pkg.fullName : mod.name,
          namespace: pkg ? pkg.owner : '',
          owner: pkg ? pkg.owner : '',
          icon: pkg ? pkg.icon : null
        };
      })
    };
  });

  ipcMain.handle('profiles:import-profile', async (_event, game, archivePath, payload) => {
    const slug = assertString(game, '游戏标识');
    const file = assertString(archivePath, '配置压缩包');
    if (!fs.existsSync(file)) throw new Error('配置压缩包不存在');
    if (!payload || typeof payload !== 'object') throw new Error('导入参数无效');

    const profile = await createUniqueProfile(slug, payload.profileName);

    const mods = (Array.isArray(payload.mods) ? payload.mods : []).filter(
      (mod) => mod && mod.matched && typeof mod.uuid === 'string' && mod.uuid
    );

    // 没有 Mod 要装时直接还原配置；有 Mod 时等装完再还原，
    // 否则 Mod 包里的默认 cfg 会把导入的用户配置覆盖掉
    if (mods.length === 0) {
      try {
        await profileTransfer.extractProfileFiles(slug, profile.id, file);
      } catch (error) {
        try {
          profiles.deleteProfile(slug, profile.id);
        } catch {
          // Ignore cleanup failures.
        }
        throw error;
      }
      return { profile, task: null };
    }

    const task = installer.startProfileImport(slug, profile.id, mods, {
      afterInstall: () => profileTransfer.extractProfileFiles(slug, profile.id, file)
    });
    return { profile, task };
  });

  ipcMain.handle('profiles:choose-mod-archive', (event) => {
    return profileTransfer.chooseModArchive(windowFrom(event));
  });

  ipcMain.handle('profiles:import-local-mod', (event, game, id, zipPath, metadata) => {
    return installer.startLocalImport(
      assertString(game, '游戏标识'),
      assertString(id, '配置标识'),
      assertString(zipPath, '压缩包路径'),
      metadata
    );
  });

  ipcMain.handle('configs:list', (_event, game, id) => {
    return configService.listConfigs(
      assertString(game, '游戏标识'),
      assertString(id, '配置标识')
    );
  });

  ipcMain.handle('configs:read', (_event, game, id, relativePath) => {
    return configService.readConfig(
      assertString(game, '游戏标识'),
      assertString(id, '配置标识'),
      assertString(relativePath, '配置文件路径')
    );
  });

  ipcMain.handle('configs:write', (_event, game, id, relativePath, content) => {
    return configService.writeConfig(
      assertString(game, '游戏标识'),
      assertString(id, '配置标识'),
      assertString(relativePath, '配置文件路径'),
      content
    );
  });

  ipcMain.handle('configs:open', (_event, game, id, relativePath) => {
    return configService.openConfig(
      assertString(game, '游戏标识'),
      assertString(id, '配置标识'),
      assertString(relativePath, '配置文件路径')
    );
  });

  ipcMain.handle('settings:detect-steam-path', () => launcher.findSteamExe());

  ipcMain.handle('settings:choose-steam-path', async (event) => {
    const options = {
      title: '选择 Steam 可执行文件',
      properties: ['openFile'],
      filters: [{ name: 'Steam', extensions: ['exe'] }]
    };
    const win = windowFrom(event);
    const result = win
      ? await dialog.showOpenDialog(win, options)
      : await dialog.showOpenDialog(options);
    return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0];
  });

  ipcMain.handle('settings:choose-launch-program', async (event) => {
    const options = {
      title: '选择启动程序',
      properties: ['openFile'],
      filters: [{ name: '可执行文件', extensions: ['exe'] }]
    };
    const win = windowFrom(event);
    const result = win
      ? await dialog.showOpenDialog(win, options)
      : await dialog.showOpenDialog(options);
    return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0];
  });

  ipcMain.handle('game:choose-executable', async (event, game) => {
    const slug = assertString(game, '游戏标识');
    const win = windowFrom(event);
    const options = {
      title: '选择游戏可执行文件',
      properties: ['openFile'],
      filters: [{ name: '可执行文件', extensions: ['exe'] }]
    };
    const result = win
      ? await dialog.showOpenDialog(win, options)
      : await dialog.showOpenDialog(options);

    if (result.canceled || result.filePaths.length === 0) return null;

    const exePath = result.filePaths[0];
    store.updateSettings({ gamePaths: { [slug]: exePath } });
    return { path: exePath };
  });

  ipcMain.handle('game:mod-launch-args-default', (_event, game, profileId) => {
    if (!profileId) return launcher.DEFAULT_MOD_LAUNCH_ARGS;
    try {
      const slug = assertString(game, '游戏标识');
      const id = assertString(profileId, '配置标识');
      const loader = loaders.getLoader(loaders.detectProfileLoader(profiles.getProfileDir(slug, id)));
      return loader.defaultLaunchArgs;
    } catch {
      return launcher.DEFAULT_MOD_LAUNCH_ARGS;
    }
  });

  ipcMain.handle('game:preloader-path', (_event, game, profileId) => {
    const slug = assertString(game, '游戏标识');
    const id = assertString(profileId, '配置标识');
    try {
      return launcher.findPreloader(profiles.getProfileDir(slug, id));
    } catch {
      return null;
    }
  });

  ipcMain.handle('game:detect-loader', (_event, game, profileId) => {
    const slug = assertString(game, '游戏标识');
    const id = assertString(profileId, '配置标识');
    return loaders.detectProfileLoader(profiles.getProfileDir(slug, id));
  });

  ipcMain.handle('game:detect-path', (_event, game, name) => {
    const slug = assertString(game, '游戏标识');
    const exePath = launcher.detectGamePath(slug, typeof name === 'string' ? name : '');
    return exePath ? { path: exePath } : null;
  });

  ipcMain.handle('game:path-exists', (_event, filePath) => {
    const target = assertString(filePath, '游戏路径');
    try {
      return fs.statSync(target).isFile();
    } catch {
      return false;
    }
  });

  ipcMain.handle('game:detect-steam-app-id', (_event, game) => {
    const slug = assertString(game, '游戏标识');
    const settings = store.readSettings();
    const exePath = settings.gamePaths[slug];
    if (!exePath) return null;
    return launcher.detectSteamAppId(exePath) || settings.steamAppIds[slug] || null;
  });

  ipcMain.handle('game:launch', (_event, request) => {
    if (!request || typeof request !== 'object') throw new Error('启动参数无效');
    return launcher.launchGame(
      assertString(request.game, '游戏标识'),
      assertString(request.profileId, '配置标识'),
      Boolean(request.modded)
    );
  });

  ipcMain.handle('settings:get', () => store.readSettings());

  ipcMain.handle('settings:update', (_event, patch) => {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
      throw new Error('设置数据无效');
    }
    const settings = store.updateSettings(patch);
    // 让原生对话框/菜单跟随主题
    nativeTheme.themeSource =
      settings.theme === 'light' || settings.theme === 'dark' ? settings.theme : 'system';
    return settings;
  });

  ipcMain.handle('profiles:list', (_event, game) => {
    return profiles.listProfiles(assertString(game, '游戏标识'));
  });

  ipcMain.handle('profiles:create', (_event, game, name) => {
    return profiles.createProfile(assertString(game, '游戏标识'), assertString(name, '配置名称'));
  });

  ipcMain.handle('profiles:rename', async (_event, game, id, name) => {
    const slug = assertString(game, '游戏标识');
    const profileId = assertString(id, '配置标识');

    const busy = installer
      .getTasks()
      .some(
        (task) =>
          task.game === slug &&
          task.profileId === profileId &&
          ['queued', 'downloading', 'extracting'].includes(task.status)
      );
    if (busy) throw new Error('该配置还有下载任务，完成后再重命名');

    const updated = await profiles.renameProfile(
      slug,
      profileId,
      assertString(name, '配置名称')
    );

    const settings = store.readSettings();
    if (settings.activeProfiles && settings.activeProfiles[slug] === profileId) {
      store.updateSettings({ activeProfiles: { [slug]: updated.id } });
    }

    return updated;
  });

  ipcMain.handle('profiles:delete', (_event, game, id) => {
    const slug = assertString(game, '游戏标识');
    const profileId = assertString(id, '配置标识');

    // 与重命名一致：还有任务在写这个目录时不能删，
    // 否则任务会继续往已删除的路径写文件，留下孤儿目录
    const busy = installer
      .getTasks()
      .some(
        (task) =>
          task.game === slug &&
          task.profileId === profileId &&
          ['queued', 'downloading', 'extracting'].includes(task.status)
      );
    if (busy) throw new Error('该配置还有下载任务，完成后再删除');

    profiles.deleteProfile(slug, profileId);

    // 同步文件只保留「剩余配置还需要」的那些：
    // 比如删掉最后一个 ML 配置后，游戏目录里的 version.dll 会被清掉
    const exePath = store.readSettings().gamePaths[slug];
    if (exePath) {
      try {
        const remainingDirs = profiles.listProfiles(slug).map((profile) => profile.dir);
        launcher.pruneLinkedFiles(slug, path.dirname(exePath), remainingDirs);
      } catch {
        // 文件被占用时忽略，下次启动还会再清理
      }
    }

    return true;
  });

  ipcMain.handle('profiles:reveal', async (_event, game, id) => {
    const dir = profiles.getProfileDir(assertString(game, '游戏标识'), assertString(id, '配置标识'));
    const result = await shell.openPath(dir);
    if (result) throw new Error(result);
    return true;
  });

  ipcMain.handle('profiles:copy-path', (_event, game, id) => {
    const dir = profiles.getProfileDir(assertString(game, '游戏标识'), assertString(id, '配置标识'));
    clipboard.writeText(dir);
    return true;
  });
}

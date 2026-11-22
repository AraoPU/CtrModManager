'use strict';

(function () {
  const api = window.ctr;

  const SVG_OPEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">';

  const ICONS = {
    search: `${SVG_OPEN}<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/></svg>`,
    arrowLeft: `${SVG_OPEN}<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/></svg>`,
    star: `${SVG_OPEN}<path d="M12 3.8l2.6 5.3 5.8.85-4.2 4.1 1 5.75L12 17.1l-5.2 2.7 1-5.75-4.2-4.1 5.8-.85z"/></svg>`,
    starFill:
      '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 3.8l2.6 5.3 5.8.85-4.2 4.1 1 5.75L12 17.1l-5.2 2.7 1-5.75-4.2-4.1 5.8-.85z"/></svg>',
    plus: `${SVG_OPEN}<path d="M12 5v14M5 12h14"/></svg>`,
    folder: `${SVG_OPEN}<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h5a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2z"/></svg>`,
    trash: `${SVG_OPEN}<path d="M4 7h16"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M6.5 7l.8 12.1A1.5 1.5 0 0 0 8.8 20.5h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7"/><path d="M10 11v5.5M14 11v5.5"/></svg>`,
    edit: `${SVG_OPEN}<path d="M4.5 19.5l4.3-1L19 8.3a2 2 0 0 0 0-2.8l-.5-.5a2 2 0 0 0-2.8 0L5.5 15.2z"/><path d="M14.2 6.7l3.1 3.1"/></svg>`,
    refresh: `${SVG_OPEN}<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5.5V11h-5.5"/></svg>`,
    copy: `${SVG_OPEN}<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 5.5A1.5 1.5 0 0 0 13.5 4h-8A1.5 1.5 0 0 0 4 5.5v8A1.5 1.5 0 0 0 5.5 15H6"/></svg>`,
    chevronDown: `${SVG_OPEN}<path d="M6 9.5l6 6 6-6"/></svg>`,
    chevronLeft: `${SVG_OPEN}<path d="M15 5.5L8.5 12l6.5 6.5"/></svg>`,
    chevronRight: `${SVG_OPEN}<path d="M9 5.5l6.5 6.5L9 18.5"/></svg>`,
    alert: `${SVG_OPEN}<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5"/><path d="M12 16.5h.01"/></svg>`,
    info: `${SVG_OPEN}<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><path d="M12 7.5h.01"/></svg>`,
    bilibili:
      '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373Z"/></svg>',
    github:
      '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>',
    adrarl:
      '<svg viewBox="0 0 48 48" fill="none"><defs><linearGradient id="ctrAdrarlBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stop-color="#863bff"/><stop offset="1" stop-color="#6366f1"/></linearGradient></defs><rect width="48" height="48" rx="12" fill="url(#ctrAdrarlBg)"/><path fill-rule="evenodd" d="M24 12 L35 36 L30 36 L28 30 L20 30 L18 36 L13 36 Z M24 20 L26.5 28 L21.5 28 Z" fill="#ffffff"/></svg>',
    thunderstore:
      '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="m.322 13.174 4.706 8.192L7.2 16.855 4.824 12.72a1.416 1.416 0 0 1 0-1.444l2.965-5.16c.265-.46.718-.723 1.245-.723h1.595l-3.086 6.953h3.812L6.171 22.403 16.583 9.914h-3.201l2.184-4.52h6.052L24 1.25H7.175c-.86 0-1.598.428-2.028 1.174l-4.825 8.4a2.306 2.306 0 0 0 0 2.35m7.213 9.576h9.29a2.29 2.29 0 0 0 2.03-1.176l4.825-8.4a2.317 2.317 0 0 0 0-2.35l-1.93-3.36h-4.763l2.19 3.813c.262.46.262.987 0 1.444l-2.964 5.162a1.41 1.41 0 0 1-1.248.723h-2.154l-1.497-.017z"/></svg>',
    check: `${SVG_OPEN}<path d="M5 12.5l4.5 4.5L19 7"/></svg>`,
    close: `${SVG_OPEN}<path d="M6 6l12 12M18 6L6 18"/></svg>`,
    package: `${SVG_OPEN}<path d="M12 3.2l8 4.3v9L12 20.8l-8-4.3v-9z"/><path d="M4 7.5l8 4.3 8-4.3"/><path d="M12 11.8v9"/></svg>`,
    download: `${SVG_OPEN}<path d="M12 4v10"/><path d="M8 10.5l4 4 4-4"/><path d="M5 19h14"/></svg>`,
    play: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8.5 5.3l10 6.7-10 6.7z"/></svg>',
    playOutline: `${SVG_OPEN}<path d="M8.5 5.3l10 6.7-10 6.7z"/></svg>`,
    gear: `${SVG_OPEN}<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>`,
    config: `${SVG_OPEN}<path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17" r="2"/></svg>`,
    grid: `${SVG_OPEN}<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/></svg>`,
    cover: `${SVG_OPEN}<rect x="4.5" y="3.5" width="6.5" height="17" rx="1.6"/><rect x="13.5" y="3.5" width="6.5" height="17" rx="1.6"/></svg>`,
    heart: `${SVG_OPEN}<path d="M12 20l-1.2-1.1C6.2 14.9 4 12.8 4 10.2A4.2 4.2 0 0 1 8.2 6c1.5 0 2.9.7 3.8 1.9A4.7 4.7 0 0 1 15.8 6 4.2 4.2 0 0 1 20 10.2c0 2.6-2.2 4.7-6.8 8.7z"/></svg>`,
    wechat: `${SVG_OPEN}<path d="M9.4 4.4c-3.4 0-6.1 2.1-6.1 4.8 0 1.5.8 2.8 2.1 3.7l-.5 1.9 2.2-1.1c.5.1 1 .2 1.6.2"/><path d="M14.7 8.7c-2.9 0-5.2 1.9-5.2 4.3s2.3 4.3 5.2 4.3c.5 0 1-.1 1.5-.2l1.9 1-.4-1.7c1-.8 1.6-1.9 1.6-3.2 0-2.4-2.3-4.3-5.2-4.3z"/><circle cx="6.9" cy="8.6" r=".75" fill="currentColor" stroke="none"/><circle cx="10.6" cy="8.6" r=".75" fill="currentColor" stroke="none"/></svg>`,
    afdian:
      '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M13.6 2.5 5.7 13.3c-.3.45 0 1.05.55 1.05h4.2l-1.4 7.1c-.1.63.66 1 1.05.5l7.9-10.8c.3-.45 0-1.05-.55-1.05h-4.2l1.5-7.1c.13-.62-.63-.99-1.05-.5z"/></svg>'
  };

  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  const MODS_PAGE_SIZE = 20;

  const state = {
    settings: {
      favorites: [],
      defaultGame: null,
      activeProfiles: {},
      gamePaths: {},
      steamAppIds: {},
      launchArgs: {},
      modLaunchArgs: {},
      ignoredUpdates: {},
      collapsedSections: [],
      launchMode: 'steam',
      steamPath: '',
      customLaunchPath: '',
      customLaunchArgs: '',
      theme: 'system',
      showDownloadDialog: true
    },
    games: null,
    fetchedAt: null,
    // 最近 3 天在 Thunderstore 新出现的游戏（slug 集合）
    newGames: new Set(),
    // Thunderstore 按收录时间倒序返回的前几个游戏
    recentSlugs: [],
    loading: true,
    refreshing: false,
    error: null,
    query: '',
    view: 'home',
    gameView: 'icon',
    gameSlug: null,
    stage: 'profiles',
    section: 'mods',
    profiles: [],
    profileId: null,
    autoOpened: false,
    tabs: [],
    downloads: [],
    browser: {
      slug: null,
      packages: [],
      loading: false,
      refreshing: false,
      error: null,
      fetchedAt: null,
      query: '',
      page: 1,
      hideDeprecated: true,
      sort: 'default'
    },
    configs: {
      game: null,
      profileId: null,
      files: [],
      loading: false,
      loaded: false,
      error: null
    }
  };

  const els = {
    main: document.getElementById('main'),
    homeTab: document.getElementById('home-tab'),
    tabStrip: document.getElementById('tab-strip'),
    toastRoot: document.getElementById('toast-root'),
    modalRoot: document.getElementById('modal-root'),
    downloadsBadge: document.getElementById('downloads-badge'),
    downloadsButton: document.getElementById('btn-downloads'),
    downloadsProgress: document.getElementById('downloads-progress'),
    downloadsProgressFill: document.getElementById('downloads-progress-fill')
  };

  let lastView = null;
  let lastPageKey = null;
  let activePicker = null;
  let dragSlug = null;
  let browserView = null;
  let browserSearchTimer = null;
  let downloadsView = null;
  let downloadsNav = null;
  let activeDownloadModal = null;
  let downloadsOverview = null;
  let modPicker = null;
  let modDetail = null;
  // 正在自动检测路径的游戏，避免重复请求
  const pathDetectionInFlight = new Set();
  let steamPathDetectionInFlight = false;
  let updateModal = null;
  let modUpdateConfirm = null;
  let configEditor = null;
  let launchingGame = false;
  let appVersion = '';
  const collapsedSections = new Set();
  const modsView = { query: '', sort: 'default' };
  const configsView = { query: '' };

  /* ---------- Theme ---------- */

  const THEME_KEY = 'ctr-theme';
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  let themePreference = 'system';
  let themePreviewToken = 0;

  function resolveTheme(pref) {
    if (pref === 'light' || pref === 'dark') return pref;
    return darkModeQuery.matches ? 'dark' : 'light';
  }

  function applyTheme(pref) {
    themePreference = pref === 'light' || pref === 'dark' ? pref : 'system';
    document.documentElement.dataset.theme = resolveTheme(themePreference);
    try {
      localStorage.setItem(THEME_KEY, themePreference);
    } catch {
      // localStorage 不可用时忽略，主题只在本次运行生效
    }
  }

  // 预览主题：先让主进程切换 nativeTheme，再按系统实际深浅色渲染。
  // 否则「跟随系统」会被之前保存的 themeSource 影响，只能保存后才生效。
  async function previewTheme(pref) {
    themePreviewToken += 1;
    const token = themePreviewToken;
    const value = pref === 'light' || pref === 'dark' ? pref : 'system';
    themePreference = value;
    try {
      localStorage.setItem(THEME_KEY, value);
    } catch {
      // 忽略未持久化的预览状态
    }

    try {
      const resolved = await api.app.previewTheme(value);
      if (token !== themePreviewToken) return;
      if (resolved === 'light' || resolved === 'dark') {
        document.documentElement.dataset.theme = resolved;
        return;
      }
    } catch {
      // 主进程不可用时退回 matchMedia 判断
    }

    if (token !== themePreviewToken) return;
    document.documentElement.dataset.theme = resolveTheme(value);
  }

  if (darkModeQuery.addEventListener) {
    darkModeQuery.addEventListener('change', () => {
      if (themePreference === 'system') applyTheme('system');
    });
  }

  // 先用上次的主题渲染，避免启动时闪一下浅色
  try {
    applyTheme(localStorage.getItem(THEME_KEY) || 'system');
  } catch {
    applyTheme('system');
  }

  init();

  async function init() {
    wireWindowControls();
    wireTabs();
    wireEvents();
    render();

    const [settings, cache, version] = await Promise.all([
      api.settings.get().catch(() => null),
      api.games.cache().catch(() => null),
      api.app.version().catch(() => '')
    ]);

    appVersion = String(version || '');

    if (settings) {
      state.settings = settings;
      state.gameView = settings.gameView === 'cover' ? 'cover' : 'icon';
      applyTheme(settings.theme || 'system');
      collapsedSections.clear();
      for (const key of settings.collapsedSections || []) collapsedSections.add(key);
    }

    // 启动时没有 Steam 路径就静默检测一次，成功失败都不提示
    if (settings && !String(settings.steamPath || '').trim()) {
      maybeAutoDetectSteamPath();
    }

    if (cache && Array.isArray(cache.games) && cache.games.length > 0) {
      state.games = cache.games;
      state.fetchedAt = cache.fetchedAt || null;
      state.newGames = new Set(Array.isArray(cache.newGames) ? cache.newGames : []);
      state.recentSlugs = Array.isArray(cache.recentSlugs) ? cache.recentSlugs : [];
      state.loading = false;
    }

    render();
    maybeAutoOpen();
    refreshGames();
  }

  // 首次启动静默检测 Steam 安装路径：只写配置，成功失败都不弹提示
  async function maybeAutoDetectSteamPath() {
    if (steamPathDetectionInFlight) return;
    if (String((state.settings && state.settings.steamPath) || '').trim()) return;

    steamPathDetectionInFlight = true;
    try {
      const detected = await api.settings.detectSteamPath();
      if (!detected) return;
      // 检测期间用户可能已经在设置里手动填了
      if (String((state.settings && state.settings.steamPath) || '').trim()) return;

      state.settings = await api.settings.update({ steamPath: detected });
    } catch {
      // 静默失败，用户仍可在设置里手动选择
    } finally {
      steamPathDetectionInFlight = false;
    }
  }

  function wireWindowControls() {
    const MAXIMIZE_ICON =
      '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.1"><rect x="2.2" y="2.2" width="7.6" height="7.6" rx="1"/></svg>';
    const RESTORE_ICON =
      '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.1"><rect x="2.2" y="3.8" width="6" height="6" rx="1"/><path d="M4 2.2h4.6a1.2 1.2 0 0 1 1.2 1.2V8"/></svg>';

    const maxButton = document.getElementById('btn-max');
    const syncMaximizeIcon = (maximized) => {
      maxButton.innerHTML = maximized ? RESTORE_ICON : MAXIMIZE_ICON;
      maxButton.title = maximized ? '还原' : '最大化';
      maxButton.setAttribute('aria-label', maximized ? '还原' : '最大化');
    };

    maxButton.addEventListener('click', async () => {
      try {
        syncMaximizeIcon(Boolean(await api.window.toggleMaximize()));
      } catch {
        // 忽略窗口状态查询失败
      }
    });

    const unsubscribeMaximize = api.window.onMaximizeChange(syncMaximizeIcon);
    window.addEventListener('beforeunload', () => unsubscribeMaximize(), { once: true });
    api.window
      .isMaximized()
      .then(syncMaximizeIcon)
      .catch(() => {});

    document.getElementById('btn-min').addEventListener('click', () => api.window.minimize());
    document.getElementById('btn-close').addEventListener('click', () => api.window.close());
    document.getElementById('btn-settings').addEventListener('click', openGlobalSettings);
    document.getElementById('btn-downloads').addEventListener('click', openDownloadsOverview);
  }

  function wireTabs() {
    els.homeTab.addEventListener('click', goHome);
    els.tabStrip.addEventListener(
      'wheel',
      (event) => {
        if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
        els.tabStrip.scrollLeft += event.deltaY;
        event.preventDefault();
      },
      { passive: false }
    );
  }

  function wireEvents() {
    // preload 的 subscribe 会返回取消订阅函数，统一存起来，页面卸载时清理。
    const subscriptions = [
      api.downloads.onUpdate((tasks) => {
        state.downloads = Array.isArray(tasks) ? tasks : [];
        onDownloadsUpdated();
      }),
      api.profiles.onUpdated((info) => {
        handleProfileUpdated(info);
      })
    ];

    window.addEventListener('beforeunload', () => {
      for (const unsubscribe of subscriptions) {
        try {
          unsubscribe();
        } catch {
          // 忽略重复取消订阅
        }
      }
      subscriptions.length = 0;
    });

    api.downloads
      .list()
      .then((tasks) => {
        state.downloads = Array.isArray(tasks) ? tasks : [];
        onDownloadsUpdated();
      })
      .catch(() => {});

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !configEditor) return;
      if (els.modalRoot.childElementCount > 0) return;
      closeConfigEditor();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (els.modalRoot.childElementCount > 0 || configEditor) return;
      const tab = currentTab();
      if (tab && tab.launchNotice) {
        tab.launchNotice = null;
        render();
      }
    });
  }

  /* ---------- State helpers ---------- */

  function findGame(slug) {
    return (state.games || []).find((game) => game.identifier === slug) || null;
  }

  function sortedGames(list) {
    return [...list].sort((a, b) => collator.compare(a.name, b.name));
  }

  function initialOf(name) {
    const trimmed = String(name || '').trim();
    return trimmed ? [...trimmed][0].toUpperCase() : '?';
  }

  function artUrl(slug, kind) {
    const size = kind === 'cover' ? 'cover-360x480' : 'icon-192x192';
    const encoded = encodeURIComponent(slug);
    return `https://ccdn.thunderstore.io/assets/${encoded}/${encoded}-${size}.webp`;
  }

  function bannerUrl(slug) {
    const encoded = encodeURIComponent(slug);
    return `https://ccdn.thunderstore.io/assets/${encoded}/${encoded}-bg-1920x620.webp`;
  }

  // 游戏页顶部横幅；不是每个社区都有，加载失败时直接移除不占位
  function buildGameBanner(game) {
    const banner = h('div', { class: 'game-banner', 'aria-hidden': 'true' });
    const image = h('img', {
      src: bannerUrl(game.identifier),
      alt: '',
      loading: 'lazy',
      decoding: 'async',
      referrerpolicy: 'no-referrer',
      draggable: 'false'
    });

    image.addEventListener('error', () => banner.remove());
    banner.append(image);
    return banner;
  }

  function buildGameArt(game, extraClass, kind = 'icon') {
    const fallbackKind = kind === 'cover' ? 'icon' : 'cover';
    const art = h('div', {
      class: `game-art ${extraClass || ''} ${kind}`.trim(),
      'aria-hidden': 'true'
    });

    const loader = h('span', { class: 'art-loader' });

    const image = h('img', {
      src: artUrl(game.identifier, kind),
      alt: '',
      loading: 'lazy',
      decoding: 'async',
      referrerpolicy: 'no-referrer',
      draggable: 'false'
    });

    image.addEventListener('load', () => loader.remove());

    image.addEventListener('error', () => {
      if (image.dataset.fallback !== fallbackKind) {
        image.dataset.fallback = fallbackKind;
        image.src = artUrl(game.identifier, fallbackKind);
        return;
      }
      art.replaceChildren(h('span', { class: 'art-fallback', text: initialOf(game.name) }));
    });

    art.append(image, loader);

    if (image.complete) {
      if (image.naturalWidth > 0) loader.remove();
      else image.dispatchEvent(new Event('error'));
    }

    return art;
  }

  function profileById(id) {
    return state.profiles.find((profile) => profile.id === id) || null;
  }

  const LOADER_LABELS = { bepinex: 'BepInEx', melonloader: 'MelonLoader' };

  function loaderLabel(id) {
    return LOADER_LABELS[id] || LOADER_LABELS.bepinex;
  }

  function installedModsByName() {
    const profile = profileById(state.profileId);
    const map = new Map();
    if (profile) {
      for (const mod of profile.mods) {
        map.set(String(mod.key || '').toLowerCase(), mod);
      }
    }
    return map;
  }

  function currentGame() {
    return findGame(state.gameSlug);
  }

  function errorText(error) {
    const raw = error && error.message ? String(error.message) : '操作失败';
    return raw
      .replace(/^Error invoking remote method '[^']*':\s*/i, '')
      .replace(/^Error:\s*/i, '');
  }

  function normalizeDriveLetter(value) {
    return String(value || '').replace(/^([a-z]):/, (_, letter) => `${letter.toUpperCase()}:`);
  }

  function formatDay(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  function formatDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatBytes(bytes) {
    const size = Number(bytes) || 0;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  /* ---------- DOM helpers ---------- */

  function h(tag, props, ...children) {
    const el = document.createElement(tag);
    const attributes = props || {};

    for (const [key, value] of Object.entries(attributes)) {
      if (value === undefined || value === null || value === false) continue;

      if (key === 'class') {
        el.className = value;
      } else if (key === 'text') {
        el.textContent = value;
      } else if (key === 'html') {
        el.innerHTML = value;
      } else if (key === 'dataset') {
        Object.assign(el.dataset, value);
      } else if (key === 'value') {
        el.value = value;
      } else if (key.startsWith('on') && typeof value === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        el.setAttribute(key, value === true ? '' : value);
      }
    }

    // 递归展平子节点，避免 flat(Infinity) 在深层嵌套时产生大量临时数组
    const appendChildren = (parent, nodes) => {
      for (let i = 0; i < nodes.length; i += 1) {
        const child = nodes[i];
        if (child === undefined || child === null || child === false) continue;
        if (Array.isArray(child)) {
          appendChildren(parent, child);
        } else {
          parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
        }
      }
    };

    appendChildren(el, children);

    return el;
  }

  function icon(name, cls) {
    const span = h('span', { class: `icon ${cls || ''}`.trim() });
    span.innerHTML = ICONS[name] || '';
    return span;
  }

  /* ---------- Rendering ---------- */

  function render() {
    closeDefaultPicker();
    downloadsView = null;
    downloadsNav = null;

    if (state.view === 'game' && !currentGame()) {
      state.view = 'home';
      state.gameSlug = null;
      state.profiles = [];
      state.profileId = null;
    }

    const isGame = state.view === 'game';
    const game = currentGame();

    if (isGame && state.stage === 'workspace' && !profileById(state.profileId)) {
      state.stage = 'profiles';
      state.profileId = null;
    }

    const viewKey = isGame
      ? `game:${state.gameSlug}:${state.stage}${state.stage === 'workspace' ? `:${state.section}` : ''}`
      : 'home';
    const scrolled = els.main.scrollTop;
    const currentContent = els.main.querySelector('.workspace-content');
    const contentScrolled = (currentContent || {}).scrollTop || 0;
    const currentPanel = els.main.querySelector('.workspace-content > .content-panel');
    const panelScrolled = currentPanel ? currentPanel.scrollTop : 0;
    const currentDownloads = els.main.querySelector('.download-list');
    const downloadsScrolled = currentDownloads ? currentDownloads.scrollTop : 0;
    const viewChanged = lastView !== viewKey;
    // 只在真正的页面级切换（主页 / 游戏 / 配置选择 ~ 工作区）时做缩放动画，
    // 左侧切换分区不再重复播放，避免一直"缩小放大"。
    const pageKey = isGame ? `game:${state.gameSlug}:${state.stage}` : 'home';
    const animate = lastPageKey !== pageKey;
    const view = isGame ? buildGamePage(game) : buildHomePage();
    if (animate) view.classList.add('page-enter');
    els.main.replaceChildren(view);
    lastPageKey = pageKey;
    if (viewChanged) {
      els.main.scrollTop = 0;
      lastView = viewKey;
    } else {
      els.main.scrollTop = scrolled;
      const content = els.main.querySelector('.workspace-content');
      if (content) content.scrollTop = contentScrolled;
      const panel = els.main.querySelector('.workspace-content > .content-panel');
      if (panel) panel.scrollTop = panelScrolled;
      const downloads = els.main.querySelector('.download-list');
      if (downloads) downloads.scrollTop = downloadsScrolled;
    }

    renderTabs();
    if (!isGame) filterGameCards();
    if (isGame && state.stage === 'workspace' && state.section === 'mods') applyModsFilter();
  }

  function buildHomePage() {
    const page = h('div', { class: 'page home-page' });
    page.append(
      h(
        'div',
        { class: 'home-header' },
        h(
          'div',
          { class: 'title-block' },
          h('h1', { text: '游戏库' }),
          h('p', { text: '浏览 Thunderstore 社区，为每个游戏维护独立的 Mod 配置。' })
        ),
        h(
          'div',
          { class: 'home-tools' },
          h(
            'div',
            { class: 'search-box' },
            icon('search'),
            h('input', {
              id: 'game-search',
              type: 'text',
              placeholder: '搜索游戏…',
              autocomplete: 'off',
              spellcheck: 'false',
              value: state.query,
              oninput: (event) => {
                state.query = event.target.value;
                filterGameCards();
              },
              onkeydown: (event) => {
                if (event.key === 'Escape') {
                  event.target.value = '';
                  state.query = '';
                  filterGameCards();
                }
              }
            })
          ),
          h(
            'div',
            { class: 'view-toggle', role: 'group', 'aria-label': '游戏显示方式' },
            h(
              'button',
              {
                type: 'button',
                class: `view-toggle-btn${state.gameView === 'icon' ? ' is-active' : ''}`,
                title: '图标视图',
                'aria-pressed': String(state.gameView === 'icon'),
                onclick: () => setGameView('icon')
              },
              icon('grid', 'icon-sm')
            ),
            h(
              'button',
              {
                type: 'button',
                class: `view-toggle-btn${state.gameView === 'cover' ? ' is-active' : ''}`,
                title: '封面视图',
                'aria-pressed': String(state.gameView === 'cover'),
                onclick: () => setGameView('cover')
              },
              icon('cover', 'icon-sm')
            )
          )
        )
      )
    );

    if (state.loading && !state.games) {
      page.append(buildSkeletonSection());
      return page;
    }

    if (!state.games) {
      page.append(
        h(
          'div',
          { class: 'state-panel' },
          h('h2', { text: '无法加载游戏列表' }),
          h('p', { text: '请检查网络连接后重试。已收藏的游戏与本地配置不会受到影响。' }),
          h(
            'button',
            {
              type: 'button',
              class: 'btn primary',
              onclick: () => refreshGames()
            },
            '重新加载'
          )
        )
      );
      return page;
    }

    const games = sortedGames(state.games);
    const gameById = new Map(games.map((game) => [game.identifier, game]));
    const newIds = state.newGames instanceof Set ? state.newGames : new Set();
    const favorites = games.filter((game) => state.settings.favorites.includes(game.identifier));
    const favoriteIds = new Set(favorites.map((game) => game.identifier));

    // 最新上架：接口顺序前 12 个 + 本次新出现的游戏；收藏已经在最上面，这里不重复
    const recentGames = [];
    const recentIds = new Set();
    const pushRecent = (game) => {
      if (!game || favoriteIds.has(game.identifier) || recentIds.has(game.identifier)) return;
      recentIds.add(game.identifier);
      recentGames.push(game);
    };
    for (const slug of state.recentSlugs || []) pushRecent(gameById.get(slug));
    for (const game of games) {
      if (newIds.has(game.identifier)) pushRecent(game);
    }

    const others = games.filter(
      (game) => !favoriteIds.has(game.identifier) && !recentIds.has(game.identifier)
    );
    const defaultGame = state.settings.defaultGame ? findGame(state.settings.defaultGame) : null;

    const defaultTrigger = h(
      'button',
      {
        type: 'button',
        class: `default-trigger${defaultGame ? '' : ' is-empty'}`,
        'aria-haspopup': 'listbox',
        'aria-expanded': 'false',
        onclick: (event) => openDefaultPicker(event.currentTarget, games)
      },
      h('span', {
        class: 'default-trigger-label',
        text: defaultGame ? defaultGame.name : '不自动进入'
      }),
      icon('chevronDown', 'icon-sm')
    );

    page.append(
      h(
        'div',
        { class: 'default-row' },
        h('span', { class: 'default-label', text: '启动默认' }),
        h('div', { class: 'default-picker' }, defaultTrigger),
        h('span', { class: 'default-hint', text: '打开软件时直接进入所选游戏' })
      )
    );

    if (favorites.length > 0) {
      page.append(buildGameSection('favorites', '收藏', favorites));
    }

    if (recentGames.length > 0) {
      page.append(buildGameSection('recent', `新游戏（${recentGames.length}）`, recentGames));
    }

    if (others.length > 0) {
      page.append(buildGameSection('games', '游戏', others));
    }

    page.append(h('div', { class: 'no-results', id: 'no-results', text: '没有找到匹配的游戏。' }));

    return h(
      'div',
      { class: 'home-view' },
      page,
      h(
        'div',
        { class: 'home-statusbar' },
        h(
          'div',
          { class: 'home-statusbar-inner' },
          h('span', { class: 'home-status-text', text: syncLabel() }),
          h('span', { class: 'spacer' }),
          h(
            'button',
            {
              type: 'button',
              class: `ghost-inline refresh-btn${state.refreshing ? ' is-busy' : ''}`,
              disabled: state.refreshing,
              onclick: () => refreshGames()
            },
            icon('refresh', 'icon-sm'),
            '刷新'
          )
        )
      )
    );
  }

  function buildSkeletonSection() {
    const grid = h('div', { class: 'grid' });
    for (let index = 0; index < 12; index += 1) {
      grid.append(
        h(
          'div',
          { class: 'skeleton-card' },
          h('div', { class: 'skeleton-block skeleton-monogram' }),
          h(
            'div',
            { class: 'skeleton-lines' },
            h('div', { class: 'skeleton-line' }),
            h('div', { class: 'skeleton-line short' })
          )
        )
      );
    }
    return h(
      'section',
      { class: 'section' },
      h('div', { class: 'section-head' }, h('h2', { text: '正在获取游戏' })),
      grid
    );
  }

  function buildGameSection(key, title, games) {
    const collapsed = collapsedSections.has(key);
    const grid = h('div', {
      class: `grid${state.gameView === 'cover' ? ' is-cover' : ''}${collapsed ? ' is-hidden' : ''}`,
      dataset: { section: key }
    });
    for (const game of games) {
      grid.append(buildGameCard(game));
    }
    return h(
      'section',
      { class: 'section' },
      h(
        'div',
        {
          class: 'section-head is-clickable',
          role: 'button',
          tabindex: '0',
          'aria-expanded': String(!collapsed),
          onclick: () => toggleSection(key),
          onkeydown: (event) => {
            if (event.target !== event.currentTarget) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              toggleSection(key);
            }
          }
        },
        icon('chevronDown', `icon-sm section-chevron${collapsed ? ' is-collapsed' : ''}`),
        h('h2', { text: title }),
        h('span', { class: 'section-count', text: `${games.length} 个` })
      ),
      grid
    );
  }

  function toggleSection(key) {
    if (collapsedSections.has(key)) collapsedSections.delete(key);
    else collapsedSections.add(key);
    filterGameCards();

    api.settings
      .update({ collapsedSections: [...collapsedSections] })
      .then((settings) => {
        state.settings = settings;
      })
      .catch(() => {});
  }

  function buildGameCard(game) {
    const isFavorite = state.settings.favorites.includes(game.identifier);
    const isDefault = state.settings.defaultGame === game.identifier;
    const isCover = state.gameView === 'cover';

    const card = h(
      'div',
      {
        class: `game-card${isCover ? ' is-cover' : ''}`,
        role: 'button',
        tabindex: '0',
        'aria-label': `打开 ${game.name}`,
        dataset: {
          slug: game.identifier,
          search: `${game.name} ${game.identifier}`.toLowerCase()
        },
        onclick: () => openGame(game.identifier),
        onkeydown: (event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openGame(game.identifier);
          }
        }
      },
      buildGameArt(game, '', isCover ? 'cover' : 'icon'),
      h(
        'div',
        { class: 'game-info' },
        h('div', { class: 'game-name', text: game.name }),
        h(
          'div',
          { class: 'game-id' },
          h('span', { text: game.identifier }),
          isDefault ? h('span', { class: 'tag-default', text: '默认' }) : null
        )
      )
    );

    card.append(
      h(
        'button',
        {
          type: 'button',
          class: `star-btn${isFavorite ? ' is-active' : ''}`,
          title: isFavorite ? '取消收藏' : '收藏',
          'aria-label': isFavorite ? '取消收藏' : '收藏',
          'aria-pressed': String(isFavorite),
          onclick: (event) => {
            event.stopPropagation();
            toggleFavorite(game.identifier);
          }
        },
        icon(isFavorite ? 'starFill' : 'star', 'icon-sm')
      )
    );

    if (state.newGames instanceof Set && state.newGames.has(game.identifier)) {
      card.append(
        h('span', { class: 'game-new-badge', text: 'NEW', title: '最近 3 天新增' })
      );
    }

    return card;
  }

  function buildGamePage(game) {
    // 进入配置后使用固定侧边栏布局，右侧内容独立滚动
    if (state.stage === 'workspace' && profileById(state.profileId)) {
      return buildWorkspace(game);
    }

    const page = h('div', { class: 'page game-page' });

    page.append(
      h(
        'div',
        { class: 'back-row' },
        h(
          'button',
          { type: 'button', class: 'back-btn', onclick: goHome },
          icon('arrowLeft', 'icon-sm'),
          '游戏库'
        )
      )
    );

    page.append(buildGameBanner(game));

    const isFavorite = state.settings.favorites.includes(game.identifier);
    const isDefault = state.settings.defaultGame === game.identifier;

    page.append(
      h(
        'div',
        { class: 'game-head' },
        buildGameArt(game, 'lg'),
        h(
          'div',
          { class: 'game-head-text' },
          h('h1', { text: game.name }),
          h('div', {
            class: 'game-head-meta',
            text: `${game.identifier} · Thunderstore 社区`
          })
        ),
        h(
          'div',
          { class: 'game-head-actions' },
          h(
            'button',
            {
              type: 'button',
              class: `btn${isFavorite ? ' is-active' : ''}`,
              onclick: () => toggleFavorite(game.identifier)
            },
            icon(isFavorite ? 'starFill' : 'star', 'icon-sm'),
            isFavorite ? '已收藏' : '收藏'
          ),
          h(
            'button',
            {
              type: 'button',
              class: `btn${isDefault ? ' is-active' : ''}`,
              onclick: () => setDefaultGame(isDefault ? null : game.identifier)
            },
            isDefault ? '默认游戏' : '设为默认'
          )
        )
      )
    );

    if (state.stage === 'loading') {
      page.append(buildWorkspaceLoading());
    } else {
      page.append(buildProfileGate(game));
    }

    return page;
  }

  function buildWorkspaceLoading() {
    return h(
      'section',
      { class: 'panel gate-loading' },
      h('div', { class: 'content-empty' }, h('p', { text: '正在读取本地配置…' }))
    );
  }

  function buildProfileGate(game) {
    const section = h('section', { class: 'profile-gate' });
    section.append(
      h(
        'div',
        { class: 'gate-head' },
        h(
          'div',
          { class: 'gate-head-text' },
          h('h2', { text: '选择 Mod 配置' }),
          h('p', { text: '每个配置拥有独立的 Mod 列表，选择后再进入 Mod 管理。' })
        ),
        h(
          'div',
          { class: 'gate-actions' },
          h(
            'button',
            { type: 'button', class: 'btn small', onclick: () => importProfileArchive(game) },
            icon('package', 'icon-sm'),
            '导入配置 (.r2z)'
          )
        )
      )
    );

    if (state.profiles.length === 0) {
      section.append(
        h(
          'div',
          { class: 'panel gate-empty' },
          h('h3', { text: '还没有配置' }),
          h('p', { text: '先创建一个配置，再开始为这个游戏添加 Mod。' }),
          h(
            'button',
            { type: 'button', class: 'btn primary', onclick: createProfile },
            icon('plus', 'icon-sm'),
            '新建配置'
          )
        )
      );
      return section;
    }

    const lastUsed = state.settings.activeProfiles[game.identifier];
    const grid = h('div', { class: 'profile-grid' });

    for (const profile of state.profiles) {
      const isLastUsed = profile.id === lastUsed;
      grid.append(
        h(
          'div',
          {
            class: 'profile-card',
            role: 'button',
            tabindex: '0',
            'aria-label': `进入配置 ${profile.name}`,
            onclick: () => enterProfile(profile.id),
            onkeydown: (event) => {
              if (event.target !== event.currentTarget) return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                enterProfile(profile.id);
              }
            }
          },
          h(
            'div',
            { class: 'profile-card-top' },
            h('h3', { text: profile.name }),
            isLastUsed ? h('span', { class: 'tag-default', text: '上次使用' }) : null
          ),
          h('p', {
            class: 'profile-card-meta',
            text: `${profile.mods.length} 个 Mod · ${formatDay(profile.updatedAt)}`
          }),
          h(
            'div',
            { class: 'profile-card-foot' },
            h('span', { text: '进入配置' }),
            icon('chevronRight', 'icon-sm')
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'card-rename',
              title: '重命名配置',
              'aria-label': `重命名配置 ${profile.name}`,
              onmousedown: (event) => event.stopPropagation(),
              onclick: (event) => {
                event.stopPropagation();
                renameProfile(profile);
              }
            },
            icon('edit', 'icon-sm')
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'card-delete',
              title: '删除配置',
              'aria-label': `删除配置 ${profile.name}`,
              onmousedown: (event) => event.stopPropagation(),
              onclick: (event) => {
                event.stopPropagation();
                confirmDeleteProfile(profile);
              }
            },
            icon('trash', 'icon-sm')
          )
        )
      );
    }

    grid.append(
      h(
        'div',
        {
          class: 'profile-card is-new',
          role: 'button',
          tabindex: '0',
          onclick: createProfile,
          onkeydown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              createProfile();
            }
          }
        },
        h('span', { class: 'new-plus' }, icon('plus')),
        h('span', { text: '新建配置' })
      )
    );

    section.append(grid);
    return section;
  }

  function buildWorkspace(game) {
    const profile = profileById(state.profileId);
    if (!profile) return buildProfileGate(game);

    const profileDownloads = downloadsForCurrentProfile();
    // 数量元素始终保留（先渲染空字符串），列表加载/后台刷新完成后就地填充，
    // 和 r2modman 侧边栏使用派生计数一样，避免数字停留在上一次渲染的快照
    const browserCount =
      state.browser.slug === game.identifier && state.browser.packages.length > 0
        ? String(state.browser.packages.length)
        : '';
    const downloadsItem = buildNavItem('downloads', 'download', '下载', profileDownloads.length, {
      progress: true
    });
    downloadsNav = {
      button: downloadsItem,
      count: downloadsItem.querySelector('.nav-count'),
      progress: downloadsItem.querySelector('.nav-progress'),
      progressFill: downloadsItem.querySelector('.nav-progress-fill')
    };
    updateDownloadsNavProgress();

    const gamePath = (state.settings.gamePaths || {})[game.identifier] || '';
    const launchMode = state.settings.launchMode || 'steam';
    const launchModeLabel =
      launchMode === 'steam'
        ? '通过 Steam 启动'
        : launchMode === 'direct'
          ? '直接启动游戏'
          : '自定义程序启动';

    const isFavorite = state.settings.favorites.includes(game.identifier);
    const isDefault = state.settings.defaultGame === game.identifier;

    const sidebar = h(
      'aside',
      { class: 'panel sidebar workspace-sidebar' },
      h(
        'div',
        { class: 'sidebar-game' },
        h(
          'button',
          {
            type: 'button',
            class: 'back-btn compact',
            title: '返回游戏库',
            'aria-label': '返回游戏库',
            onclick: goHome
          },
          icon('arrowLeft', 'icon-sm')
        ),
        buildGameArt(game),
        h(
          'div',
          { class: 'sidebar-game-text' },
          h('strong', { class: 'sidebar-game-name', text: game.name, title: game.name }),
          h('span', { class: 'sidebar-game-meta', text: game.identifier })
        )
      ),
      h(
        'div',
        { class: 'sidebar-game-actions' },
        h(
          'button',
          {
            type: 'button',
            class: `chip${isFavorite ? ' is-active' : ''}`,
            onclick: () => toggleFavorite(game.identifier)
          },
          icon(isFavorite ? 'starFill' : 'star', 'icon-sm'),
          isFavorite ? '已收藏' : '收藏'
        ),
        h(
          'button',
          {
            type: 'button',
            class: `chip${isDefault ? ' is-active' : ''}`,
            onclick: () => setDefaultGame(isDefault ? null : game.identifier)
          },
          isDefault ? '默认游戏' : '设为默认'
        )
      ),
      h(
        'div',
        { class: 'sidebar-profile' },
        h('div', { class: 'sidebar-label', text: '当前配置' }),
        h(
          'div',
          { class: 'sidebar-profile-row' },
          h('strong', { class: 'sidebar-profile-name', text: profile.name }),
          h(
            'button',
            { type: 'button', class: 'ghost-inline', onclick: switchProfile },
            '切换'
          )
        ),
        h('div', {
          class: 'sidebar-profile-loader',
          text: `加载器：${loaderLabel(profile.loader)}`
        }),
        profile.loaderConflicts && profile.loaderConflicts.length
          ? h('div', {
              class: 'sidebar-profile-loader',
              text: `同时检测到 ${profile.loaderConflicts
                .map(loaderLabel)
                .join('、')}，只有 ${loaderLabel(profile.loader)} 会生效`
            })
          : null
      ),
      h(
        'div',
        { class: 'sidebar-launch' },
        h(
          'button',
          {
            type: 'button',
            class: 'btn primary small',
            title: launchMode === 'steam' ? '通过 Steam 启动（加载 Mod）' : '启动游戏（加载 Mod）',
            onclick: () => launchGame(true)
          },
          icon('play', 'icon-sm'),
          '以 Mod 启动'
        ),
        h(
          'button',
          {
            type: 'button',
            class: 'btn small',
            title: launchMode === 'steam' ? '通过 Steam 启动（原版）' : '启动原版游戏',
            onclick: () => launchGame(false)
          },
          icon('playOutline', 'icon-sm'),
          '启动原版'
        ),
        h('span', { class: 'launch-hint', text: launchModeLabel })
      ),
      h(
        'nav',
        { class: 'sidebar-nav' },
        buildNavItem('mods', 'package', '已安装模组', profile.mods.length),
        buildNavItem('download', 'download', '获取模组', browserCount),
        downloadsItem,
        buildNavItem('config', 'config', '配置文件', null),
        buildNavItem('settings', 'gear', '设置', null)
      ),
      h(
        'div',
        { class: 'sidebar-footer' },
        h(
          'div',
          { class: 'sidebar-actions' },
          h(
            'button',
            { type: 'button', class: 'ghost-inline', onclick: () => revealProfile(profile) },
            icon('folder', 'icon-sm'),
            '打开目录'
          ),
          h(
            'button',
            { type: 'button', class: 'ghost-inline', onclick: () => copyProfilePath(profile) },
            icon('copy', 'icon-sm'),
            '复制路径'
          )
        )
      )
    );

    let content;
    if (state.section === 'downloads') content = buildDownloadsPanel();
    else if (state.section === 'download') content = buildDownloadPanel(game);
    else if (state.section === 'config') content = buildConfigPanel();
    else if (state.section === 'settings') content = buildGameSettingsPanel(game, profile, gamePath);
    else content = buildModsPanel(profile);

    const shell = h(
      'div',
      { class: 'workspace-shell' },
      sidebar,
      h('div', { class: 'workspace-content' }, content)
    );

    // 该标签页的启动提示（切走再切回来仍然保留，直到手动关闭）
    const tab = currentTab();
    if (tab && tab.launchNotice) shell.append(buildLaunchNotice(tab));

    return shell;
  }

  function buildNavItem(key, iconName, label, count, options) {
    const active = state.section === key;
    const showProgress = Boolean(options && options.progress);
    return h(
      'button',
      {
        type: 'button',
        class: `nav-item${active ? ' is-active' : ''}${showProgress ? ' has-progress' : ''}`,
        dataset: { nav: key },
        onclick: () => setSection(key)
      },
      icon(iconName, 'icon-sm'),
      h('span', { class: 'nav-label', text: label }),
      showProgress
        ? h(
            'span',
            { class: 'nav-progress is-hidden' },
            h('span', { class: 'nav-progress-fill' })
          )
        : null,
      count === null || count === undefined ? null : h('span', { class: 'nav-count', text: String(count) })
    );
  }

  function buildModsPanel(profile) {
    const panel = h(
      'section',
      { class: 'panel content-panel' },
      h(
        'div',
        { class: 'content-head' },
        h('h2', { text: '模组' }),
        h('span', { class: 'content-count', text: `${profile.mods.length} 个` })
      )
    );

    if (profile.mods.length === 0) {
      panel.append(
        h(
          'div',
          { class: 'content-empty' },
          h('p', { text: '这个配置还没有安装 Mod。' }),
          h('span', { text: '从左侧「下载模组」开始添加，安装后会显示在这里。' })
        )
      );
      return panel;
    }

    const list = h('div', { class: 'mod-list' });
    const installedByName = new Map(
      profile.mods.map((mod) => [String(mod.key || '').toLowerCase(), mod])
    );
    const deprecationFlags = [];
    const updateRows = [];

    // 搜索 + 排序工具栏
    const searchInput = h('input', {
      type: 'text',
      class: 'browser-input',
      placeholder: '搜索模组…',
      autocomplete: 'off',
      spellcheck: 'false',
      value: modsView.query,
      oninput: (event) => {
        modsView.query = event.target.value;
        applyModsFilter();
      },
      onkeydown: (event) => {
        if (event.key === 'Escape') {
          event.target.value = '';
          modsView.query = '';
          applyModsFilter();
        }
      }
    });

    const sortSelect = h(
      'select',
      {
        class: 'browser-sort',
        'aria-label': '模组排序方式',
        onchange: (event) => {
          modsView.sort = event.target.value;
          render();
        }
      },
      h('option', { value: 'default' }, '默认顺序'),
      h('option', { value: 'name-asc' }, '按名称排序'),
      h('option', { value: 'name-desc' }, '按名称倒序'),
      h('option', { value: 'recent' }, '最近安装')
    );
    sortSelect.value = modsView.sort;

    panel.append(
      h(
        'div',
        { class: 'browser-filters mods-toolbar' },
        h('div', { class: 'browser-search' }, icon('search', 'icon-sm'), searchInput),
        sortSelect
      )
    );

    // 模组更新提示：进入列表（或自动刷新）时和 Thunderstore 的最新版本比对一次
    const updateHost = h('div', { class: 'mods-update-host' });
    panel.append(updateHost);
    const slug = state.gameSlug;
    const refreshUpdates = shouldRefreshUpdateCheck(slug);

    // 先用已有缓存秒出更新状态，别让网络刷新拖着「更新」按钮不显示
    checkModUpdates(slug, profile).then((updates) => {
      // 异步返回时用户可能已经切走游戏/配置，直接丢弃，避免操作已卸载的 DOM
      if (state.gameSlug !== slug || state.profileId !== profile.id) return;
      if (!updateHost.isConnected) return;

      // 每个有更新的 Mod 在开关左边显示「更新」按钮
      const byKey = new Map(
        updates.map((item) => [String(item.mod.key || '').toLowerCase(), item])
      );
      for (const row of updateRows) {
        if (!row.button.isConnected) continue;
        const entry = byKey.get(row.key);
        if (!entry) continue;
        row.state.entry = entry;
        row.button.classList.remove('is-hidden');
      }

      if (updates.length === 0) return;
      const panelEl = updateHost.parentElement;
      const previousScroll = panelEl ? panelEl.scrollTop : 0;
      updateHost.replaceChildren(buildUpdateBanner(updates));
      // 提示卡是异步插入的，滚动时保持当前浏览位置，不要跳动
      if (panelEl && previousScroll > 0) {
        panelEl.scrollTop = previousScroll + updateHost.offsetHeight;
      }
    });

    // 到了该刷新的时候再后台拉一次列表，完成后重绘，更新状态不会因为网络慢而延迟
    if (refreshUpdates) {
      remotePackagesFor(slug, { force: true })
        .then(() => {
          if (state.gameSlug !== slug || state.profileId !== profile.id) return;
          if (state.view === 'game' && state.stage === 'workspace' && state.section === 'mods') {
            render();
          }
        })
        .catch(() => {});
    }

    for (const mod of sortInstalledMods(profile.mods, modsView.sort)) {
      const warningText = modDependencyWarning(mod, installedByName);
      const warning = warningText ? buildModWarning(warningText) : null;

      const dependencyCount = (mod.dependencies || []).length;
      const subParts = [];
      if (mod.author) subParts.push(mod.author);
      if (dependencyCount > 0) subParts.push(`${dependencyCount} 个依赖`);

      const deprecatedFlag = h('span', {
        class: 'mod-flag is-hidden',
        text: '已弃用'
      });
      deprecationFlags.push({ mod, flag: deprecatedFlag });

      // 有可用更新时才显示，点击选择要更新到的版本
      const rowUpdate = { entry: null };
      const updateButton = h(
        'button',
        {
          type: 'button',
          class: 'mod-update-btn is-hidden',
          title: '更新 Mod',
          onclick: (event) => {
            event.stopPropagation();
            if (rowUpdate.entry) openModUpdateConfirm(rowUpdate.entry);
          },
          onkeydown: (event) => event.stopPropagation()
        },
        icon('download', 'icon-sm'),
        '更新'
      );
      updateRows.push({
        key: String(mod.key || '').toLowerCase(),
        button: updateButton,
        state: rowUpdate
      });

      list.append(
        h(
          'div',
          {
            class: `installed-mod is-clickable${mod.enabled ? '' : ' is-disabled'}`,
            role: 'button',
            tabindex: '0',
            title: '查看详细信息',
            dataset: {
              search: `${mod.name || ''} ${mod.key || ''} ${mod.author || ''}`.toLowerCase(),
              modKey: String(mod.key || ''),
              modVersion: String(mod.version || '')
            },
            onclick: () => openModDetail(mod),
            onkeydown: (event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              openModDetail(mod);
            }
          },
          buildInstalledModIcon(mod, 'installed-icon'),
          h(
            'div',
            { class: 'installed-main' },
            h(
              'div',
              { class: 'installed-title-line' },
              h('span', { class: 'installed-name', text: mod.name || '未命名 Mod' }),
              mod.version ? h('span', { class: 'installed-version', text: `v${mod.version}` }) : null,
              deprecatedFlag
            ),
            subParts.length ? h('div', { class: 'installed-sub', text: subParts.join(' · ') }) : null
          ),
          warning,
          updateButton,
          buildModSwitch(mod)
        )
      );
    }
    panel.append(list);
    panel.append(
      h('div', {
        class: 'mods-no-results is-hidden',
        id: 'mods-no-results',
        text: '没有找到匹配的模组。'
      })
    );

    // 已安装的 Mod 是否被 Thunderstore 标记为弃用（异步查询，查到才显示红色标签）
    remotePackagesForGame().then((map) => {
      for (const { mod, flag } of deprecationFlags) {
        if (!flag.isConnected) continue;
        const pkg = map.get(String(mod.key || '').toLowerCase());
        if (pkg && pkg.deprecated) flag.classList.remove('is-hidden');
      }
    });

    return panel;
  }

  function modDependencyWarning(mod, installedByName) {
    const disabledDependencies = [];
    const missingDependencies = [];
    const outdatedDependencies = [];

    for (const dependency of mod.dependencies || []) {
      const packageName = dependencyPackageName(dependency).toLowerCase();
      const installed = installedByName.get(packageName);
      if (!installed) {
        missingDependencies.push(dependencyPackageName(dependency));
        continue;
      }
      if (!installed.enabled) {
        disabledDependencies.push(installed);
        continue;
      }

      // 依赖比清单声明的版本还旧时也提示：管理器不会自动升级已安装的依赖
      const text = String(dependency || '');
      const declared = text.slice(text.lastIndexOf('-') + 1);
      if (declared && installed.version && compareVersions(installed.version, declared) < 0) {
        outdatedDependencies.push(
          `${installed.name || installed.key}（需要 v${declared}，当前 v${installed.version}）`
        );
      }
    }

    const uniqueDependencies = [
      ...new Map(disabledDependencies.map((item) => [item.key, item])).values()
    ];
    const missingNames = [...new Set(missingDependencies)].join('、');
    const dependencyNames = uniqueDependencies.map((item) => item.name).join('、');

    if (missingNames) return `缺少依赖：${missingNames}`;
    if (uniqueDependencies.length) return `依赖已禁用：${dependencyNames}`;
    if (outdatedDependencies.length) {
      return `依赖版本过旧：${[...new Set(outdatedDependencies)].join('、')}`;
    }
    return '';
  }

  function buildModWarning(text) {
    return h(
      'span',
      {
        class: 'mod-warning',
        title: text,
        'aria-label': text
      },
      icon('alert', 'icon-sm')
    );
  }

  function sortInstalledMods(mods, sort) {
    const list = [...mods];
    if (sort === 'name-asc') {
      list.sort((a, b) => collator.compare(String(a.name || ''), String(b.name || '')));
    } else if (sort === 'name-desc') {
      list.sort((a, b) => collator.compare(String(b.name || ''), String(a.name || '')));
    } else if (sort === 'recent') {
      list.sort((a, b) => (Number(b.installedAtTime) || 0) - (Number(a.installedAtTime) || 0));
    }
    return list;
  }

  function applyModsFilter() {
    const query = modsView.query.trim().toLowerCase();
    let visible = 0;

    for (const row of els.main.querySelectorAll('.installed-mod')) {
      const match = !query || String(row.dataset.search || '').includes(query);
      row.classList.toggle('is-hidden', !match);
      if (match) visible += 1;
    }

    const empty = document.getElementById('mods-no-results');
    if (empty) empty.classList.toggle('is-hidden', !query || visible > 0);
  }

  // 只是启用/禁用变化时，就地更新列表行，避免整页重建导致滚动位置跳动
  function syncInstalledRows() {
    const profile = profileById(state.profileId);
    if (!profile) return false;

    const rows = els.main.querySelectorAll('.installed-mod');
    if (rows.length !== profile.mods.length) return false;

    const byKey = new Map(
      profile.mods.map((mod) => [String(mod.key || '').toLowerCase(), mod])
    );
    const installedByName = new Map(
      profile.mods.map((mod) => [String(mod.key || '').toLowerCase(), mod])
    );

    for (const row of rows) {
      const mod = byKey.get(String(row.dataset.modKey || '').toLowerCase());
      if (!mod) return false;
      // 版本变化（更新完成）需要整体重绘，才能刷新版本号和更新按钮
      if (String(row.dataset.modVersion || '') !== String(mod.version || '')) return false;

      row.classList.toggle('is-disabled', !mod.enabled);

      const input = row.querySelector('.switch input');
      if (input) {
        input.disabled = isModBusy(mod.key);
        input.checked = mod.enabled;
      }

      // 依赖的启用状态可能变化，同步依赖警告
      const warningText = modDependencyWarning(mod, installedByName);
      const warning = row.querySelector('.mod-warning');
      if (!warningText) {
        if (warning) warning.remove();
      } else if (warning) {
        warning.title = warningText;
        warning.setAttribute('aria-label', warningText);
      } else {
        const anchor = row.querySelector('.mod-update-btn') || row.querySelector('.switch');
        if (anchor) row.insertBefore(buildModWarning(warningText), anchor);
      }
    }

    return true;
  }

  function dependencyPackageName(value) {
    const text = String(value || '');
    const lastDash = text.lastIndexOf('-');
    return lastDash > 0 ? text.slice(0, lastDash) : text;
  }

  function buildModSwitch(mod) {
    const input = h('input', {
      type: 'checkbox',
      'aria-label': `${mod.name} 启用状态`
    });
    input.checked = mod.enabled;
    // 下载/安装中切换开关会和落盘抢同一批文件，先把开关锁住
    input.disabled = isModBusy(mod.key);

    input.addEventListener('change', async () => {
      const enabled = input.checked;
      input.disabled = true;

      try {
        await api.profiles.toggleMod(state.gameSlug, state.profileId, mod.key, enabled);
        input.disabled = isModBusy(mod.key);
      } catch (error) {
        input.checked = !enabled;
        input.disabled = false;
        toast(errorText(error), true);
      }
    });

    return h(
      'label',
      {
        class: 'switch',
        onclick: (event) => event.stopPropagation(),
        onkeydown: (event) => event.stopPropagation()
      },
      input,
      h('span', { class: 'switch-track' })
    );
  }

  function buildUpdateBanner(updates) {
    return h(
      'div',
      { class: 'update-banner' },
      icon('alert', 'icon-sm'),
      h('span', { class: 'update-banner-text', text: `有 ${updates.length} 个模组可用更新` }),
      h(
        'button',
        {
          type: 'button',
          class: 'update-banner-link',
          onclick: () => openUpdateModal(updates)
        },
        '更新'
      )
    );
  }

  function openUpdateModal(updates) {
    closeUpdateModal();
    if (updates.length === 0) return;

    const game = state.gameSlug;
    const profileId = state.profileId;
    const selected = new Set(updates.map((entry) => entry.mod.key));
    const rows = [];
    let activeCount = updates.length;

    const countLabel = h('span', { class: 'update-summary' });
    const updateButton = h(
      'button',
      { type: 'button', class: 'btn primary', onclick: () => runUpdates() },
      '更新'
    );
    const master = h('input', { type: 'checkbox', 'aria-label': '全选' });
    master.checked = true;

    const list = h('div', { class: 'update-list' });

    const syncSummary = () => {
      countLabel.textContent = `已选择 ${selected.size} / ${activeCount} 个`;
      master.checked = activeCount > 0 && selected.size === activeCount;
      master.indeterminate = selected.size > 0 && selected.size < activeCount;
      updateButton.disabled = selected.size === 0;
      updateButton.textContent = selected.size > 0 ? `更新 ${selected.size} 个` : '更新';
    };

    master.addEventListener('change', () => {
      for (const row of rows) {
        row.box.checked = master.checked;
        if (master.checked) selected.add(row.entry.mod.key);
        else selected.delete(row.entry.mod.key);
      }
      syncSummary();
    });

    for (const entry of updates) {
      const box = h('input', { type: 'checkbox', 'aria-label': `更新 ${entry.mod.name}` });
      box.checked = true;
      box.addEventListener('change', () => {
        if (box.checked) selected.add(entry.mod.key);
        else selected.delete(entry.mod.key);
        syncSummary();
      });

      const rowElement = h(
        'label',
        { class: 'update-row' },
        box,
        buildInstalledModIcon(entry.mod, 'update-icon'),
        h(
          'div',
          { class: 'update-info' },
          h('span', { class: 'update-name', text: entry.mod.name || entry.mod.key }),
          h(
            'span',
            { class: 'update-versions' },
            h('span', { class: 'update-version-old', text: `v${entry.mod.version || '?'}` }),
            icon('chevronRight', 'icon-sm'),
            h('span', { class: 'update-version-new', text: `v${entry.pkg.version}` })
          )
        ),
        h(
          'button',
          {
            type: 'button',
            class: 'update-ignore-btn',
            title: '忽略这个 Mod 的更新',
            onclick: async (event) => {
              event.preventDefault();
              event.stopPropagation();
              const ok = await ignoreModUpdate(entry.mod.key);
              if (!ok) return;

              selected.delete(entry.mod.key);
              const index = rows.findIndex((item) => item.entry === entry);
              if (index >= 0) rows.splice(index, 1);
              rowElement.remove();
              activeCount -= 1;
              syncSummary();
              render();

              if (activeCount === 0) {
                closeUpdateModal();
                toast('已忽略全部可用更新');
              }
            }
          },
          '忽略'
        )
      );

      list.append(rowElement);
      rows.push({ entry, box });
    }

    const overlay = h(
      'div',
      {
        class: 'modal-overlay',
        onmousedown: (event) => {
          if (event.target === overlay) closeUpdateModal();
        }
      },
      h(
        'div',
        { class: 'modal update-modal' },
        h('h2', { text: '更新模组' }),
        h('p', {
          class: 'update-hint',
          text: '勾选要更新到最新版本的模组；依赖 Mod 如果也有更新会自动一并更新。'
        }),
        h(
          'div',
          { class: 'update-head' },
          h('label', { class: 'update-master' }, master, h('span', { text: '全选' })),
          countLabel
        ),
        list,
        h(
          'div',
          { class: 'modal-actions' },
          h('button', { type: 'button', class: 'btn', onclick: () => closeUpdateModal() }, '取消'),
          updateButton
        )
      )
    );

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeUpdateModal();
    };

    async function runUpdates() {
      const installed = profileById(profileId);
      const installedByKey = new Map(
        (installed ? installed.mods : []).map((mod) => [String(mod.key || '').toLowerCase(), mod])
      );
      const updatesByKey = new Map(
        updates.map((entry) => [String(entry.mod.key || '').toLowerCase(), entry])
      );

      const chosenKeys = new Set(
        updates
          .filter((entry) => selected.has(entry.mod.key))
          .map((entry) => String(entry.mod.key || '').toLowerCase())
      );
      if (chosenKeys.size === 0) return;

      // 依赖也有更新时一并更新，避免只升级主 Mod 后依赖版本不匹配
      const queue = [...chosenKeys];
      while (queue.length > 0) {
        const key = queue.pop();
        const entry = updatesByKey.get(key);
        const mod = entry ? entry.mod : installedByKey.get(key);
        for (const dependency of (mod && mod.dependencies) || []) {
          const dependencyKey = dependencyPackageName(dependency).toLowerCase();
          if (!updatesByKey.has(dependencyKey) || chosenKeys.has(dependencyKey)) continue;
          chosenKeys.add(dependencyKey);
          queue.push(dependencyKey);
        }
      }

      const chosen = updates.filter((entry) =>
        chosenKeys.has(String(entry.mod.key || '').toLowerCase())
      );

      updateButton.disabled = true;
      updateButton.textContent = '处理中…';

      let started = 0;
      let failed = 0;
      let firstTaskId = null;

      for (const entry of chosen) {
        try {
          const task = await api.downloads.start({
            game,
            profileId,
            uuid: entry.pkg.uuid,
            versionNumber: entry.pkg.version,
            name: entry.mod.name
          });
          if (!state.downloads.some((item) => item.id === task.id)) {
            state.downloads = [task, ...state.downloads];
          }
          if (!firstTaskId) firstTaskId = task.id;
          started += 1;
        } catch {
          failed += 1;
        }
      }

      closeUpdateModal();
      onDownloadsUpdated();
      if (started === 1 && firstTaskId) {
        openDownloadUi(firstTaskId);
      } else if (started > 1 && state.settings.showDownloadDialog !== false) {
        openDownloadsOverview();
      }

      if (started > 0) toast(`已将 ${started} 个模组加入更新队列`);
      if (failed > 0) toast(`${failed} 个模组更新启动失败`, true);
    }

    syncSummary();
    updateModal = { overlay, onKeyDown };
    els.modalRoot.append(overlay);
    document.addEventListener('keydown', onKeyDown);
  }

  function closeUpdateModal() {
    if (!updateModal) return;
    document.removeEventListener('keydown', updateModal.onKeyDown);
    updateModal.overlay.remove();
    updateModal = null;
  }

  // 单个 Mod 的更新确认：只展示将要更新到的最新版本，不提供版本选择（避免误降级）
  function openModUpdateConfirm(entry) {
    closeModUpdateConfirm();
    if (!entry) return;

    const game = state.gameSlug;
    const profileId = state.profileId;
    const { mod, pkg } = entry;

    const startButton = h(
      'button',
      { type: 'button', class: 'btn primary', onclick: () => start() },
      '更新'
    );

    const overlay = h(
      'div',
      {
        class: 'modal-overlay',
        onmousedown: (event) => {
          if (event.target === overlay) closeModUpdateConfirm();
        }
      },
      h(
        'div',
        { class: 'modal mod-update-modal' },
        h('h2', { text: '更新 Mod' }),
        h(
          'div',
          { class: 'mod-update-head' },
          buildInstalledModIcon(mod, 'update-icon'),
          h(
            'div',
            { class: 'mod-update-heading' },
            h('strong', { class: 'mod-update-name', text: mod.name || mod.key }),
            h('span', {
              class: 'mod-update-author',
              text: `by ${mod.author || pkg.owner || '未知作者'}`
            })
          )
        ),
        h(
          'div',
          { class: 'mod-update-versions' },
          h(
            'div',
            { class: 'mod-update-version' },
            h('span', { class: 'mod-update-version-label', text: '当前版本' }),
            h('span', { class: 'mod-update-version-value', text: `v${mod.version || '?'}` })
          ),
          icon('chevronRight', 'icon-sm'),
          h(
            'div',
            { class: 'mod-update-version is-new' },
            h('span', { class: 'mod-update-version-label', text: '最新版本' }),
            h('span', { class: 'mod-update-version-value', text: `v${pkg.version}` })
          )
        ),
        h('p', {
          class: 'mod-update-note',
          text: '将下载并替换为 Thunderstore 上的最新版本，已禁用的 Mod 更新后仍保持禁用。'
        }),
        h(
          'div',
          { class: 'modal-actions' },
          h(
            'button',
            { type: 'button', class: 'btn', onclick: () => ignore() },
            '忽略此更新'
          ),
          h(
            'button',
            { type: 'button', class: 'btn', onclick: () => closeModUpdateConfirm() },
            '取消'
          ),
          startButton
        )
      )
    );

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeModUpdateConfirm();
    };

    async function start() {
      if (startButton.disabled) return;
      startButton.disabled = true;
      startButton.textContent = '处理中…';

      try {
        const task = await api.downloads.start({
          game,
          profileId,
          uuid: pkg.uuid,
          versionNumber: pkg.version,
          name: mod.name
        });
        if (!state.downloads.some((item) => item.id === task.id)) {
          state.downloads = [task, ...state.downloads];
        }
        onDownloadsUpdated();
        closeModUpdateConfirm();
        openDownloadUi(task.id);
      } catch (error) {
        startButton.disabled = false;
        startButton.textContent = '更新';
        toast(errorText(error), true);
      }
    }

    async function ignore() {
      const ok = await ignoreModUpdate(mod.key);
      if (!ok) return;
      closeModUpdateConfirm();
      toast(`已忽略 ${mod.name || mod.key} 的更新`);
      render();
    }

    modUpdateConfirm = { overlay, onKeyDown };
    els.modalRoot.append(overlay);
    document.addEventListener('keydown', onKeyDown);
  }

  function closeModUpdateConfirm() {
    if (!modUpdateConfirm) return;
    document.removeEventListener('keydown', modUpdateConfirm.onKeyDown);
    modUpdateConfirm.overlay.remove();
    modUpdateConfirm = null;
  }

  function buildGameSettingsPanel(game, profile, gamePath) {
    const launchArgs = String((state.settings.launchArgs || {})[game.identifier] || '');
    const modLaunchArgs = String((state.settings.modLaunchArgs || {})[game.identifier] || '');
    const ignoredCount = ignoredUpdatesFor(game.identifier, profile.id).length;

    return h(
      'section',
      { class: 'panel content-panel settings-panel' },
      h('div', { class: 'content-head' }, h('h2', { text: '设置' })),
      h(
        'div',
        { class: 'settings-list' },
        h(
          'div',
          { class: 'settings-row' },
          h(
            'div',
            { class: 'settings-info' },
            h('div', { class: 'settings-label', text: '游戏路径' }),
            h('input', {
              type: 'text',
              class: 'settings-path-input',
              value: gamePath || '',
              placeholder: '可直接填写游戏 exe 的完整路径',
              autocomplete: 'off',
              spellcheck: 'false',
              onkeydown: (event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  saveGamePath(game, event.currentTarget);
                } else if (event.key === 'Escape') {
                  event.currentTarget.value = gamePath || '';
                  event.currentTarget.blur();
                }
              },
              onblur: (event) => {
                const next = event.currentTarget.value.trim();
                if (next === String(gamePath || '')) return;
                saveGamePath(game, event.currentTarget);
              }
            })
          ),
          h(
            'div',
            { class: 'settings-actions' },
            h(
              'button',
              {
                type: 'button',
                class: 'btn small',
                onclick: (event) => autoDetectGamePath(game, event.currentTarget)
              },
              gamePath ? '重新检测' : '自动检测'
            ),
            h(
              'button',
              { type: 'button', class: 'btn small', onclick: () => chooseGamePath() },
              '浏览'
            )
          )
        ),
        h(
          'div',
          { class: 'settings-row' },
          h(
            'div',
            { class: 'settings-info' },
            h('div', { class: 'settings-label', text: '启动参数' }),
            h('div', {
              class: `settings-value${launchArgs ? '' : ' is-empty'}`,
              text: launchArgs || '未设置',
              title: launchArgs
            })
          ),
          h(
            'div',
            { class: 'settings-actions' },
            h(
              'button',
              { type: 'button', class: 'btn small', onclick: () => promptLaunchArgs(game) },
              launchArgs ? '修改启动参数' : '设置启动参数'
            )
          )
        ),
        h(
          'div',
          { class: 'settings-row' },
          h(
            'div',
            { class: 'settings-info' },
            h('div', { class: 'settings-label', text: 'Mod 启动参数命令' }),
            h('div', {
              class: `settings-value${modLaunchArgs ? '' : ' is-empty'}`,
              text:
                modLaunchArgs ||
                (profile.loader === 'melonloader' ? '无（MelonLoader）' : '默认（内置）'),
              title: modLaunchArgs
            })
          ),
          h(
            'div',
            { class: 'settings-actions' },
            h(
              'button',
              { type: 'button', class: 'btn small', onclick: () => promptModLaunchArgs(game) },
              modLaunchArgs ? '修改' : '设置'
            )
          )
        ),
        h(
          'div',
          { class: 'settings-row' },
          h(
            'div',
            { class: 'settings-info' },
            h('div', { class: 'settings-label', text: '已忽略的更新' }),
            h('div', {
              class: `settings-value${ignoredCount ? '' : ' is-empty'}`,
              text: ignoredCount ? `${ignoredCount} 个 Mod 的更新已忽略` : '未忽略任何更新'
            })
          ),
          h(
            'div',
            { class: 'settings-actions' },
            h(
              'button',
              {
                type: 'button',
                class: 'btn small',
                onclick: () => openIgnoredUpdates(profile)
              },
              '管理'
            )
          )
        ),
        h(
          'div',
          { class: 'settings-row' },
          h(
            'div',
            { class: 'settings-info' },
            h('div', { class: 'settings-label', text: '配置' }),
            h('div', {
              class: 'settings-value',
              text: '导出当前配置为 .r2z，或从本地压缩包导入 Mod'
            })
          ),
          h(
            'div',
            { class: 'settings-actions' },
            h(
              'button',
              { type: 'button', class: 'btn small', onclick: exportProfile },
              icon('package', 'icon-sm'),
              '导出配置'
            ),
            h(
              'button',
              { type: 'button', class: 'btn small', onclick: importLocalMod },
              icon('plus', 'icon-sm'),
              '导入本地 Mod'
            )
          )
        ),
        h(
          'div',
          { class: 'settings-row' },
          h(
            'div',
            { class: 'settings-info' },
            h('div', { class: 'settings-label', text: '配置目录' }),
            h('div', {
              class: 'settings-value settings-path',
              text: profile.dir,
              title: profile.dir
            })
          ),
          h(
            'div',
            { class: 'settings-actions' },
            h(
              'button',
              { type: 'button', class: 'btn small', onclick: () => revealProfile(profile) },
              icon('folder', 'icon-sm'),
              '打开'
            ),
            h(
              'button',
              { type: 'button', class: 'btn small', onclick: () => copyProfilePath(profile) },
              icon('copy', 'icon-sm'),
              '复制'
            )
          )
        ),
        h(
          'div',
          { class: 'settings-row' },
          h(
            'div',
            { class: 'settings-info' },
            h('div', { class: 'settings-label', text: '未跟踪文件' }),
            h('div', {
              class: 'settings-value',
              text: '扫描不属于任何已安装 Mod 的残留文件，可确认后清理'
            })
          ),
          h(
            'div',
            { class: 'settings-actions' },
            h(
              'button',
              { type: 'button', class: 'btn small', onclick: () => openUntrackedPanel(profile) },
              icon('trash', 'icon-sm'),
              '扫描清理'
            )
          )
        ),
        h(
          'div',
          { class: 'settings-row' },
          h(
            'div',
            { class: 'settings-info' },
            h('div', { class: 'settings-label', text: '文件冲突' }),
            h('div', {
              class: 'settings-value',
              text: '多个 Mod 声明同一路径时，可选择以谁为准'
            })
          ),
          h(
            'div',
            { class: 'settings-actions' },
            h(
              'button',
              { type: 'button', class: 'btn small', onclick: () => openConflictPanel(profile) },
              icon('alert', 'icon-sm'),
              '查看冲突'
            )
          )
        )
      )
    );
  }

  // 通用面板：标题 + 说明 + 内容 + 底部按钮
  function openPanelModal(title, subtitle, body, actions) {
    const overlay = h(
      'div',
      {
        class: 'modal-overlay',
        onmousedown: (event) => {
          if (event.target === overlay) close();
        }
      },
      h(
        'div',
        { class: 'modal update-modal' },
        h('h2', { text: title }),
        subtitle ? h('p', { class: 'update-hint', text: subtitle }) : null,
        body,
        h('div', { class: 'modal-actions' }, actions)
      )
    );

    const onKeyDown = (event) => {
      if (event.key === 'Escape') close();
    };

    function close() {
      document.removeEventListener('keydown', onKeyDown);
      overlay.remove();
    }

    document.addEventListener('keydown', onKeyDown);
    els.modalRoot.append(overlay);
    return { overlay, close };
  }

  async function openUntrackedPanel(profile) {
    const game = state.gameSlug;
    if (!game) return;

    let data = null;
    try {
      data = await api.profiles.scanUntracked(game, profile.id);
    } catch (error) {
      toast(errorText(error), true);
      return;
    }

    const rows = [];
    const list = h('div', { class: 'update-list' });

    for (const group of (data && data.groups) || []) {
      const box = h('input', { type: 'checkbox', 'aria-label': `清理 ${group.key}` });
      box.checked = group.suggested;
      box.addEventListener('change', () => syncSummary());
      rows.push({ group, box });

      list.append(
        h(
          'label',
          { class: 'update-row' },
          box,
          h(
            'div',
            { class: 'update-info' },
            h('span', { class: 'update-name', text: group.key }),
            h('span', {
              class: 'update-versions',
              text: `${group.files.length} 个文件 · ${formatBytes(group.size)}${
                group.kind === 'config' ? ' · 用户配置，确认后再勾选' : ''
              }`
            })
          )
        )
      );
    }

    if (rows.length === 0) {
      list.append(h('div', { class: 'content-empty' }, h('p', { text: '没有未跟踪文件' })));
    }

    const summary = h('span', { class: 'update-summary' });
    function syncSummary() {
      const total = rows
        .filter((row) => row.box.checked)
        .reduce((sum, row) => sum + row.group.files.length, 0);
      summary.textContent = `已选择 ${total} / ${(data && data.total) || 0} 个文件`;
    }

    let closePanel = () => {};

    async function run() {
      const paths = [];
      for (const row of rows) {
        if (!row.box.checked) continue;
        for (const file of row.group.files) paths.push(file.path);
      }
      if (paths.length === 0) {
        toast('请先选择要清理的文件', true);
        return;
      }

      cleanButton.disabled = true;
      cleanButton.textContent = '清理中…';

      try {
        const result = await api.profiles.cleanUntracked(game, profile.id, paths);
        closePanel();
        toast(
          `已清理 ${result.removed} 个文件${result.skipped ? `，跳过 ${result.skipped} 个` : ''}`
        );
        render();
      } catch (error) {
        cleanButton.disabled = false;
        cleanButton.textContent = '清理选中';
        toast(errorText(error), true);
      }
    }

    const cleanButton = h(
      'button',
      {
        type: 'button',
        class: 'btn primary',
        disabled: rows.length === 0,
        onclick: () => run()
      },
      '清理选中'
    );

    syncSummary();

    const panel = openPanelModal(
      '清理未跟踪文件',
      '这些文件不属于任何已安装 Mod（例如旧版本残留）。配置目录默认不勾选。',
      h('div', {}, h('div', { class: 'update-head' }, summary), list),
      [
        h('button', { type: 'button', class: 'btn', onclick: () => panel.close() }, '取消'),
        cleanButton
      ]
    );
    closePanel = panel.close;
  }

  async function openConflictPanel(profile) {
    const game = state.gameSlug;
    if (!game) return;

    let conflicts = [];
    try {
      conflicts = await api.profiles.conflicts(game, profile.id);
    } catch (error) {
      toast(errorText(error), true);
      return;
    }

    const list = h('div', { class: 'update-list' });

    if (!Array.isArray(conflicts) || conflicts.length === 0) {
      list.append(h('div', { class: 'content-empty' }, h('p', { text: '没有发现文件冲突' })));
    }

    for (const conflict of conflicts || []) {
      const actions = h(
        'div',
        { class: 'conflict-actions' },
        conflict.packages.map((pkg) =>
          h(
            'button',
            {
              type: 'button',
              class: 'btn small',
              title: pkg.hasBackup ? '使用该 Mod 的文件副本' : '需要重新安装该 Mod 才能切换',
              onclick: async () => {
                try {
                  const result = await api.profiles.setConflictWinner(
                    game,
                    profile.id,
                    conflict.path,
                    pkg.name
                  );
                  if (result.applied) toast(`已切换为 ${pkg.name}`);
                  else if (result.needsReinstall) {
                    toast(`需要重新安装 ${pkg.name} 才能切换这个文件`, true);
                  } else {
                    toast('没有可恢复的文件副本', true);
                  }
                } catch (error) {
                  toast(errorText(error), true);
                }
              }
            },
            pkg.name
          )
        )
      );

      list.append(
        h(
          'div',
          { class: 'update-row' },
          h(
            'div',
            { class: 'update-info' },
            h('span', { class: 'update-name', text: conflict.path }),
            h('span', {
              class: 'update-versions',
              text: conflict.packages
                .map((pkg) => `${pkg.name}${pkg.hasBackup ? '（有副本）' : ''}`)
                .join(' · ')
            })
          ),
          actions
        )
      );
    }

    const panel = openPanelModal(
      '文件冲突',
      '多个 Mod 声明了同一路径。选择「以某为准」会用安装时留下的副本覆盖当前文件。',
      list,
      [h('button', { type: 'button', class: 'btn', onclick: () => panel.close() }, '关闭')]
    );
  }

  function promptLaunchArgs(game) {
    const current = String((state.settings.launchArgs || {})[game.identifier] || '');
    const input = h('textarea', {
      class: 'launch-args-input',
      rows: '3',
      placeholder: '例如 -windowed -screen-width 1920 -screen-height 1080',
      spellcheck: 'false'
    });
    input.value = current;

    const overlay = h(
      'div',
      {
        class: 'modal-overlay',
        onmousedown: (event) => {
          if (event.target === overlay) close();
        }
      },
      h(
        'div',
        { class: 'modal launch-args-modal' },
        h('h2', { text: '启动参数' }),
        h('p', {
          class: 'launch-args-hint',
          text: '每次启动该游戏（以 Mod 启动或启动原版）都会附加这些参数，多个参数用空格分隔。'
        }),
        input,
        h(
          'div',
          { class: 'modal-actions' },
          h('button', { type: 'button', class: 'btn', onclick: () => close() }, '取消'),
          h('button', { type: 'button', class: 'btn primary', onclick: () => save() }, '保存')
        )
      )
    );

    const onKeyDown = (event) => {
      if (event.key === 'Escape') close();
    };

    function close() {
      document.removeEventListener('keydown', onKeyDown);
      overlay.remove();
    }

    async function save() {
      const value = input.value.trim();
      try {
        const settings = await api.settings.update({
          launchArgs: { [game.identifier]: value || null }
        });
        state.settings = settings;
        close();
        render();
        toast(value ? '启动参数已保存' : '已清除启动参数');
      } catch (error) {
        toast(errorText(error), true);
      }
    }

    els.modalRoot.append(overlay);
    document.addEventListener('keydown', onKeyDown);
    input.focus();
  }

  async function promptModLaunchArgs(game) {
    let defaultTemplate = '';
    let preloaderPath = '';
    let loaderId = 'bepinex';

    try {
      const [template, preloader, loader] = await Promise.all([
        api.game.modLaunchArgsDefault(game.identifier, state.profileId).catch(() => ''),
        state.profileId
          ? api.game.preloaderPath(game.identifier, state.profileId).catch(() => null)
          : Promise.resolve(null),
        state.profileId
          ? api.game.detectLoader(game.identifier, state.profileId).catch(() => 'bepinex')
          : Promise.resolve('bepinex')
      ]);
      defaultTemplate = String(template || '');
      preloaderPath = String(preloader || '');
      loaderId = String(loader || 'bepinex');
    } catch {
      // 读取默认命令失败时仍可查看/编辑已保存的值
    }

    const isMelonLoader = loaderId === 'melonloader';

    const current = String((state.settings.modLaunchArgs || {})[game.identifier] || '');
    const input = h('textarea', {
      class: 'launch-args-input',
      rows: '4',
      spellcheck: 'false'
    });
    input.value = current || defaultTemplate;

    const overlay = h(
      'div',
      {
        class: 'modal-overlay',
        onmousedown: (event) => {
          if (event.target === overlay) close();
        }
      },
      h(
        'div',
        { class: 'modal launch-args-modal' },
        h('h2', { text: 'Mod 启动参数命令' }),
        h('p', {
          class: 'launch-args-hint',
          text: isMelonLoader
            ? 'MelonLoader 由 version.dll 注入，启动时不需要额外参数，这里留空即可；如需自定义可直接填写。'
            : '以 Mod 方式启动时附加这些参数。{preloader} 是占位符，启动时会自动替换为当前配置的 BepInEx 预加载器 DLL 路径（如 …/BepInEx/core/BepInEx.Preloader.dll），不需要手动填写真实路径；保持默认即可正常加载 Mod。'
        }),
        input,
        isMelonLoader
          ? null
          : h(
              'div',
              { class: 'launch-args-preloader' },
              h('span', {
                class: 'launch-args-preloader-label',
                text: '当前配置的 BepInEx 预加载器'
              }),
              h('code', {
                class: `launch-args-preloader-path${preloaderPath ? '' : ' is-empty'}`,
                text: preloaderPath || '未找到（该配置可能还没安装 BepInExPack）'
              })
            ),
        h(
          'div',
          { class: 'modal-actions' },
          h(
            'div',
            { class: 'modal-actions-tools' },
            isMelonLoader
              ? null
              : h(
                  'button',
                  {
                    type: 'button',
                    class: 'btn small',
                    onclick: () => {
                      if (!defaultTemplate) return;
                      input.value = defaultTemplate;
                      input.focus();
                    }
                  },
                  '重置'
                ),
            h(
              'button',
              {
                type: 'button',
                class: 'btn small',
                onclick: async () => {
                  try {
                    await api.app.copyText(input.value);
                    toast('已复制到剪贴板');
                  } catch (error) {
                    toast(errorText(error), true);
                  }
                }
              },
              icon('copy', 'icon-sm'),
              '复制'
            )
          ),
          h('button', { type: 'button', class: 'btn', onclick: () => close() }, '取消'),
          h('button', { type: 'button', class: 'btn primary', onclick: () => save() }, '保存')
        )
      )
    );

    const onKeyDown = (event) => {
      if (event.key === 'Escape') close();
    };

    function close() {
      document.removeEventListener('keydown', onKeyDown);
      overlay.remove();
    }

    async function save() {
      const value = input.value.trim();
      const isDefault = !value || value === defaultTemplate.trim();

      try {
        const settings = await api.settings.update({
          modLaunchArgs: { [game.identifier]: isDefault ? null : value }
        });
        state.settings = settings;
        close();
        render();
        toast(isDefault ? '已恢复默认 Mod 启动参数' : 'Mod 启动参数已保存');
      } catch (error) {
        toast(errorText(error), true);
      }
    }

    els.modalRoot.append(overlay);
    document.addEventListener('keydown', onKeyDown);
    input.focus();
  }

  function openIgnoredUpdates(profile) {
    const game = state.gameSlug;
    if (!game) return;

    let query = '';
    const selected = new Set();
    let visibleKeys = [];
    const boxes = new Map();

    const body = h('div', { class: 'ignored-list' });

    const searchInput = h('input', {
      type: 'text',
      class: 'browser-input',
      placeholder: '搜索已忽略的模组…',
      autocomplete: 'off',
      spellcheck: 'false',
      oninput: (event) => {
        query = event.target.value;
        rebuild();
      },
      onkeydown: (event) => {
        if (event.key !== 'Escape') return;
        event.stopPropagation();
        event.target.value = '';
        query = '';
        rebuild();
      }
    });

    const countLabel = h('span', { class: 'update-summary' });
    const restoreButton = h(
      'button',
      {
        type: 'button',
        class: 'btn primary',
        disabled: true,
        onclick: () => restoreSelected()
      },
      '恢复选中'
    );
    const master = h('input', { type: 'checkbox', 'aria-label': '全选已忽略的模组' });

    const syncSummary = () => {
      const count = visibleKeys.filter((key) => selected.has(key)).length;
      countLabel.textContent = `已选择 ${count} / ${visibleKeys.length} 个`;
      master.disabled = visibleKeys.length === 0;
      master.checked = visibleKeys.length > 0 && count === visibleKeys.length;
      master.indeterminate = count > 0 && count < visibleKeys.length;
      restoreButton.disabled = selected.size === 0;
      restoreButton.textContent = selected.size > 0 ? `恢复选中（${selected.size}）` : '恢复选中';
    };

    master.addEventListener('change', () => {
      for (const key of visibleKeys) {
        if (master.checked) selected.add(key);
        else selected.delete(key);
        const box = boxes.get(key);
        if (box) box.checked = master.checked;
      }
      syncSummary();
    });

    async function restoreSelected() {
      if (selected.size === 0) return;

      const current = ignoredUpdatesFor(game, profile.id);
      const remaining = current.filter((key) => !selected.has(key));
      const removed = current.length - remaining.length;
      if (removed === 0) return;

      const ok = await updateIgnoredUpdates(game, profile.id, remaining);
      if (!ok) return;

      selected.clear();
      rebuild();
      render();
      toast(`已恢复 ${removed} 个 Mod 的更新检查`);
    }

    const rebuild = () => {
      const list = ignoredUpdatesFor(game, profile.id);
      const byKey = new Map(
        profile.mods.map((mod) => [String(mod.key || '').toLowerCase(), mod])
      );
      const keyword = query.trim().toLowerCase();
      const deprecatedFlags = [];

      boxes.clear();
      body.replaceChildren();

      if (list.length === 0) {
        visibleKeys = [];
        body.append(
          h('div', {
            class: 'ignored-empty',
            text: '没有忽略任何更新。在模组列表的更新提示里点「忽略」会出现在这里。'
          })
        );
        syncSummary();
        return;
      }

      visibleKeys = list.filter((key) => {
        if (!keyword) return true;
        const mod = byKey.get(String(key).toLowerCase());
        const name = mod ? mod.name : key;
        return `${name} ${key}`.toLowerCase().includes(keyword);
      });

      if (visibleKeys.length === 0) {
        body.append(h('div', { class: 'ignored-empty', text: '没有找到匹配的模组。' }));
        syncSummary();
        return;
      }

      for (const key of visibleKeys) {
        const mod = byKey.get(String(key).toLowerCase());
        const name = mod ? mod.name : key;
        const displayMod = mod || { key, name, icon: null };
        const deprecatedFlag = h('span', { class: 'mod-flag is-hidden', text: '已弃用' });
        deprecatedFlags.push({ key, flag: deprecatedFlag });

        const box = h('input', { type: 'checkbox', 'aria-label': `恢复 ${name}` });
        box.checked = selected.has(key);
        box.addEventListener('change', () => {
          if (box.checked) selected.add(key);
          else selected.delete(key);
          syncSummary();
        });
        boxes.set(key, box);

        body.append(
          h(
            'div',
            { class: 'ignored-row' },
            box,
            buildInstalledModIcon(displayMod, 'ignored-icon'),
            h(
              'div',
              { class: 'ignored-info' },
              h(
                'div',
                { class: 'ignored-name-line' },
                h('span', { class: 'ignored-name', text: name }),
                deprecatedFlag
              ),
              h('span', { class: 'ignored-key', text: key })
            )
          )
        );
      }

      remotePackagesForGame().then((map) => {
        for (const item of deprecatedFlags) {
          if (!item.flag.isConnected) continue;
          const pkg = map.get(String(item.key).toLowerCase());
          if (pkg && pkg.deprecated) item.flag.classList.remove('is-hidden');
        }
      });

      syncSummary();
    };

    const overlay = h(
      'div',
      {
        class: 'modal-overlay',
        onmousedown: (event) => {
          if (event.target === overlay) close();
        }
      },
      h(
        'div',
        { class: 'modal ignored-updates-modal' },
        h('h2', { text: '已忽略的更新' }),
        h('p', {
          class: 'ignored-hint',
          text: '这些 Mod 不会出现在更新提示里，勾选后点「恢复选中」重新参与更新检查。'
        }),
        h('div', { class: 'browser-search ignored-search' }, icon('search', 'icon-sm'), searchInput),
        h(
          'div',
          { class: 'update-head' },
          h('label', { class: 'update-master' }, master, h('span', { text: '全选' })),
          countLabel
        ),
        body,
        h(
          'div',
          { class: 'modal-actions' },
          restoreButton,
          h('button', { type: 'button', class: 'btn', onclick: () => close() }, '关闭')
        )
      )
    );

    const onKeyDown = (event) => {
      if (event.key === 'Escape') close();
    };

    function close() {
      document.removeEventListener('keydown', onKeyDown);
      overlay.remove();
    }

    els.modalRoot.append(overlay);
    document.addEventListener('keydown', onKeyDown);
    rebuild();
  }

  async function exportProfile() {
    if (!state.gameSlug || !state.profileId) return;

    try {
      const result = await api.profiles.exportProfile(state.gameSlug, state.profileId);
      if (result && result.path) toast('配置已导出');
    } catch (error) {
      toast(errorText(error), true);
    }
  }

  async function importLocalMod() {
    if (!state.gameSlug || !state.profileId) return;

    try {
      const picked = await api.profiles.chooseModArchive();
      if (!picked) return;

      const metadata = await promptLocalModMetadata(picked);
      if (!metadata) return;

      const task = await api.profiles.importLocalMod(
        state.gameSlug,
        state.profileId,
        picked.path,
        metadata
      );

      if (!state.downloads.some((item) => item.id === task.id)) {
        state.downloads = [task, ...state.downloads];
      }
      onDownloadsUpdated();
      openDownloadUi(task.id);
    } catch (error) {
      toast(errorText(error), true);
    }
  }

  function promptLocalModMetadata(suggested) {
    return new Promise((resolve) => {
      let settled = false;
      const hint = suggested || {};
      const nameInput = h('input', {
        type: 'text',
        value: hint.name || '',
        placeholder: '例如 MyLocalMod',
        autocomplete: 'off',
        spellcheck: 'false'
      });
      const authorInput = h('input', {
        type: 'text',
        value: hint.author || '',
        placeholder: '例如 LocalAuthor',
        autocomplete: 'off',
        spellcheck: 'false'
      });
      const versionInput = h('input', {
        type: 'text',
        value: hint.version || '1.0.0',
        autocomplete: 'off',
        spellcheck: 'false'
      });

      const finish = (value) => {
        if (settled) return;
        settled = true;
        document.removeEventListener('keydown', onKeyDown);
        overlay.remove();
        resolve(value);
      };

      const form = h(
        'form',
        {
          class: 'modal local-mod-modal',
          onsubmit: (event) => {
            event.preventDefault();
            const name = nameInput.value.trim();
            const author = authorInput.value.trim();
            const version = versionInput.value.trim();

            if (!name) {
              nameInput.focus();
              return;
            }
            if (!author) {
              authorInput.focus();
              return;
            }
            if (!/^\d+(\.\d+){0,3}([+-][0-9A-Za-z.-]+)?$/.test(version)) {
              toast('版本号格式无效，例如 1.0.0', true);
              versionInput.focus();
              return;
            }

            finish({ name, author, version });
          }
        },
        h('h2', { text: '导入本地 Mod' }),
        h('p', { text: '填写 Mod 信息，压缩包会解压到当前配置目录。' }),
        h('div', { class: 'field' }, h('label', { text: 'Mod 名称' }), nameInput),
        h('div', { class: 'field' }, h('label', { text: '作者名称' }), authorInput),
        h('div', { class: 'field' }, h('label', { text: '版本号' }), versionInput),
        h(
          'div',
          { class: 'modal-actions' },
          h('button', { type: 'button', class: 'btn', onclick: () => finish(null) }, '取消'),
          h('button', { type: 'submit', class: 'btn primary' }, '导入')
        )
      );

      // 不响应点击遮罩关闭：填写 Mod 信息时误点窗口外会丢掉已输入的内容
      const overlay = h('div', { class: 'modal-overlay' }, form);

      const onKeyDown = (event) => {
        if (event.key === 'Escape') finish(null);
      };

      els.modalRoot.append(overlay);
      document.addEventListener('keydown', onKeyDown);
      setTimeout(() => nameInput.focus(), 30);
    });
  }

  /* ---------- Config files ---------- */

  function buildConfigPanel() {
    if (configEditor) {
      if (
        configEditor.game === state.gameSlug &&
        configEditor.profileId === state.profileId
      ) {
        return buildConfigEditorPanel();
      }
      configEditor = null;
    }

    const configs = state.configs;
    // 计数元素要能被搜索就地更新，先保留引用
    const countEl = h('span', {
      class: 'content-count',
      text: configs.loading && !configs.loaded ? '加载中' : `${configs.files.length} 个`
    });

    const head = h(
      'div',
      { class: 'content-head' },
      h('h2', { text: '配置文件' }),
      countEl,
      h('span', { class: 'spacer' }),
      h(
        'button',
        {
          type: 'button',
          class: 'btn small icon-only',
          title: '刷新',
          onclick: () => {
            prepareConfigs(true);
            render();
          }
        },
        icon('refresh', 'icon-sm')
      )
    );

    const panel = h('section', { class: 'panel content-panel config-panel' }, head);

    if (configs.loading && !configs.loaded) {
      panel.append(
        h(
          'div',
          { class: 'browser-state' },
          h('span', { class: 'loading-ring' }),
          h('p', { text: '正在读取配置文件…' })
        )
      );
      return panel;
    }

    if (configs.error) {
      panel.append(
        h(
          'div',
          { class: 'browser-state' },
          h('p', { text: '配置文件读取失败' }),
          h('span', { text: configs.error }),
          h(
            'button',
            {
              type: 'button',
              class: 'btn small',
              onclick: () => {
                prepareConfigs(true);
                render();
              }
            },
            '重试'
          )
        )
      );
      return panel;
    }

    if (configs.files.length === 0) {
      panel.append(
        h(
          'div',
          { class: 'content-empty' },
          h('p', { text: '还没有 .cfg 配置文件' }),
          h('span', { text: '安装带配置文件的 Mod 后会显示在这里。' })
        )
      );
      return panel;
    }

    const searchInput = h('input', {
      type: 'text',
      class: 'browser-input',
      placeholder: '搜索配置文件…',
      autocomplete: 'off',
      spellcheck: 'false',
      value: configsView.query,
      oninput: (event) => {
        configsView.query = event.target.value;
        applyConfigsFilter(countEl, list);
      },
      onkeydown: (event) => {
        if (event.key === 'Escape') {
          event.target.value = '';
          configsView.query = '';
          applyConfigsFilter(countEl, list);
        }
      }
    });

    panel.append(
      h(
        'div',
        { class: 'browser-search-row' },
        h('div', { class: 'browser-search' }, icon('search', 'icon-sm'), searchInput)
      )
    );

    const list = h('div', { class: 'config-list' });
    for (const file of configs.files) {
      list.append(
        h(
          'div',
          {
            class: 'config-row',
            // 文件名和相对路径都参与搜索，方便按目录定位
            dataset: { search: `${file.name} ${file.path}`.toLowerCase() }
          },
          h(
            'div',
            { class: 'config-row-info' },
            h('div', { class: 'config-row-name', text: file.name }),
            h('div', { class: 'config-row-path', text: file.path }),
            h('div', {
              class: 'config-row-meta',
              text: `${formatBytes(file.size)} · ${formatDateTime(file.modifiedAt)}`
            })
          ),
          h(
            'div',
            { class: 'config-row-actions' },
            h(
              'button',
              { type: 'button', class: 'btn small', onclick: () => openConfigEditor(file) },
              icon('config', 'icon-sm'),
              '编辑'
            ),
            h(
              'button',
              {
                type: 'button',
                class: 'btn small',
                onclick: () => openConfigExternal(file)
              },
              icon('folder', 'icon-sm'),
              '打开'
            )
          )
        )
      );
    }
    panel.append(list);
    panel.append(
      h('div', {
        class: 'mods-no-results is-hidden',
        id: 'configs-no-results',
        text: '没有找到匹配的配置文件。'
      })
    );
    // 切回来时沿用上次的搜索词，直接显示过滤后的结果
    applyConfigsFilter(countEl, list);
    return panel;
  }

  function applyConfigsFilter(countEl, list) {
    const query = configsView.query.trim().toLowerCase();
    let visible = 0;

    for (const row of list.querySelectorAll('.config-row')) {
      const match = !query || String(row.dataset.search || '').includes(query);
      row.classList.toggle('is-hidden', !match);
      if (match) visible += 1;
    }

    const empty = document.getElementById('configs-no-results');
    if (empty) empty.classList.toggle('is-hidden', !query || visible > 0);

    if (countEl) {
      countEl.textContent = query
        ? `${visible} 个`
        : `${(state.configs.files || []).length} 个`;
    }
  }

  async function openConfigExternal(file) {
    try {
      await api.configs.open(state.gameSlug, state.profileId, file.path);
    } catch (error) {
      toast(errorText(error), true);
    }
  }

  async function openConfigEditor(file) {
    const game = state.gameSlug;
    const profileId = state.profileId;
    if (!game || !profileId) return;

    configEditor = {
      game,
      profileId,
      name: file.name,
      path: file.path,
      items: [],
      loading: true,
      error: null,
      saving: false
    };
    const tab = currentTab();
    if (tab) tab.editor = configEditor;
    render();

    try {
      const data = await api.configs.read(game, profileId, file.path);
      if (
        !configEditor ||
        configEditor.game !== game ||
        configEditor.profileId !== profileId ||
        configEditor.path !== file.path
      ) {
        return;
      }
      configEditor.items = parseConfigItems(data.content);
      configEditor.loading = false;
    } catch (error) {
      if (!configEditor) return;
      configEditor.loading = false;
      configEditor.error = errorText(error);
    }

    render();
  }

  function closeConfigEditor() {
    if (!configEditor) return;
    const tab = currentTab();
    if (tab) tab.editor = null;
    configEditor = null;
    render();
  }

  async function saveConfigEditor() {
    if (!configEditor || configEditor.loading || configEditor.error || configEditor.saving) {
      return;
    }

    const editor = configEditor;
    editor.saving = true;
    render();

    try {
      const content = serializeConfigItems(editor.items);
      await api.configs.write(editor.game, editor.profileId, editor.path, content);
      const tab = currentTab();
      if (tab) tab.editor = null;
      configEditor = null;
      toast('配置已保存');
      prepareConfigs(true);
      render();
    } catch (error) {
      editor.saving = false;
      toast(errorText(error), true);
      render();
    }
  }

  function buildConfigEditorPanel() {
    const editor = configEditor;
    const head = h(
      'div',
      { class: 'config-editor-head' },
      h('h2', { text: editor.name }),
      h('p', { text: editor.path })
    );

    const body = h('div', { class: 'config-editor-body' });

    if (editor.loading) {
      body.append(
        h(
          'div',
          { class: 'browser-state' },
          h('span', { class: 'loading-ring' }),
          h('p', { text: '正在读取配置文件…' })
        )
      );
    } else if (editor.error) {
      body.append(
        h(
          'div',
          { class: 'browser-state' },
          h('p', { text: '配置文件读取失败' }),
          h('span', { text: editor.error })
        )
      );
    } else {
      const groups = groupConfigItems(editor.items);
      let entryCount = 0;

      for (const group of groups) {
        if (group.name) {
          body.append(h('h3', { class: 'config-section-title', text: group.name }));
        }
        for (const entry of group.entries) {
          entryCount += 1;
          body.append(
            h(
              'div',
              { class: 'config-entry' },
              h(
                'div',
                { class: 'config-entry-info' },
                h('div', { class: 'config-key', text: entry.item.key }),
                entry.comments ? h('div', { class: 'config-help', text: entry.comments }) : null
              ),
              h('div', { class: 'config-entry-control' }, buildConfigControl(entry.item))
            )
          );
        }
      }

      if (entryCount === 0) {
        body.append(
          h(
            'div',
            { class: 'content-empty' },
            h('p', { text: '没有可编辑的配置项' }),
            h('span', { text: '该文件只包含注释或无法识别的行。' })
          )
        );
      }
    }

    const footer = h(
      'div',
      { class: 'config-editor-footer' },
      h(
        'button',
        { type: 'button', class: 'btn', onclick: () => closeConfigEditor() },
        '取消'
      ),
      h(
        'button',
        {
          type: 'button',
          class: 'btn primary',
          disabled: Boolean(editor.loading || editor.error || editor.saving),
          onclick: () => saveConfigEditor()
        },
        editor.saving ? '保存中…' : '保存'
      )
    );

    return h('section', { class: 'panel content-panel config-editor-panel' }, head, body, footer);
  }

  function parseConfigItems(content) {
    const lines = String(content).split(/\r?\n/);
    const items = [];
    let section = '';

    for (const line of lines) {
      const sectionMatch = line.match(/^\s*\[(.+?)\]\s*$/);
      if (sectionMatch) {
        section = sectionMatch[1];
        items.push({ type: 'section', name: section, raw: line });
        continue;
      }

      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) {
        items.push({ type: 'raw', text: line });
        continue;
      }

      const equalsIndex = line.indexOf('=');
      if (equalsIndex > 0) {
        const key = line.slice(0, equalsIndex).trim();
        if (key) {
          items.push({
            type: 'entry',
            section,
            key,
            value: line.slice(equalsIndex + 1).trim(),
            raw: line
          });
          continue;
        }
      }

      items.push({ type: 'raw', text: line });
    }

    return items;
  }

  function groupConfigItems(items) {
    const groups = [];
    let current = { name: '', entries: [] };
    let pendingComments = [];
    groups.push(current);

    for (const item of items) {
      if (item.type === 'section') {
        if (current.entries.length > 0 || current.name) {
          current = { name: item.name, entries: [] };
          groups.push(current);
        } else {
          current.name = item.name;
        }
        pendingComments = [];
        continue;
      }

      if (item.type === 'entry') {
        current.entries.push({
          item,
          comments: pendingComments.join('\n')
        });
        pendingComments = [];
        continue;
      }

      const trimmed = item.text.trim();
      if (trimmed.startsWith('#') || trimmed.startsWith(';')) {
        pendingComments.push(trimmed.replace(/^[#;]+\s?/, ''));
      }
    }

    return groups.filter((group) => group.name || group.entries.length > 0);
  }

  function configValueKind(value) {
    const text = String(value || '').trim();
    if (/^(true|false)$/i.test(text)) return 'boolean';
    if (/^-?\d+$/.test(text) || /^-?\d*\.\d+$/.test(text)) return 'number';
    if (/^#[0-9a-f]{6}$/i.test(text)) return 'color';
    return 'text';
  }

  function buildConfigControl(item) {
    const kind = configValueKind(item.value);

    if (kind === 'boolean') {
      const input = h('input', { type: 'checkbox', 'aria-label': item.key });
      input.checked = /^true$/i.test(item.value.trim());
      input.addEventListener('change', () => {
        item.value = input.checked ? 'true' : 'false';
      });
      return h('label', { class: 'switch' }, input, h('span', { class: 'switch-track' }));
    }

    if (kind === 'number') {
      const input = h('input', { type: 'number', step: 'any', value: item.value.trim() });
      input.addEventListener('input', () => {
        item.value = input.value;
      });
      return input;
    }

    if (kind === 'color') {
      const colorInput = h('input', { type: 'color', value: item.value.trim() });
      const textInput = h('input', { type: 'text', value: item.value.trim() });

      colorInput.addEventListener('input', () => {
        textInput.value = colorInput.value;
        item.value = colorInput.value;
      });
      textInput.addEventListener('input', () => {
        item.value = textInput.value;
        if (/^#[0-9a-f]{6}$/i.test(textInput.value.trim())) {
          colorInput.value = textInput.value.trim();
        }
      });

      return h('div', { class: 'config-color-control' }, colorInput, textInput);
    }

    const input = h('input', { type: 'text', value: item.value });
    input.addEventListener('input', () => {
      item.value = input.value;
    });
    return input;
  }

  function serializeConfigItems(items) {
    return items
      .map((item) => {
        if (item.type === 'entry') return `${item.key} = ${item.value}`;
        if (item.type === 'section') return item.raw;
        return item.text;
      })
      .join('\n');
  }

  function buildDownloadsPanel() {
    const tasks = downloadsForCurrentProfile();
    const count = h('span', {
      class: 'content-count',
      text: `${tasks.length} 个`
    });
    const list = h('div', { class: 'download-list' });
    downloadsView = { list, count };
    renderDownloadsList(list);

    return h(
      'section',
      { class: 'panel content-panel downloads-panel' },
      h('div', { class: 'content-head' }, h('h2', { text: '下载' }), count),
      list
    );
  }

  // 结构签名：标题/版本/状态/错误/子项状态变化时才需要重建卡片，
  // 高频的进度刷新必须走原地更新，避免销毁重建导致进度条动画重置。
  function downloadStructureKey(task) {
    const steps = task.steps
      .map((step) => `${step.status}:${step.error ? 1 : 0}`)
      .join(',');
    return [task.title, task.version, task.status, task.error ? 1 : 0, steps].join('|');
  }

  function downloadStatusText(task) {
    if (task.status === 'downloading') {
      return task.currentLabel ? `正在处理 ${task.currentLabel}` : '准备中…';
    }
    return downloadStatusLabel(task.status);
  }

  function renderDownloadsList(list) {
    const scrollTop = list.scrollTop;
    const tasks = downloadsForCurrentProfile();
    const cards = new Map();
    for (const card of list.querySelectorAll('.download-card')) {
      cards.set(card.dataset.taskId, card);
    }

    if (tasks.length === 0) {
      list.replaceChildren(
        h(
          'div',
          { class: 'content-empty' },
          h('p', { text: '没有正在下载的内容。' }),
          h('span', { text: '从「下载模组」选择一个 Mod 开始安装。' })
        )
      );
      return;
    }

    const empty = list.querySelector('.content-empty');
    if (empty) empty.remove();

    const currentIds = new Set(tasks.map((task) => task.id));

    // 1. 移除已经不在队列里的卡片
    for (const [id, card] of cards) {
      if (!currentIds.has(id)) card.remove();
    }

    // 2. 局部更新或追加新卡片
    for (const task of tasks) {
      const card = cards.get(task.id);
      if (!card) list.append(buildDownloadCard(task));
      else updateDownloadCard(card, task);
    }

    if (scrollTop > 0) list.scrollTop = scrollTop;
  }

  function updateDownloadCard(card, task) {
    // 结构变了（状态切换、出错、子项增减）才重建，否则原地更新保住 transition
    if (card.dataset.structure !== downloadStructureKey(task)) {
      const next = buildDownloadCard(task);
      card.replaceWith(next);
      return next;
    }

    const percent = Math.round((task.progress || 0) * 100);
    const fill = card.querySelector('.progress-track > .progress-fill');
    if (fill) fill.style.width = `${percent}%`;

    const percentText = card.querySelector('.download-percent');
    if (percentText) percentText.textContent = `${percent}%`;

    const statusLine = card.querySelector('.download-status-line');
    if (statusLine) statusLine.textContent = downloadStatusText(task);

    const stepEls = card.querySelectorAll('.download-step');
    task.steps.forEach((step, index) => {
      const stepEl = stepEls[index];
      if (!stepEl) return;
      const operation =
        typeof step.operationProgress === 'number' ? step.operationProgress : step.progress;
      const stepFill = stepEl.querySelector('.progress-fill');
      if (stepFill) stepFill.style.width = `${Math.round((operation || 0) * 100)}%`;
    });

    return card;
  }

  function buildDownloadCard(task, options) {
    // 大进度条：整个任务（含所有子 Mod）的总进度
    const percent = Math.round((task.progress || 0) * 100);
    const fill = h('div', { class: 'progress-fill' });
    fill.style.width = `${percent}%`;
    const showActions = !options || options.showActions !== false;

    return h(
      'div',
      {
        class: `download-card download-${task.status}`,
        dataset: { taskId: task.id, structure: downloadStructureKey(task) }
      },
      h(
        'div',
        { class: 'download-card-head' },
        h(
          'div',
          { class: 'download-card-title' },
          h('strong', { text: task.title }),
          task.version ? h('span', { class: 'download-version', text: `v${task.version}` }) : null
        ),
        h('span', { class: 'download-percent', text: `${percent}%`, title: '总进度' })
      ),
      h('div', { class: 'download-status-line', text: downloadStatusText(task) }),
      h('div', { class: 'progress-track', title: '总进度' }, fill),
      buildDownloadSteps(task),
      task.error ? h('div', { class: 'download-error', text: task.error }) : null,
      task.status === 'error' && showActions
        ? h(
            'div',
            { class: 'download-actions' },
            buildDownloadRetryButton(task),
            h(
              'button',
              {
                type: 'button',
                class: 'btn small icon-only',
                title: '移除下载任务',
                'aria-label': '移除下载任务',
                onclick: () => dismissDownload(task.id)
              },
              icon('close', 'icon-sm')
            )
          )
        : null
    );
  }

  // 失败任务的重试（重新跑整个任务，已装好的部分会自动跳过）
  function buildDownloadRetryButton(task) {
    const button = h('button', { type: 'button', class: 'btn small primary' }, '重试');
    button.addEventListener('click', async (event) => {
      event.stopPropagation();
      button.disabled = true;
      button.textContent = '重试中…';
      try {
        await api.downloads.retry(task.id);
      } catch (error) {
        button.disabled = false;
        button.textContent = '重试';
        toast(errorText(error), true);
      }
    });
    return button;
  }

  // 单个子 Mod 失败时只重试这一项，不提供取消（由整个任务统一移除）
  function buildStepRetryButton(task, step) {
    const button = h('button', { type: 'button', class: 'btn small' }, '重试');
    button.addEventListener('click', async (event) => {
      event.stopPropagation();
      button.disabled = true;
      button.textContent = '重试中…';
      try {
        await api.downloads.retry(task.id, step.key);
      } catch (error) {
        button.disabled = false;
        button.textContent = '重试';
        toast(errorText(error), true);
      }
    });
    return button;
  }

  function buildDownloadSteps(task) {
    if (!task.steps.length) return null;

    const wrap = h('div', { class: 'download-steps' });
    for (const step of task.steps) {
      // 小进度条：当前这个子项本次操作的进度（下载/解压），不是任务总进度
      const operation = typeof step.operationProgress === 'number' ? step.operationProgress : step.progress;
      const percent = Math.round((operation || 0) * 100);
      const fill = h('div', { class: 'progress-fill' });
      fill.style.width = `${percent}%`;

      wrap.append(
        h(
          'div',
          { class: `download-step${step.status === 'error' ? ' has-error' : ''}` },
          h(
            'div',
            { class: 'download-step-head' },
            h('span', { class: 'download-step-name', text: step.name }),
            h('span', {
              class: 'download-step-version',
              text: step.version ? `v${step.version}` : ''
            }),
            h('span', { class: 'download-step-status', text: stepStatusLabel(step.status) })
          ),
          step.status === 'downloading' || step.status === 'extracting'
            ? h('div', { class: 'progress-track tiny', title: '当前操作进度' }, fill)
            : null,
          step.error ? h('div', { class: 'download-step-error', text: step.error }) : null,
          step.status === 'error' && task.kind !== 'local'
            ? h('div', { class: 'download-step-actions' }, buildStepRetryButton(task, step))
            : null
        )
      );
    }
    return wrap;
  }

  function downloadStatusLabel(status) {
    if (status === 'queued') return '等待中';
    if (status === 'downloading') return '下载并安装中';
    if (status === 'extracting') return '正在解压';
    if (status === 'done') return '已完成';
    if (status === 'error') return '安装失败';
    return status;
  }

  function stepStatusLabel(status) {
    if (status === 'pending') return '等待';
    if (status === 'downloading') return '下载中';
    if (status === 'extracting') return '解压中';
    if (status === 'done') return '完成';
    if (status === 'skipped') return '已安装';
    if (status === 'error') return '失败';
    return status;
  }

  async function dismissDownload(id) {
    try {
      await api.downloads.dismiss(id);
    } catch (error) {
      toast(errorText(error), true);
    }
  }

  function buildDownloadPanel(game) {
    const browser = state.browser;
    const count = h('span', { class: 'content-count' });
    const list = h('div', { class: 'browser-list' });
    const pager = h('div', { class: 'pager' });
    const searchInput = h('input', {
      type: 'text',
      class: 'browser-input',
      placeholder: '搜索 Mod 或作者…',
      autocomplete: 'off',
      spellcheck: 'false'
    });
    const refreshButton = h(
      'button',
      {
        type: 'button',
        class: `btn small icon-only${browser.refreshing ? ' is-busy' : ''}`,
        title: '刷新列表',
        disabled: browser.loading || browser.refreshing,
        onclick: () => {
          prepareBrowser(true);
          render();
        }
      },
      icon('refresh', 'icon-sm')
    );

    const sortSelect = h(
      'select',
      {
        class: 'browser-sort',
        'aria-label': '排序方式'
      },
      h('option', { value: 'default', text: '默认排序' }),
      h('option', { value: 'downloads', text: '下载量最高' }),
      h('option', { value: 'updated', text: '最近更新' }),
      h('option', { value: 'name', text: '按名称排序' })
    );
    sortSelect.value = browser.sort || 'default';

    const deprecatedChip = h(
      'button',
      {
        type: 'button',
        class: `chip${browser.hideDeprecated ? ' is-active' : ''}`,
        title: '过滤掉 Thunderstore 上已弃用的 Mod'
      },
      icon('alert', 'icon-sm'),
      '隐藏已弃用'
    );

    const filters = h(
      'div',
      { class: 'browser-filters' },
      deprecatedChip,
      h('span', { class: 'spacer' }),
      sortSelect
    );

    const searchRow = h(
      'div',
      { class: 'browser-search-row' },
      h('div', { class: 'browser-search' }, icon('search'), searchInput)
    );

    const panel = h(
      'section',
      { class: 'panel content-panel browser-panel' },
      h(
        'div',
        { class: 'browser-head' },
        h('div', { class: 'content-head' }, h('h2', { text: '下载模组' }), count),
        h('div', { class: 'browser-tools' }, refreshButton)
      ),
      filters,
      searchRow,
      list,
      pager
    );

    if (browser.slug !== game.identifier || browser.loading) {
      count.textContent = '加载中';
      searchInput.disabled = true;
      refreshButton.disabled = true;
      list.append(
        h(
          'div',
          { class: 'browser-state' },
          h('span', { class: 'loading-ring' }),
          h('p', { text: '正在获取 Mod 列表…' }),
          h('span', { text: '首次加载需要几秒，之后会使用本地缓存。' })
        )
      );
      pager.append(h('span', { class: 'pager-info', text: '正在获取列表' }));
      return panel;
    }

    if (browser.error && browser.packages.length === 0) {
      count.textContent = '—';
      searchInput.disabled = true;
      list.append(
        h(
          'div',
          { class: 'browser-state' },
          h('p', { text: 'Mod 列表加载失败' }),
          h('span', { text: browser.error }),
          h(
            'button',
            {
              type: 'button',
              class: 'btn small',
              onclick: () => {
                prepareBrowser(true);
                render();
              }
            },
            '重试'
          )
        )
      );
      return panel;
    }

    searchInput.value = browser.query;
    searchInput.addEventListener('input', () => {
      state.browser.query = searchInput.value;
      clearTimeout(browserSearchTimer);

      // 防抖：停止输入一会儿后再全量过滤，避免每敲一个字都遍历整份列表
      browserSearchTimer = setTimeout(() => {
        if (!list.isConnected) return;
        state.browser.page = 1;
        list.scrollTop = 0;
        updateBrowserResults(state.browser, count, list, pager);
      }, 220);
    });

    deprecatedChip.addEventListener('click', () => {
      state.browser.hideDeprecated = !state.browser.hideDeprecated;
      deprecatedChip.classList.toggle('is-active', state.browser.hideDeprecated);
      state.browser.page = 1;
      list.scrollTop = 0;
      updateBrowserResults(state.browser, count, list, pager);
    });

    sortSelect.addEventListener('change', () => {
      state.browser.sort = sortSelect.value;
      state.browser.page = 1;
      list.scrollTop = 0;
      updateBrowserResults(state.browser, count, list, pager);
    });

    browserView = {
      slug: game.identifier,
      list,
      pager,
      count,
      searchInput,
      refreshButton
    };

    updateBrowserResults(browser, count, list, pager);
    return panel;
  }

  function sortBrowserPackages(packages, sort) {
    if (!sort || sort === 'default') return packages;

    const list = [...packages];
    if (sort === 'downloads') {
      list.sort((a, b) => (Number(b.downloads) || 0) - (Number(a.downloads) || 0));
    } else if (sort === 'updated') {
      list.sort(
        (a, b) => new Date(b.updated || 0).getTime() - new Date(a.updated || 0).getTime()
      );
    } else if (sort === 'name') {
      list.sort((a, b) => collator.compare(a.name, b.name));
    }
    return list;
  }

  function updateBrowserResults(browser, count, list, pager) {
    // 和 r2modman 一致：按空格/下划线拆分关键词，包名去掉空格和下划线后再做包含匹配
    const keys = browser.query
      .trim()
      .toLowerCase()
      .split(/[ |_]+/)
      .filter(Boolean);

    let filtered = browser.packages;

    if (browser.hideDeprecated) {
      filtered = filtered.filter((mod) => !mod.deprecated);
    }

    if (keys.length) {
      filtered = filtered.filter((mod) =>
        keys.every(
          (key) =>
            (mod.searchName || '').includes(key) ||
            (mod.searchText || '').includes(key)
        )
      );
    }

    filtered = sortBrowserPackages(filtered, browser.sort);

    const totalPages = Math.max(1, Math.ceil(filtered.length / MODS_PAGE_SIZE));
    const page = Math.min(Math.max(1, browser.page), totalPages);
    browser.page = page;
    count.textContent = `${filtered.length} 个`;

    list.replaceChildren();
    const slice = filtered.slice((page - 1) * MODS_PAGE_SIZE, page * MODS_PAGE_SIZE);

    if (slice.length === 0) {
      list.append(
        h(
          'div',
          { class: 'browser-state' },
          h('p', { text: '没有找到匹配的 Mod' }),
          h('span', { text: '换个关键词试试。' })
        )
      );
    } else {
      const installedMap = installedModsByName();
      for (const mod of slice) list.append(buildModCard(mod, installedMap));
    }

    pager.replaceChildren();
    pager.append(
      h(
        'button',
        {
          type: 'button',
          class: 'pager-btn',
          disabled: page <= 1,
          'aria-label': '上一页',
          onclick: () => {
            if (page <= 1) return;
            browser.page = page - 1;
            updateBrowserResults(browser, count, list, pager);
            list.scrollTop = 0;
          }
        },
        icon('chevronLeft', 'icon-sm')
      )
    );

    for (const item of buildPageSequence(page, totalPages)) {
      if (item === 'ellipsis') {
        pager.append(h('span', { class: 'pager-ellipsis', text: '…' }));
        continue;
      }
      pager.append(
        h(
          'button',
          {
            type: 'button',
            class: `pager-btn${item === page ? ' is-active' : ''}`,
            'aria-current': item === page ? 'page' : 'false',
            onclick: () => {
              if (item === page) return;
              browser.page = item;
              updateBrowserResults(browser, count, list, pager);
              list.scrollTop = 0;
            }
          },
          String(item)
        )
      );
    }

    pager.append(
      h(
        'button',
        {
          type: 'button',
          class: 'pager-btn',
          disabled: page >= totalPages,
          'aria-label': '下一页',
          onclick: () => {
            if (page >= totalPages) return;
            browser.page = page + 1;
            updateBrowserResults(browser, count, list, pager);
            list.scrollTop = 0;
          }
        },
        icon('chevronRight', 'icon-sm')
      )
    );
  }

  function buildPageSequence(current, total) {
    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    const pages = new Set([1, total, current - 1, current, current + 1]);
    if (current <= 3) {
      pages.add(2);
      pages.add(3);
      pages.add(4);
      pages.add(5);
    }
    if (current >= total - 2) {
      pages.add(total - 1);
      pages.add(total - 2);
      pages.add(total - 3);
      pages.add(total - 4);
    }

    const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
    const result = [];
    let previous = 0;
    for (const page of sorted) {
      if (previous && page - previous > 1) result.push('ellipsis');
      result.push(page);
      previous = page;
    }
    return result;
  }

  function buildModCard(mod, installedMap) {
    const installedMod = installedMap
      ? installedMap.get(String(mod.fullName || '').toLowerCase())
      : null;

    return h(
      'div',
      {
        class: 'mod-card is-clickable',
        role: 'button',
        tabindex: '0',
        'aria-label': `查看 ${mod.name}`,
        onclick: () => openModPicker(mod),
        onkeydown: (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openModPicker(mod);
          }
        }
      },
      buildModIcon(mod),
      h(
        'div',
        { class: 'mod-card-body' },
        h(
          'div',
          { class: 'mod-card-title' },
          h('span', { class: 'mod-card-name', text: mod.name }),
          installedMod
            ? h(
                'span',
                {
                  class: 'mod-installed-badge',
                  title: `已安装${installedMod.version ? ` v${installedMod.version}` : ''}`,
                  'aria-label': '已安装'
                },
                icon('check', 'icon-sm')
              )
            : null,
          h('span', { class: 'mod-card-owner', text: `by ${mod.owner}` }),
          mod.deprecated ? h('span', { class: 'mod-flag', text: '已弃用' }) : null
        ),
        h('p', { class: 'mod-card-desc', text: mod.description || '暂无描述' }),
        h(
          'div',
          { class: 'mod-card-meta' },
          h('span', { text: `v${mod.version}` }),
          h('span', { text: `${formatCompact(mod.downloads)} 次下载` }),
          h('span', { text: `${formatDay(mod.updated)} 更新` })
        )
      )
    );
  }

  function buildModIcon(mod) {
    const wrap = h('div', { class: 'mod-icon', 'aria-hidden': 'true' });

    if (!mod.icon) {
      wrap.append(h('span', { class: 'mod-icon-fallback', text: initialOf(mod.name) }));
      return wrap;
    }

    const loader = h('span', { class: 'art-loader' });
    const image = h('img', {
      src: mod.icon,
      alt: '',
      loading: 'lazy',
      decoding: 'async',
      referrerpolicy: 'no-referrer',
      draggable: 'false'
    });

    image.addEventListener('load', () => loader.remove());
    image.addEventListener('error', () => {
      wrap.replaceChildren(h('span', { class: 'mod-icon-fallback', text: initialOf(mod.name) }));
    });

    wrap.append(image, loader);
    if (image.complete) {
      if (image.naturalWidth > 0) loader.remove();
      else wrap.replaceChildren(h('span', { class: 'mod-icon-fallback', text: initialOf(mod.name) }));
    }
    return wrap;
  }

  const REMOTE_CACHE_TTL = 10 * 60 * 1000;
  const REMOTE_CACHE_LIMIT = 20;
  const remotePackageCache = new Map(); // slug -> { map, fetchedAt }
  const remotePackageRequests = new Map();
  const updateCheckAt = new Map();

  function remotePackagesForGame() {
    return remotePackagesFor(state.gameSlug);
  }

  function storeRemotePackages(slug, map) {
    remotePackageCache.delete(slug);
    remotePackageCache.set(slug, { map, fetchedAt: Date.now() });
    while (remotePackageCache.size > REMOTE_CACHE_LIMIT) {
      const oldest = remotePackageCache.keys().next().value;
      remotePackageCache.delete(oldest);
    }
  }

  function normalizeRemotePackages(data) {
    const map = new Map();
    for (const pkg of data && Array.isArray(data.packages) ? data.packages : []) {
      map.set(String(pkg.fullName || '').toLowerCase(), pkg);
    }
    return map;
  }

  function remotePackagesFor(slug, options) {
    if (!slug) return Promise.resolve(new Map());

    const force = Boolean(options && options.force);
    const cached = remotePackageCache.get(slug);
    // 10 分钟内直接复用；超过 TTL 自动重新拉取，挂机久了也能看到新版本
    if (!force && cached && Date.now() - cached.fetchedAt < REMOTE_CACHE_TTL) {
      return Promise.resolve(cached.map);
    }

    // 缓存过期或显式要求刷新时真正走网络，首次加载先读主进程缓存
    const useRefresh = force || Boolean(cached);
    const requestKey = `${slug}:${useRefresh ? 'refresh' : 'cache'}`;
    const pending = remotePackageRequests.get(requestKey);
    if (pending) return pending;

    const request = (useRefresh ? api.mods.refresh(slug) : api.mods.list(slug))
      .then((data) => {
        const map = normalizeRemotePackages(data);
        storeRemotePackages(slug, map);
        return map;
      })
      // 网络失败时退回旧缓存；延迟 1 分钟再重试，避免连续失败时反复请求
      .catch(() => {
        if (!cached) return new Map();
        cached.fetchedAt = Date.now() - REMOTE_CACHE_TTL + 60 * 1000;
        return cached.map;
      })
      .finally(() => remotePackageRequests.delete(requestKey));

    remotePackageRequests.set(requestKey, request);
    return request;
  }

  // 每次打开模组列表（或列表自动刷新）时查一次更新；5 分钟内复用已拉取的列表，避免重复请求。
  function shouldRefreshUpdateCheck(slug) {
    const last = updateCheckAt.get(slug) || 0;
    if (Date.now() - last < 5 * 60 * 1000) return false;
    updateCheckAt.set(slug, Date.now());
    return true;
  }

  function ignoredUpdateKey(game, profileId) {
    return `${game}::${profileId}`;
  }

  function ignoredUpdatesFor(game, profileId) {
    if (!game || !profileId) return [];
    const all = state.settings.ignoredUpdates || {};
    const list = all[ignoredUpdateKey(game, profileId)];
    return Array.isArray(list) ? list : [];
  }

  async function updateIgnoredUpdates(game, profileId, list) {
    try {
      state.settings = await api.settings.update({
        ignoredUpdates: { [ignoredUpdateKey(game, profileId)]: list.length ? list : null }
      });
      return true;
    } catch (error) {
      toast(errorText(error), true);
      return false;
    }
  }

  async function ignoreModUpdate(modKey) {
    const game = state.gameSlug;
    const profileId = state.profileId;
    if (!game || !profileId) return false;

    const current = ignoredUpdatesFor(game, profileId);
    const target = String(modKey || '');
    if (!target) return false;
    if (current.some((key) => key.toLowerCase() === target.toLowerCase())) return true;

    return updateIgnoredUpdates(game, profileId, [...current, target]);
  }

  async function checkModUpdates(slug, profile) {
    const map = await remotePackagesFor(slug);
    const ignored = new Set(
      ignoredUpdatesFor(slug, profile.id).map((key) => String(key).toLowerCase())
    );

    const updates = [];
    for (const mod of profile.mods) {
      const key = String(mod.key || '').toLowerCase();
      if (ignored.has(key)) continue;
      const pkg = map.get(key);
      if (!pkg || !pkg.uuid || !pkg.version) continue;
      if (compareVersions(pkg.version, mod.version) <= 0) continue;
      updates.push({ mod, pkg });
    }
    return updates;
  }

  function compareVersions(left, right) {
    const parse = (value) => {
      const match = String(value || '')
        .trim()
        .match(/^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:[-+](.+))?$/i);
      if (!match) return null;
      return {
        parts: [Number(match[1] || 0), Number(match[2] || 0), Number(match[3] || 0)],
        pre: match[4] || ''
      };
    };

    const a = parse(left);
    const b = parse(right);
    if (!a || !b) return String(left) === String(right) ? 0 : 1;

    for (let index = 0; index < 3; index += 1) {
      if (a.parts[index] !== b.parts[index]) return a.parts[index] > b.parts[index] ? 1 : -1;
    }

    // 正式版本高于同号的预发布版本（1.2.0 > 1.2.0-beta.1）
    if (!a.pre && !b.pre) return 0;
    if (!a.pre) return 1;
    if (!b.pre) return -1;
    return comparePreRelease(a.pre, b.pre);
  }

  // 预发布标识逐段比较，数字段按数值比：beta.10 > beta.2
  function comparePreRelease(left, right) {
    const a = String(left).split(/[.-]/);
    const b = String(right).split(/[.-]/);

    for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
      const x = a[index];
      const y = b[index];
      if (x === undefined) return -1;
      if (y === undefined) return 1;

      const xNumeric = /^\d+$/.test(x);
      const yNumeric = /^\d+$/.test(y);
      if (xNumeric && yNumeric) {
        const diff = Number(x) - Number(y);
        if (diff !== 0) return diff > 0 ? 1 : -1;
        continue;
      }
      // 语义化版本里数字标识低于字母标识
      if (xNumeric !== yNumeric) return xNumeric ? -1 : 1;

      const cmp = x.localeCompare(y);
      if (cmp !== 0) return cmp > 0 ? 1 : -1;
    }

    return 0;
  }

  async function resolveModIcon(mod) {
    const icon = typeof mod.icon === 'string' ? mod.icon : '';
    if (/^https?:\/\//i.test(icon)) return icon;

    if (icon) {
      const dataUrl = await api.icons.read(icon).catch(() => null);
      if (dataUrl) return dataUrl;
    }

    const map = await remotePackagesForGame();
    const pkg = map.get(String(mod.key || '').toLowerCase());
    return (pkg && pkg.icon) || null;
  }

  function buildInstalledModIcon(mod, extraClass) {
    const wrap = h(
      'div',
      { class: `mod-icon ${extraClass || ''}`.trim(), 'aria-hidden': 'true' },
      h('span', { class: 'mod-icon-fallback', text: initialOf(mod.name) })
    );

    resolveModIcon(mod).then((src) => {
      if (!src || !wrap.isConnected) return;

      const image = h('img', {
        src,
        alt: '',
        decoding: 'async',
        referrerpolicy: 'no-referrer',
        draggable: 'false'
      });

      image.addEventListener('load', () => {
        const fallback = wrap.querySelector('.mod-icon-fallback');
        if (fallback) fallback.remove();
      });
      image.addEventListener('error', () => image.remove());

      wrap.append(image);
    });

    return wrap;
  }

  function formatCompact(value) {
    const number = Number(value) || 0;
    try {
      return new Intl.NumberFormat('zh-CN', {
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(number);
    } catch {
      return String(number);
    }
  }

  /* ---------- Search filter ---------- */

  function setGameView(view) {
    if (state.gameView === view) return;
    state.gameView = view;
    render();

    api.settings
      .update({ gameView: view })
      .then((settings) => {
        state.settings = settings;
      })
      .catch(() => {});
  }

  function filterGameCards() {
    const query = state.query.trim().toLowerCase();
    let visible = 0;

    for (const card of els.main.querySelectorAll('.game-card')) {
      const match = !query || card.dataset.search.includes(query);
      card.classList.toggle('is-hidden', !match);
      if (match) visible += 1;
    }

    for (const section of els.main.querySelectorAll('.section')) {
      if (!section.querySelector('.game-card')) continue;
      const hasVisible = [...section.querySelectorAll('.game-card')].some(
        (card) => !card.classList.contains('is-hidden')
      );
      section.classList.toggle('is-hidden', !hasVisible);
    }

    for (const grid of els.main.querySelectorAll('.grid[data-section]')) {
      const collapsed = !query && collapsedSections.has(grid.dataset.section);
      grid.classList.toggle('is-hidden', collapsed);

      const head = grid.parentElement ? grid.parentElement.querySelector('.section-head') : null;
      if (head) head.setAttribute('aria-expanded', String(!collapsed));

      const chevron = grid.parentElement
        ? grid.parentElement.querySelector('.section-chevron')
        : null;
      if (chevron) chevron.classList.toggle('is-collapsed', collapsed);
    }

    const empty = document.getElementById('no-results');
    if (empty) empty.classList.toggle('is-visible', visible === 0);
  }

  function syncLabel() {
    if (state.refreshing) return '正在同步 Thunderstore…';
    if (state.error) return '同步失败，当前显示本地缓存';
    if (!state.fetchedAt) return `共 ${(state.games || []).length} 个游戏`;
    const time = new Date(state.fetchedAt).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `已同步 ${state.games.length} 个游戏 · 更新于 ${time}`;
  }

  /* ---------- Actions ---------- */

  async function refreshGames() {
    if (state.refreshing) return;
    state.refreshing = true;
    if (state.view === 'home') render();

    try {
      const cache = await api.games.refresh();
      state.games = cache.games;
      state.fetchedAt = cache.fetchedAt;
      state.newGames = new Set(Array.isArray(cache.newGames) ? cache.newGames : []);
      state.recentSlugs = Array.isArray(cache.recentSlugs) ? cache.recentSlugs : [];
      state.error = null;
      state.loading = false;
    } catch (error) {
      state.error = errorText(error);
      state.loading = false;
    } finally {
      state.refreshing = false;
      if (state.view === 'home') render();
      maybeAutoOpen();
    }
  }

  function maybeAutoOpen() {
    if (state.autoOpened || !state.games) return;
    const defaultSlug = state.settings.defaultGame;
    if (!defaultSlug) return;
    if (!findGame(defaultSlug)) return;
    state.autoOpened = true;
    openGame(defaultSlug);
  }

  function goHome() {
    if (state.view === 'home') return;
    stashTabState();
    state.view = 'home';
    state.gameSlug = null;
    state.stage = 'profiles';
    state.section = 'mods';
    state.profiles = [];
    state.profileId = null;
    configEditor = null;
    render();
  }

  function currentTab() {
    return state.tabs.find((tab) => tab.slug === state.gameSlug) || null;
  }

  // 把当前标签页的界面状态（配置、分区、正在编辑的 cfg）存回标签，切走再切回来能原样恢复。
  function stashTabState() {
    if (state.view !== 'game') return;
    const tab = currentTab();
    if (!tab) return;

    tab.section = state.section;
    if (state.profileId) {
      tab.profileId = state.profileId;
      tab.entered = state.stage === 'workspace';
    }
    tab.editor = configEditor;
  }

  async function openGame(slug) {
    const game = findGame(slug);
    if (!game) return;

    // 新游戏还没配置路径时静默检测一次：成功直接写入，失败不打扰用户
    maybeAutoDetectGamePath(game);

    stashTabState();

    let tab = state.tabs.find((item) => item.slug === slug);
    if (!tab) {
      tab = { slug, entered: false, profileId: null, section: 'mods', editor: null };
      state.tabs.push(tab);
    }

    state.view = 'game';
    state.gameSlug = slug;
    state.profiles = [];
    state.profileId = null;
    state.stage = 'loading';
    state.section = tab.section || 'mods';
    configEditor = null;
    // 先读本地缓存把列表画出来（有缓存时 list 立即返回），再后台预取；
    // 两者互不阻塞，预取失败也不会让侧边栏数量一直是空的
    const applyGamePackages = (data) => {
      if (state.gameSlug !== slug) return;
      const sameGame = state.browser.slug === slug;
      if (sameGame && state.browser.packages.length > 0) {
        // 已经有旧缓存：只替换数据并同步列表/数量，不重置搜索和分页
        applyBrowserData(data);
        if (state.section === 'download' && browserView && browserView.slug === slug) {
          updateBrowserResults(
            state.browser,
            browserView.count,
            browserView.list,
            browserView.pager
          );
        }
        return;
      }

      state.browser = {
        slug,
        packages: [],
        loading: false,
        refreshing: false,
        error: null,
        fetchedAt: sameGame ? state.browser.fetchedAt : null,
        query: sameGame ? state.browser.query : '',
        page: sameGame ? state.browser.page : 1,
        hideDeprecated: sameGame ? state.browser.hideDeprecated : true,
        sort: sameGame ? state.browser.sort : 'default'
      };
      applyBrowserData(data);
      render();
    };
    api.mods.list(slug).then(applyGamePackages).catch(() => {});
    api.mods
      .prefetch(slug)
      .then(() => {
        if (state.gameSlug !== slug) return null;
        return api.mods.list(slug);
      })
      .then((data) => {
        if (data) applyGamePackages(data);
      })
      .catch(() => {});
    render();

    try {
      const profiles = await api.profiles.list(slug);
      if (state.view !== 'game' || state.gameSlug !== slug) return;

      const activeTab = currentTab();
      if (!activeTab) return;

      state.profiles = profiles;
      if (
        activeTab.entered &&
        activeTab.profileId &&
        profiles.some((profile) => profile.id === activeTab.profileId)
      ) {
        state.profileId = activeTab.profileId;
        state.stage = 'workspace';
        state.section = activeTab.section || 'mods';

        // 恢复该标签页之前打开的配置文件编辑器
        configEditor =
          activeTab.editor &&
          activeTab.editor.game === slug &&
          activeTab.editor.profileId === state.profileId
            ? activeTab.editor
            : null;

        if (state.section === 'download') prepareBrowser();
        if (state.section === 'config') prepareConfigs();
      } else {
        activeTab.entered = false;
        activeTab.profileId = null;
        activeTab.editor = null;
        state.profileId = null;
        state.stage = 'profiles';
      }
    } catch (error) {
      if (state.view === 'game' && state.gameSlug === slug) {
        toast(`读取配置失败：${errorText(error)}`, true);
        state.stage = 'profiles';
      }
    } finally {
      if (state.view === 'game' && state.gameSlug === slug) render();
    }
  }

  // 打开游戏时静默检测安装路径：只写配置，不弹提示
  async function maybeAutoDetectGamePath(game) {
    if (!game || !game.identifier) return;

    const slug = game.identifier;
    if (String((state.settings.gamePaths || {})[slug] || '').trim()) return;
    if (pathDetectionInFlight.has(slug)) return;

    pathDetectionInFlight.add(slug);
    try {
      const result = await api.game.detectPath(slug, game.name || '');
      if (!result || !result.path) return;

      // 检测期间用户可能已经手动设置，别覆盖
      if (String((state.settings.gamePaths || {})[slug] || '').trim()) return;

      state.settings = await api.settings.update({ gamePaths: { [slug]: result.path } });
      if (state.view === 'game' && state.gameSlug === slug) render();
    } catch {
      // 自动检测失败时保持静默，用户仍可在设置里手动选择
    } finally {
      pathDetectionInFlight.delete(slug);
    }
  }

  async function refreshProfiles(game) {
    if (!game) return null;

    try {
      const profiles = await api.profiles.list(game);
      if (state.view !== 'game' || state.gameSlug !== game) return null;
      state.profiles = profiles;
      return profiles;
    } catch (error) {
      toast(`读取配置失败：${errorText(error)}`, true);
      return null;
    }
  }

  function enterProfile(id) {
    const profile = profileById(id);
    if (!profile) return;

    const tab = currentTab();
    if (tab) {
      tab.entered = true;
      tab.profileId = id;
      tab.section = 'mods';
      tab.editor = null;
    }

    configEditor = null;
    state.profileId = id;
    state.stage = 'workspace';
    state.section = 'mods';
    persistActiveProfile(id);
    render();

    // 进入配置后重新读一次磁盘，拿到最新的已安装 Mod 列表
    const game = state.gameSlug;
    refreshProfiles(game).then((profiles) => {
      if (!profiles) return;
      if (state.view !== 'game' || state.gameSlug !== game || state.profileId !== id) return;

      if (!profiles.some((item) => item.id === id)) {
        const activeTab = currentTab();
        if (activeTab) {
          activeTab.entered = false;
          activeTab.profileId = null;
        }
        state.profileId = null;
        state.stage = 'profiles';
      }

      render();
    });
  }

  function switchProfile() {
    const tab = currentTab();
    if (tab) {
      tab.entered = false;
      tab.editor = null;
    }
    configEditor = null;
    state.profileId = null;
    state.stage = 'profiles';
    render();

    // 每次回到配置选择页都重新获取配置列表
    const game = state.gameSlug;
    refreshProfiles(game).then((profiles) => {
      if (!profiles) return;
      if (state.view === 'game' && state.gameSlug === game && state.stage === 'profiles') {
        render();
      }
    });
  }

  function setSection(section) {
    if (state.section === section) return;
    if (configEditor && section !== 'config') {
      const tab = currentTab();
      if (tab) tab.editor = null;
      configEditor = null;
    }
    state.section = section;
    const tab = currentTab();
    if (tab) tab.section = section;
    if (section === 'download') prepareBrowser();
    if (section === 'config') prepareConfigs();
    render();
  }

  function prepareConfigs(force = false) {
    const game = state.gameSlug;
    const profileId = state.profileId;
    if (!game || !profileId) return;

    const current = state.configs;
    if (
      !force &&
      current.game === game &&
      current.profileId === profileId &&
      (current.loading || current.loaded || current.error)
    ) {
      return;
    }

    state.configs = {
      game,
      profileId,
      files: [],
      loading: true,
      loaded: false,
      error: null
    };

    loadConfigs(game, profileId);
  }

  async function loadConfigs(game, profileId) {
    try {
      const files = await api.configs.list(game, profileId);
      if (state.configs.game !== game || state.configs.profileId !== profileId) return;
      state.configs.files = Array.isArray(files) ? files : [];
      state.configs.loading = false;
      state.configs.loaded = true;
      state.configs.error = null;
    } catch (error) {
      if (state.configs.game !== game || state.configs.profileId !== profileId) return;
      state.configs.loading = false;
      state.configs.loaded = true;
      state.configs.error = errorText(error);
    }

    if (state.section === 'config' && state.gameSlug === game) render();
  }

  async function chooseGamePath() {
    const slug = state.gameSlug;
    if (!slug) return null;

    try {
      const result = await api.game.chooseExecutable(slug);
      if (result && result.path) {
        state.settings.gamePaths = {
          ...(state.settings.gamePaths || {}),
          [slug]: normalizeDriveLetter(result.path)
        };
        toast('已设置游戏路径');
        render();
        return result.path;
      }
    } catch (error) {
      toast(errorText(error), true);
    }

    return null;
  }

  // 手动编辑游戏路径：Enter 或失焦时保存
  async function saveGamePath(game, input) {
    const slug = game.identifier;
    const next = String((input && input.value) || '').trim();

    try {
      if (!next) {
        // store 只接受 null 来删除键，空字符串会被忽略
        state.settings = await api.settings.update({ gamePaths: { [slug]: null } });
        toast('已清除游戏路径');
        render();
        return;
      }

      if (!/\.exe$/i.test(next)) {
        toast('请填写游戏可执行文件（.exe）的完整路径', true);
        return;
      }

      const exists = await api.game.pathExists(next).catch(() => false);
      if (!exists) {
        toast('路径不存在，请检查后重试', true);
        return;
      }

      state.settings = await api.settings.update({ gamePaths: { [slug]: next } });
      toast('已保存游戏路径');
      render();
    } catch (error) {
      toast(errorText(error), true);
    }
  }

  async function autoDetectGamePath(game, button) {
    const slug = game && game.identifier;
    if (!slug) return;

    const originalText = button ? button.textContent : '';
    if (button) {
      button.disabled = true;
      button.textContent = '检测中…';
    }

    try {
      const result = await api.game.detectPath(slug, game.name || '');
      if (result && result.path) {
        state.settings = await api.settings.update({ gamePaths: { [slug]: result.path } });
        toast('已自动检测到游戏路径');
        render();
        return;
      }

      toast('未找到游戏安装路径，请手动选择');
    } catch (error) {
      toast(errorText(error), true);
    }

    if (button && button.isConnected) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  async function ensureSteamAppId(slug) {
    let detected = null;
    try {
      detected = await api.game.detectSteamAppId(slug);
    } catch {
      // Fall back to configured value.
    }

    const configured = (state.settings.steamAppIds || {})[slug] || '';
    const found = String(detected || configured || '').trim();

    if (/^\d+$/.test(found)) {
      if (found !== configured) {
        // 等持久化完成再返回：写盘失败时 UI 与设置文件不会不一致
        try {
          state.settings = await api.settings.update({ steamAppIds: { [slug]: found } });
        } catch {
          // 保存失败不阻塞本次启动，下次会重新检测
          state.settings.steamAppIds = {
            ...(state.settings.steamAppIds || {}),
            [slug]: found
          };
        }
      }
      return found;
    }

    const entered = await promptModal({
      title: '需要 Steam App ID',
      label: 'Steam App ID（商店页地址中的数字）',
      placeholder: '例如 1966720',
      confirmText: '保存并启动'
    });

    if (entered === null) return null;

    const appId = entered.trim();
    if (!/^\d+$/.test(appId)) {
      toast('Steam App ID 只能是数字', true);
      return null;
    }

    try {
      state.settings = await api.settings.update({ steamAppIds: { [slug]: appId } });
    } catch (error) {
      toast(errorText(error), true);
      return null;
    }

    return appId;
  }

  async function launchGame(modded) {
    if (launchingGame) return;

    const slug = state.gameSlug;
    if (!slug || !state.profileId) return;

    const exePath = (state.settings.gamePaths || {})[slug];
    if (!exePath) {
      setSection('settings');
      toast('请先在设置中配置游戏路径', true);
      return;
    }

    // 立刻上锁：后面可能要等用户输入 Steam App ID，
    // 如果等输入完再置位，期间重复点击会弹出第二个对话框并启动两次
    launchingGame = true;

    try {
      const launchMode = state.settings.launchMode || 'steam';
      if (launchMode === 'steam') {
        const appId = await ensureSteamAppId(slug);
        if (!appId) return;
      }

      const result = await api.game.launch({
        game: slug,
        profileId: state.profileId,
        modded
      });
      showLaunchNotice(slug, modded);
      if (result && Array.isArray(result.notices) && result.notices.length > 0) {
        toast(result.notices.join('；'));
      }
      if (result && Array.isArray(result.warnings) && result.warnings.length > 0) {
        toast(result.warnings.join('；'), true);
      }
    } catch (error) {
      toast(errorText(error), true);
    } finally {
      launchingGame = false;
    }
  }

  function showLaunchNotice(slug, modded) {
    const tab = state.tabs.find((item) => item.slug === slug);
    if (!tab) return;

    tab.launchNotice = { modded };
    if (state.view === 'game' && state.gameSlug === slug) render();
  }

  function closeLaunchNotice() {
    const tab = currentTab();
    if (!tab || !tab.launchNotice) return;
    tab.launchNotice = null;
    render();
  }

  // 启动提示只覆盖当前标签页的内容区，标题栏和标签仍然可以操作。
  function buildLaunchNotice(tab) {
    const game = findGame(tab.slug);
    const modded = Boolean(tab.launchNotice && tab.launchNotice.modded);
    const mode = state.settings.launchMode || 'steam';
    const modeText =
      mode === 'steam' ? 'Steam' : mode === 'direct' ? '直接启动' : '自定义程序';

    const overlay = h(
      'div',
      {
        class: 'launch-tab-overlay',
        onmousedown: (event) => {
          if (event.target === overlay) closeLaunchNotice();
        }
      },
      h(
        'div',
        { class: 'modal launch-modal' },
        h('div', { class: 'launch-modal-icon' }, icon('play')),
        h('h2', { text: '游戏已启动' }),
        h('p', {
          text: `${game ? game.name : tab.slug} 已${modded ? '加载 Mod' : '以原版'}启动（${modeText}）。`
        }),
        h('span', { class: 'launch-modal-hint', text: '点击窗口外任意位置关闭此窗口' })
      )
    );

    return overlay;
  }

  function prepareBrowser(force = false) {
    const slug = state.gameSlug;
    if (!slug) return;

    const current = state.browser;
    const sameGame = current.slug === slug;

    if (!force && sameGame && (current.loading || current.refreshing)) return;

    const hasData = sameGame && current.packages.length > 0;

    state.browser = {
      slug,
      packages: sameGame ? current.packages : [],
      loading: !hasData,
      refreshing: hasData,
      error: null,
      fetchedAt: sameGame ? current.fetchedAt : null,
      query: sameGame ? current.query : '',
      page: sameGame ? current.page : 1,
      hideDeprecated: sameGame ? current.hideDeprecated : true,
      sort: sameGame ? current.sort : 'default'
    };

    fetchBrowser(slug, force);
  }

  function applyBrowserData(data) {
    const packages = Array.isArray(data.packages) ? data.packages : [];
    state.browser.packages = packages.map((mod) => ({
      ...mod,
      // 包名/全名去掉空格和下划线，兼容 "BlueArchive" 搜 "Blue_Archive" 这类写法
      searchName: `${mod.name} ${mod.fullName}`.replace(/[ _]/g, '').toLowerCase(),
      searchText: `${mod.owner} ${mod.description}`.toLowerCase()
    }));
    state.browser.fetchedAt = data.fetchedAt || Date.now();
    state.browser.error = null;
    syncBrowserNavCount();
  }

  // 侧边栏「获取模组」的数量始终跟随 state.browser，后台静默刷新后数字也要一起变，
  // 不能等下一次整页渲染才更新（r2modman 的侧边栏数字就是同源派生值）
  function syncBrowserNavCount() {
    if (state.view !== 'game' || state.stage !== 'workspace') return;
    const countEl = els.main.querySelector('.nav-item[data-nav="download"] .nav-count');
    if (!countEl) return;
    const hasData =
      state.browser.slug === state.gameSlug && state.browser.packages.length > 0;
    countEl.textContent = hasData ? String(state.browser.packages.length) : '';
  }

  async function fetchBrowser(slug, force) {
    try {
      const data = force ? await api.mods.refresh(slug) : await api.mods.list(slug);
      if (state.browser.slug !== slug) return;

      applyBrowserData(data);
      state.browser.loading = false;

      const needsBackgroundRefresh = !force && data.stale;
      state.browser.refreshing = Boolean(needsBackgroundRefresh);
      render();

      if (needsBackgroundRefresh) refreshBrowserSilently(slug);
    } catch (error) {
      if (state.browser.slug !== slug) return;
      state.browser.loading = false;
      state.browser.refreshing = false;
      state.browser.error = errorText(error);
      if (force && state.browser.packages.length > 0) {
        toast('刷新失败，当前显示缓存数据', true);
      }
      render();
    }
  }

  async function refreshBrowserSilently(slug) {
    try {
      const data = await api.mods.refresh(slug);
      if (state.browser.slug !== slug) return;
      applyBrowserData(data);
    } catch {
      // Keep the cached list if a background refresh fails.
    }

    if (state.browser.slug !== slug) return;
    state.browser.refreshing = false;

    if (
      state.section === 'download' &&
      state.gameSlug === slug &&
      browserView &&
      browserView.slug === slug
    ) {
      updateBrowserResults(state.browser, browserView.count, browserView.list, browserView.pager);
      browserView.refreshButton.classList.remove('is-busy');
      browserView.refreshButton.disabled = false;
    }
  }

  function renderTabs() {
    els.homeTab.classList.toggle('is-active', state.view === 'home');
    els.tabStrip.replaceChildren();

    for (const tab of state.tabs) {
      const game = findGame(tab.slug);
      if (!game) continue;
      const active = state.view === 'game' && state.gameSlug === tab.slug;

      const element = h(
        'div',
        {
          class: `tab${active ? ' is-active' : ''}`,
          role: 'tab',
          tabindex: '0',
          draggable: 'true',
          'aria-selected': String(active),
          title: game.name,
          onmousedown: (event) => {
            if (event.button === 1) event.preventDefault();
          },
          onclick: () => activateTab(tab.slug),
          onauxclick: (event) => {
            if (event.button !== 1) return;
            event.preventDefault();
            closeTab(tab.slug);
          },
          onkeydown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              activateTab(tab.slug);
            }
          },
          ondragstart: (event) => {
            dragSlug = tab.slug;
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', tab.slug);
            element.classList.add('is-dragging');
          },
          ondragend: () => {
            dragSlug = null;
            clearTabDropClasses();
          },
          ondragover: (event) => {
            if (!dragSlug || dragSlug === tab.slug) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            const rect = element.getBoundingClientRect();
            const after = event.clientX > rect.left + rect.width / 2;
            element.classList.toggle('drop-before', !after);
            element.classList.toggle('drop-after', after);
          },
          ondragleave: () => {
            element.classList.remove('drop-before', 'drop-after');
          },
          ondrop: (event) => {
            event.preventDefault();
            moveTab(dragSlug, tab.slug, element, event.clientX);
          }
        },
        buildGameArt(game, 'sm'),
        h('span', { class: 'tab-label', text: game.name }),
        h(
          'button',
          {
            type: 'button',
            class: 'tab-close',
            title: '关闭',
            'aria-label': `关闭 ${game.name}`,
            onmousedown: (event) => event.stopPropagation(),
            onclick: (event) => {
              event.stopPropagation();
              closeTab(tab.slug);
            }
          },
          icon('close', 'icon-sm')
        )
      );

      els.tabStrip.append(element);
    }

    const activeElement = els.tabStrip.querySelector('.tab.is-active');
    if (activeElement) {
      const left = activeElement.offsetLeft;
      const right = left + activeElement.offsetWidth;
      if (left < els.tabStrip.scrollLeft) {
        els.tabStrip.scrollLeft = Math.max(0, left - 4);
      } else if (right > els.tabStrip.scrollLeft + els.tabStrip.clientWidth) {
        els.tabStrip.scrollLeft = right - els.tabStrip.clientWidth + 4;
      }
    }
  }

  function activateTab(slug) {
    if (state.view === 'game' && state.gameSlug === slug) return;
    openGame(slug);
  }

  function closeTab(slug) {
    const index = state.tabs.findIndex((tab) => tab.slug === slug);
    if (index < 0) return;

    const wasActive = state.view === 'game' && state.gameSlug === slug;
    state.tabs.splice(index, 1);

    if (!wasActive) {
      renderTabs();
      return;
    }

    const next = state.tabs[index] || state.tabs[index - 1] || null;
    if (next) openGame(next.slug);
    else goHome();
  }

  function moveTab(sourceSlug, targetSlug, targetElement, clientX) {
    const from = state.tabs.findIndex((tab) => tab.slug === sourceSlug);
    const targetIndex = state.tabs.findIndex((tab) => tab.slug === targetSlug);
    dragSlug = null;
    clearTabDropClasses();

    if (from < 0 || targetIndex < 0 || sourceSlug === targetSlug) return;

    const rect = targetElement.getBoundingClientRect();
    const after = clientX > rect.left + rect.width / 2;
    const [moved] = state.tabs.splice(from, 1);
    let insertAt = targetIndex + (after ? 1 : 0);
    if (from < insertAt) insertAt -= 1;
    insertAt = Math.max(0, Math.min(insertAt, state.tabs.length));
    state.tabs.splice(insertAt, 0, moved);
    renderTabs();
  }

  function clearTabDropClasses() {
    for (const element of els.tabStrip.querySelectorAll('.tab')) {
      element.classList.remove('drop-before', 'drop-after');
    }
  }

  function persistActiveProfile(id) {
    const slug = state.gameSlug;
    if (!slug) return;
    const next = { ...state.settings.activeProfiles };
    if (id) next[slug] = id;
    else delete next[slug];
    state.settings.activeProfiles = next;
    api.settings.update({ activeProfiles: { [slug]: id || null } }).catch((error) => {
      toast(errorText(error), true);
    });
  }

  // 统一追加/更新配置列表，按 id 去重，避免列表里出现两张同名同 id 的卡片
  function upsertProfile(profile) {
    if (!profile) return;
    state.profiles = [
      ...state.profiles.filter((item) => item.id !== profile.id),
      profile
    ].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  }

  async function createProfile() {
    const name = await promptModal({
      title: '新建配置',
      label: '配置名称',
      placeholder: '例如：原版增强',
      confirmText: '创建'
    });
    if (name === null) return;

    try {
      const profile = await api.profiles.create(state.gameSlug, name);
      upsertProfile(profile);
      toast(`已创建配置「${profile.name}」`);
      enterProfile(profile.id);
    } catch (error) {
      toast(errorText(error), true);
    }
  }

  async function renameProfile(profile) {
    const name = await promptModal({
      title: '重命名配置',
      label: '配置名称',
      placeholder: '例如：原版增强',
      confirmText: '保存',
      value: profile.name
    });
    if (name === null || name === profile.name) return;

    try {
      const updated = await api.profiles.rename(state.gameSlug, profile.id, name);
      const oldId = profile.id;
      const newId = updated.id;
      const slug = state.gameSlug;

      // 目录也会被重命名，id 可能变化，相关引用一起更新
      if (oldId !== newId) {
        if (state.profileId === oldId) state.profileId = newId;

        const tab = currentTab();
        if (tab) {
          if (tab.profileId === oldId) tab.profileId = newId;
          if (tab.editor && tab.editor.profileId === oldId) tab.editor.profileId = newId;
        }

        if (state.settings.activeProfiles && state.settings.activeProfiles[slug] === oldId) {
          state.settings.activeProfiles = {
            ...state.settings.activeProfiles,
            [slug]: newId
          };
        }

        state.downloads = state.downloads.map((task) =>
          task.game === slug && task.profileId === oldId
            ? { ...task, profileId: newId }
            : task
        );
      }

      state.profiles = state.profiles.map((item) =>
        item.id === oldId ? { ...item, ...updated } : item
      );
      render();
      toast(`配置已重命名为「${updated.name}」`);
    } catch (error) {
      toast(errorText(error), true);
    }
  }

  async function importProfileArchive(game) {
    const slug = game.identifier;
    let data = null;

    try {
      data = await api.profiles.chooseProfileArchive(slug);
    } catch (error) {
      alertModal('导入失败', errorText(error));
      return;
    }

    if (!data) return;
    openProfileImportModal(data);
  }

  function buildR2zIcon(mod) {
    const wrap = h(
      'div',
      { class: 'mod-icon r2z-icon', 'aria-hidden': 'true' },
      h('span', { class: 'mod-icon-fallback', text: initialOf(mod.name || mod.packageName) })
    );

    const src = typeof mod.icon === 'string' ? mod.icon : '';
    if (!src) return wrap;

    const image = h('img', {
      src,
      alt: '',
      loading: 'lazy',
      decoding: 'async',
      referrerpolicy: 'no-referrer',
      draggable: 'false'
    });
    image.addEventListener('load', () => {
      const fallback = wrap.querySelector('.mod-icon-fallback');
      if (fallback) fallback.remove();
    });
    image.addEventListener('error', () => image.remove());
    wrap.append(image);
    return wrap;
  }

  function openProfileImportModal(data) {
    const matched = data.mods.filter((mod) => mod.matched);
    const missing = data.mods.filter((mod) => !mod.matched);
    let closed = false;

    const list = h('div', { class: 'r2z-list' });
    for (const mod of data.mods) {
      const subParts = [];
      if (mod.owner) subParts.push(`by ${mod.owner}`);
      if (mod.version) subParts.push(`v${mod.version}`);
      if (!mod.enabled) subParts.push('已禁用');

      list.append(
        h(
          'div',
          { class: `r2z-row${mod.matched ? '' : ' is-missing'}` },
          buildR2zIcon(mod),
          h(
            'div',
            { class: 'r2z-info' },
            h('div', { class: 'r2z-name', text: mod.matched ? mod.name : mod.packageName }),
            h('div', { class: 'r2z-sub', text: subParts.join(' · ') })
          ),
          mod.matched
            ? null
            : h(
                'span',
                { class: 'r2z-missing' },
                icon('alert', 'icon-sm'),
                '未找到'
              )
        )
      );
    }

    if (data.mods.length === 0) {
      list.append(
        h(
          'div',
          { class: 'content-empty' },
          h('p', { text: '这个配置里没有 Mod' }),
          h('span', { text: '只会导入配置文件。' })
        )
      );
    }

    const warning = missing.length
      ? h(
          'div',
          { class: 'r2z-banner' },
          icon('alert', 'icon-sm'),
          h('span', {
            text: `${missing.map((mod) => mod.packageName).join('、')} 未在 Thunderstore 找到，将不会被安装。`
          })
        )
      : null;

    const importButton = h(
      'button',
      { type: 'button', class: 'btn primary' },
      matched.length > 0 ? `导入（${matched.length} 个 Mod）` : '仅导入配置'
    );

    const overlay = h(
      'div',
      {
        class: 'modal-overlay',
        onmousedown: (event) => {
          if (event.target === overlay) close();
        }
      },
      h(
        'div',
        { class: 'modal r2z-modal' },
        h('h2', { text: '导入配置' }),
        h('p', { class: 'r2z-profile-name', text: `配置名称：${data.profileName}` }),
        h('div', {
          class: 'r2z-summary',
          text: `共 ${data.mods.length} 个 Mod，可安装 ${matched.length} 个`
        }),
        warning,
        list,
        h(
          'div',
          { class: 'modal-actions' },
          h('button', { type: 'button', class: 'btn', onclick: () => close() }, '取消'),
          importButton
        )
      )
    );

    function close() {
      if (closed) return;
      closed = true;
      overlay.remove();
    }

    importButton.addEventListener('click', async () => {
      importButton.disabled = true;
      importButton.textContent = '正在创建配置…';

      try {
        const result = await api.profiles.importProfile(state.gameSlug, data.path, {
          profileName: data.profileName,
          mods: data.mods
        });

        close();
        upsertProfile(result.profile);
        enterProfile(result.profile.id);

        if (result.task) {
          if (!state.downloads.some((item) => item.id === result.task.id)) {
            state.downloads = [result.task, ...state.downloads];
          }
          onDownloadsUpdated();
          openDownloadUi(result.task.id);
        }

        toast(`已导入配置「${result.profile.name}」`);
      } catch (error) {
        importButton.disabled = false;
        importButton.textContent = matched.length > 0 ? `导入（${matched.length} 个 Mod）` : '仅导入配置';
        alertModal('导入失败', errorText(error));
      }
    });

    els.modalRoot.append(overlay);
  }

  function alertModal(title, message) {
    const overlay = h(
      'div',
      {
        class: 'modal-overlay',
        onmousedown: (event) => {
          if (event.target === overlay) close();
        }
      },
      h(
        'div',
        { class: 'modal' },
        h('h2', { text: title }),
        h('p', { class: 'modal-text-block', text: message }),
        h(
          'div',
          { class: 'modal-actions' },
          h('button', { type: 'button', class: 'btn primary', onclick: () => close() }, '知道了')
        )
      )
    );

    function close() {
      overlay.remove();
    }

    els.modalRoot.append(overlay);
    setTimeout(() => {
      const button = overlay.querySelector('.btn.primary');
      if (button) button.focus();
    }, 30);
  }

  async function confirmDeleteProfile(profile) {
    // 与主进程检查保持一致：还有任务在写这个配置时不能删
    const active = state.downloads.some(
      (task) =>
        task.game === state.gameSlug &&
        task.profileId === profile.id &&
        ACTIVE_DOWNLOAD_STATES.has(task.status)
    );
    if (active) {
      toast('该配置还有下载任务，完成后再删除', true);
      return;
    }

    const confirmed = await confirmModal({
      title: '删除配置',
      message: `确定要删除「${profile.name}」吗？该配置的文件会从本地移除，此操作无法撤销。`,
      confirmText: '删除'
    });
    if (!confirmed) return;

    const slug = state.gameSlug;

    try {
      await api.profiles.remove(slug, profile.id);
      state.profiles = state.profiles.filter((item) => item.id !== profile.id);

      const tab = currentTab();
      if (tab && tab.profileId === profile.id) tab.profileId = null;

      if (state.profileId === profile.id) {
        state.profileId = null;
        state.stage = 'profiles';
      }

      if (state.settings.activeProfiles[slug] === profile.id) {
        const next = { ...state.settings.activeProfiles };
        delete next[slug];
        state.settings.activeProfiles = next;
        api.settings.update({ activeProfiles: { [slug]: null } }).catch((error) => {
          toast(errorText(error), true);
        });
      }

      render();
      toast('配置已删除');
    } catch (error) {
      toast(errorText(error), true);
    }
  }

  async function toggleFavorite(slug) {
    const favorites = new Set(state.settings.favorites);
    if (favorites.has(slug)) favorites.delete(slug);
    else favorites.add(slug);

    try {
      state.settings = await api.settings.update({ favorites: [...favorites] });
      render();
    } catch (error) {
      toast(errorText(error), true);
    }
  }

  async function setDefaultGame(slug) {
    try {
      state.settings = await api.settings.update({ defaultGame: slug });
      render();
    } catch (error) {
      toast(errorText(error), true);
    }
  }

  function openDefaultPicker(trigger, games) {
    if (activePicker && activePicker.trigger === trigger) {
      closeDefaultPicker();
      return;
    }
    closeDefaultPicker();

    const options = [
      { slug: '', name: '不自动进入' },
      ...games.map((game) => ({ slug: game.identifier, name: game.name }))
    ];
    const selectedSlug = state.settings.defaultGame || '';

    const list = h('div', { class: 'picker-list' });
    for (const option of options) {
      const selected = option.slug === selectedSlug;
      list.append(
        h(
          'button',
          {
            type: 'button',
            class: `picker-option${selected ? ' is-selected' : ''}`,
            role: 'option',
            'aria-selected': String(selected),
            dataset: {
              search: `${option.name} ${option.slug}`.toLowerCase(),
              none: option.slug ? '0' : '1'
            },
            onclick: () => chooseDefault(option.slug)
          },
          h('span', { class: 'picker-option-name', text: option.name }),
          selected ? icon('check', 'icon-sm') : null
        )
      );
    }

    const empty = h('div', { class: 'picker-empty is-hidden', text: '没有找到匹配的游戏。' });
    list.append(empty);

    const searchInput = h('input', {
      type: 'text',
      class: 'picker-input',
      placeholder: '搜索游戏…',
      autocomplete: 'off',
      spellcheck: 'false'
    });

    function filterOptions() {
      const query = searchInput.value.trim().toLowerCase();
      let visible = 0;
      for (const option of list.querySelectorAll('.picker-option')) {
        const isNone = option.dataset.none === '1';
        const match = query ? !isNone && option.dataset.search.includes(query) : true;
        option.classList.toggle('is-hidden', !match);
        if (match) visible += 1;
      }
      empty.classList.toggle('is-hidden', visible > 0);
    }

    searchInput.addEventListener('input', filterOptions);
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closeDefaultPicker();
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        const first = list.querySelector('.picker-option:not(.is-hidden)');
        if (first) first.click();
      }
    });

    const popover = h(
      'div',
      { class: 'picker-popover', role: 'listbox', 'aria-label': '选择启动默认游戏' },
      h('div', { class: 'picker-search' }, icon('search'), searchInput),
      list
    );

    const onDocDown = (event) => {
      const wrapper = trigger.parentElement;
      if (wrapper && wrapper.contains(event.target)) return;
      closeDefaultPicker();
    };
    const onDocKey = (event) => {
      if (event.key === 'Escape') closeDefaultPicker();
    };

    trigger.setAttribute('aria-expanded', 'true');
    trigger.parentElement.append(popover);

    activePicker = {
      trigger,
      popover,
      cleanup() {
        document.removeEventListener('mousedown', onDocDown, true);
        document.removeEventListener('keydown', onDocKey);
        trigger.setAttribute('aria-expanded', 'false');
      }
    };

    document.addEventListener('mousedown', onDocDown, true);
    document.addEventListener('keydown', onDocKey);

    const selectedOption = list.querySelector('.picker-option.is-selected');
    if (selectedOption) {
      list.scrollTop = Math.max(
        0,
        selectedOption.offsetTop - list.clientHeight / 2 + selectedOption.offsetHeight / 2
      );
    }

    filterOptions();
    setTimeout(() => searchInput.focus(), 30);
  }

  function closeDefaultPicker() {
    if (!activePicker) return;
    const picker = activePicker;
    activePicker = null;
    picker.cleanup();
    picker.popover.remove();
  }

  function chooseDefault(slug) {
    closeDefaultPicker();
    const next = slug || null;
    if ((state.settings.defaultGame || null) === next) return;
    setDefaultGame(next);
  }

  async function copyProfilePath(profile) {
    try {
      await api.profiles.copyPath(state.gameSlug, profile.id);
      toast('路径已复制到剪贴板');
    } catch (error) {
      toast(errorText(error), true);
    }
  }

  async function revealProfile(profile) {
    try {
      await api.profiles.reveal(state.gameSlug, profile.id);
    } catch (error) {
      toast(errorText(error), true);
    }
  }

  /* ---------- Sponsor ---------- */

  const SPONSOR_AFDIAN_URL = 'https://ifdian.net/a/AraoPU2';

  const SPONSOR_NOTICE = [
    '赞助是自愿的赠与行为，不构成购买任何商品或服务。',
    '赞助不会解锁额外功能、特权或优先支持，软件功能对所有用户一致。',
    '本项目以 MIT 协议开源，赞助不影响任何人使用、修改或分发它的权利。',
    '赞助款不予退还，请量力而行。'
  ];

  function openSponsorNotice(kind) {
    const isWechat = kind === 'wechat';
    let closed = false;

    const titleEl = h('h2', { class: 'sponsor-modal-title', text: '重要声明' });
    const body = h('div', { class: 'sponsor-notice-body' });
    const actions = h('div', { class: 'modal-actions' });

    const overlay = h(
      'div',
      {
        class: 'modal-overlay',
        onmousedown: (event) => {
          if (event.target === overlay) close();
        }
      },
      h('div', { class: 'modal sponsor-modal' }, titleEl, body, actions)
    );

    const onKeyDown = (event) => {
      if (event.key === 'Escape') close();
    };

    function close() {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKeyDown);
      overlay.remove();
    }

    function renderNotice() {
      const agree = h('input', { type: 'checkbox', class: 'sponsor-agree-input' });
      const nextButton = h(
        'button',
        {
          type: 'button',
          class: 'btn primary',
          disabled: true,
          onclick: () => proceed()
        },
        '下一步'
      );

      agree.addEventListener('change', () => {
        nextButton.disabled = !agree.checked;
      });

      body.replaceChildren(
        h(
          'ul',
          { class: 'sponsor-notice-list' },
          SPONSOR_NOTICE.map((text) => h('li', { class: 'sponsor-notice-item', text }))
        ),
        h(
          'label',
          { class: 'sponsor-agree' },
          agree,
          h('span', { text: '我已阅读并同意以上声明' })
        )
      );

      actions.replaceChildren(
        h('button', { type: 'button', class: 'btn', onclick: () => close() }, '取消'),
        nextButton
      );
    }

    function renderWechatQr() {
      titleEl.textContent = '微信赞赏';
      body.replaceChildren(
        h(
          'div',
          { class: 'sponsor-qr' },
          h('img', {
            class: 'sponsor-qr-image',
            src: 'assets/wechat-reward.png',
            alt: '微信赞赏码',
            draggable: 'false'
          }),
          h('p', {
            class: 'sponsor-qr-hint',
            text: '打开微信「扫一扫」，识别二维码完成赞赏。'
          })
        )
      );
      actions.replaceChildren(
        h('button', { type: 'button', class: 'btn primary', onclick: () => close() }, '关闭')
      );
    }

    async function proceed() {
      // 微信是扫码，留在应用内展示二维码；爱发电需要到浏览器完成
      if (isWechat) {
        renderWechatQr();
        return;
      }

      try {
        await api.app.openExternal(SPONSOR_AFDIAN_URL);
        close();
        toast('已在浏览器中打开爱发电');
      } catch (error) {
        toast(errorText(error), true);
      }
    }

    renderNotice();
    els.modalRoot.append(overlay);
    document.addEventListener('keydown', onKeyDown);
  }

  /* ---------- Global settings ---------- */

  function openGlobalSettings() {
    let closed = false;
    let settled = false;

    const draft = {
      launchMode: state.settings.launchMode || 'steam',
      steamPath: state.settings.steamPath || '',
      customLaunchPath: state.settings.customLaunchPath || '',
      customLaunchArgs: state.settings.customLaunchArgs || '',
      theme: state.settings.theme || 'system',
      showDownloadDialog: state.settings.showDownloadDialog !== false
    };

    const steamInput = h('input', {
      type: 'text',
      value: draft.steamPath,
      placeholder: '可直接填写，例如 D:\\Steam\\steam.exe',
      autocomplete: 'off',
      spellcheck: 'false'
    });
    const customInput = h('input', {
      type: 'text',
      value: draft.customLaunchPath,
      placeholder: '可直接填写启动程序路径',
      autocomplete: 'off',
      spellcheck: 'false'
    });
    const argsInput = h('input', {
      type: 'text',
      value: draft.customLaunchArgs,
      placeholder: '可选，空格分隔'
    });

    const steamFields = h(
      'div',
      { class: `settings-fields${draft.launchMode === 'steam' ? '' : ' is-hidden'}` },
      h('label', { class: 'field-label', text: 'Steam 路径' }),
      h(
        'div',
        { class: 'path-input-row' },
        steamInput,
        h(
          'button',
          {
            type: 'button',
            class: 'btn small',
            onclick: async () => {
              try {
                const path = await api.settings.detectSteamPath();
                if (path) {
                  steamInput.value = normalizeDriveLetter(path);
                  toast('已检测到 Steam');
                } else {
                  toast('未检测到 Steam，请手动选择', true);
                }
              } catch (error) {
                toast(errorText(error), true);
              }
            }
          },
          '自动检测'
        ),
        h(
          'button',
          {
            type: 'button',
            class: 'btn small',
            onclick: async () => {
              try {
                const path = await api.settings.chooseSteamPath();
                if (path) steamInput.value = normalizeDriveLetter(path);
              } catch (error) {
                toast(errorText(error), true);
              }
            }
          },
          '选择'
        )
      ),
      h('div', { class: 'field-hint', text: '留空时启动会自动检测 Steam 安装位置。' })
    );

    const directHint = h(
      'div',
      { class: `settings-fields${draft.launchMode === 'direct' ? '' : ' is-hidden'}` },
      h('div', {
        class: 'field-hint',
        text: '直接运行游戏程序，不经过 Steam，可能没有 Steam 覆层和帧率显示。'
      })
    );

    const customFields = h(
      'div',
      { class: `settings-fields${draft.launchMode === 'custom' ? '' : ' is-hidden'}` },
      h('label', { class: 'field-label', text: '启动程序' }),
      h(
        'div',
        { class: 'path-input-row' },
        customInput,
        h(
          'button',
          {
            type: 'button',
            class: 'btn small',
            onclick: async () => {
              try {
                const path = await api.settings.chooseLaunchProgram();
                if (path) customInput.value = normalizeDriveLetter(path);
              } catch (error) {
                toast(errorText(error), true);
              }
            }
          },
          '选择'
        )
      ),
      h('label', { class: 'field-label', text: '启动参数' }),
      argsInput,
      h('div', { class: 'field-hint', text: '会使用该程序启动游戏，适合其他启动器或脚本。' })
    );

    const updateVisibility = (mode) => {
      steamFields.classList.toggle('is-hidden', mode !== 'steam');
      directHint.classList.toggle('is-hidden', mode !== 'direct');
      customFields.classList.toggle('is-hidden', mode !== 'custom');
    };

    const radioGroup = h('div', { class: 'radio-group choices-row' });
    const modeOptions = [
      ['steam', 'Steam', '通过 Steam 启动'],
      ['direct', '直接启动', '直接运行游戏程序'],
      ['custom', '其他', '使用自定义启动程序']
    ];

    for (const [value, label, description] of modeOptions) {
      const radio = h('input', {
        type: 'radio',
        name: 'launch-mode',
        value,
        checked: draft.launchMode === value
      });
      radio.addEventListener('change', () => {
        if (!radio.checked) return;
        draft.launchMode = value;
        updateVisibility(value);
      });

      radioGroup.append(
        h(
          'label',
          { class: 'radio-row' },
          radio,
          h(
            'span',
            { class: 'radio-text' },
            h('span', { class: 'radio-title', text: label }),
            h('span', { class: 'radio-desc', text: description })
          )
        )
      );
    }

    const themeGroup = h('div', { class: 'radio-group choices-row' });
    const themeOptions = [
      ['light', '浅色', '始终使用浅色界面'],
      ['dark', '深色', '始终使用深色界面'],
      ['system', '跟随系统', '跟随 Windows 的深浅色设置']
    ];

    for (const [value, label, description] of themeOptions) {
      const radio = h('input', {
        type: 'radio',
        name: 'theme-mode',
        value,
        checked: draft.theme === value
      });
      radio.addEventListener('change', () => {
        if (!radio.checked) return;
        draft.theme = value;
        // 先预览，取消时恢复原主题
        previewTheme(value);
      });

      themeGroup.append(
        h(
          'label',
          { class: 'radio-row' },
          radio,
          h(
            'span',
            { class: 'radio-text' },
            h('span', { class: 'radio-title', text: label }),
            h('span', { class: 'radio-desc', text: description })
          )
        )
      );
    }

    const downloadGroup = h('div', { class: 'radio-group choices-row' });
    const downloadOptions = [
      [true, '弹出下载窗口', '开始下载时显示正在下载的进度窗口'],
      [false, '进入后台下载', '不弹窗，进入后台下载']
    ];

    for (const [value, label, description] of downloadOptions) {
      const radio = h('input', {
        type: 'radio',
        name: 'download-dialog',
        checked: draft.showDownloadDialog === value
      });
      radio.addEventListener('change', () => {
        if (!radio.checked) return;
        draft.showDownloadDialog = value;
      });

      downloadGroup.append(
        h(
          'label',
          { class: 'radio-row' },
          radio,
          h(
            'span',
            { class: 'radio-text' },
            h('span', { class: 'radio-title', text: label }),
            h('span', { class: 'radio-desc', text: description })
          )
        )
      );
    }

    const generalPanel = h(
      'div',
      { class: 'settings-tab-panel' },
      h('div', { class: 'field-label', text: '启动方式' }),
      radioGroup,
      steamFields,
      directHint,
      customFields,
      h('div', { class: 'field-label', text: '外观' }),
      themeGroup,
      h('div', { class: 'field-label', text: '下载' }),
      downloadGroup
    );

    const openAboutLink = (url) => {
      api.app.openExternal(url).catch((error) => toast(errorText(error), true));
    };

    const linkButton = (iconName, label, url, title) =>
      h(
        'button',
        {
          type: 'button',
          class: 'btn small',
          title,
          onclick: () => openAboutLink(url)
        },
        icon(iconName),
        label
      );

    const aboutPanel = h(
      'div',
      { class: 'settings-tab-panel is-hidden' },
      h(
        'div',
        { class: 'about-hero' },
        h('img', {
          class: 'about-icon',
          src: '../../build/icon.png',
          alt: '',
          draggable: 'false'
        }),
        h(
          'div',
          { class: 'about-title' },
          h('span', { class: 'about-product', text: 'CtrModManager' }),
          h('span', {
            class: 'about-version',
            text: appVersion ? `v${appVersion}` : '版本未知'
          })
        )
      ),
      h(
        'div',
        { class: 'about-list' },
        h(
          'div',
          { class: 'about-row' },
          h('span', { class: 'about-label', text: '作者' }),
          h('span', { class: 'about-value', text: 'AraoPU2' })
        ),
        h(
          'div',
          { class: 'about-row' },
          h('span', { class: 'about-label', text: '版权' }),
          h('span', {
            class: 'about-value',
            text: 'Copyright (c) 2026 Ar Studio'
          })
        ),
        h(
          'div',
          { class: 'about-row' },
          h('span', { class: 'about-label', text: '源' }),
          h(
            'span',
            { class: 'about-value about-source' },
            icon('thunderstore', 'icon-sm'),
            h('span', { text: '资源来自 Thunderstore' })
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'btn small',
              title: '打开 Thunderstore',
              onclick: () => openAboutLink('https://thunderstore.io/')
            },
            '打开'
          )
        )
      ),
      h(
        'div',
        { class: 'about-loaders' },
        h('div', { class: 'field-label', text: '支持的模组加载器' }),
        h(
          'div',
          { class: 'about-loader-list' },
          h(
            'span',
            { class: 'about-loader' },
            icon('package', 'icon-sm'),
            h('span', { text: 'BepInEx' })
          ),
          h(
            'span',
            { class: 'about-loader' },
            icon('package', 'icon-sm'),
            h('span', { text: 'MelonLoader' })
          )
        )
      ),
      h('div', { class: 'field-label', text: '项目' }),
      h(
        'div',
        { class: 'about-links' },
        linkButton(
          'github',
          '项目仓库',
          'https://github.com/AraoPU/CtrModManager',
          'Github 仓库'
        )
      ),
      h('div', { class: 'field-label', text: '作者主页' }),
      h(
        'div',
        { class: 'about-links' },
        linkButton('bilibili', 'Bilibili', 'https://space.bilibili.com/1371161115', 'Bilibili 主页'),
        linkButton('github', 'GitHub', 'https://github.com/AraoPU', 'GitHub 主页')
      ),
      h(
        'div',
        { class: 'about-extra' },
        h('div', { class: 'field-label', text: '其他' }),
        h(
          'div',
          { class: 'about-links' },
          linkButton('adrarl', 'Adrarl', 'https://adrarl.pages.dev/', 'Adrarl 网站')
        ),
        h('div', {
          class: 'field-hint',
          text: 'Adrarl 是独立的账号管理网站，可用于登录 Ar Studio 的应用，也可在网站中加好友社交聊天，点击打开网站立即体验！'
        })
      )
    );

    const sponsorOption = (iconName, title, description, toneClass, kind) =>
      h(
        'button',
        {
          type: 'button',
          class: `sponsor-option ${toneClass}`,
          onclick: () => openSponsorNotice(kind)
        },
        h('span', { class: 'sponsor-option-icon' }, icon(iconName)),
        h(
          'span',
          { class: 'sponsor-option-text' },
          h('span', { class: 'sponsor-option-title', text: title }),
          h('span', { class: 'sponsor-option-desc', text: description })
        ),
        icon('chevronRight', 'icon-sm sponsor-option-arrow')
      );

    const sponsorPanel = h(
      'div',
      { class: 'settings-tab-panel is-hidden' },
      h(
        'div',
        { class: 'sponsor-intro' },
        h('div', { class: 'sponsor-heading', text: '支持 CtrModManager' }),
        h('p', {
          class: 'sponsor-desc',
          text: '如果这个工具帮你省下了折腾 Mod 的时间，欢迎请我喝一杯。赞助完全出于自愿，不影响任何功能。'
        })
      ),
      h(
        'div',
        { class: 'sponsor-options' },
        sponsorOption('wechat', '微信赞赏', '使用微信扫码，金额随意', 'is-wechat', 'wechat'),
        sponsorOption('afdian', '爱发电', '在爱发电主页持续支持', 'is-afdian', 'afdian')
      ),
      h('div', {
        class: 'field-hint',
        text: '赞助不会解锁额外功能，也不会影响后续更新。'
      })
    );

    const modalTitle = h('h2', { class: 'settings-modal-title', text: '设置' });
    const nav = h('nav', { class: 'settings-modal-nav' });
    const navButtons = new Map();

    const saveActions = h(
      'div',
      { class: 'settings-footer-actions' },
      h('button', { type: 'button', class: 'btn', onclick: () => finish(true) }, '取消'),
      h('button', { type: 'submit', class: 'btn primary' }, '保存')
    );
    const closeActions = h(
      'div',
      { class: 'settings-footer-actions is-hidden' },
      h('button', { type: 'button', class: 'btn primary', onclick: () => finish(true) }, '关闭')
    );

    const panels = new Map([
      ['general', generalPanel],
      ['about', aboutPanel],
      ['sponsor', sponsorPanel]
    ]);
    const panelTitles = { general: '设置', about: '关于', sponsor: '赞助' };

    const switchTab = (key) => {
      for (const [name, button] of navButtons) {
        button.classList.toggle('is-active', name === key);
      }
      for (const [name, panel] of panels) {
        panel.classList.toggle('is-hidden', name !== key);
      }
      modalTitle.textContent = panelTitles[key] || '设置';
      saveActions.classList.toggle('is-hidden', key !== 'general');
      closeActions.classList.toggle('is-hidden', key === 'general');
    };

    for (const [key, label, iconName] of [
      ['general', '常规', 'gear'],
      ['about', '关于', 'info'],
      ['sponsor', '赞助', 'heart']
    ]) {
      const button = h(
        'button',
        {
          type: 'button',
          class: `settings-nav-item${key === 'general' ? ' is-active' : ''}`,
          onclick: () => switchTab(key)
        },
        icon(iconName, 'icon-sm'),
        h('span', { text: label })
      );
      navButtons.set(key, button);
      nav.append(button);
    }

    const form = h(
      'form',
      {
        class: 'modal global-settings-modal',
        onsubmit: async (event) => {
          event.preventDefault();

          const mode = draft.launchMode;
          const steamPath = normalizeDriveLetter(steamInput.value.trim());
          const customLaunchPath = normalizeDriveLetter(customInput.value.trim());
          const customLaunchArgs = argsInput.value;

          if (mode === 'custom' && !customLaunchPath) {
            toast('请选择或填写自定义启动程序路径', true);
            return;
          }

          try {
            state.settings = await api.settings.update({
              launchMode: mode,
              steamPath,
              customLaunchPath,
              customLaunchArgs,
              theme: draft.theme,
              showDownloadDialog: draft.showDownloadDialog
            });
            await previewTheme(state.settings.theme || 'system');
            finish(false);
            toast('设置已保存');
            render();
          } catch (error) {
            toast(errorText(error), true);
          }
        }
      },
      h(
        'div',
        { class: 'settings-modal-header' },
        modalTitle,
        h(
          'button',
          {
            type: 'button',
            class: 'btn small icon-only',
            title: '关闭',
            'aria-label': '关闭',
            onclick: () => finish(true)
          },
          icon('close', 'icon-sm')
        )
      ),
      h(
        'div',
        { class: 'settings-modal-main' },
        h('aside', { class: 'settings-modal-sidebar' }, nav),
        h('div', { class: 'settings-modal-body' }, generalPanel, aboutPanel, sponsorPanel)
      ),
      h('div', { class: 'settings-modal-footer' }, saveActions, closeActions)
    );

    const overlay = h(
      'div',
      {
        class: 'modal-overlay',
        onmousedown: (event) => {
          if (event.target === overlay) finish(true);
        }
      },
      form
    );

    const onKeyDown = (event) => {
      // 上层还叠着赞助声明等子弹窗时，ESC 只关最上层，不要把设置一起关掉
      if (els.modalRoot.lastElementChild !== overlay) return;
      if (event.key === 'Escape') finish(true);
    };

    function finish(revertTheme) {
      if (settled) return;
      settled = true;
      closed = true;
      document.removeEventListener('keydown', onKeyDown);
      overlay.remove();
      // 取消时把预览中的主题恢复成已保存的设置
      if (revertTheme) previewTheme(state.settings.theme || 'system');
    }

    els.modalRoot.append(overlay);
    document.addEventListener('keydown', onKeyDown);

    api.settings
      .detectSteamPath()
      .then((path) => {
        if (!closed && path && !steamInput.value) steamInput.value = normalizeDriveLetter(path);
      })
      .catch(() => {});
  }

  /* ---------- Download & install UI ---------- */

  const ACTIVE_DOWNLOAD_STATES = new Set(['queued', 'downloading', 'extracting']);
  const PENDING_STEP_STATES = new Set(['pending', 'downloading', 'extracting']);

  function downloadsForCurrentProfile() {
    if (!state.gameSlug || !state.profileId) return [];
    return state.downloads.filter(
      (task) => task.game === state.gameSlug && task.profileId === state.profileId
    );
  }

  // 该 Mod（或这次安装里的某个子项）是否正在下载/安装
  function isModBusy(modKey) {
    const key = String(modKey || '').toLowerCase();
    if (!key) return false;

    return downloadsForCurrentProfile().some(
      (task) =>
        ACTIVE_DOWNLOAD_STATES.has(task.status) &&
        (task.steps || []).some(
          (step) =>
            PENDING_STEP_STATES.has(step.status) &&
            // 普通安装的 step.key 是带版本号的 fullName（Author-Mod-1.2.3）；
            // 本地导入任务的 step.key 是不带版本的包名（Author-Mod），需要精确匹配
            (String(step.key || '').toLowerCase() === key ||
              String(step.key || '')
                .toLowerCase()
                .startsWith(`${key}-`))
        )
    );
  }

  function activeDownloadCount() {
    let count = 0;

    for (const task of state.downloads) {
      if (!ACTIVE_DOWNLOAD_STATES.has(task.status)) continue;
      const pending = (task.steps || []).filter((step) =>
        PENDING_STEP_STATES.has(step.status)
      ).length;
      count += pending > 0 ? pending : 1;
    }

    return count;
  }

  function updateDownloadsBadge() {
    if (!els.downloadsBadge) return;
    const count = activeDownloadCount();
    els.downloadsBadge.classList.toggle('is-hidden', count === 0);
    els.downloadsBadge.textContent = count > 99 ? '99+' : String(count);
  }

  // 标题栏下载按钮下方的综合进度条：统计所有正在进行的任务（全局）
  function updateDownloadsTitleProgress() {
    if (!els.downloadsProgress || !els.downloadsProgressFill) return;

    const active = state.downloads.filter((task) =>
      ACTIVE_DOWNLOAD_STATES.has(task.status)
    );

    if (active.length === 0) {
      els.downloadsProgress.classList.add('is-hidden');
      if (els.downloadsButton) els.downloadsButton.title = '下载';
      return;
    }

    const total = active.reduce(
      (sum, task) => sum + Math.min(1, Math.max(0, task.progress || 0)),
      0
    );
    const percent = Math.round((total / active.length) * 100);

    els.downloadsProgress.classList.remove('is-hidden');
    els.downloadsProgressFill.style.width = `${percent}%`;
    if (els.downloadsButton) els.downloadsButton.title = `下载 · 总进度 ${percent}%`;
  }

  // 侧边栏「下载」项的总体进度：只统计正在进行的任务
  function updateDownloadsNavProgress() {
    if (!downloadsNav || !downloadsNav.progress || !downloadsNav.progressFill) return;

    const active = downloadsForCurrentProfile().filter((task) =>
      ACTIVE_DOWNLOAD_STATES.has(task.status)
    );

    if (active.length === 0) {
      downloadsNav.progress.classList.add('is-hidden');
      downloadsNav.progress.removeAttribute('title');
      return;
    }

    const total = active.reduce((sum, task) => sum + Math.min(1, Math.max(0, task.progress || 0)), 0);
    const percent = Math.round((total / active.length) * 100);

    downloadsNav.progress.classList.remove('is-hidden');
    downloadsNav.progressFill.style.width = `${percent}%`;
    downloadsNav.progress.title = `总体进度 ${percent}%`;
  }

  function onDownloadsUpdated() {
    updateDownloadsBadge();
    updateDownloadsTitleProgress();
    updateDownloadsNavProgress();
    if (downloadsOverview) renderDownloadsOverview();

    const count = downloadsForCurrentProfile().length;

    if (downloadsNav) {
      if (downloadsNav.count) downloadsNav.count.textContent = String(count);
    }

    if (state.view === 'game' && state.stage === 'workspace' && state.section === 'downloads') {
      if (downloadsView) {
        downloadsView.count.textContent = `${count} 个`;
        renderDownloadsList(downloadsView.list);
      } else {
        render();
      }
    }

    updateDownloadModal();
  }

  async function handleProfileUpdated(info) {
    if (!info || !state.gameSlug || info.game !== state.gameSlug) return;

    try {
      const list = await api.profiles.list(info.game);
      state.profiles = list;
      let needsRender = false;

      if (state.profileId && !list.some((profile) => profile.id === state.profileId)) {
        const tab = currentTab();
        if (tab) tab.editor = null;
        configEditor = null;
        state.profileId = null;
        state.stage = 'profiles';
        needsRender = true;
      }

      if (state.stage === 'profiles') needsRender = true;
      if (state.view === 'game' && state.stage === 'workspace' && state.section === 'mods') {
        // 只有启用/禁用变化时就地更新列表，避免整页重绘让滚动位置跳动
        needsRender = needsRender || !syncInstalledRows();
      }

      // 非「模组」页时也同步侧边栏的模组数量，避免装完后数字还是旧值
      if (state.view === 'game' && state.stage === 'workspace') {
        const profile = profileById(state.profileId);
        const countEl = els.main.querySelector('.nav-item[data-nav="mods"] .nav-count');
        if (profile && countEl) countEl.textContent = String(profile.mods.length);
      }

      if (
        state.view === 'game' &&
        state.stage === 'workspace' &&
        state.section === 'download' &&
        browserView &&
        browserView.slug === state.gameSlug
      ) {
        updateBrowserResults(state.browser, browserView.count, browserView.list, browserView.pager);
      }

      if (needsRender) render();
    } catch {
      // Ignore refresh failures; the next profile load will retry.
    }
  }

  function openModPicker(mod) {
    if (!state.gameSlug || !state.profileId) return;
    closeModPicker();

    const profile = profileById(state.profileId);
    const installedMod = profile
      ? profile.mods.find(
          (item) =>
            String(item.key || '').toLowerCase() === String(mod.fullName || '').toLowerCase()
        )
      : null;
    const installedVersion = installedMod ? String(installedMod.version || '') : '';
    const pickerWebsiteUrl = modWebsiteUrl(mod);

    let selectedVersion = null;
    let closed = false;

    const versionsArea = h(
      'div',
      { class: 'version-list' },
      h('div', { class: 'version-loading' }, '正在获取版本列表…')
    );
    const versionLabel = h('div', {
      class: 'version-label',
      text: installedVersion ? '切换版本' : '选择版本'
    });
    const startButton = h(
      'button',
      {
        type: 'button',
        class: 'btn primary',
        disabled: true
      },
      installedVersion ? '切换版本' : '开始下载'
    );

    function updateStartButton() {
      if (!selectedVersion) {
        startButton.disabled = true;
        return;
      }

      if (installedVersion && selectedVersion.versionNumber === installedVersion) {
        startButton.disabled = true;
        startButton.textContent = '当前版本';
      } else {
        startButton.disabled = false;
        startButton.textContent = installedVersion ? '切换版本' : '开始下载';
      }
    }

    const overlay = h(
      'div',
      {
        class: 'modal-overlay',
        onmousedown: (event) => {
          if (event.target === overlay) closePicker();
        }
      },
      h(
        'div',
        { class: 'modal mod-picker-modal' },
        h(
          'div',
          { class: 'mod-picker-head' },
          buildModIcon(mod),
          h(
            'div',
            { class: 'mod-picker-title' },
            h('h2', { text: mod.name }),
            h('p', { text: `by ${mod.owner}` })
          )
        ),
        h('p', { class: 'mod-picker-desc', text: mod.description || '暂无描述' }),
        versionLabel,
        versionsArea,
        h(
          'div',
          { class: 'modal-actions' },
          pickerWebsiteUrl
            ? h(
                'button',
                {
                  type: 'button',
                  class: 'btn',
                  onclick: () => {
                    api.app
                      .openExternal(pickerWebsiteUrl)
                      .catch((error) => toast(errorText(error), true));
                  }
                },
                '打开 Thunderstore'
              )
            : null,
          h('button', { type: 'button', class: 'btn', onclick: () => closePicker() }, '取消'),
          startButton
        )
      )
    );

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closePicker();
    };

    function closePicker() {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKeyDown);
      overlay.remove();
      modPicker = null;
    }

    modPicker = { overlay, close: closePicker };
    document.addEventListener('keydown', onKeyDown);
    els.modalRoot.append(overlay);

    api.mods
      .versions(state.gameSlug, mod.uuid)
      .then((data) => {
        if (closed) return;
        const versions = Array.isArray(data.versions) ? data.versions : [];
        if (versions.length === 0) {
          versionsArea.replaceChildren(h('div', { class: 'version-loading', text: '没有可用版本' }));
          return;
        }

        selectedVersion = versions[0];
        versionsArea.replaceChildren();

        if (installedVersion) {
          const currentSelect = h(
            'select',
            { class: 'version-select', disabled: true },
            h('option', { value: installedVersion }, `v${installedVersion}`)
          );

          const targetSelect = h(
            'select',
            { class: 'version-select' },
            versions.map((version, index) =>
              h(
                'option',
                { value: version.versionNumber },
                `v${version.versionNumber}${index === 0 ? '（最新）' : ''}`
              )
            )
          );

          const targetMeta = h('div', { class: 'version-meta version-target-meta' });
          targetSelect.value = selectedVersion.versionNumber;

          const updateTargetMeta = () => {
            if (!selectedVersion) return;
            targetMeta.textContent = `${formatDay(selectedVersion.dateCreated)} · ${formatCompact(
              selectedVersion.downloads
            )} 次下载`;
          };

          targetSelect.addEventListener('change', () => {
            const match = versions.find(
              (version) => version.versionNumber === targetSelect.value
            );
            if (!match) return;
            selectedVersion = match;
            updateTargetMeta();
            updateStartButton();
          });

          versionsArea.append(
            h(
              'div',
              { class: 'version-switch' },
              h(
                'div',
                { class: 'version-field' },
                h('span', { class: 'version-field-label', text: '当前版本' }),
                currentSelect
              ),
              icon('chevronRight', 'icon-sm'),
              h(
                'div',
                { class: 'version-field' },
                h('span', { class: 'version-field-label', text: '目标版本' }),
                targetSelect
              )
            ),
            targetMeta
          );

          updateTargetMeta();
          updateStartButton();
          return;
        }

        versions.forEach((version, index) => {
          const row = h(
            'button',
            {
              type: 'button',
              class: `version-option${version === selectedVersion ? ' is-selected' : ''}`
            },
            h(
              'div',
              { class: 'version-main' },
              h('span', { class: 'version-number', text: `v${version.versionNumber}` }),
              index === 0 ? h('span', { class: 'tag-default', text: '最新' }) : null
            ),
            h('div', {
              class: 'version-meta',
              text: `${formatDay(version.dateCreated)} · ${formatCompact(version.downloads)} 次下载`
            })
          );

          row.addEventListener('click', () => {
            selectedVersion = version;
            for (const option of versionsArea.querySelectorAll('.version-option')) {
              option.classList.toggle('is-selected', option === row);
            }
            updateStartButton();
          });

          versionsArea.append(row);
        });

        updateStartButton();
      })
      .catch((error) => {
        if (closed) return;
        versionsArea.replaceChildren(
          h('div', { class: 'version-loading', text: `版本获取失败：${errorText(error)}` })
        );
      });

    startButton.addEventListener('click', async () => {
      if (!selectedVersion || startButton.disabled) return;

      const previousLabel = startButton.textContent;
      startButton.disabled = true;
      startButton.textContent = '处理中…';

      try {
        const task = await api.downloads.start({
          game: state.gameSlug,
          profileId: state.profileId,
          uuid: mod.uuid,
          versionNumber: selectedVersion.versionNumber,
          name: mod.name
        });

        closePicker();
        if (!state.downloads.some((item) => item.id === task.id)) {
          state.downloads = [task, ...state.downloads];
        }
        onDownloadsUpdated();
        openDownloadUi(task.id);
      } catch (error) {
        startButton.disabled = false;
        startButton.textContent = previousLabel;
        toast(errorText(error), true);
      }
    });
  }

  function closeModPicker() {
    if (modPicker) modPicker.close();
  }

  // 统一打开 Thunderstore 的 Mod 页面（manifest 里的 website_url 经常是 GitHub）
  function modWebsiteUrl(mod) {
    const key = String(mod.key || mod.fullName || '');
    const dash = key.indexOf('-');

    if (dash > 0 && state.gameSlug) {
      const owner = encodeURIComponent(key.slice(0, dash));
      const name = encodeURIComponent(key.slice(dash + 1));
      return `https://thunderstore.io/c/${encodeURIComponent(state.gameSlug)}/p/${owner}/${name}/`;
    }

    return mod.websiteUrl || null;
  }

  function lookupRemotePackage(mod) {
    const target = String(mod.key || '').toLowerCase();
    if (!target) return Promise.resolve(null);

    const match = (list) =>
      (Array.isArray(list) ? list : []).find(
        (pkg) => String(pkg.fullName || '').toLowerCase() === target
      ) || null;

    const cached = match(state.browser.packages);
    if (cached) return Promise.resolve(cached);

    return remotePackagesForGame().then((map) => map.get(target) || null);
  }

  function openModDetail(mod) {
    if (modDetail) modDetail.close();

    const profile = profileById(state.profileId);
    const dependents = (profile ? profile.mods : []).filter(
      (item) =>
        item.key !== mod.key &&
        (item.dependencies || []).some(
          (dependency) =>
            dependencyPackageName(dependency).toLowerCase() === String(mod.key).toLowerCase()
        )
    );

    const description = h('p', {
      class: 'mod-detail-desc',
      text: mod.description || '暂无描述'
    });

    if (!mod.description) {
      lookupRemotePackage(mod).then((pkg) => {
        if (!pkg || !pkg.description || !description.isConnected) return;
        description.textContent = pkg.description;
      });
    }

    const dependencies = (mod.dependencies || []).map((dependency) =>
      dependencyPackageName(dependency)
    );
    const websiteUrl = modWebsiteUrl(mod);
    const detailDeprecatedFlag = h('span', {
      class: 'mod-flag is-hidden',
      text: '已弃用'
    });

    lookupRemotePackage(mod).then((pkg) => {
      if (pkg && pkg.deprecated && detailDeprecatedFlag.isConnected) {
        detailDeprecatedFlag.classList.remove('is-hidden');
      }
    });

    const sharedNote = h('p', { class: 'mod-detail-note is-hidden' });

    const overlay = h(
      'div',
      {
        class: 'modal-overlay',
        onmousedown: (event) => {
          if (event.target === overlay) close();
        }
      },
      h(
        'div',
        { class: 'modal mod-detail' },
        h(
          'div',
          { class: 'mod-detail-head' },
          buildInstalledModIcon(mod, 'mod-detail-icon'),
          h(
            'div',
            { class: 'mod-detail-heading' },
            h(
              'div',
              { class: 'mod-detail-title-line' },
              h('h2', { text: mod.name || '未命名 Mod' }),
              mod.version
                ? h('span', { class: 'mod-detail-version', text: `v${mod.version}` })
                : null,
              detailDeprecatedFlag
            ),
            h(
              'div',
              { class: 'mod-detail-meta' },
              h('span', { text: mod.author || '未知作者' }),
              h('span', { text: mod.enabled ? '已启用' : '已停用' }),
              mod.key && mod.key !== mod.name
                ? h('span', { class: 'mod-detail-key', text: mod.key })
                : null
            )
          )
        ),
        h(
          'div',
          { class: 'mod-detail-section' },
          h('div', { class: 'mod-detail-label', text: '描述' }),
          description
        ),
        dependencies.length
          ? h(
              'div',
              { class: 'mod-detail-section' },
              h('div', { class: 'mod-detail-label', text: `依赖 ${dependencies.length} 个` }),
              h('div', { class: 'mod-detail-deps', text: dependencies.join('、') })
            )
          : null,
        dependents.length
          ? h('p', {
              class: 'mod-detail-note',
              text: `以下 Mod 依赖它：${dependents.map((item) => item.name).join('、')}`
            })
          : null,
        sharedNote,
        h(
          'div',
          { class: 'modal-actions' },
          websiteUrl
            ? h(
                'button',
                {
                  type: 'button',
                  class: 'btn small',
                  onclick: () => {
                    api.app.openExternal(websiteUrl).catch((error) => toast(errorText(error), true));
                  }
                },
                '打开 Thunderstore'
              )
            : null,
          h(
            'button',
            {
              type: 'button',
              class: 'btn small danger',
              onclick: () => uninstallMod(mod, dependents, close)
            },
            '卸载'
          ),
          h('button', { type: 'button', class: 'btn small primary', onclick: () => close() }, '关闭')
        )
      )
    );

    const onKeyDown = (event) => {
      if (event.key === 'Escape') close();
    };

    function close() {
      document.removeEventListener('keydown', onKeyDown);
      overlay.remove();
      if (modDetail && modDetail.overlay === overlay) modDetail = null;
    }

    els.modalRoot.append(overlay);
    document.addEventListener('keydown', onKeyDown);
    modDetail = { overlay, close };

    sharedInfoFor(mod.key).then((info) => {
      if (!info || !info.count || !sharedNote.isConnected) return;
      sharedNote.textContent = `与 ${info.packages.join('、')} 共享 ${info.count} 个文件，卸载时会保留这些文件`;
      sharedNote.classList.remove('is-hidden');
    });
  }

  // 查询某个 Mod 与其它 Mod 共享的文件（主进程按安装记录聚合）
  async function sharedInfoFor(modKey) {
    if (!modKey || !state.gameSlug || !state.profileId) return null;
    try {
      const map = await api.profiles.sharedFiles(state.gameSlug, state.profileId);
      if (!map) return null;
      const target = String(modKey).toLowerCase();
      const hit = Object.entries(map).find(([key]) => String(key).toLowerCase() === target);
      return hit ? hit[1] : null;
    } catch {
      return null;
    }
  }

  async function uninstallMod(mod, dependents, close) {
    if (isModBusy(mod.key)) {
      toast('该 Mod 正在下载或安装，请稍后再卸载', true);
      return;
    }

    const message = dependents.length
      ? `确定卸载 ${mod.name}？文件会从当前配置中删除。依赖它的 Mod（${dependents
          .map((item) => item.name)
          .join('、')}）可能无法正常工作。`
      : `确定卸载 ${mod.name}？文件会从当前配置中删除。`;

    const shared = await sharedInfoFor(mod.key);
    const sharedText =
      shared && shared.count > 0
        ? ` 其中 ${shared.count} 个文件与（${shared.packages.join('、')}）共享，卸载时会保留。`
        : '';

    const confirmed = await confirmModal({
      title: '卸载 Mod',
      message: message + sharedText,
      confirmText: '卸载'
    });
    if (!confirmed) return;

    try {
      const result = await api.profiles.uninstallMod(state.gameSlug, state.profileId, mod.key);
      if (close) close();
      if (state.configs.game === state.gameSlug && state.configs.profileId === state.profileId) {
        state.configs = {
          game: state.gameSlug,
          profileId: state.profileId,
          files: [],
          loading: false,
          loaded: false,
          error: null
        };
      }
      const configs = Number(result && result.configs) || 0;
      toast(configs > 0 ? `已卸载 ${mod.name}，并删除 ${configs} 个配置文件` : `已卸载 ${mod.name}`);
    } catch (error) {
      toast(errorText(error), true);
    }
  }

  function openDownloadUi(taskId) {
    if (state.settings.showDownloadDialog === false) return;
    openDownloadModal(taskId);
  }

  function openDownloadModal(taskId) {
    closeDownloadModal();

    const body = h('div', { class: 'download-modal-body' });
    const overlay = h(
      'div',
      {
        class: 'modal-overlay',
        onmousedown: (event) => {
          if (event.target === overlay) closeDownloadModal();
        }
      },
      h('div', { class: 'modal download-modal' }, body)
    );

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeDownloadModal();
    };

    document.addEventListener('keydown', onKeyDown);
    els.modalRoot.append(overlay);

    activeDownloadModal = {
      id: taskId,
      overlay,
      body,
      onKeyDown,
      snapshot: null
    };

    updateDownloadModal();
  }

  function closeDownloadModal() {
    if (!activeDownloadModal) return;
    document.removeEventListener('keydown', activeDownloadModal.onKeyDown);
    activeDownloadModal.overlay.remove();
    activeDownloadModal = null;
  }

  function updateDownloadModal() {
    if (!activeDownloadModal) return;

    const task =
      state.downloads.find((item) => item.id === activeDownloadModal.id) ||
      activeDownloadModal.snapshot;

    if (!task) {
      closeDownloadModal();
      return;
    }

    activeDownloadModal.snapshot = task;

    const action =
      task.kind === 'local' ? '导入' : task.kind === 'import' ? '导入配置' : '下载';

    const scrolled = activeDownloadModal.body.scrollTop;

    const nodes = [
      h('h2', {
        text:
          task.status === 'done'
            ? `${action}完成`
            : task.status === 'error'
              ? `${action}失败`
              : `正在${action}`
      }),
      buildDownloadCard(task, { showActions: false })
    ];

    if (task.status === 'error') {
      nodes.push(h('div', { class: 'modal-actions' }, buildDownloadRetryButton(task)));
    }

    activeDownloadModal.body.replaceChildren(...nodes);

    if (scrolled > 0) activeDownloadModal.body.scrollTop = scrolled;

    // 下载完成后立即关闭，不需要用户再点确认
    if (task.status === 'done') closeDownloadModal();
  }

  function openDownloadsOverview() {
    closeDownloadsOverview();

    const body = h('div', { class: 'downloads-overview-body' });
    const overlay = h(
      'div',
      {
        class: 'modal-overlay',
        onmousedown: (event) => {
          if (event.target === overlay) closeDownloadsOverview();
        }
      },
      h(
        'div',
        { class: 'modal downloads-overview' },
        h('h2', { text: '下载' }),
        body,
        h(
          'div',
          { class: 'modal-actions' },
          h('button', { type: 'button', class: 'btn', onclick: () => closeDownloadsOverview() }, '关闭')
        )
      )
    );

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeDownloadsOverview();
    };

    downloadsOverview = { overlay, body, onKeyDown };
    els.modalRoot.append(overlay);
    document.addEventListener('keydown', onKeyDown);
    renderDownloadsOverview();
  }

  function closeDownloadsOverview() {
    if (!downloadsOverview) return;
    document.removeEventListener('keydown', downloadsOverview.onKeyDown);
    downloadsOverview.overlay.remove();
    downloadsOverview = null;
  }

  function renderDownloadsOverview() {
    if (!downloadsOverview) return;

    const body = downloadsOverview.body;
    const scrollTop = body.scrollTop;
    body.replaceChildren();

    if (state.downloads.length === 0) {
      body.append(
        h(
          'div',
          { class: 'content-empty' },
          h('p', { text: '没有下载任务' }),
          h('span', { text: '从游戏里的「下载模组」开始添加 Mod。' })
        )
      );
      return;
    }

    const groups = new Map();
    for (const task of state.downloads) {
      if (!groups.has(task.game)) groups.set(task.game, []);
      groups.get(task.game).push(task);
    }

    for (const [slug, tasks] of groups) {
      const game = findGame(slug);
      const downloading = tasks.some((task) => ACTIVE_DOWNLOAD_STATES.has(task.status));

      body.append(
        h(
          'div',
          { class: 'overview-game' },
          h(
            'div',
            { class: 'overview-game-head' },
            h('strong', { text: game ? game.name : slug }),
            downloading ? h('span', { class: 'overview-game-state', text: '下载中' }) : null,
            h('span', { class: 'spacer' }),
            h(
              'button',
              {
                type: 'button',
                class: 'ghost-inline',
                onclick: () => openGameDownloads(slug, tasks[0].profileId)
              },
              '打开游戏'
            )
          ),
          ...tasks.map((task) => buildDownloadCard(task))
        )
      );
    }

    if (scrollTop > 0) body.scrollTop = scrollTop;
  }

  async function openGameDownloads(slug, profileId) {
    closeDownloadsOverview();

    if (!(state.view === 'game' && state.gameSlug === slug)) {
      await openGame(slug);
    }

    if (state.gameSlug !== slug) return;

    if (state.stage === 'profiles' && state.profiles.some((profile) => profile.id === profileId)) {
      enterProfile(profileId);
    }

    if (state.stage === 'workspace' && state.profileId === profileId) {
      setSection('downloads');
    }
  }

  /* ---------- Modal & toast ---------- */

  function promptModal(options) {
    return new Promise((resolve) => {
      let settled = false;

      const input = h('input', {
        type: 'text',
        placeholder: options.placeholder || '',
        autocomplete: 'off',
        spellcheck: 'false',
        value: options.value || ''
      });

      const finish = (value) => {
        if (settled) return;
        settled = true;
        document.removeEventListener('keydown', onKeyDown);
        overlay.remove();
        resolve(value);
      };

      const form = h(
        'form',
        {
          class: 'modal',
          onsubmit: (event) => {
            event.preventDefault();
            const value = input.value.trim();
            if (!value) {
              input.focus();
              return;
            }
            finish(value);
          }
        },
        h('h2', { text: options.title }),
        h('div', { class: 'field' }, h('label', { text: options.label }), input),
        h(
          'div',
          { class: 'modal-actions' },
          h(
            'button',
            { type: 'button', class: 'btn', onclick: () => finish(null) },
            '取消'
          ),
          h('button', { type: 'submit', class: 'btn primary', text: options.confirmText || '确定' })
        )
      );

      const overlay = h(
        'div',
        {
          class: 'modal-overlay',
          onmousedown: (event) => {
            if (event.target === overlay) finish(null);
          }
        },
        form
      );

      const onKeyDown = (event) => {
        if (event.key === 'Escape') finish(null);
      };

      els.modalRoot.append(overlay);
      document.addEventListener('keydown', onKeyDown);
      setTimeout(() => {
        input.focus();
        if (input.value) input.select();
      }, 30);
    });
  }

  function confirmModal(options) {
    return new Promise((resolve) => {
      let settled = false;

      const finish = (value) => {
        if (settled) return;
        settled = true;
        document.removeEventListener('keydown', onKeyDown);
        overlay.remove();
        resolve(value);
      };

      const overlay = h(
        'div',
        {
          class: 'modal-overlay',
          onmousedown: (event) => {
            if (event.target === overlay) finish(false);
          }
        },
        h(
          'div',
          { class: 'modal' },
          h('h2', { text: options.title }),
          h('p', { text: options.message }),
          h(
            'div',
            { class: 'modal-actions' },
            h(
              'button',
              { type: 'button', class: 'btn', onclick: () => finish(false) },
              '取消'
            ),
            h(
              'button',
              {
                type: 'button',
                class: 'btn danger',
                onclick: () => finish(true)
              },
              options.confirmText || '确定'
            )
          )
        )
      );

      const onKeyDown = (event) => {
        if (event.key === 'Escape') finish(false);
      };

      els.modalRoot.append(overlay);
      document.addEventListener('keydown', onKeyDown);
      setTimeout(() => {
        const button = overlay.querySelector('.btn.danger');
        if (button) button.focus();
      }, 30);
    });
  }

  function toast(message, isError) {
    const item = h('div', { class: `toast${isError ? ' error' : ''}`, text: message });
    els.toastRoot.append(item);
    setTimeout(() => {
      item.classList.add('is-leaving');
      setTimeout(() => item.remove(), 220);
    }, 2600);
  }
})();

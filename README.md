# CtrModManager

一个简洁、配置隔离的 Windows 桌面 Mod 管理器，面向 [Thunderstore](https://thunderstore.io) 生态。

![Platform](https://img.shields.io/badge/Platform-Windows-0078D4)
![Electron](https://img.shields.io/badge/Electron-45-47848F?logo=electron&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-2ea44f)

CtrModManager 会把每个 Mod 配置（Profile）完整保存在应用数据目录中，让游戏目录保持干净：只有「以 Mod 启动」时才注入当前配置需要的加载器文件，从 Steam 直接启动仍然是原版。支持 BepInEx 与 MelonLoader，并可与 r2modman 的 `.r2z` 配置互相导入导出。


<!--
界面截图：把图片放到 docs/screenshots/ 下，取消下方注释即可生效。
建议 1280×800（或等比例）PNG，单张控制在 500 KB 内；首图用深色主题辨识度更高。

![主页](docs/screenshots/home.png)
![已安装模组](docs/screenshots/mods.png)
![获取模组](docs/screenshots/browse.png)
-->

## 功能

### Mod 浏览与安装

- 浏览 Thunderstore 上的游戏社区，支持搜索、排序（默认 / 下载量 / 最近更新 / 名称）与隐藏已弃用 Mod
- 一键安装并自动解析、补齐依赖；下载队列、分步进度、失败重试
- 支持从本地 `.zip` 导入 Mod
- 检查已安装 Mod 的版本更新，支持批量更新

### 配置（Profile）

- 同一游戏可创建多个独立配置，Mod 与配置文件互不影响
- 文件级启用 / 禁用与卸载；跨 Mod 共享的文件会被保护，避免误删
- 检测 Mod 之间的文件冲突，可指定由哪个 Mod 覆盖
- 扫描并清理未跟踪文件；启动前自动修复配置记录
- 内置 `.cfg` 配置编辑器
- 配置导入 / 导出为 `.r2z`，与 r2modman 互通

### 加载器与启动

- 「以 Mod 启动」与「启动原版」两种模式
- 通过 Steam 或自定义启动程序启动，支持自定义游戏参数与 Mod 启动参数
- 自动检测 Steam、Epic 游戏安装路径与 Steam AppID

### 界面

- 浅色 / 深色 / 跟随系统主题
- 收藏、默认游戏、新游戏标记、下载任务面板
- 无边框自定义标题栏；原生 JS 实现，无前端框架

## 环境要求

- Windows 10 / 11
- 使用安装包时无需单独安装 Node.js（安装包自带运行时）
- 从源码运行或构建需要 Node.js 18+（建议 20 LTS 或更高）与 npm

## 快速开始

1. 从 [Releases](../../releases) 下载 `CtrModManager-Setup-<version>.exe` 并安装，或按下方「本地开发」自行构建。
2. 打开后选择游戏；如果未自动识别游戏路径，请在设置中手动选择游戏可执行文件。
3. 新建或选择一个 Mod 配置。
4. 在「获取模组」中搜索并安装 Mod，依赖会自动补齐；也可以「导入配置 (.r2z)」。
5. 点击「以 Mod 启动」开始游戏，或点击「启动原版」干净启动。
6. 在「设置 → 配置」中可将当前配置导出为 `.r2z`，用于备份或分享。

> **首次安装会被 SmartScreen 拦截。** 当前安装包没有代码签名，Windows 会提示「未知发布者」。点「更多信息 → 仍要运行」即可；下载后建议先按下方「验证安装包」核对 SHA256。

### 验证安装包

每个 Release 的说明里会给出安装包的 SHA256。下载后可在 PowerShell 中核对：

```powershell
Get-FileHash .\CtrModManager-Setup-1.0.0.exe -Algorithm SHA256
```

输出与 Release 说明中的哈希一致，才说明文件在传输过程中没有被替换。

## 本地开发

```bash
git clone https://github.com/AraoPU/CtrModManager.git
cd CtrModManager
npm install
npm start
```

构建：

```bash
npm run pack          # 生成未打包目录 release/win-unpacked
npm run dist          # 生成 NSIS 安装包 release/CtrModManager-Setup-<version>.exe
npm run dist:portable # 生成便携版 release/CtrModManager-Portable-<version>.exe
```

`package.json` 中配置了 Electron / electron-builder 的国内镜像（npmmirror）。如果在其他网络环境下构建缓慢或失败，可删除 `config.electron_builder_binaries_mirror` 或替换为合适的镜像。

目前没有自动化测试，提交前请手动验证「安装 → 启用 / 禁用 → 启动 → 卸载」主流程。

## 目录结构

```text
src/
├─ main/                 主进程
│  ├─ main.js            应用入口、窗口与 IPC 路由
│  ├─ installer.js       下载、解压、依赖、启停、冲突、修复
│  ├─ launcher.js        加载器注入、路径检测、游戏启动
│  ├─ thunderstore.js    Thunderstore API 与缓存
│  ├─ profiles.js        配置元数据与 mods.yml
│  ├─ profileTransfer.js .r2z 导入 / 导出
│  ├─ configService.js   .cfg 配置读写
│  ├─ loaders.js         BepInEx / MelonLoader 定义
│  ├─ installRules.js    安装路径规则
│  ├─ profileLock.js     配置级异步互斥锁
│  └─ store.js           设置与本地缓存
├─ preload/preload.js    contextBridge IPC 白名单
└─ renderer/             原生 HTML / CSS / JS 界面
   ├─ index.html         窗口骨架、CSP、标题栏
   ├─ app.js             视图渲染与交互（单文件，按功能分区注释）
   └─ styles.css         主题变量与全部样式
```

## 数据存放

所有配置与缓存都保存在 `%APPDATA%\CtrModManager`，卸载应用不会删除这些数据：

```text
%APPDATA%\CtrModManager\
├─ settings.json
├─ games-cache.json
├─ seen-games.json
└─ profiles\
   └─ <game-slug>\
      └─ <profile>\
         ├─ profile.json
         ├─ mods.yml
         ├─ .ctr\installed.json
         ├─ .ctr\loader.json
         └─ BepInEx\ 或 MelonLoader\ ...
```

游戏目录只在启动时写入当前配置所需的加载器根文件（例如 `winhttp.dll`、`doorstop_config.ini`），并记录在清单中；切换配置或原版启动时会自动清理。

## 技术栈

- [Electron](https://www.electronjs.org/) 45 + 原生 HTML / CSS / JavaScript，无前端框架
- [adm-zip](https://www.npmjs.com/package/adm-zip) 解压，[js-yaml](https://www.npmjs.com/package/js-yaml) 读写 `mods.yml` 与 `export.r2x`
- 主进程负责所有文件与网络操作；渲染进程开启 `contextIsolation` 与 `sandbox`，仅通过 preload 暴露的白名单 IPC 通信
- 页面启用 CSP，外部链接统一交给系统浏览器打开

## 安全性说明

一个 Mod 管理器要往你的游戏目录里写文件，所以它必须对得起这份权限。目前已做的防护：

- **渲染进程完全沙箱化**：`sandbox` 与 `contextIsolation` 开启、`nodeIntegration` 关闭，界面代码无法直接访问文件系统
- **IPC 白名单**：所有主进程能力都必须在 `preload.js` 中显式声明，参数在主进程侧校验
- **路径校验**：来自界面的相对路径统一归一化，拒绝 `..`、绝对路径与盘符，并二次确认解析结果仍在配置目录内
- **CSP 与导航锁定**：页面禁止跳转与开新窗口，`http` / `https` 以外的链接一律拒绝；Mod 图标的 CDN 域名单独放行
- **解压保护**：限制单个包的条目数与解压总量，解压失败会回滚已写入的文件
- **游戏目录可追溯**：注入到游戏目录的加载器文件都有清单记录，切换配置或原版启动时自动清理

**已知限制**：当前版本下载 Mod 后只校验 ZIP 结构是否完整，**没有做哈希比对**，安全性依赖 Thunderstore 的 HTTPS 通道。如果上游包本身被篡改，本工具发现不了。计划在后续版本补上完整性校验；在那之前，请只安装来自可信作者的 Mod。

发现安全问题请通过 Issues 或私下联系作者，先不要公开披露细节。

## 兼容性说明

- 仅支持 Windows：路径检测、Steam / Epic 清单读取依赖 Windows 环境
- 依赖 Thunderstore 公开 API，网络不可用时只能管理已安装的 Mod
- 游戏路径与 AppID 检测为尽力而为，失败时可手动指定
- `.r2z` 与 r2modman 格式兼容，但 Mod 的实际启用状态以本工具为准
- 本项目与 Thunderstore、r2modman、BepInEx、MelonLoader 均无隶属关系

## 贡献

欢迎提交 Issue 与 Pull Request。

- 保持原生 JS，不引入前端框架；新增依赖前请先讨论
- 主进程新增 IPC 时请在 [preload.js](src/preload/preload.js) 中显式暴露，并校验参数与路径
- 涉及配置文件读写时注意配置级并发，参考 [profileLock.js](src/main/profileLock.js)
- 提交前运行 `npm start`，手动验证受影响的流程

## 许可证

本项目基于 [MIT License](LICENSE) 开源。

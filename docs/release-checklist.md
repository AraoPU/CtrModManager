# 发布检查清单

> 每次发版照着走一遍。目标是让「下载 → 校验 → 安装 → 启动」这条路上没有需要用户猜的地方。

---

## 1. 发版前

- [ ] `npm start` 手动跑通主流程：**安装 → 启用 / 禁用 → 以 Mod 启动 → 卸载**
- [ ] 至少用一个真实游戏验证「以 Mod 启动」和「启动原版」都能进游戏
- [ ] 确认 `%APPDATA%\CtrModManager\profiles\<game>\<profile>\` 下没有残留的 `.old` 文件
- [ ] 确认游戏目录在「启动原版」后已清理干净（`winhttp.dll`、`doorstop_config.ini` 不应残留）
- [ ] 更新 `package.json` 的 `version`
- [ ] 更新 README 中涉及版本号的内容（如无则跳过）

## 2. 构建

```bash
rm -rf release
npm run dist            # NSIS 安装包
npm run dist:portable   # 便携版单文件 exe
```

产物应只有两个：

| 文件 | 用途 |
| --- | --- |
| `release/CtrModManager-Setup-<version>.exe` | 安装版，推荐给大多数用户 |
| `release/CtrModManager-Portable-<version>.exe` | 便携版，解压即用、不写注册表 |

> **不要上传 `release/win-unpacked.zip`。** 它是 electron-builder 的中间目录，解压后是三千多个文件、用户找不到该点哪个 exe。它比不提供绿色版更糟。真正的绿色版用 `npm run dist:portable`。

## 3. 生成哈希

```bash
cd release
sha256sum CtrModManager-Setup-*.exe CtrModManager-Portable-*.exe
```

Windows 上也可以用 PowerShell：

```powershell
Get-FileHash .\release\CtrModManager-Setup-0.1.0.exe -Algorithm SHA256
```

把结果填进下面的 Release 说明。

## 4. Release 说明模板

````markdown
## CtrModManager vX.Y.Z

<一两句话说明这个版本解决了什么。首版可写项目定位，后续版本写重点变化。>

### 下载

| 文件 | 说明 |
| --- | --- |
| `CtrModManager-Setup-X.Y.Z.exe` | 安装版（推荐） |
| `CtrModManager-Portable-X.Y.Z.exe` | 便携版，单文件，不写注册表 |

> 安装包没有代码签名，Windows SmartScreen 会提示「未知发布者」。点「更多信息 → 仍要运行」即可。
> 介意的话可以先核对下面的哈希。

### 校验

```text
SHA256 (CtrModManager-Setup-X.Y.Z.exe)    = <填入>
SHA256 (CtrModManager-Portable-X.Y.Z.exe) = <填入>
```

核对方式（PowerShell）：

```powershell
Get-FileHash .\CtrModManager-Setup-X.Y.Z.exe -Algorithm SHA256
```

### 变化

- 新增 …
- 修复 …
- 调整 …

### 已知限制

- 仅支持 Windows 10 / 11
- 下载的 Mod 包暂未做哈希校验，请只安装来自可信作者的 Mod
- 目前没有自动化测试，发版前为手动验证
````

## 5. 发布

- [ ] 打 tag：`git tag -a vX.Y.Z -m "vX.Y.Z"` 然后 `git push origin vX.Y.Z`
- [ ] 创建 Release，粘贴上一步的说明，上传两个 exe
- [ ] **首版之外不要勾 pre-release**：勾选后 Release 不会出现在仓库首页的「Latest」，访客会以为项目没发布过
- [ ] 发布后打开无痕窗口检查一遍 Release 页面：表格是否渲染、哈希是否完整、下载链接是否可用

## 6. GitHub 仓库设置（一次性）

**About 描述**：保持 `A Game Mod Management Tool`，不展开。定位与差异化的说明放在 README 第一段，描述只做一句克制自我介绍。

> 注意：描述保持极简后，**Topics 就成了唯一的机器可读信号**。GitHub 站内搜索主要看仓库名、topics 与 README 正文；描述影响的是「人点不点进来」，不是「搜不搜得到」。所以下面这一项不要省。

**Topics**（最多 20 个，直接影响站内搜索能否命中）：

```text
mod-manager  thunderstore  bepinex  melonloader  r2modman  game-modding
electron  windows  unity-modding  modding-tool
```

**其它**

- [ ] Website 填仓库地址（`homepage` 为空时 GitHub 不显示外链）
- [ ] 确认 Issues 已开启
- [ ] README 顶部的三张截图取消注释前，先把图片放进 `docs/screenshots/`

# 钉一钉 · Ding Wall

**给小团队的暖纸共享信息墙 —— 一个 DeepSeek Harness 面板插件。**

想法变成便签，待办变成索引卡，匿名意见投进牛皮纸信箱。小团队实时同步，手绘风格的「团队心跳」，还有适合站会的晨报模式。

[English](README.en.md) · **简体中文** · [让 Agent 安装](#让-agent-安装) · [手动安装](#手动安装) · [截图](#截图) · [功能](#功能)

![钉一钉面板](screenshots/panel-wide.png)

## 让 Agent 安装

把下面这段提示词发给一个能在你电脑上执行操作的 AI Agent（DeepSeek Harness、Claude Code、Codex，或任何有 shell / 文件权限的 Agent），它会帮你从头装好。

> **安装提示词（复制这一段）**
>
> 请帮我安装 DeepSeek Harness 插件 **钉一钉**（`dsh-ding-wall`），仓库地址：https://github.com/Into-the-Numind/Ding-Wall
>
> 1. 把仓库克隆到一个**固定目录**，例如：
>    `git clone https://github.com/Into-the-Numind/Ding-Wall.git ~/dsh-plugins/dsh-ding-wall`
>    这个目录要保留，DeepSeek Harness 会从它加载插件，安装后不要删除或移动。
> 2. 在这个 DeepSeek Harness 里把该目录安装为插件包：
>    - 如果你有 `plugin_manager` 工具：调用 `install_bundle`，`target` 设为克隆下来的目录**绝对路径**（包含 `package.json` 的那一层），并确保它已启用；
>    - 否则让我从「插件管理器 → 添加插件 → 本地目录」安装，或者在当前 DSH 版本支持 CLI 时执行 `dsh plugin --profile <profile> add link:<绝对路径>`。
> 3. 确认插件包 `dsh-ding-wall` 已安装并启用。然后提醒我**完全退出并重启 DeepSeek Harness**——宿主侧代码在重启时加载，刷新页面不够。
> 4. 重启后和我一起确认：侧栏出现红色图钉「钉一钉」，点开能看到信息墙。
>
> 不要发布任何内容，也不要修改其他插件。最后把执行过的命令、警告和需要我检查的事项告诉我。

### 更短的一句话

> 安装 DeepSeek Harness 插件 **https://github.com/Into-the-Numind/Ding-Wall** —— 克隆到固定目录、作为本地插件包安装，然后提醒我完全重启 DeepSeek Harness。

### 怎么算装好了

- `dsh-ding-wall` 出现在插件列表中，且处于启用状态；
- **完全重启应用**后，侧栏出现红色图钉「钉一钉」；
- 点开能看到暖纸信息墙，首次进入会要求认领一张团队名片；
- 默认安装是**本机墙**模式：不发起网络请求，每台电脑各有一面墙；要加入团队共享墙，见[加入已有的墙](#加入已有的团队墙队友)。

> 如果你的 DSH 版本插件管理器不支持安装本地目录，就用安装其他本地插件包的方式安装这个文件夹。如果图钉没出现，先确认是**完全重启**了 Harness，而不是只刷新了窗口。

## 截图

| 信息墙 | 晨报模式 |
| --- | --- |
| ![信息墙](screenshots/panel-wide.png) | ![晨报模式](screenshots/morning-mode.png) |

| 钉一张 | 认领名片 |
| --- | --- |
| ![钉一张](screenshots/composer.png) | ![认领名片](screenshots/identity.png) |

| 窄面板 | 团队心跳 |
| --- | --- |
| ![窄面板](screenshots/panel-narrow.png) | ![团队心跳](screenshots/team-pulse.png) |

## 功能

- **灵感便签**：点一下就能把想法钉上墙，便签可以拖动、撕下。
- **待办索引卡**：明天 / 这周两栏，完成时盖一枚「完成」印章。
- **匿名信箱**：匿名意见不记录作者，服务端不会存是谁写的。
- **团队心跳**：在线状态、活动条、手绘风格的一周节奏。
- **晨报模式**：适合站会的报纸版面，每天刷新。
- **暖纸视觉**：奶油纸色、宋体标题、图钉、胶带、橡皮章和纸纹，来自最初的网页版设计。
- **本地优先**：默认模式完全本地（`$DSH_HOME/ding-wall/wall.json`），无账号、无云端。
- **中英双语**：跟随 Harness 的语言设置。

## 环境要求与兼容性

- DeepSeek Harness Desktop 的 Web UI。基于 **DSH 0.2.1** 系列（2026 年 11 月）开发与测试。
- 插件使用了 Harness 的客户端插槽 API（`sidebar.panellist`、主面板、locale、layout）；这些 API 尚未冻结，未来 DSH 大版本可能需要小幅适配。
- 无需构建、运行时无 npm 依赖：客户端是预构建 ESM bundle，宿主侧只用 Node 内置模块。
- 支持 Harness Desktop 所在的 macOS / Windows / Linux。

## 手动安装

1. 克隆到一个固定目录：

   ```bash
   git clone https://github.com/Into-the-Numind/Ding-Wall.git ~/dsh-plugins/dsh-ding-wall
   ```

2. 打开 DeepSeek Harness 的**插件 → 添加插件 → 本地目录**，选择克隆下来的文件夹（包含 `package.json` 的那一层），启用插件。

3. **完全退出并重启 DeepSeek Harness。**（宿主侧插件代码在启动时加载；刷新页面只会重载 UI。）

4. 点击侧栏红色图钉「钉一钉」。首次打开时认领你的团队名片。

### 更新

```bash
cd ~/dsh-plugins/dsh-ding-wall
git pull
```

然后完全重启 Harness。如果你安装的是快照而不是 git 仓库，重新安装该目录即可。

### 卸载

在插件管理器中移除插件。墙的数据仍保留在 `$DSH_HOME/ding-wall/`；如需彻底清空，删除该目录即可。（macOS 上 `$DSH_HOME` 一般是 `~/.dsh`。）

## 数据、隐私与网络

- **本地优先**：默认模式下数据存在 `$DSH_HOME/ding-wall/wall.json`，不会离开本机。
- **匿名意见**：信箱条目不会持久化任何作者标识。
- **无遥测、无统计、无 CDN 请求。**
- 宿主插件以你的用户权限运行——和任何 Harness 插件一样，介意的话安装前先读源码。
- 只有当你显式配置了共享团队服务器时，宿主才会向该 URL 发起网络请求。

## 共享团队模式（可选）

钉一钉也可以作为一个小团队共享墙的界面，后端可以自托管。在 Harness 的 profile 补丁里配置——访问码只存在宿主侧，不会下发浏览器：

```yaml
- id: ding-wall
  name: dsh-ding-wall
  config:
    serverUrl: "https://your-wall.example.com"
    # 可选：共享访问码，由宿主代理以 Bearer 形式附加
    serverToken: "your-team-access-code"
    # 可选：没有公网证书的部署，固定自签 CA
    # serverCa: |
    #   -----BEGIN CERTIFICATE-----
    #   ...
    #   -----END CERTIFICATE-----
```

本仓库不包含墙服务端；插件只依赖一套很小的 JSON + SSE 接口。不配置 `serverUrl` 时，一切都在本地运行。

### 加入已有的团队墙（队友）

如果团队里已经有人搭好了共享墙，**不需要重新安装插件**：找他要一段填好的配置（`serverUrl`、`serverToken`，自签证书部署还需要 `serverCa`），追加到自己的 profile 补丁并完全重启 Harness。面板底部的「本机墙」会变成「共享墙」。

可以把下面这段交给你的 Agent（把配置替换成团队给你的那段）：

```text
我的钉一钉插件现在是「本机墙」模式，看不到团队共享墙的内容。
请把下面这段配置追加到 ~/.dsh/profiles/<profile>/cordis.patch.yml 末尾，注意 YAML 缩进，然后提醒我完全退出并重启 DeepSeek Harness；重启后帮我确认面板底部显示「共享墙」：

<把团队给你的 YAML 配置贴在这里>
```

## 快捷键

| 快捷键 | 操作 |
| --- | --- |
| `Ctrl`/`⌘` + `Enter` | 提交当前弹层 |
| `Esc` | 关闭弹层 |

## 开发

```bash
npm test
# 或者：node --test test/host.test.mjs test/client.test.mjs
```

无需安装依赖，测试直接跑在 Node.js 20+。

| 路径 | 说明 |
| --- | --- |
| `package.json` | DSH 插件包清单（`dsh.bundle` + `dsh.client`） |
| `cordis.patch.yml` | 插件包补丁：侧栏入口 + 主面板 |
| `lib/index.js` | 宿主插件：本地存储、共享模式代理、`/api/ding-wall/*` 路由 |
| `lib/store.js`、`lib/api.js`、`lib/sse.js` | 本地 API、原子 JSON 落盘、SSE 广播 |
| `lib/proxy.js` | 共享模式反向代理（含 SSE、访问码与 CA 固定） |
| `client.js` | 预构建客户端 bundle：React 面板、样式、中英词典 |
| `test/` | 宿主与客户端契约测试 |

## 许可证

[MIT](LICENSE) © Into the Numind

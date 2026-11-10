# Ding Wall · 钉一下

**A warm, paper-like shared pinboard for small teams — as a DeepSeek Harness panel plugin.**

Ideas pinned as sticky notes, to-dos as index cards, anonymous feedback in a kraft-paper mailbox. Real-time sync for a small team, a hand-drawn “team pulse”, and a morning-paper mode for stand-ups.

[English](README.md) · [简体中文](README.zh-CN.md) · [Install with an agent](#install-with-an-agent) · [Manual install](#manual-install) · [Screenshots](#screenshots) · [Features](#features)

![Ding Wall panel](screenshots/panel-wide.png)

## Install with an agent

Copy the prompt below into an AI agent that can work on your computer — DeepSeek Harness, Claude Code, Codex, or any agent with shell/file access. It handles the install end to end.

> **Install prompt (copy everything in this block)**
>
> Please install the DeepSeek Harness plugin **Ding Wall** (`dsh-ding-wall`) from https://github.com/Into-the-Numind/dsh-ding-wall.
>
> 1. Clone the repository into a permanent directory, for example:
>    `git clone https://github.com/Into-the-Numind/dsh-ding-wall.git ~/dsh-plugins/dsh-ding-wall`
>    Keep this directory — DeepSeek Harness loads the plugin from it. Do not delete or move it afterwards.
> 2. Install that directory as a plugin bundle in DeepSeek Harness:
>    - If you have the `plugin_manager` tool: call `install_bundle` with `target` set to the **absolute path of the cloned directory** (the folder containing `package.json`), then make sure the bundle is enabled.
>    - Otherwise use Plugin Manager → Add plugin → local folder, or `dsh plugin --profile <profile> add link:<absolute-path>` if this DSH build provides that CLI.
> 3. Confirm the bundle `dsh-ding-wall` is installed and enabled. Then tell me to **fully quit and restart DeepSeek Harness** — the host half of the plugin loads on restart (a page refresh is not enough).
> 4. After my restart, verify with me that a red pin icon labeled **“钉一下 / Ding Wall”** appears in the sidebar and that opening it shows the wall.
>
> Do not publish anything or modify other plugins. Report the commands you ran, any warnings, and what I should check.

### Even shorter

> Install the DeepSeek Harness plugin at **https://github.com/Into-the-Numind/dsh-ding-wall** — clone it, add it as a local plugin bundle, then tell me to fully restart DeepSeek Harness.

### What “done” looks like

- `dsh-ding-wall` appears as an installed plugin bundle and is enabled;
- after a **full app restart**, the sidebar shows a red pin **钉一下**;
- opening it shows the paper wall, and the first visit asks you to claim a team card;
- no network requests are made in the default local mode.

> If the plugin manager in your DSH build cannot install a local directory, install it the same way you install any other local plugin bundle and point it at the cloned folder. If the icon does not appear, make sure you fully restarted Harness, not just reloaded the window.

## Screenshots

| Wall | Morning paper |
| --- | --- |
| ![Wall](screenshots/panel-wide.png) | ![Morning paper](screenshots/morning-mode.png) |

| Composer | Claim a card |
| --- | --- |
| ![Composer](screenshots/composer.png) | ![Identity](screenshots/identity.png) |

| Narrow panel | Team pulse |
| --- | --- |
| ![Narrow panel](screenshots/panel-narrow.png) | ![Team pulse](screenshots/team-pulse.png) |

## Features

- **Ideas as sticky notes** — one click to pin a thought; drag the wall into a calm paper workspace.
- **To-dos as index cards** — tomorrow / this week, with a satisfying DONE stamp.
- **Anonymous mailbox** — opinions are posted without an author; the server does not store who wrote them.
- **Real-time team pulse** — presence, activity bars and a hand-drawn weekly rhythm.
- **Morning paper** — a broadsheet view for stand-ups, refreshed daily.
- **Warm paper aesthetic** — cream paper, Songti display type, pins, tape, rubber stamps and grain, restored from the original web design.
- **Local-first** — the default mode is completely local (`$DSH_HOME/ding-wall/wall.json`); no account, no cloud.
- **Bilingual UI** — 简体中文 / English, following the Harness locale.

## Requirements & compatibility

- DeepSeek Harness Desktop with the Web UI. Built and tested against the **DSH 0.2.1** series (November 2026).
- The plugin uses Harness client slot APIs (`sidebar.panellist`, main panel, locale, layout); these APIs are not frozen, so a future DSH major version may need small adjustments.
- No build step and no runtime npm dependencies: the client is a prebuilt ESM bundle, the host uses Node built-ins only.
- macOS / Windows / Linux wherever Harness Desktop runs.

## Manual install

1. Clone the repo somewhere permanent:

   ```bash
   git clone https://github.com/Into-the-Numind/dsh-ding-wall.git ~/dsh-plugins/dsh-ding-wall
   ```

2. In DeepSeek Harness, open **Plugins → Add plugin → local directory** and select the cloned folder (the one containing `package.json`). Enable the plugin.

3. **Fully quit and restart DeepSeek Harness.** (Host-side plugin code is loaded at startup; a page refresh only reloads the UI.)

4. Click the red pin **钉一下** in the sidebar. On first open, claim your team card.

### Update

```bash
cd ~/dsh-plugins/dsh-ding-wall
git pull
```

Then fully restart Harness. If you installed a snapshot instead of a git checkout, reinstall that folder.

### Uninstall

Remove the plugin in Plugin Manager. Your wall data stays in `$DSH_HOME/ding-wall/`; delete that folder if you want a clean slate. (On macOS, `$DSH_HOME` is usually `~/.dsh`.)

## Data, privacy & network

- **Local-first:** data is stored in `$DSH_HOME/ding-wall/wall.json` and never leaves the machine in the default local mode.
- **Anonymous opinions:** no author ID is persisted for mailbox entries.
- **No telemetry, no analytics, no CDN calls.**
- The host plugin runs with your user permissions — like any Harness plugin, read the source before installing if you need to.
- Only if you explicitly configure a shared team server does the host make network requests to that URL.

## Shared team mode (optional)

Ding Wall can also be the UI for a small shared wall served by a compatible self-hosted backend. Configure it in your Harness profile patch — the access token stays host-side and is never sent to the browser:

```yaml
- id: ding-wall
  name: dsh-ding-wall
  config:
    serverUrl: "https://your-wall.example.com"
    # optional: shared access code, attached by the host proxy as a Bearer token
    serverToken: "your-team-access-code"
    # optional: pin a self-signed CA for deployments without a public certificate
    # serverCa: |
    #   -----BEGIN CERTIFICATE-----
    #   ...
    #   -----END CERTIFICATE-----
```

The wall server itself is not included in this repository; the plugin speaks a small JSON + SSE API. Without `serverUrl`, everything runs locally.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl`/`⌘` + `Enter` | Submit the open composer |
| `Esc` | Close composer / modal |

## Development

```bash
npm test
# or: node --test test/host.test.mjs test/client.test.mjs
```

No dependencies to install — tests run on plain Node.js 20+.

| Path | What it is |
| --- | --- |
| `package.json` | DSH bundle manifest (`dsh.bundle` + `dsh.client`) |
| `cordis.patch.yml` | Bundle patch: sidebar panel + main panel entries |
| `lib/index.js` | Host plugin: local store, shared-mode proxy, `/api/ding-wall/*` routes |
| `lib/store.js`, `lib/api.js`, `lib/sse.js` | Local API, atomic JSON persistence, SSE hub |
| `lib/proxy.js` | Shared-mode reverse proxy (including SSE, token and CA pinning) |
| `client.js` | Prebuilt client bundle: React panel, CSS, zh/en dictionaries |
| `test/` | Host and client contract tests |

## License

[MIT](LICENSE) © Into the Numind

---

Built for three people trying to stay on the same page. If you use it, we’d love to hear what your wall looks like.

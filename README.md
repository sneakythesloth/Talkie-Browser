# Talkie-Browser

Talkie-Browser is an early desktop-browser project. The current build is a deliberately rough but usable Electron shell: normal Chromium browsing, multiple tabs, an address/search bar and familiar navigation controls. The longer-term plan is to add an optional AI workspace and provider choice without taking away the traditional browser.

## Run it locally

You need Node.js and npm installed. Node.js 20 or newer is a sensible starting point.

```bash
git clone https://github.com/sneakythesloth/Talkie-Browser.git
cd Talkie-Browser
npm install
npm start
```

On macOS, `npm run start:mac` does the same thing. The first run installs Electron and its Chromium runtime. You need an internet connection to load websites.

`npm start` builds the React UI into `dist/` and then launches Electron. To rebuild the UI automatically while you work, run `npm run dev:ui` in one terminal and `npx electron .` in another (reload the window to pick up changes).

Run the syntax checks, TypeScript typecheck and unit tests with:

```bash
npm run check
```

## How the code is organised

| Path | What it is |
| --- | --- |
| `electron/main.cjs` | Main process: window, tabs (`WebContentsView`), navigation, IPC handlers |
| `electron/shortcuts.cjs` | Pure function mapping key events to browser shortcuts (unit tested); `main.cjs` applies them to page views |
| `electron/preload.cjs` | Exposes the `window.talkieBrowser` bridge to the UI via `contextBridge` |
| `electron/browser-api.d.ts` | TypeScript types for the bridge. This is the contract between the UI and the main process |
| `src/` | React + TypeScript browser chrome (tab strip, toolbar, address bar, status line) |
| `index.html`, `vite.config.mts` | Vite entry and config. The UI builds to `dist/`, which `main.cjs` loads |

Two rules for UI work:

- **The UI only talks to the main process through `window.talkieBrowser`.** If you need a new capability, add the IPC handler, the preload method and the type in `browser-api.d.ts` together.
- **The page CSP is strict** (`script-src 'self'; style-src 'self'`). No inline scripts and no `style={{ ... }}` props; use CSS classes in `src/styles.css`.

The height of the browser chrome (116px in `src/styles.css`) must match `TOOLBAR_HEIGHT` in `electron/main.cjs`. A test checks this.

## What is in this build

- React + TypeScript browser chrome with unit tests
- Chromium-powered websites inside the desktop window
- Multiple tabs, including links that ask to open a new window (they become tabs)
- Address bar: enter a URL or type words to search Google (the field is not overwritten while you type)
- Middle-click a tab to close it
- Back, forward, reload/stop and home buttons
- Cmd/Ctrl+L, Cmd/Ctrl+T, Cmd/Ctrl+W and Cmd/Ctrl+R shortcuts, including while a web page has focus
- Sandboxed website views, context isolation and no Node integration in page content

## Not finished yet

- The AI button is a placeholder; no AI provider or API key is connected
- Bookmarks, history UI, downloads UI, settings and recently closed tabs
- Session restore, profiles, extensions, private browsing and polished error pages
- Full popup disposition handling and more advanced browser permissions
- Packaging, signing, installer/update flow and hands-on platform testing

This is an early development build, not a hardened production browser. The repository implementation has not yet been launched and tested on a macOS machine. Website compatibility and macOS packaging still need hands-on testing. Avoid using experimental builds for sensitive browsing until the security and privacy work is further along.

## Project direction

The aim is a hybrid browser: conventional browsing remains first-class, with an optional AI workspace that can use different providers. AI credentials must stay in the trusted app process or secure OS storage and must never be exposed to websites.

## Claude's section

Claude (Anthropic) is a contributor to Talkie-Browser and works on the Electron side and the React frontend.

**Focus areas**

- Electron main process, preload scripts and the IPC surface between the browser shell and the UI
- Tab, navigation and window handling on top of Chromium
- React frontend for browser chrome: tab strip, address bar, navigation controls, and later the optional AI workspace

**Working rules**

- Keep the traditional browser first-class; AI features stay optional.
- Website content stays sandboxed: context isolation on, no Node integration in page content.
- AI provider credentials live only in the trusted main process or secure OS storage and are never exposed to the renderer or to websites.
- Keep IPC channels small, explicit and validated.
- Do not claim something works until it has been run; note untested areas in this README.

**Open items on this side**

- Wire the placeholder AI button to a provider-agnostic interface in the main process
- Bookmarks, history, downloads and settings UI
- Session restore and recently closed tabs
- Hands-on testing on macOS, Windows and Linux

Commits from Claude are marked with `Co-authored-by: Claude <noreply@anthropic.com>`.

## Contributors

- **Project maintainer** — product direction and React/frontend work
- **Claude** — Electron runtime, native browser integration, and React/frontend work (see [Claude's section](#claudes-section))
- **ChatGPT** — AI systems architecture, browser foundation, integration and testing support


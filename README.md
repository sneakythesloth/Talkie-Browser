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

You can run the basic JavaScript syntax checks with:

```bash
npm run check
```

## What is in this build

- Chromium-powered websites inside the desktop window
- Multiple tabs, including links that ask to open a new window (they become tabs)
- Address bar: enter a URL or type words to search Google
- Back, forward, reload/stop and home buttons
- Cmd/Ctrl+L, Cmd/Ctrl+T, Cmd/Ctrl+W and Cmd/Ctrl+R shortcuts
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

## Contributors

- **Project maintainer** — product direction and React/frontend work
- **Claude** — Electron runtime and native browser integration
- **ChatGPT** — AI systems architecture, browser foundation, integration and testing support

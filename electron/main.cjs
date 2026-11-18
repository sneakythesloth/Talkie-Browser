const { app, BrowserWindow, WebContentsView, ipcMain, shell } = require("electron");
const path = require("node:path");

const TOOLBAR_HEIGHT = 116;
const START_URL = "https://www.google.com";
const SEARCH_URL = "https://www.google.com/search?q=";

let mainWindow = null;
let tabs = new Map();
let activeTabId = null;
let nextTabNumber = 1;

function isWebUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function resolveAddress(input) {
  const value = String(input || "").trim();
  if (!value) return START_URL;

  // A string with spaces is almost certainly a search, not a hostname.
  if (/\s/.test(value)) return SEARCH_URL + encodeURIComponent(value);

  const candidate = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)
    ? value
    : `https://${value}`;

  if (!isWebUrl(candidate)) {
    throw new Error("Talkie-Browser currently supports normal http:// and https:// pages only.");
  }
  return candidate;
}

function getTab(tabId = activeTabId) {
  return tabs.get(tabId) || null;
}

function getTabState(tab) {
  if (!tab || tab.webContents.isDestroyed()) return null;
  const contents = tab.webContents;
  let url = contents.getURL();
  if (!url && tab.isNewTab) url = "";
  return {
    id: tab.id,
    title: contents.getTitle() || (tab.isNewTab ? "New tab" : "Loading…"),
    url,
    isLoading: contents.isLoading(),
    canGoBack: contents.navigationHistory.canGoBack(),
    canGoForward: contents.navigationHistory.canGoForward()
  };
}

function getBrowserState() {
  const active = getTab();
  return {
    tabs: [...tabs.values()].map(getTabState).filter(Boolean),
    activeTabId,
    active: getTabState(active)
  };
}

function publishState() {
  if (!mainWindow || mainWindow.isDestroyed() || mainWindow.webContents.isDestroyed()) return;
  mainWindow.webContents.send("talkie:browser-state", getBrowserState());
  const active = getTab();
  const title = active ? (active.webContents.getTitle() || "New tab") : "Talkie-Browser";
  mainWindow.setTitle(`${title} — Talkie-Browser`);
}

function layoutTabs() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const { width, height } = mainWindow.getContentBounds();
  for (const tab of tabs.values()) {
    if (tab.webContents.isDestroyed()) continue;
    if (tab.id === activeTabId) {
      tab.view.setBounds({
        x: 0,
        y: TOOLBAR_HEIGHT,
        width,
        height: Math.max(0, height - TOOLBAR_HEIGHT)
      });
    } else {
      // Keep background tabs alive, but take them out of the visible area.
      tab.view.setBounds({ x: 0, y: TOOLBAR_HEIGHT, width: 0, height: 0 });
    }
  }
}

function attachTabEvents(tab) {
  const contents = tab.webContents;
  const update = () => {
    if (tabs.has(tab.id)) publishState();
  };

  for (const event of [
    "did-start-loading",
    "did-stop-loading",
    "did-navigate",
    "did-navigate-in-page",
    "page-title-updated",
    "page-favicon-updated"
  ]) {
    contents.on(event, update);
  }

  contents.on("will-navigate", (event, url) => {
    if (!isWebUrl(url)) event.preventDefault();
  });
  contents.on("will-redirect", (event, details) => {
    const redirectUrl = typeof details === "string" ? details : details?.url;
    if (redirectUrl && !isWebUrl(redirectUrl)) event.preventDefault();
  });

  contents.setWindowOpenHandler(({ url, disposition }) => {
    if (isWebUrl(url)) {
      // Popups become tabs instead of escaping into an uncontrolled window.
      createTab(url, disposition !== "background-tab");
    }
    return { action: "deny" };
  });

  contents.on("render-process-gone", (_event, details) => {
    tab.crashed = true;
    tab.crashReason = details.reason;
    publishState();
  });
}

function createTab(initialUrl = START_URL, activate = true) {
  if (!mainWindow || mainWindow.isDestroyed()) return null;

  const id = `tab-${nextTabNumber++}`;
  const view = new WebContentsView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  const tab = { id, view, webContents: view.webContents, isNewTab: false };

  tabs.set(id, tab);
  mainWindow.contentView.addChildView(view);
  attachTabEvents(tab);

  if (activate) activeTabId = id;
  layoutTabs();
  publishState();

  const target = initialUrl ? resolveAddress(initialUrl) : "";
  if (target) {
    tab.webContents.loadURL(target).catch((error) => {
      console.warn("Tab navigation failed:", error.message);
      publishState();
    });
  } else {
    tab.isNewTab = true;
  }

  return id;
}

function activateTab(tabId) {
  if (!tabs.has(tabId)) return;
  activeTabId = tabId;
  layoutTabs();
  publishState();
}

function closeTab(tabId) {
  const tab = getTab(tabId);
  if (!tab) return;

  if (tabs.size === 1) {
    // Keep the window useful: closing the last tab resets it to the start page.
    tab.isNewTab = false;
    tab.webContents.loadURL(START_URL).catch(() => {});
    publishState();
    return;
  }

  const ids = [...tabs.keys()];
  const index = ids.indexOf(tabId);
  const wasActive = activeTabId === tabId;

  tabs.delete(tabId);
  mainWindow.contentView.removeChildView(tab.view);
  if (!tab.webContents.isDestroyed()) tab.webContents.close();

  if (wasActive) {
    const nextId = ids[index + 1] || ids[index - 1];
    activeTabId = nextId;
  }
  layoutTabs();
  publishState();
}

function getTrustedWindow(event) {
  if (!mainWindow || mainWindow.isDestroyed() || event.sender !== mainWindow.webContents) {
    throw new Error("Untrusted IPC sender");
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 760,
    minHeight: 560,
    title: "Talkie-Browser",
    backgroundColor: "#f4f5f7",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  // The React shell is built by Vite into dist/ (npm run build:ui).
  mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html")).catch((error) => {
    console.error("Could not load the browser UI. Did you run `npm run build:ui`?", error.message);
  });
  createTab(START_URL, true);
  mainWindow.on("resize", layoutTabs);
  mainWindow.on("closed", () => {
    // WebContentsView instances are not automatically destroyed with their host.
    for (const tab of tabs.values()) {
      if (!tab.webContents.isDestroyed()) tab.webContents.close();
    }
    tabs.clear();
    activeTabId = null;
    mainWindow = null;
  });
}

ipcMain.handle("talkie:browser-state", (event) => {
  getTrustedWindow(event);
  return getBrowserState();
});

ipcMain.handle("talkie:browser-new-tab", (event, url) => {
  getTrustedWindow(event);
  return createTab(url ? resolveAddress(url) : START_URL, true);
});

ipcMain.handle("talkie:browser-switch-tab", (event, tabId) => {
  getTrustedWindow(event);
  activateTab(String(tabId));
});

ipcMain.handle("talkie:browser-close-tab", (event, tabId) => {
  getTrustedWindow(event);
  closeTab(String(tabId));
});

ipcMain.handle("talkie:browser-navigate", async (event, target) => {
  getTrustedWindow(event);
  const tab = getTab();
  if (!tab) return;
  const url = resolveAddress(target);
  tab.isNewTab = false;
  return tab.webContents.loadURL(url);
});

ipcMain.handle("talkie:browser-back", (event) => {
  getTrustedWindow(event);
  const contents = getTab()?.webContents;
  if (contents && contents.navigationHistory.canGoBack()) contents.navigationHistory.goBack();
});

ipcMain.handle("talkie:browser-forward", (event) => {
  getTrustedWindow(event);
  const contents = getTab()?.webContents;
  if (contents && contents.navigationHistory.canGoForward()) contents.navigationHistory.goForward();
});

ipcMain.handle("talkie:browser-reload", (event) => {
  getTrustedWindow(event);
  const contents = getTab()?.webContents;
  if (!contents) return;
  if (contents.isLoading()) contents.stop();
  else contents.reload();
});

ipcMain.handle("talkie:browser-home", (event) => {
  getTrustedWindow(event);
  const tab = getTab();
  if (tab) tab.webContents.loadURL(START_URL).catch(() => {});
});

ipcMain.handle("talkie:browser-open-external", (event, target) => {
  getTrustedWindow(event);
  if (typeof target !== "string" || !isWebUrl(target)) return;
  return shell.openExternal(target);
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});


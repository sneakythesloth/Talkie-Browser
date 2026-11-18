const { app, BrowserWindow, WebContentsView, ipcMain } = require("electron");
const path = require("node:path");

const SHELL_HEIGHT = 88;
const START_URL = "https://www.google.com";

let mainWindow;
let browserView;

function isAllowedWebUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function sendBrowserState() {
  if (!mainWindow || mainWindow.isDestroyed() || !browserView) return;

  const contents = browserView.webContents;
  mainWindow.webContents.send("talkie:browser-state", {
    url: contents.getURL(),
    title: contents.getTitle(),
    canGoBack: contents.navigationHistory.canGoBack(),
    canGoForward: contents.navigationHistory.canGoForward(),
    isLoading: contents.isLoading()
  });
}

function resizeBrowserView() {
  if (!mainWindow || !browserView) return;

  const { width, height } = mainWindow.getContentBounds();
  browserView.setBounds({
    x: 0,
    y: SHELL_HEIGHT,
    width,
    height: Math.max(0, height - SHELL_HEIGHT)
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 760,
    minHeight: 560,
    title: "Talkie-Browser",
    backgroundColor: "#f5f5f5",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  // The trusted local shell owns the browser controls. Websites are displayed
  // in a separate Chromium WebContentsView and never receive the preload bridge.
  mainWindow.loadFile(path.join(__dirname, "shell.html"));

  browserView = new WebContentsView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.contentView.addChildView(browserView);
  resizeBrowserView();

  browserView.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  browserView.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedWebUrl(url)) event.preventDefault();
  });

  for (const event of ["did-navigate", "did-navigate-in-page", "page-title-updated", "did-start-loading", "did-stop-loading"]) {
    browserView.webContents.on(event, sendBrowserState);
  }

  mainWindow.on("resize", resizeBrowserView);
  mainWindow.on("closed", () => {
    browserView = null;
    mainWindow = null;
  });

  browserView.webContents.loadURL(START_URL);
}

function getTrustedWindow(event) {
  if (!mainWindow || event.sender !== mainWindow.webContents) {
    throw new Error("Untrusted IPC sender");
  }
  return browserView?.webContents;
}

ipcMain.handle("talkie:browser-navigate", (event, target) => {
  const contents = getTrustedWindow(event);
  if (!contents) return;

  const value = String(target || "").trim();
  const candidate = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)
    ? value
    : `https://${value}`;

  if (!isAllowedWebUrl(candidate)) {
    throw new Error("Only HTTP and HTTPS addresses are supported.");
  }

  return contents.loadURL(candidate);
});

ipcMain.handle("talkie:browser-back", (event) => {
  const contents = getTrustedWindow(event);
  if (contents?.navigationHistory.canGoBack()) contents.navigationHistory.goBack();
});

ipcMain.handle("talkie:browser-forward", (event) => {
  const contents = getTrustedWindow(event);
  if (contents?.navigationHistory.canGoForward()) contents.navigationHistory.goForward();
});

ipcMain.handle("talkie:browser-reload", (event) => {
  getTrustedWindow(event)?.reload();
});

ipcMain.handle("talkie:browser-get-state", (event) => {
  const contents = getTrustedWindow(event);
  if (!contents) return null;

  return {
    url: contents.getURL(),
    title: contents.getTitle(),
    canGoBack: contents.navigationHistory.canGoBack(),
    canGoForward: contents.navigationHistory.canGoForward(),
    isLoading: contents.isLoading()
  };
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

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("talkieBrowser", {
  getState: () => ipcRenderer.invoke("talkie:browser-state"),
  newTab: (url) => ipcRenderer.invoke("talkie:browser-new-tab", url),
  switchTab: (id) => ipcRenderer.invoke("talkie:browser-switch-tab", id),
  closeTab: (id) => ipcRenderer.invoke("talkie:browser-close-tab", id),
  navigate: (url) => ipcRenderer.invoke("talkie:browser-navigate", url),
  back: () => ipcRenderer.invoke("talkie:browser-back"),
  forward: () => ipcRenderer.invoke("talkie:browser-forward"),
  reload: () => ipcRenderer.invoke("talkie:browser-reload"),
  home: () => ipcRenderer.invoke("talkie:browser-home"),
  openExternal: (url) => ipcRenderer.invoke("talkie:browser-open-external", url),
  onFocusAddress: (callback) => {
    if (typeof callback !== "function") return () => {};
    const listener = () => callback();
    ipcRenderer.on("talkie:focus-address", listener);
    return () => ipcRenderer.removeListener("talkie:focus-address", listener);
  },
  onStateChange: (callback) => {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, state) => callback(state);
    ipcRenderer.on("talkie:browser-state", listener);
    return () => ipcRenderer.removeListener("talkie:browser-state", listener);
  }
});


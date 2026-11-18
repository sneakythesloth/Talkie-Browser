const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("talkieBrowser", {
  navigate: (url) => ipcRenderer.invoke("talkie:browser-navigate", url),
  back: () => ipcRenderer.invoke("talkie:browser-back"),
  forward: () => ipcRenderer.invoke("talkie:browser-forward"),
  reload: () => ipcRenderer.invoke("talkie:browser-reload"),
  getState: () => ipcRenderer.invoke("talkie:browser-get-state"),
  onStateChange: (callback) => {
    if (typeof callback !== "function") return () => {};

    const listener = (_event, state) => callback(state);
    ipcRenderer.on("talkie:browser-state", listener);

    return () => ipcRenderer.removeListener("talkie:browser-state", listener);
  }
});

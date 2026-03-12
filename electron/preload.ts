import { contextBridge, ipcRenderer } from "electron";

type ShortcutName =
  | "next-tab"
  | "prev-tab"
  | "mark-objective"
  | "toggle-pin"
  | "adjust-level";

contextBridge.exposeInMainWorld("desktop", {
  toggleOverlay: () => ipcRenderer.invoke("app:toggle-overlay"),
  resetOverlayPosition: () => ipcRenderer.invoke("overlay:reset-position"),
  onShortcut: (handler: (name: ShortcutName) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, name: ShortcutName) => {
      handler(name);
    };

    ipcRenderer.on("shortcut", listener);

    return () => {
      ipcRenderer.removeListener("shortcut", listener);
    };
  },
});

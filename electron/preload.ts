import { contextBridge, ipcRenderer } from "electron";

type ShortcutName =
  | "next-tab"
  | "prev-tab"
  | "mark-objective"
  | "toggle-pin"
  | "adjust-level";

type ImportSourceType = "link" | "code" | "file";

contextBridge.exposeInMainWorld("desktop", {
  toggleOverlay: () => ipcRenderer.invoke("app:toggle-overlay"),
  resetOverlayPosition: () => ipcRenderer.invoke("overlay:reset-position"),
  resolvePobSource: (sourceType: ImportSourceType, sourceValue: string) =>
    ipcRenderer.invoke("pob:resolve-source", sourceType, sourceValue),
  setLocale: (locale: string) => ipcRenderer.invoke("app:set-locale", locale),
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

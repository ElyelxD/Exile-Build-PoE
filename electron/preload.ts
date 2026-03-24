import { contextBridge, ipcRenderer } from "electron";

type ShortcutName =
  | "next-tab"
  | "prev-tab"
  | "mark-objective"
  | "toggle-pin"
  | "adjust-level";

type HotkeyAction = ShortcutName | "toggle-overlay";
type HotkeyConfig = Record<HotkeyAction, string>;

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

  // Auto-updater
  updaterCheck: () => ipcRenderer.invoke("updater:check"),
  updaterDownload: () => ipcRenderer.invoke("updater:download"),
  updaterInstall: () => ipcRenderer.invoke("updater:install"),
  updaterGetVersion: () => ipcRenderer.invoke("updater:get-version") as Promise<string>,
  onUpdateAvailable: (handler: (version: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, version: string) => handler(version);
    ipcRenderer.on("updater:update-available", listener);
    return () => { ipcRenderer.removeListener("updater:update-available", listener); };
  },
  onDownloadProgress: (handler: (percent: number) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, percent: number) => handler(percent);
    ipcRenderer.on("updater:download-progress", listener);
    return () => { ipcRenderer.removeListener("updater:download-progress", listener); };
  },
  onUpdateDownloaded: (handler: () => void) => {
    const listener = () => handler();
    ipcRenderer.on("updater:update-downloaded", listener);
    return () => { ipcRenderer.removeListener("updater:update-downloaded", listener); };
  },
  onUpToDate: (handler: () => void) => {
    const listener = () => handler();
    ipcRenderer.on("updater:up-to-date", listener);
    return () => { ipcRenderer.removeListener("updater:up-to-date", listener); };
  },
  onUpdateError: (handler: (msg: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, msg: string) => handler(msg);
    ipcRenderer.on("updater:error", listener);
    return () => { ipcRenderer.removeListener("updater:error", listener); };
  },

  // Hotkeys
  getHotkeys: () => ipcRenderer.invoke("hotkeys:get") as Promise<HotkeyConfig>,
  setHotkey: (action: HotkeyAction, accelerator: string) =>
    ipcRenderer.invoke("hotkeys:set", action, accelerator) as Promise<HotkeyConfig>,
  resetHotkeys: () => ipcRenderer.invoke("hotkeys:reset") as Promise<HotkeyConfig>,
});

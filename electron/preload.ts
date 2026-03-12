import { contextBridge, ipcRenderer } from "electron";

type ShortcutName =
  | "next-tab"
  | "prev-tab"
  | "mark-objective"
  | "toggle-pin"
  | "adjust-level";

type ImportSourceType = "link" | "code" | "file";
type PoeAssetsState = {
  installPath?: string;
  extractorPath?: string;
  cacheDir?: string;
  extractorName?: string;
  manifestPath?: string;
  status: "idle" | "ready" | "missing-install" | "missing-extractor" | "syncing" | "error";
  lastSyncAt?: string;
  lastError?: string;
};

contextBridge.exposeInMainWorld("desktop", {
  toggleOverlay: () => ipcRenderer.invoke("app:toggle-overlay"),
  resetOverlayPosition: () => ipcRenderer.invoke("overlay:reset-position"),
  resolvePobSource: (sourceType: ImportSourceType, sourceValue: string) =>
    ipcRenderer.invoke("pob:resolve-source", sourceType, sourceValue),
  getPoeAssetsState: () => ipcRenderer.invoke("poe-assets:get-state") as Promise<PoeAssetsState>,
  choosePoeInstallPath: () => ipcRenderer.invoke("poe-assets:choose-install-path") as Promise<PoeAssetsState>,
  choosePoeExtractorPath: () => ipcRenderer.invoke("poe-assets:choose-extractor-path") as Promise<PoeAssetsState>,
  syncPoeAssets: () => ipcRenderer.invoke("poe-assets:sync") as Promise<PoeAssetsState>,
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

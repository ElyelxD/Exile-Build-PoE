/// <reference types="vite/client" />

type ShortcutEventName =
  | "next-tab"
  | "prev-tab"
  | "mark-objective"
  | "toggle-pin"
  | "adjust-level";

type ImportSourceType = "link" | "code" | "file";

declare global {
  type HotkeyAction = ShortcutEventName | "toggle-overlay";
  type HotkeyConfig = Record<HotkeyAction, string>;
  interface Window {
    desktop?: {
      toggleOverlay: () => Promise<void>;
      resetOverlayPosition: () => Promise<void>;
      resolvePobSource: (sourceType: ImportSourceType, sourceValue: string) => Promise<string>;
      setLocale: (locale: string) => Promise<void>;
      onShortcut: (handler: (name: ShortcutEventName) => void) => () => void;
      updaterCheck: () => Promise<unknown>;
      updaterDownload: () => Promise<unknown>;
      updaterInstall: () => Promise<void>;
      updaterGetVersion: () => Promise<string>;
      onUpdateAvailable: (handler: (version: string) => void) => () => void;
      onDownloadProgress: (handler: (percent: number) => void) => () => void;
      onUpdateDownloaded: (handler: () => void) => () => void;
      getHotkeys: () => Promise<HotkeyConfig>;
      setHotkey: (action: HotkeyAction, accelerator: string) => Promise<HotkeyConfig>;
      resetHotkeys: () => Promise<HotkeyConfig>;
    };
  }
}

export {};

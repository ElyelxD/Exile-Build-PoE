/// <reference types="vite/client" />

type ShortcutEventName =
  | "next-tab"
  | "prev-tab"
  | "mark-objective"
  | "toggle-pin"
  | "adjust-level";

type ImportSourceType = "link" | "code" | "file";

declare global {
  interface Window {
    desktop?: {
      toggleOverlay: () => Promise<void>;
      resetOverlayPosition: () => Promise<void>;
      resolvePobSource: (sourceType: ImportSourceType, sourceValue: string) => Promise<string>;
      setLocale: (locale: string) => Promise<void>;
      onShortcut: (handler: (name: ShortcutEventName) => void) => () => void;
    };
  }
}

export {};

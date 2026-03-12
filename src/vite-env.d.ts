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
      onShortcut: (handler: (name: ShortcutEventName) => void) => () => void;
    };
  }
}

export {};

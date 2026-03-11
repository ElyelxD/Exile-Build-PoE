/// <reference types="vite/client" />

type ShortcutEventName =
  | "next-tab"
  | "prev-tab"
  | "mark-objective"
  | "toggle-pin"
  | "adjust-level";

declare global {
  interface Window {
    desktop?: {
      toggleOverlay: () => Promise<void>;
      resetOverlayPosition: () => Promise<void>;
      setOverlayClickThrough: (enabled: boolean) => Promise<boolean>;
      onShortcut: (handler: (name: ShortcutEventName) => void) => () => void;
    };
  }
}

export {};

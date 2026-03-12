/// <reference types="vite/client" />
import type { PoeAssetsState } from "@/domain/models";

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
      getPoeAssetsState: () => Promise<PoeAssetsState>;
      choosePoeInstallPath: () => Promise<PoeAssetsState>;
      choosePoeExtractorPath: () => Promise<PoeAssetsState>;
      syncPoeAssets: () => Promise<PoeAssetsState>;
      onShortcut: (handler: (name: ShortcutEventName) => void) => () => void;
    };
  }
}

export {};

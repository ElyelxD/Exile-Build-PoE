import { useEffect } from "react";
import { AppStoreProvider, useAppStore } from "@/store/app-store";
import { I18nProvider } from "@/i18n";
import { MainShell } from "@/views/MainShell";
import { OverlayWindow } from "@/views/OverlayWindow";

function ShortcutBridge() {
  const { state, actions } = useAppStore();

  useEffect(() => {
    if (!window.desktop) {
      return;
    }

    return window.desktop.onShortcut((shortcut) => {
      const selectedBuildId = state.selectedBuildId;

      switch (shortcut) {
        case "next-tab":
          actions.cycleTab(1);
          break;
        case "prev-tab":
          actions.cycleTab(-1);
          break;
        case "mark-objective":
          if (selectedBuildId) {
            actions.markNextObjective(selectedBuildId);
          }
          break;
        case "toggle-pin":
          if (selectedBuildId) {
            actions.togglePinNextObjective(selectedBuildId);
          }
          break;
        case "adjust-level":
          if (selectedBuildId) {
            const progress = state.progressByBuildId[selectedBuildId];
            const nextLevel = (progress?.playerLevel ?? 1) + 1;
            actions.setPlayerLevel(selectedBuildId, nextLevel);
          }
          break;
      }
    });
  }, [actions, state.progressByBuildId, state.selectedBuildId]);

  return null;
}

function RoutedApp() {
  const isOverlay = window.location.hash.includes("/overlay");

  return isOverlay ? <OverlayWindow /> : <MainShell />;
}

export default function App() {
  return (
    <I18nProvider>
      <AppStoreProvider>
        <ShortcutBridge />
        <RoutedApp />
      </AppStoreProvider>
    </I18nProvider>
  );
}

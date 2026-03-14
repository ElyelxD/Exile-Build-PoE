import { useEffect } from "react";
import { OverlayPanel } from "@/components/OverlayPanel";
import { useAppStore } from "@/store/app-store";
import {
  getBuildProgress,
  getCurrentStage,
  getNextObjectives,
  getPinnedItems,
  getSelectedBuild,
} from "@/store/selectors";
import { useI18n } from "@/i18n";

export function OverlayWindow() {
  const { state, actions } = useAppStore();
  const { t } = useI18n();
  const build = getSelectedBuild(state);
  const progress = build ? getBuildProgress(state, build.id) : undefined;
  const currentStage = build && progress ? getCurrentStage(build, progress) : undefined;
  const nextObjectives = build && progress ? getNextObjectives(build, progress, 3) : [];
  const pinnedItems = build && progress ? getPinnedItems(build, progress) : [];

  useEffect(() => {
    document.body.dataset.view = "overlay";
  }, []);

  // Apply overlay opacity as CSS variable
  useEffect(() => {
    const alpha = (state.overlayOpacity / 100).toFixed(2);
    document.documentElement.style.setProperty("--overlay-opacity", alpha);
  }, [state.overlayOpacity]);

  if (!build || !progress || !currentStage) {
    return (
      <div className="overlay-route">
        <section className="overlay-empty">
          <span className="eyebrow">{t("header.appName")}</span>
          <h2>{t("overlay.noActivePoB")}</h2>
          <p>{t("overlay.importPrompt")}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="overlay-route">
      <OverlayPanel
        activeTab={state.activeTab}
        build={build}
        currentStage={currentStage}
        nextObjectives={nextObjectives}
        onMarkObjective={() => actions.markNextObjective(build.id)}
        onSetPobTreeSpec={(specId) => actions.setPobTreeSpec(build.id, specId)}
        onSetPlayerLevel={(level) => actions.setPlayerLevel(build.id, level)}
        onSetTab={actions.setActiveTab}
        onToggleChecklist={(itemId) => actions.toggleChecklist(build.id, itemId)}
        onTogglePin={(itemId) => actions.togglePin(build.id, itemId)}
        overlayOpacity={state.overlayOpacity}
        onSetOverlayOpacity={actions.setOverlayOpacity}
        pinnedItems={pinnedItems}
        progress={progress}
        variant="live"
      />
    </div>
  );
}

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

export function OverlayWindow() {
  const { state, actions } = useAppStore();
  const build = getSelectedBuild(state);
  const progress = build ? getBuildProgress(state, build.id) : undefined;
  const currentStage = build && progress ? getCurrentStage(build, progress) : undefined;
  const nextObjectives = build && progress ? getNextObjectives(build, progress, 3) : [];
  const pinnedItems = build && progress ? getPinnedItems(build, progress) : [];

  useEffect(() => {
    document.body.dataset.view = "overlay";
  }, []);

  useEffect(() => {
    if (window.desktop) {
      void window.desktop.setOverlayClickThrough(state.overlayClickThrough);
    }
  }, [state.overlayClickThrough]);

  const resetOverlayPosition = () => {
    if (window.desktop) {
      void window.desktop.resetOverlayPosition();
    }
  };

  if (!build || !progress || !currentStage) {
    return (
      <div className="overlay-route">
        <section className="overlay-empty">
          <span className="eyebrow">BuildPilot PoE</span>
          <h2>Nenhum PoB ativo</h2>
          <p>Importe um Path of Building na janela principal e use `Ctrl + Shift + O`.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="overlay-route">
      <OverlayPanel
        activeTab={state.activeTab}
        build={build}
        clickThrough={state.overlayClickThrough}
        currentStage={currentStage}
        nextObjectives={nextObjectives}
        onMarkObjective={() => actions.markNextObjective(build.id)}
        onSetTab={actions.setActiveTab}
        onToggleChecklist={(itemId) => actions.toggleChecklist(build.id, itemId)}
        onToggleClickThrough={() =>
          actions.setOverlayClickThrough(!state.overlayClickThrough)
        }
        onToggleMode={actions.toggleOverlayMode}
        onTogglePin={(itemId) => actions.togglePin(build.id, itemId)}
        onResetPosition={resetOverlayPosition}
        overlayMode={state.overlayMode}
        pinnedItems={pinnedItems}
        progress={progress}
        variant="live"
      />
    </div>
  );
}

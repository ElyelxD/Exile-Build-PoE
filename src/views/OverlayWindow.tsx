import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { OverlayPanel } from "@/components/OverlayPanel";
import { useAppStore } from "@/store/app-store";
import {
  getBuildProgress,
  getCurrentStage,
  getNextObjectives,
  getPinnedItems,
  getSelectedBuild,
} from "@/store/selectors";
import { getActivePobTreeSpec } from "@/services/pob-selectors";
import { useI18n } from "@/i18n";

/** `.overlay-route` padding around the minibar, kept inside the collapsed window. */
const MINIBAR_GUTTER_PX = 6;

export function OverlayWindow() {
  const { state, actions } = useAppStore();
  const { t } = useI18n();
  const build = getSelectedBuild(state);
  const progress = build ? getBuildProgress(state, build.id) : undefined;
  const currentStage = build && progress ? getCurrentStage(build, progress) : undefined;
  const nextObjectives = build && progress ? getNextObjectives(build, progress, 3) : [];
  const pinnedItems = build && progress ? getPinnedItems(build, progress) : [];
  const [minimized, setMinimized] = useState(false);
  const minibarRef = useRef<HTMLDivElement>(null);
  const hasBuild = Boolean(build && progress && currentStage);
  // The minibar only exists with a build: losing it while collapsed must give the
  // empty state a full-size window again.
  const collapsed = minimized && hasBuild;
  const treeLabel = build ? (getActivePobTreeSpec(build.pob)?.title ?? currentStage?.title) : undefined;

  // The window itself follows the minibar: a transparent leftover would still be
  // part of the window and keep catching clicks meant for the game. Measured in a
  // layout effect so the window resizes before the collapsed frame is painted.
  useLayoutEffect(() => {
    if (!window.desktop) return;

    if (!collapsed) {
      void window.desktop.setOverlayMinimized(null);
      return;
    }

    const rect = minibarRef.current!.getBoundingClientRect();
    void window.desktop.setOverlayMinimized({
      width: Math.ceil(rect.right + MINIBAR_GUTTER_PX),
      height: Math.ceil(rect.bottom + MINIBAR_GUTTER_PX),
    });
  }, [collapsed, build?.name, treeLabel]);

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

  if (collapsed) {
    return (
      <div className="overlay-route is-minimized">
        <div className="overlay-minibar" onClick={() => setMinimized(false)} ref={minibarRef}>
          <span className="minibar-name">{build.name}</span>
          <span className="minibar-sep">·</span>
          <span className="minibar-tree">{treeLabel}</span>
          <button
            className="minibar-expand"
            type="button"
            title={t("overlay.expand")}
            onClick={(e) => { e.stopPropagation(); setMinimized(false); }}
          >
            {/* chevron-up icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 15 12 9 18 15" />
            </svg>
          </button>
        </div>
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
        onMinimize={() => setMinimized(true)}
        onSetPobTreeSpec={(specId) => actions.setPobTreeSpec(build.id, specId)}
        onSetPlayerLevel={(level) => actions.setPlayerLevel(build.id, level)}
        onSetTab={actions.setActiveTab}
        onToggleChecklist={(itemId) => actions.toggleChecklist(build.id, itemId)}
        onTogglePin={(itemId) => actions.togglePin(build.id, itemId)}
        pinnedItems={pinnedItems}
        progress={progress}
        variant="live"
      />
    </div>
  );
}

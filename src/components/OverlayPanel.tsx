import { BUILD_TABS, Build, BuildStage, BuildTab, UserProgress } from "@/domain/models";
import { BuildTabContent } from "@/components/BuildTabContent";
import { getActivePobTreeSpec } from "@/services/pob-selectors";
import { useI18n } from "@/i18n";

type DecoratedChecklistItem = {
  id: string;
  text: string;
  type: string;
  required: boolean;
  stageTitle: string;
};

interface OverlayPanelProps {
  build: Build;
  progress: UserProgress;
  currentStage: BuildStage;
  activeTab: BuildTab;
  nextObjectives: DecoratedChecklistItem[];
  pinnedItems: DecoratedChecklistItem[];
  onSetTab?: (tab: BuildTab) => void;
  onSetPobTreeSpec?: (specId: string) => void;
  onSetPlayerLevel?: (level: number) => void;
  onMarkObjective?: () => void;
  onMinimize?: () => void;
  onTogglePin?: (itemId: string) => void;
  onToggleChecklist?: (itemId: string) => void;
  variant?: "preview" | "live";
}

export function OverlayPanel({
  build,
  progress,
  currentStage,
  activeTab,
  nextObjectives,
  pinnedItems,
  onSetTab,
  onMinimize,
  onSetPobTreeSpec,
  onSetPlayerLevel,
  onMarkObjective,
  onTogglePin,
  onToggleChecklist,
  variant = "preview",
}: OverlayPanelProps) {
  const { t } = useI18n();
  const activeTreeSpec = getActivePobTreeSpec(build.pob);
  const displayStageTitle = activeTreeSpec?.title ?? currentStage.title;

  return (
    <section
      className={`overlay-panel is-expanded ${
        variant === "live" ? "is-live" : "is-preview"
      }`}
    >
      <header className="overlay-header">
        <div className="overlay-meta">
          <span className="eyebrow">{build.className + " · " + build.ascendancy}</span>
          <h2>{build.name}</h2>
          <p>
            Lvl {progress.playerLevel} · {displayStageTitle}
          </p>
        </div>
        {variant === "live" && onMinimize && (
          <button
            className="minibar-collapse"
            type="button"
            title={t("overlay.minimize")}
            onClick={onMinimize}
          >
            {/* chevron-down icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}
      </header>

      <div className="overlay-body">
        <nav className="tab-bar is-overlay">
          {BUILD_TABS.map((tab) => (
            <button
              className={`tab-button ${activeTab === tab ? "is-active" : ""}`}
              key={tab}
              onClick={() => onSetTab?.(tab)}
              type="button"
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="overlay-expanded-content">
          <BuildTabContent
            activeTab={activeTab}
            build={build}
            progress={progress}
            currentStage={currentStage}
            onSetPobTreeSpec={onSetPobTreeSpec}
            pinnedItems={pinnedItems}
            condensed
            onToggleChecklist={onToggleChecklist}
            onTogglePin={onTogglePin}
          />
        </div>
      </div>
    </section>
  );
}

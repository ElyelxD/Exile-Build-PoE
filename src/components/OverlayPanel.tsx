import { BUILD_TABS, Build, BuildStage, BuildTab, OverlayMode, UserProgress } from "@/domain/models";
import { BuildTabContent } from "@/components/BuildTabContent";

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
  overlayMode: OverlayMode;
  clickThrough: boolean;
  nextObjectives: DecoratedChecklistItem[];
  pinnedItems: DecoratedChecklistItem[];
  onSetTab?: (tab: BuildTab) => void;
  onToggleMode?: () => void;
  onMarkObjective?: () => void;
  onTogglePin?: (itemId: string) => void;
  onToggleClickThrough?: () => void;
  onToggleChecklist?: (itemId: string) => void;
  variant?: "preview" | "live";
}

export function OverlayPanel({
  build,
  progress,
  currentStage,
  activeTab,
  overlayMode,
  clickThrough,
  nextObjectives,
  pinnedItems,
  onSetTab,
  onToggleMode,
  onMarkObjective,
  onTogglePin,
  onToggleClickThrough,
  onToggleChecklist,
  variant = "preview",
}: OverlayPanelProps) {
  return (
    <section
      className={`overlay-panel ${overlayMode === "compact" ? "is-compact" : "is-expanded"} ${
        variant === "live" ? "is-live" : "is-preview"
      }`}
    >
      <header className="overlay-header">
        <div className="overlay-meta">
          <span className="eyebrow">{build.className + " · " + build.ascendancy}</span>
          <h2>{build.name}</h2>
          <p>
            Lvl {progress.playerLevel} · {currentStage.title}
          </p>
        </div>
        <div className="overlay-controls">
          <button className="icon-button" onClick={onToggleMode} type="button">
            {overlayMode === "compact" ? "Expand" : "Compact"}
          </button>
          <button className="icon-button" onClick={onToggleClickThrough} type="button">
            {clickThrough ? "Unlock" : "Click-through"}
          </button>
        </div>
      </header>

      {overlayMode === "compact" ? (
        <div className="overlay-body">
          <div className="overlay-stage-summary">
            <span className="pill">
              {currentStage.label} · {currentStage.levelMin}-{currentStage.levelMax}
            </span>
            <p>{currentStage.summary}</p>
          </div>

          <div className="overlay-objectives">
            {nextObjectives.map((item) => (
              <div className="overlay-objective" key={item.id}>
                <button
                  className="overlay-objective-main"
                  onClick={() => onToggleChecklist?.(item.id)}
                  type="button"
                >
                  <strong>{item.text}</strong>
                  <span>{item.stageTitle}</span>
                </button>
                <button
                  className="icon-button"
                  onClick={() => onTogglePin?.(item.id)}
                  type="button"
                >
                  Pin
                </button>
              </div>
            ))}
          </div>

          <footer className="overlay-footer">
            <span>{pinnedItems.length} pinados</span>
            <button className="primary-button is-small" onClick={onMarkObjective} type="button">
              Marcar próximo
            </button>
          </footer>
        </div>
      ) : (
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
              pinnedItems={pinnedItems}
              condensed
              onToggleChecklist={onToggleChecklist}
              onTogglePin={onTogglePin}
            />
          </div>
        </div>
      )}
    </section>
  );
}


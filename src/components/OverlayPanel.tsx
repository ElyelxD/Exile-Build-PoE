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
  onResetPosition?: () => void;
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
  onResetPosition,
  onToggleChecklist,
  variant = "preview",
}: OverlayPanelProps) {
  const compactObjectives = nextObjectives.slice(0, 2);
  const pinnedCopy =
    pinnedItems.length === 0
      ? "Overlay leve · Ctrl + Shift + M conclui"
      : `${pinnedItems.length} lembrete${pinnedItems.length === 1 ? "" : "s"} pinado${
          pinnedItems.length === 1 ? "" : "s"
        } · Ctrl + Shift + M conclui`;

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
          <button className="icon-button" onClick={onResetPosition} type="button">
            Centro
          </button>
          <button className="icon-button" onClick={onToggleMode} type="button">
            {overlayMode === "compact" ? "Detalhes" : "Resumo"}
          </button>
          <button className="icon-button" onClick={onToggleClickThrough} type="button">
            {clickThrough ? "Editar" : "Liberar mouse"}
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

          {compactObjectives.length > 0 ? (
            <div className="overlay-objectives">
              {compactObjectives.map((item, index) => (
                <div
                  className={`overlay-objective ${index === 0 ? "is-primary" : "is-secondary"}`}
                  key={item.id}
                >
                  <button
                    className="overlay-objective-main"
                    onClick={() => onToggleChecklist?.(item.id)}
                    type="button"
                  >
                    <span className="overlay-objective-kicker">
                      {index === 0 ? "Agora" : "Em seguida"}
                    </span>
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
          ) : (
            <div className="overlay-stage-summary is-complete">
              <span className="pill">Checklist em dia</span>
              <p>Sem pendencias imediatas. Abra os detalhes para revisar a build com calma.</p>
            </div>
          )}

          <footer className="overlay-footer">
            <span>{pinnedCopy}</span>
            <button className="primary-button is-small" onClick={onMarkObjective} type="button">
              Concluir
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

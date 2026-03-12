import { BUILD_TABS, Build, BuildStage, BuildTab, OverlayMode, UserProgress } from "@/domain/models";
import { BuildTabContent } from "@/components/BuildTabContent";
import { sanitizePobInlineText } from "@/services/pob-display";
import { getActivePobTreeSpec, getNextPobTreeSpecForLevel } from "@/services/pob-selectors";

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
  nextObjectives: DecoratedChecklistItem[];
  pinnedItems: DecoratedChecklistItem[];
  onSetTab?: (tab: BuildTab) => void;
  onSetPobTreeSpec?: (specId: string) => void;
  onSetPlayerLevel?: (level: number) => void;
  onToggleMode?: () => void;
  onMarkObjective?: () => void;
  onTogglePin?: (itemId: string) => void;
  onToggleChecklist?: (itemId: string) => void;
  variant?: "preview" | "live";
}

export function OverlayPanel({
  build,
  progress,
  currentStage,
  activeTab,
  overlayMode,
  nextObjectives,
  pinnedItems,
  onSetTab,
  onSetPobTreeSpec,
  onSetPlayerLevel,
  onToggleMode,
  onMarkObjective,
  onTogglePin,
  onToggleChecklist,
  variant = "preview",
}: OverlayPanelProps) {
  const compactObjectives = nextObjectives.slice(0, variant === "live" ? 3 : 2);
  const nextUpgradeLabel = sanitizePobInlineText(build.summary.nextUpgrade);
  const activeTreeSpec = getActivePobTreeSpec(build.pob);
  const displayStageTitle = activeTreeSpec?.title ?? currentStage.title;
  const isTreeDrivenBuild = Boolean(build.pob && build.pob.treeSpecs.length > 1);
  const nextTreeSpec = getNextPobTreeSpecForLevel(build.pob, progress.playerLevel);
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
            Lvl {progress.playerLevel} · {displayStageTitle}
          </p>
        </div>
        <div className="overlay-controls">
          <button className="icon-button" onClick={onToggleMode} type="button">
            {overlayMode === "compact" ? "Detalhes" : "Resumo"}
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

          {variant === "live" ? (
            <div className="overlay-session-strip">
              <div className="overlay-session-card">
                <span className="overlay-session-label">{isTreeDrivenBuild ? "Tree ativa" : "Fase"}</span>
                <strong>{displayStageTitle}</strong>
              </div>
              <div className="overlay-session-card">
                <span className="overlay-session-label">Próximo upgrade</span>
                <strong>{nextUpgradeLabel || "Revisar snapshot do PoB"}</strong>
              </div>
            </div>
          ) : null}

          {variant === "live" ? (
            <div className="overlay-level-strip">
              <span className="overlay-session-label">Nível atual</span>
              <div className="overlay-level-controls">
                <button
                  className="icon-button"
                  onClick={() => onSetPlayerLevel?.(progress.playerLevel - 1)}
                  type="button"
                >
                  -
                </button>
                <input
                  className="level-input overlay-level-input"
                  max={100}
                  min={1}
                  onChange={(event) => onSetPlayerLevel?.(Number(event.target.value) || 1)}
                  type="number"
                  value={progress.playerLevel}
                />
                <button
                  className="icon-button"
                  onClick={() => onSetPlayerLevel?.(progress.playerLevel + 1)}
                  type="button"
                >
                  +
                </button>
              </div>
              <span className="overlay-level-help">
                {isTreeDrivenBuild && nextTreeSpec
                  ? `Ao subir o nível, a próxima tree será ${nextTreeSpec.title}.`
                  : "Ajustar o nível aqui atualiza o stage ativo no overlay."}
              </span>
            </div>
          ) : null}

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
              onSetPobTreeSpec={onSetPobTreeSpec}
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

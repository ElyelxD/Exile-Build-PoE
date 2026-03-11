import { Build, BuildStage, BuildTab, UserProgress } from "@/domain/models";

type DecoratedChecklistItem = {
  id: string;
  text: string;
  type: string;
  required: boolean;
  stageTitle: string;
};

interface BuildTabContentProps {
  activeTab: BuildTab;
  build: Build;
  progress: UserProgress;
  currentStage: BuildStage;
  pinnedItems: DecoratedChecklistItem[];
  condensed?: boolean;
  onToggleChecklist?: (itemId: string) => void;
  onTogglePin?: (itemId: string) => void;
}

function ChecklistBlock({
  currentStage,
  completedChecklistIds,
  onToggleChecklist,
  onTogglePin,
}: {
  currentStage: BuildStage;
  completedChecklistIds: string[];
  onToggleChecklist?: (itemId: string) => void;
  onTogglePin?: (itemId: string) => void;
}) {
  const completed = new Set(completedChecklistIds);

  return (
    <div className="list-block">
      <div className="section-heading">
        <h3>Checklist operacional</h3>
        <span>{currentStage.checklist.length} itens</span>
      </div>
      <div className="checklist">
        {currentStage.checklist.map((item) => {
          const isComplete = completed.has(item.id);

          return (
            <div
              key={item.id}
              className={`checklist-item ${isComplete ? "is-complete" : ""}`}
            >
              <button
                className="checklist-main"
                onClick={() => onToggleChecklist?.(item.id)}
                type="button"
              >
                <span className="check-badge">{isComplete ? "Done" : "Now"}</span>
                <strong>{item.text}</strong>
                <span>{item.type}</span>
              </button>
              <button
                className="icon-button"
                onClick={() => onTogglePin?.(item.id)}
                type="button"
              >
                Pin
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BuildTabContent({
  activeTab,
  build,
  progress,
  currentStage,
  pinnedItems,
  condensed = false,
  onToggleChecklist,
  onTogglePin,
}: BuildTabContentProps) {
  const stageSubset = condensed ? [currentStage] : build.stages;

  switch (activeTab) {
    case "overview":
      return (
        <div className="content-stack">
          <div className="card-grid two-up">
            <section className="panel">
              <div className="section-heading">
                <h3>Build agora</h3>
                <span>
                  Lvl {progress.playerLevel} · {build.className} {build.ascendancy}
                </span>
              </div>
              <p className="lead-copy">{build.summary.tagline}</p>
              <div className="metric-stack">
                <div>
                  <span>Playstyle</span>
                  <strong>{build.summary.playstyle}</strong>
                </div>
                <div>
                  <span>Próximo upgrade</span>
                  <strong>{build.summary.nextUpgrade}</strong>
                </div>
                <div>
                  <span>Stage atual</span>
                  <strong>{currentStage.title}</strong>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="section-heading">
                <h3>Warnings</h3>
                <span>Antes de jogar</span>
              </div>
              <div className="warning-list">
                {[...build.warnings, ...build.summary.warningCards].map((warning) => (
                  <div className="warning-row" key={warning}>
                    <span className="warning-dot" />
                    <p>{warning}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <ChecklistBlock
            currentStage={currentStage}
            completedChecklistIds={progress.completedChecklistIds}
            onToggleChecklist={onToggleChecklist}
            onTogglePin={onTogglePin}
          />

          <div className="stage-list">
            {stageSubset.map((stage) => (
              <article className="stage-card" key={stage.id}>
                <div className="stage-card-header">
                  <div>
                    <span className="eyebrow">{stage.label}</span>
                    <h3>{stage.title}</h3>
                  </div>
                  <span className="pill">
                    Lvl {stage.levelMin}-{stage.levelMax}
                  </span>
                </div>
                <p>{stage.summary}</p>
                <div className="chip-row">
                  {stage.notes.slice(0, condensed ? 1 : 2).map((note) => (
                    <span className="chip" key={note}>
                      {note}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      );
    case "tree":
      return (
        <div className="content-stack">
          <section className="panel">
            <div className="section-heading">
              <h3>Passive milestones</h3>
              <span>{currentStage.title}</span>
            </div>
            <div className="card-grid">
              {stageSubset.flatMap((stage) =>
                stage.passives.map((passive) => (
                  <article className="detail-card" key={passive.id}>
                    <span className="eyebrow">{stage.label}</span>
                    <h4>{passive.targetName}</h4>
                    <p>{passive.instructions}</p>
                    <span className="detail-meta">{passive.pointsRequired} pontos</span>
                  </article>
                )),
              )}
            </div>
          </section>

          {!condensed && (
            <section className="panel">
              <div className="section-heading">
                <h3>Roadmap completo</h3>
                <span>Ordem de progressão</span>
              </div>
              <div className="stage-list">
                {build.stages.map((stage) => (
                  <article className="stage-card is-small" key={stage.id}>
                    <div className="stage-card-header">
                      <h3>{stage.title}</h3>
                      <span className="pill">
                        {stage.levelMin}-{stage.levelMax}
                      </span>
                    </div>
                    <p>{stage.summary}</p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      );
    case "gems":
      return (
        <div className="content-stack">
          <div className="card-grid">
            {stageSubset.flatMap((stage) =>
              stage.gems.map((gem) => (
                <article className="detail-card" key={gem.id}>
                  <span className="eyebrow">
                    {stage.title} · {gem.category}
                  </span>
                  <h4>{gem.mainGem}</h4>
                  <p>{gem.notes}</p>
                  <div className="token-row">
                    {gem.supportGems.map((support) => (
                      <span className="token" key={support}>
                        {support}
                      </span>
                    ))}
                  </div>
                  {gem.optionalGems.length > 0 && (
                    <div className="token-row">
                      {gem.optionalGems.map((optional) => (
                        <span className="token is-muted" key={optional}>
                          {optional}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              )),
            )}
          </div>
        </div>
      );
    case "gear":
      return (
        <div className="content-stack">
          <div className="card-grid">
            {stageSubset.flatMap((stage) =>
              stage.gear.map((gear) => (
                <article className="detail-card" key={gear.id}>
                  <span className="eyebrow">{stage.title}</span>
                  <h4>{gear.slot}</h4>
                  <p>{gear.notes}</p>
                  <div className="token-row">
                    {gear.requiredStats.map((stat) => (
                      <span className="token" key={stat}>
                        {stat}
                      </span>
                    ))}
                  </div>
                  <div className="token-row">
                    {gear.preferredStats.map((stat) => (
                      <span className="token is-muted" key={stat}>
                        {stat}
                      </span>
                    ))}
                  </div>
                  {gear.uniqueSuggestion && (
                    <span className="detail-meta">Unique hint: {gear.uniqueSuggestion}</span>
                  )}
                </article>
              )),
            )}
          </div>
        </div>
      );
    case "labs":
      return (
        <div className="content-stack">
          <div className="stage-list">
            {build.labs.map((lab) => (
              <article className="stage-card is-small" key={lab.id}>
                <div className="stage-card-header">
                  <div>
                    <span className="eyebrow">Lab {lab.order}</span>
                    <h3>{lab.title}</h3>
                  </div>
                  <span className="pill">{lab.levelHint}</span>
                </div>
                <p>{lab.ascendancyChoice}</p>
                <span className="detail-meta">{lab.notes}</span>
              </article>
            ))}
          </div>
        </div>
      );
    case "notes":
      return (
        <div className="content-stack">
          <section className="panel">
            <div className="section-heading">
              <h3>Notas da build</h3>
              <span>Import + MVP</span>
            </div>
            <div className="note-block">{build.notes}</div>
            <div className="note-block">{currentStage.notes.join(" ")}</div>
          </section>

          <section className="panel">
            <div className="section-heading">
              <h3>Itens pinados</h3>
              <span>{pinnedItems.length} ativos</span>
            </div>
            {pinnedItems.length === 0 ? (
              <p className="subtle">Nenhum item pinado ainda.</p>
            ) : (
              <div className="checklist">
                {pinnedItems.map((item) => (
                  <div className="checklist-item" key={item.id}>
                    <button
                      className="checklist-main"
                      onClick={() => onTogglePin?.(item.id)}
                      type="button"
                    >
                      <span className="check-badge">Pin</span>
                      <strong>{item.text}</strong>
                      <span>{item.stageTitle}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      );
    default:
      return null;
  }
}

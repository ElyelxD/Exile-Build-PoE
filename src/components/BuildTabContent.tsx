import type { ReactNode } from "react";
import {
  Build,
  BuildStage,
  BuildTab,
  PobItem,
  PobSkillGroup,
  UserProgress,
} from "@/domain/models";
import { GearSlotIcon, GemIcon } from "@/components/PobVisuals";
import {
  parsePobItemDisplay,
  sanitizePobInlineText,
  splitPobParagraphs,
} from "@/services/pob-display";
import {
  getActivePobItemSet,
  getActivePobSkillGroups,
  getActivePobTreeSpec,
} from "@/services/pob-selectors";

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
  onSetPobTreeSpec?: (specId: string) => void;
  onToggleChecklist?: (itemId: string) => void;
  onTogglePin?: (itemId: string) => void;
}

const NOTE_LINK_PATTERN = /((?:https?:\/\/|www\.)[^\s<]+)/gi;

const gearLayout = [
  { key: "weapon1", label: "Weapon 1" },
  { key: "helmet", label: "Helmet" },
  { key: "weapon2", label: "Weapon 2" },
  { key: "amulet", label: "Amulet" },
  { key: "body", label: "Body Armour" },
  { key: "ring1", label: "Ring 1" },
  { key: "gloves", label: "Gloves" },
  { key: "boots", label: "Boots" },
  { key: "ring2", label: "Ring 2" },
  { key: "belt", label: "Belt" },
] as const;

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

function NoteSections({
  text,
  emptyCopy = "Nenhuma nota importada do Path of Building.",
  limit,
}: {
  text: string;
  emptyCopy?: string;
  limit?: number;
}) {
  const sections = splitPobParagraphs(text);
  const displaySections = typeof limit === "number" ? sections.slice(0, limit) : sections;

  if (displaySections.length === 0) {
    return <p className="subtle">{emptyCopy}</p>;
  }

  return (
    <article className="note-block pob-note-document">
      {displaySections.map((section, index) => (
        <p className="pob-note-paragraph" key={`${index}-${section.slice(0, 24)}`}>
          {renderNoteParagraph(section, index)}
        </p>
      ))}
    </article>
  );
}

function normalizeNoteUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function splitNoteUrlSuffix(value: string) {
  const match = value.match(/[),.;!?]+$/);

  if (!match) {
    return { urlText: value, trailing: "" };
  }

  return {
    urlText: value.slice(0, -match[0].length),
    trailing: match[0],
  };
}

function renderNoteLine(line: string, paragraphIndex: number, lineIndex: number) {
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of line.matchAll(NOTE_LINK_PATTERN)) {
    const rawMatch = match[0];
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      parts.push(line.slice(lastIndex, matchIndex));
    }

    const { urlText, trailing } = splitNoteUrlSuffix(rawMatch);

    parts.push(
      <a
        className="pob-note-link"
        href={normalizeNoteUrl(urlText)}
        key={`link-${paragraphIndex}-${lineIndex}-${matchIndex}`}
        rel="noreferrer"
        target="_blank"
      >
        {urlText}
      </a>,
    );

    if (trailing) {
      parts.push(trailing);
    }

    lastIndex = matchIndex + rawMatch.length;
  }

  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }

  return parts.length > 0 ? parts : line;
}

function renderNoteParagraph(section: string, paragraphIndex: number) {
  const lines = section.split("\n");

  return lines.map((line, index) => (
    <span className="pob-note-line" key={`${paragraphIndex}-${index}-${line.slice(0, 24)}`}>
      {renderNoteLine(line, paragraphIndex, index)}
    </span>
  ));
}

function normalizeItemSlot(slot?: string) {
  return (slot ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function mapItemArea(slot?: string) {
  const normalized = normalizeItemSlot(slot);

  if (!normalized) {
    return "extra";
  }

  if (normalized.startsWith("weapon 1") && !normalized.includes("swap")) {
    return "weapon1";
  }

  if (normalized.startsWith("weapon 2") && !normalized.includes("swap")) {
    return "weapon2";
  }

  if (normalized.includes("helmet")) {
    return "helmet";
  }

  if (normalized.includes("body armour")) {
    return "body";
  }

  if (normalized.includes("gloves")) {
    return "gloves";
  }

  if (normalized.includes("boots")) {
    return "boots";
  }

  if (normalized.includes("amulet")) {
    return "amulet";
  }

  if (normalized.includes("ring 1")) {
    return "ring1";
  }

  if (normalized.includes("ring 2")) {
    return "ring2";
  }

  if (normalized === "belt") {
    return "belt";
  }

  if (normalized.includes("flask")) {
    return "flask";
  }

  return "extra";
}

function itemToneClass(rarity?: string) {
  const normalized = (rarity ?? "").toLowerCase();

  if (normalized === "unique") {
    return "is-unique";
  }

  if (normalized === "rare") {
    return "is-rare";
  }

  if (normalized === "magic") {
    return "is-magic";
  }

  return "is-normal";
}

function itemPreviewLines(item: PobItem, limit = 3) {
  const parsed = parsePobItemDisplay(item.rawText);

  return [...parsed.propertyLines, ...parsed.modifierLines]
    .map((line) => sanitizePobInlineText(line))
    .filter(Boolean)
    .slice(0, limit);
}

function SkillBoard({
  groups,
}: {
  groups: PobSkillGroup[];
}) {
  return (
    <div className="skill-board">
      {groups.map((group) => {
        const enabledGems = group.gems.filter((gem) => gem.enabled);
        const disabledGems = group.gems.filter((gem) => !gem.enabled);
        const displayGems = enabledGems.length > 0 ? enabledGems : group.gems;

        return (
          <article
            className={`skill-group-card ${group.isSelected ? "is-selected" : ""}`}
            key={group.id}
          >
            <div className="skill-group-header">
              <div>
                <span className="eyebrow">
                  {sanitizePobInlineText(group.setTitle)}
                  {group.slot ? ` · ${sanitizePobInlineText(group.slot)}` : ""}
                </span>
                <h4>{sanitizePobInlineText(group.label)}</h4>
              </div>
              <span className="pill">
                {displayGems.length > 1 ? `${displayGems.length}-link` : `${displayGems.length} gema`}
              </span>
            </div>

            <div className="skill-chain">
              {displayGems.map((gem, index) => {
                const meta = [
                  gem.level ? `Lvl ${gem.level}` : null,
                  typeof gem.quality === "number" ? `Q${gem.quality}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <div
                    className={`skill-node ${index === 0 ? "is-primary" : ""}`}
                    key={gem.id}
                  >
                    {index < displayGems.length - 1 && <span className="skill-link" />}
                    <GemIcon
                      isPrimary={index === 0}
                      name={sanitizePobInlineText(gem.name)}
                      rawName={gem.rawName}
                    />
                    <div className="skill-copy">
                      <strong>{sanitizePobInlineText(gem.name)}</strong>
                      <span>{meta || (index === 0 ? "Gema principal" : "Link ativo")}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {disabledGems.length > 0 && (
              <div className="skill-bench">
                <span className="skill-bench-label">Banco do grupo</span>
                <div className="skill-bench-row">
                  {disabledGems.map((gem) => (
                    <span className="skill-bench-chip" key={gem.id}>
                      {sanitizePobInlineText(gem.name)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function GearBoard({
  itemSetTitle,
  items,
}: {
  itemSetTitle: string;
  items: PobItem[];
}) {
  const boardItems = new Map<string, PobItem>();
  const flaskItems: PobItem[] = [];
  const extraItems: PobItem[] = [];

  items.forEach((item) => {
    const area = mapItemArea(item.slot);

    if (area === "flask") {
      flaskItems.push(item);
      return;
    }

    if (area === "extra") {
      extraItems.push(item);
      return;
    }

    if (!boardItems.has(area)) {
      boardItems.set(area, item);
      return;
    }

    extraItems.push(item);
  });

  return (
    <section className="panel">
      <div className="section-heading">
        <h3>Gear exata do PoB</h3>
        <span>{sanitizePobInlineText(itemSetTitle)}</span>
      </div>

      <div className="gear-layout">
        {gearLayout.map((slot) => {
          const item = boardItems.get(slot.key);
          const previewLines = item ? itemPreviewLines(item) : [];

          return (
            <article
              className={`gear-slot gear-slot--${slot.key} ${item ? "has-item" : "is-empty"}`}
              key={slot.key}
            >
              <div className="gear-slot-head">
                <span className="gear-slot-label">{slot.label}</span>
                <GearSlotIcon rarity={item?.rarity} slot={item?.slot ?? slot.label} />
              </div>
              {item ? (
                <div className={`gear-item-card ${itemToneClass(item.rarity)}`}>
                  <strong>{sanitizePobInlineText(item.title)}</strong>
                  {item.baseType && <span className="gear-item-base">{sanitizePobInlineText(item.baseType)}</span>}
                  {previewLines.length > 0 && (
                    <div className="gear-line-list">
                      {previewLines.map((line) => (
                        <span key={line}>{line}</span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="gear-empty">
                  <GearSlotIcon compact slot={slot.label} />
                  <span>Sem item</span>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {flaskItems.length > 0 && (
        <div className="gear-subsection">
          <span className="mini-help-title">Frascos</span>
          <div className="gear-strip">
            {flaskItems.map((item) => (
              <article className={`gear-mini-card ${itemToneClass(item.rarity)}`} key={item.id}>
                <div className="gear-mini-head">
                  <span className="gear-mini-slot">{sanitizePobInlineText(item.slot ?? "Flask")}</span>
                  <GearSlotIcon compact rarity={item.rarity} slot={item.slot ?? "Flask"} />
                </div>
                <strong>{sanitizePobInlineText(item.title)}</strong>
                <span>{sanitizePobInlineText(item.baseType ?? item.rarity ?? "Frasco importado")}</span>
              </article>
            ))}
          </div>
        </div>
      )}

      {extraItems.length > 0 && (
        <div className="gear-subsection">
          <span className="mini-help-title">Swap e sockets extras</span>
          <div className="gear-extra-grid">
            {extraItems.map((item) => {
              const preview = itemPreviewLines(item, 2);

              return (
                <article className={`gear-mini-card ${itemToneClass(item.rarity)}`} key={item.id}>
                  <div className="gear-mini-head">
                    <span className="gear-mini-slot">{sanitizePobInlineText(item.slot ?? "Extra")}</span>
                    <GearSlotIcon compact rarity={item.rarity} slot={item.slot ?? "Extra"} />
                  </div>
                  <strong>{sanitizePobInlineText(item.title)}</strong>
                  <span>{sanitizePobInlineText(item.baseType ?? item.rarity ?? "Importado")}</span>
                  {preview.length > 0 && <p>{preview.join(" · ")}</p>}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

export function BuildTabContent({
  activeTab,
  build,
  progress,
  currentStage,
  pinnedItems,
  condensed = false,
  onSetPobTreeSpec,
  onToggleChecklist,
  onTogglePin,
}: BuildTabContentProps) {
  const pob = build.pob;
  const stageSubset = condensed ? [currentStage] : build.stages;
  const activeTreeSpec = getActivePobTreeSpec(pob);
  const activeItemSet = getActivePobItemSet(pob);
  const activeSkillGroups = getActivePobSkillGroups(pob);
  const activePobItems =
    pob && activeItemSet
      ? pob.items.filter((item) => item.setId === activeItemSet.id)
      : pob?.items ?? [];
  const displayTagline = sanitizePobInlineText(build.summary.tagline);
  const displayPlaystyle = sanitizePobInlineText(build.summary.playstyle);
  const displayNextUpgrade = sanitizePobInlineText(build.summary.nextUpgrade);
  const stageNotes = currentStage.notes
    .map((note) => sanitizePobInlineText(note))
    .filter(Boolean);

  switch (activeTab) {
    case "overview":
      if (pob) {
        return (
          <div className="content-stack">
            <div className="card-grid two-up">
              <section className="panel">
                <div className="section-heading">
                  <h3>PoB agora</h3>
                  <span>
                    Lvl {pob.level} · {build.className} {build.ascendancy}
                  </span>
                </div>
                <p className="lead-copy">{displayTagline}</p>
                <div className="metric-stack">
                  <div>
                    <span>Skill principal</span>
                    <strong>{pob.mainSkill ?? "Sem label principal no PoB"}</strong>
                  </div>
                  <div>
                    <span>Tree ativa</span>
                    <strong>{activeTreeSpec?.title ?? "Sem tree spec ativa"}</strong>
                  </div>
                  <div>
                    <span>Item set ativo</span>
                    <strong>{activeItemSet?.title ?? "Sem item set ativo"}</strong>
                  </div>
                  <div>
                    <span>Próximo upgrade</span>
                    <strong>{displayNextUpgrade || "Revisar notas importadas"}</strong>
                  </div>
                </div>
              </section>

              <section className="panel">
                <div className="section-heading">
                  <h3>Import exato</h3>
                  <span>PoB real</span>
                </div>
                <div className="metric-stack">
                  <div>
                    <span>Tree specs</span>
                    <strong>{pob.treeSpecs.length}</strong>
                  </div>
                  <div>
                    <span>Grupos de skill</span>
                    <strong>{pob.skillGroups.length}</strong>
                  </div>
                  <div>
                    <span>Itens no set ativo</span>
                    <strong>{activePobItems.length}</strong>
                  </div>
                  {pob.bandit && (
                    <div>
                      <span>Bandit</span>
                      <strong>{pob.bandit}</strong>
                    </div>
                  )}
                  {(pob.pantheonMajor || pob.pantheonMinor) && (
                    <div>
                      <span>Pantheon</span>
                      <strong>{[pob.pantheonMajor, pob.pantheonMinor].filter(Boolean).join(" · ")}</strong>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <ChecklistBlock
              currentStage={currentStage}
              completedChecklistIds={progress.completedChecklistIds}
              onToggleChecklist={onToggleChecklist}
              onTogglePin={onTogglePin}
            />

            {build.notes && (
              <section className="panel">
                <div className="section-heading">
                  <h3>Notas do PoB</h3>
                  <span>Formatadas para leitura</span>
                </div>
                <NoteSections text={build.notes} limit={condensed ? 1 : 2} />
              </section>
            )}
          </div>
        );
      }

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
              <p className="lead-copy">{displayTagline}</p>
              <div className="metric-stack">
                <div>
                  <span>Playstyle</span>
                  <strong>{displayPlaystyle}</strong>
                </div>
                <div>
                  <span>Próximo upgrade</span>
                  <strong>{displayNextUpgrade}</strong>
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
      if (pob) {
        const visibleTreeSpecs = condensed
          ? pob.treeSpecs.filter((spec) => spec.id === activeTreeSpec?.id)
          : pob.treeSpecs;

        return (
          <div className="content-stack">
            <section className="panel">
              <div className="section-heading">
                <h3>{condensed ? "Tree ativa" : "Timeline de trees"}</h3>
                <span>{condensed ? activeTreeSpec?.title ?? "Sem tree ativa" : pob.treeSpecs.length}</span>
              </div>
              {condensed && pob.treeSpecs.length > 1 && (
                <div className="pob-spec-switcher">
                  <span className="mini-help-title">Tree ativa no app</span>
                  <label className="field pob-spec-field">
                    <span className="field-label">Selecionar tree</span>
                    <select
                      className="pob-spec-select"
                      onChange={(event) => onSetPobTreeSpec?.(event.target.value)}
                      value={activeTreeSpec?.id ?? ""}
                    >
                      {pob.treeSpecs.map((spec) => (
                        <option key={spec.id} value={spec.id}>
                          {spec.title}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
              <div className="card-grid tree-spec-grid">
                {visibleTreeSpecs.map((spec) => (
                  <article
                    className={`detail-card tree-spec-card ${activeTreeSpec?.id === spec.id ? "is-selected" : ""}`}
                    key={spec.id}
                  >
                    <div className="stage-card-header">
                      <div>
                        <span className="eyebrow">{activeTreeSpec?.id === spec.id ? "Ativa no app" : "PoB"}</span>
                        <h3>{spec.title}</h3>
                      </div>
                      <span className="pill">
                        {spec.levelHint ? `Lvl ${spec.levelHint}` : "PoB"}
                      </span>
                    </div>
                    <span className="detail-meta">
                      {spec.treeVersion
                        ? `Passive tree ${spec.treeVersion}`
                        : "Tree spec importada exatamente do PoB."}
                    </span>
                  </article>
                ))}
              </div>
            </section>
          </div>
        );
      }

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
      if (pob) {
        const displayGroups = condensed
          ? activeSkillGroups.slice(0, 4)
          : activeSkillGroups;
        const visibleGroups = displayGroups.length > 0 ? displayGroups : pob.skillGroups;
        const activeSkillSetTitle = visibleGroups[0]?.setTitle ?? "Skill set ativa";

        return (
          <div className="content-stack">
            <section className="panel">
              <div className="section-heading">
                <h3>Links e gemas</h3>
                <span>{activeSkillSetTitle}</span>
              </div>
              <SkillBoard groups={visibleGroups} />
            </section>
          </div>
        );
      }

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
      if (pob) {
        return (
          <div className="content-stack">
            <GearBoard
              itemSetTitle={activeItemSet?.title ?? "Todos os sets"}
              items={condensed ? activePobItems.slice(0, 12) : activePobItems}
            />
          </div>
        );
      }

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
                <span className="detail-meta">{sanitizePobInlineText(lab.notes)}</span>
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
            <NoteSections text={build.notes} />
          </section>

          {stageNotes.length > 0 && (
            <section className="panel">
              <div className="section-heading">
                <h3>Snapshot atual</h3>
                <span>{currentStage.title}</span>
              </div>
              <div className="chip-row">
                {stageNotes.map((note) => (
                  <span className="chip" key={note}>
                    {note}
                  </span>
                ))}
              </div>
            </section>
          )}

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

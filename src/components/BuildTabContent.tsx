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
  isMetaLine,
  parsePobItemDetailed,
  sanitizePobInlineText,
  splitPobParagraphs,
} from "@/services/pob-display";
import type { PobItemMod } from "@/services/pob-display";
import {
  getActivePobItemSet,
  getActivePobSkillGroups,
  getActivePobTreeSpec,
} from "@/services/pob-selectors";
import { useI18n } from "@/i18n";
import { PassiveTreeCanvas } from "@/components/PassiveTreeCanvas";
import { decodeTreeUrl } from "@/services/tree-decoder";

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
  const { t } = useI18n();
  const completed = new Set(completedChecklistIds);

  return (
    <div className="list-block">
      <div className="section-heading">
        <h3>{t("checklist.heading")}</h3>
        <span>{t("checklist.itemCount", { count: currentStage.checklist.length })}</span>
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
  emptyCopy,
  limit,
}: {
  text: string;
  emptyCopy?: string;
  limit?: number;
}) {
  const { t } = useI18n();
  const fallbackEmpty = emptyCopy ?? t("notes.empty");
  const sections = splitPobParagraphs(text);
  const displaySections = typeof limit === "number" ? sections.slice(0, limit) : sections;

  if (displaySections.length === 0) {
    return <p className="subtle">{fallbackEmpty}</p>;
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

/** Sanitize a display field — returns empty string if it looks like PoB metadata. */
function sanitizeDisplayField(value: string | undefined) {
  const clean = sanitizePobInlineText(value ?? "");
  if (!clean) return "";
  // Check each segment (baseType could be multi-line from old import)
  if (clean.split(/\s+/).every((w) => /^[0-9a-f]+$/i.test(w) && w.length >= 8)) return "";
  if (isMetaLine(clean)) return "";
  return clean;
}

function itemDetailedMods(item: PobItem) {
  const parsed = parsePobItemDetailed(item.rawText);

  const baseStats = parsed.propertyLines
    .map((line) => sanitizePobInlineText(line))
    .filter(Boolean)
    .filter((line) => !isMetaLine(line));

  const mods: PobItemMod[] = parsed.mods
    .filter((m) => sanitizePobInlineText(m.text))
    .map((m) => ({ ...m, text: sanitizePobInlineText(m.text) }))
    .filter((m) => !isMetaLine(m.text));

  return { baseStats, mods };
}

function SkillBoard({
  groups,
}: {
  groups: PobSkillGroup[];
}) {
  const { t } = useI18n();

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
                {displayGems.length > 1
                  ? t("gems.linkCount", { count: displayGems.length })
                  : t("gems.gemCount", { count: displayGems.length })}
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
                      iconUrl={gem.iconUrl}
                      isPrimary={index === 0}
                      name={sanitizePobInlineText(gem.name)}
                      rawName={gem.rawName}
                    />
                    <div className="skill-copy">
                      <strong>{sanitizePobInlineText(gem.name)}</strong>
                      <span>{meta || (index === 0 ? t("gems.primaryGem") : t("gems.activeLink"))}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {disabledGems.length > 0 && (
              <div className="skill-bench">
                <span className="skill-bench-label">{t("gems.groupBench")}</span>
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

function ItemModBlock({ item, showTiers = true }: { item: PobItem; showTiers?: boolean }) {
  const detail = itemDetailedMods(item);
  const implicits = detail.mods.filter((m) => m.source === "implicit");
  const explicits = detail.mods.filter((m) => m.source !== "implicit");

  return (
    <>
      {detail.baseStats.length > 0 && (
        <div className="gear-props">
          {detail.baseStats.map((stat) => (
            <span key={stat}>{stat}</span>
          ))}
        </div>
      )}

      {implicits.length > 0 && (
        <ul className="gear-mods gear-mods--implicit">
          {implicits.map((mod) => (
            <li key={mod.text}>{mod.text}</li>
          ))}
        </ul>
      )}

      {explicits.length > 0 && (
        <ul className="gear-mods">
          {explicits.map((mod) => (
            <li className={`gear-mods__mod--${mod.source}`} key={mod.text}>
              {showTiers && (mod.source === "prefix" || mod.source === "suffix") && mod.tier != null && mod.tier > 0 && (
                <span className="gear-mods__tier">T{mod.tier}</span>
              )}
              {mod.text}
              {mod.source === "crafted" && <span className="gear-mods__crafted">crafted</span>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function FlaskExtraCard({ item, condensed }: { item: PobItem; condensed: boolean }) {
  const displayTitle = sanitizeDisplayField(item.title);
  const displayBase = sanitizeDisplayField(item.baseType);
  const isGenericTitle = !displayTitle || displayTitle === "New Item";

  return (
    <article className={`gear-mini-card ${itemToneClass(item.rarity)}`}>
      <div className="gear-item-row">
        <GearSlotIcon compact iconUrl={item.iconUrl} rarity={item.rarity} slot={item.slot ?? "Extra"} />
        <div className="gear-item-info">
          <span className="gear-mini-slot">{sanitizePobInlineText(item.slot ?? "")}</span>
          <strong>{isGenericTitle && displayBase ? displayBase : displayTitle}</strong>
          {!isGenericTitle && displayBase && (
            <span className="gear-item-base">{displayBase}</span>
          )}
        </div>
      </div>
      {!condensed && <ItemModBlock item={item} showTiers={false} />}
    </article>
  );
}

function GearBoard({
  itemSetTitle,
  items,
  condensed = false,
}: {
  itemSetTitle: string;
  items: PobItem[];
  condensed?: boolean;
}) {
  const { t } = useI18n();
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
        <h3>{t("gear.exactGear")}</h3>
        <span>{sanitizePobInlineText(itemSetTitle)}</span>
      </div>

      <div className="gear-layout">
        {gearLayout.map((slot) => {
          const item = boardItems.get(slot.key);
          const displayTitle = sanitizeDisplayField(item?.title);
          const displayBase = sanitizeDisplayField(item?.baseType);
          const isGenericTitle = !displayTitle || displayTitle === "New Item";

          return (
            <article
              className={`gear-slot gear-slot--${slot.key} ${item ? "has-item" : "is-empty"}`}
              key={slot.key}
            >
              <span className="gear-slot-label">{slot.label}</span>
              {item ? (
                <div className={`gear-item-card ${itemToneClass(item.rarity)}`}>
                  <div className="gear-item-row">
                    <GearSlotIcon iconUrl={item.iconUrl} rarity={item.rarity} slot={item.slot ?? slot.label} />
                    <div className="gear-item-info">
                      <strong>{isGenericTitle && displayBase ? displayBase : displayTitle}</strong>
                      {!isGenericTitle && displayBase && (
                        <span className="gear-item-base">{displayBase}</span>
                      )}
                    </div>
                  </div>
                  {!condensed && <ItemModBlock item={item} />}
                </div>
              ) : (
                <div className="gear-empty">
                  <GearSlotIcon compact slot={slot.label} />
                  <span>{t("gear.noItem")}</span>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {flaskItems.length > 0 && (
        <div className="gear-subsection">
          <span className="mini-help-title">{t("gear.flasks")}</span>
          <div className="gear-strip">
            {flaskItems.map((item) => (
              <FlaskExtraCard item={item} condensed={condensed} key={item.id} />
            ))}
          </div>
        </div>
      )}

      {extraItems.length > 0 && (
        <div className="gear-subsection">
          <span className="mini-help-title">{t("gear.swapAndExtra")}</span>
          <div className="gear-extra-grid">
            {extraItems.map((item) => (
              <FlaskExtraCard item={item} condensed={condensed} key={item.id} />
            ))}
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
  const { t } = useI18n();
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
                  <h3>{t("overview.pobNow")}</h3>
                  <span>
                    Lvl {pob.level} · {build.className} {build.ascendancy}
                  </span>
                </div>
                <p className="lead-copy">{displayTagline}</p>
                <div className="metric-stack">
                  <div>
                    <span>{t("overview.mainSkill")}</span>
                    <strong>{pob.mainSkill ?? t("overview.noMainSkill")}</strong>
                  </div>
                  <div>
                    <span>{t("overview.activeTree")}</span>
                    <strong>{activeTreeSpec?.title ?? t("overview.noActiveTree")}</strong>
                  </div>
                  <div>
                    <span>{t("overview.activeItemSet")}</span>
                    <strong>{activeItemSet?.title ?? t("overview.noActiveItemSet")}</strong>
                  </div>
                  <div>
                    <span>{t("overview.nextUpgrade")}</span>
                    <strong>{displayNextUpgrade || t("overview.reviewNotes")}</strong>
                  </div>
                </div>
                {pob.treeSpecs.length > 1 && (
                  <label className="field pob-spec-field">
                    <span className="field-label">{t("snapshot.activeTreeInApp")}</span>
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
                )}
              </section>

              <section className="panel">
                <div className="section-heading">
                  <h3>{t("overview.exactImport")}</h3>
                  <span>{t("overview.realPoB")}</span>
                </div>
                <div className="metric-stack">
                  <div>
                    <span>{t("overview.treeSpecs")}</span>
                    <strong>{pob.treeSpecs.length}</strong>
                  </div>
                  <div>
                    <span>{t("overview.skillGroups")}</span>
                    <strong>{pob.skillGroups.length}</strong>
                  </div>
                  <div>
                    <span>{t("overview.itemsInActiveSet")}</span>
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
                  <h3>{t("overview.pobNotes")}</h3>
                  <span>{t("overview.formattedForReading")}</span>
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
                <h3>{t("overview.buildNow")}</h3>
                <span>
                  Lvl {progress.playerLevel} · {build.className} {build.ascendancy}
                </span>
              </div>
              <p className="lead-copy">{displayTagline}</p>
              <div className="metric-stack">
                <div>
                  <span>{t("overview.playstyle")}</span>
                  <strong>{displayPlaystyle}</strong>
                </div>
                <div>
                  <span>{t("overview.nextUpgrade")}</span>
                  <strong>{displayNextUpgrade}</strong>
                </div>
                <div>
                  <span>{t("overview.currentStage")}</span>
                  <strong>{currentStage.title}</strong>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="section-heading">
                <h3>{t("overview.warnings")}</h3>
                <span>{t("overview.beforePlaying")}</span>
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
        // Try URL first, then raw base64 from specText
        const treeInput = activeTreeSpec?.url ?? "";
        const decoded = treeInput ? decodeTreeUrl(treeInput) : null;
        const allocatedNodes = decoded?.allocatedNodes ?? new Set<number>();

        return (
          <div className="content-stack">
            <section className="panel tree-panel">
              <div className="section-heading">
                <h3>{condensed ? t("tree.activeTree") : t("tree.treeTimeline")}</h3>
                <span>{activeTreeSpec?.title ?? t("tree.noActiveTree")}</span>
              </div>
              {pob.treeSpecs.length > 1 && (
                <div className="pob-spec-switcher">
                  <label className="field pob-spec-field">
                    <span className="field-label">{t("tree.selectTree")}</span>
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
              <PassiveTreeCanvas
                allocatedNodes={allocatedNodes}
                height={condensed ? 350 : undefined}
              />
              <div className="tree-meta-row">
                <span className="detail-meta">
                  {allocatedNodes.size > 0
                    ? `${allocatedNodes.size} ${t("tree.pointCount", { count: allocatedNodes.size })}`
                    : t("tree.treeSpecImported")}
                </span>
                {activeTreeSpec?.url && (
                  <a
                    className="tree-view-link"
                    href={activeTreeSpec.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {t("tree.viewTree")}
                  </a>
                )}
              </div>
            </section>
          </div>
        );
      }

      return (
        <div className="content-stack">
          <section className="panel">
            <div className="section-heading">
              <h3>{t("tree.passiveMilestones")}</h3>
              <span>{currentStage.title}</span>
            </div>
            <div className="card-grid">
              {stageSubset.flatMap((stage) =>
                stage.passives.map((passive) => (
                  <article className="detail-card" key={passive.id}>
                    <span className="eyebrow">{stage.label}</span>
                    <h4>{passive.targetName}</h4>
                    <p>{passive.instructions}</p>
                    <span className="detail-meta">{t("tree.pointCount", { count: passive.pointsRequired })}</span>
                  </article>
                )),
              )}
            </div>
          </section>

          {!condensed && (
            <section className="panel">
              <div className="section-heading">
                <h3>{t("tree.fullRoadmap")}</h3>
                <span>{t("tree.progressionOrder")}</span>
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
        const activeSkillSetTitle = visibleGroups[0]?.setTitle ?? t("gems.activeSkillSet");

        return (
          <div className="content-stack">
            <section className="panel">
              <div className="section-heading">
                <h3>{t("gems.linksAndGems")}</h3>
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
              itemSetTitle={activeItemSet?.title ?? t("gear.exactGear")}
              items={condensed ? activePobItems.slice(0, 12) : activePobItems}
              condensed={condensed}
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
                    <span className="detail-meta">{t("gear.uniqueHint", { suggestion: gear.uniqueSuggestion })}</span>
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
              <h3>{t("notes.buildNotes")}</h3>
              <span>{t("notes.importMvp")}</span>
            </div>
            <NoteSections text={build.notes} />
          </section>

          {stageNotes.length > 0 && (
            <section className="panel">
              <div className="section-heading">
                <h3>{t("notes.currentSnapshot")}</h3>
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
              <h3>{t("notes.pinnedItems")}</h3>
              <span>{t("notes.pinnedActive", { count: pinnedItems.length })}</span>
            </div>
            {pinnedItems.length === 0 ? (
              <p className="subtle">{t("notes.noPinnedItems")}</p>
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

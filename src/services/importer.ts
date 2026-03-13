import {
  Build,
  BuildSourceType,
  BuildStage,
  BuildSummary,
  ChecklistItem,
  GearPriority,
  GemCategory,
  GemSetup,
  LabStep,
  PassiveMilestone,
  PobData,
  PobGem,
  PobItem,
  PobItemSet,
  PobSkillGroup,
  PobTreeSpec,
  UserProgress,
} from "@/domain/models";
import { sanitizePobInlineText, sanitizePobNotes } from "@/services/pob-display";
import { resolveGemIcons, resolveItemIcons } from "@/services/poe-icons";
import { t } from "@/i18n";

const classIdToName: Record<string, string> = {
  "0": "Scion",
  "1": "Marauder",
  "2": "Ranger",
  "3": "Witch",
  "4": "Duelist",
  "5": "Templar",
  "6": "Shadow",
};

const ascendancyByClassId: Record<string, Record<string, string>> = {
  "0": { "1": "Ascendant" },
  "1": { "1": "Juggernaut", "2": "Berserker", "3": "Chieftain" },
  "2": { "1": "Raider", "2": "Deadeye", "3": "Pathfinder" },
  "3": { "1": "Necromancer", "2": "Occultist", "3": "Elementalist" },
  "4": { "1": "Slayer", "2": "Gladiator", "3": "Champion" },
  "5": { "1": "Inquisitor", "2": "Hierophant", "3": "Guardian" },
  "6": { "1": "Assassin", "2": "Trickster", "3": "Saboteur" },
};

function getDesktopBridge() {
  if (!window.desktop?.resolvePobSource) {
    throw new Error(t("importer.desktopRequired"));
  }

  return window.desktop;
}

function parseXmlDocument(xml: string) {
  const document = new DOMParser().parseFromString(xml, "text/xml");

  if (document.getElementsByTagName("parsererror").length > 0) {
    throw new Error(t("importer.invalidXml"));
  }

  return document;
}

function childElements(parent: Element, tagName: string) {
  return Array.from(parent.childNodes).filter(
    (node): node is Element =>
      node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === tagName,
  );
}

function firstElement(document: XMLDocument, tagName: string) {
  return document.getElementsByTagName(tagName)[0] ?? null;
}

function attribute(element: Element | null, name: string) {
  return element?.getAttribute(name)?.trim() || "";
}

function attributeNumber(element: Element | null, name: string) {
  const raw = attribute(element, name);

  if (!raw) {
    return undefined;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function attributeBoolean(element: Element | null, name: string, fallback = true) {
  const raw = attribute(element, name).toLowerCase();

  if (!raw) {
    return fallback;
  }

  if (raw === "false" || raw === "0" || raw === "nil") {
    return false;
  }

  if (raw === "true" || raw === "1") {
    return true;
  }

  return fallback;
}

function formatIdentifier(rawValue: string) {
  return rawValue
    .replace(/^Metadata\/Items\/Gems\//, "")
    .replace(/^Metadata\/Items\//, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .replace(/^Support\s+/i, "")
    .replace(/\s+Support$/i, "")
    .replace(/\bAnd\b/g, "and")
    .replace(/\bOf\b/g, "of")
    .trim();
}

function buildGemName(skillId: string, nameSpec: string) {
  const baseName = skillId ? formatIdentifier(skillId) : "";

  if (nameSpec && baseName) {
    // Avoid redundant "Name (Name)" when both resolve to the same string
    if (baseName.toLowerCase() === nameSpec.toLowerCase()) {
      return nameSpec;
    }
    return `${baseName} (${nameSpec})`;
  }

  if (nameSpec) {
    return nameSpec;
  }

  return baseName || t("importer.importedGem");
}

function extractLevelHint(title: string) {
  const match = title.match(/\b(?:level|lvl)\s*(\d{1,3})\b/i);

  if (!match) {
    return undefined;
  }

  const level = Number(match[1]);
  return Number.isFinite(level) ? level : undefined;
}

const NOTE_LINK_ONLY_PATTERN = /^(?:https?:\/\/|www\.)\S+$/i;
const NOTE_PROMO_PATTERN =
  /(discord|twitch|youtube|subscribe|like the video|channel|more content|questions|hit me on|build made by|guide by|follow me)/i;

function splitNoteSections(value: string) {
  return sanitizePobNotes(value)
    .split(/\n{2,}/)
    .map((section) =>
      section
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .filter((section) => section.length > 0);
}

function cleanNoteLine(value: string) {
  return sanitizePobInlineText(
    value
      .replace(/^[\s\-_=|~:•*]+/, "")
      .replace(/[\s\-_=|~:•*]+$/, ""),
  );
}

function inferActionType(text: string): ChecklistItem["type"] {
  const normalized = text.toLowerCase();

  if (/(lab|ascend)/.test(normalized)) {
    return "lab";
  }

  if (/(gem|skill|aura|support|link|socket)/.test(normalized)) {
    return "gem";
  }

  if (/(gear|item|weapon|helmet|helm|body|armour|gloves|boots|ring|belt|amulet|flask)/.test(normalized)) {
    return "gear";
  }

  if (/(nota|note|review|revisar|conferir)/.test(normalized)) {
    return "note";
  }

  return "quest";
}

type SnapshotAction = {
  text: string;
  type: ChecklistItem["type"];
  required?: boolean;
};

function createActionFromNoteSection(lines: string[]): SnapshotAction | undefined {
  const cleanedLines = lines
    .map((line) => cleanNoteLine(line))
    .filter(Boolean)
    .filter((line) => !NOTE_LINK_ONLY_PATTERN.test(line));

  if (cleanedLines.length === 0) {
    return undefined;
  }

  const joined = cleanedLines.join(" ");
  const lead = cleanedLines[0];

  if (NOTE_PROMO_PATTERN.test(joined) || /^(discord|twitch|youtube)$/i.test(lead)) {
    return undefined;
  }

  const banditMatch = lead.match(/^bandits?\s*[-:]\s*(.+)$/i);
  if (banditMatch) {
    return { text: t("importer.chooseBandit", { name: cleanNoteLine(banditMatch[1]) }), type: "quest" };
  }

  const majorGodMatch = lead.match(/^major god\s*[-:]\s*(.+)$/i);
  if (majorGodMatch) {
    return { text: t("importer.pantheonMajor", { name: cleanNoteLine(majorGodMatch[1]) }), type: "quest" };
  }

  const minorGodMatch = lead.match(/^minor god\s*[-:]\s*(.+)$/i);
  if (minorGodMatch) {
    return { text: t("importer.pantheonMinor", { name: cleanNoteLine(minorGodMatch[1]) }), type: "quest" };
  }

  const labMatch = lead.match(/^(lab|ascendancy)\s*[-:]\s*(.+)$/i);
  if (labMatch) {
    return { text: t("importer.doLab", { name: cleanNoteLine(labMatch[2]) }), type: "lab" };
  }

  const detailLine = cleanedLines.find((line, index) => index > 0 && !NOTE_PROMO_PATTERN.test(line));
  if (detailLine && detailLine.length <= 120) {
    return { text: detailLine, type: inferActionType(detailLine) };
  }

  if (lead.length > 120 || /^tips?$/i.test(lead)) {
    return undefined;
  }

  if (/^(?:a\d|act\b|level\b|lvl\b|early maps|yellow maps|red maps|endgame)/i.test(lead)) {
    return { text: t("importer.followSetup", { name: lead }), type: "quest" };
  }

  return { text: lead, type: inferActionType(lead) };
}

function dedupeSnapshotActions(actions: SnapshotAction[]) {
  const seen = new Set<string>();

  return actions.filter((action) => {
    const key = sanitizePobInlineText(action.text).toLowerCase();

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function createSnapshotActions(pob: PobData) {
  const activeSpec = pob.treeSpecs.find((spec) => spec.id === pob.activeTreeSpecId) ?? pob.treeSpecs[0];
  const activeItemSet = pob.itemSets.find((itemSet) => itemSet.id === pob.activeItemSetId) ?? pob.itemSets[0];
  const noteActions = splitNoteSections(pob.notes)
    .map((section) => createActionFromNoteSection(section))
    .filter((action): action is SnapshotAction => Boolean(action));
  const fallbackActions: SnapshotAction[] = [
    ...(pob.bandit ? [{ text: t("importer.chooseBandit", { name: sanitizePobInlineText(pob.bandit) }), type: "quest" as const }] : []),
    ...(pob.pantheonMajor
      ? [{ text: t("importer.pantheonMajor", { name: sanitizePobInlineText(pob.pantheonMajor) }), type: "quest" as const }]
      : []),
    ...(pob.pantheonMinor
      ? [{ text: t("importer.pantheonMinor", { name: sanitizePobInlineText(pob.pantheonMinor) }), type: "quest" as const }]
      : []),
    ...(activeSpec
      ? [{ text: t("importer.followTree", { name: sanitizePobInlineText(activeSpec.title) }), type: "quest" as const }]
      : [{ text: t("importer.checkImportedTree"), type: "quest" as const }]),
    ...(pob.mainSkill
      ? [{ text: t("importer.setupMainSkill", { name: sanitizePobInlineText(pob.mainSkill) }), type: "gem" as const }]
      : [{ text: t("importer.checkActiveSkillSet"), type: "gem" as const }]),
    ...(activeItemSet
      ? [{ text: t("importer.reviewGear", { name: sanitizePobInlineText(activeItemSet.title) }), type: "gear" as const }]
      : [{ text: t("importer.checkImportedGear"), type: "gear" as const }]),
    ...(pob.notes
      ? [{ text: t("importer.openPobNotes"), type: "note" as const, required: false }]
      : []),
  ];

  return dedupeSnapshotActions([...noteActions, ...fallbackActions]);
}

function isMetadataLine(line: string) {
  return (
    /^Rarity:/i.test(line) ||
    /^Unique ID:/i.test(line) ||
    /^[0-9a-f]{24,}$/i.test(line) ||
    /^Implicits:\s*\d+/i.test(line) ||
    /BasePercentile/i.test(line) ||
    /^crafted:\s*true$/i.test(line) ||
    /^Prefix:\s*/i.test(line) ||
    /^Suffix:\s*/i.test(line) ||
    /^Selected Variant:/i.test(line) ||
    /^Selected Alt Variant:/i.test(line) ||
    /^Has Alt Variant:/i.test(line) ||
    /^Variant:/i.test(line) ||
    /^Quality:\s*\d+/i.test(line) ||
    /^Sockets:/i.test(line) ||
    /^Item Level:/i.test(line) ||
    /^LevelReq:/i.test(line) ||
    /^Catalyst/i.test(line) ||
    /^(Searing Exarch|Eater of Worlds|Shaper|Elder|Crusader|Hunter|Redeemer|Warlord) Item$/i.test(line) ||
    line === "--------"
  );
}

function parseItemHeader(rawText: string) {
  const lines = rawText
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const rarity = lines[0]?.startsWith("Rarity:") ? lines[0].replace("Rarity:", "").trim() : undefined;
  const contentLines = rarity ? lines.slice(1) : lines;

  // Separate header names from metadata/stats — stop at first metadata/stat/separator line
  const headerLines: string[] = [];
  for (const line of contentLines) {
    // Strip PoB tags before checking
    const clean = line.replace(/\{[^}]+\}/g, "").replace(/\^(?:x[0-9a-fA-F]{6}|[0-9])/g, "").trim();
    if (!clean) continue;
    if (isMetadataLine(clean) || clean === "--------") break;
    // Lines with ":" are usually stats/metadata (e.g. "Physical Damage: 10-20")
    // Exception: item names can have ":" but those are the first 1-2 lines max
    if (headerLines.length >= 2) break;
    if (clean.includes(":") && headerLines.length > 0) break;
    headerLines.push(clean);
  }

  if ((rarity === "Rare" || rarity === "Unique") && headerLines.length >= 2) {
    return {
      title: headerLines[0],
      baseType: headerLines[1],
      rarity,
    };
  }

  return {
    title: headerLines[0] ?? t("importer.importedItem"),
    baseType: headerLines[1],
    rarity,
  };
}

function inferClassName(buildElement: Element | null, activeTreeSpec: Element | null) {
  const explicit = attribute(buildElement, "className");

  if (explicit) {
    return explicit;
  }

  const classId = attribute(activeTreeSpec, "classId");
  return classIdToName[classId] ?? t("importer.unknownClass");
}

function inferAscendancy(buildElement: Element | null, activeTreeSpec: Element | null, className: string) {
  const explicit = attribute(buildElement, "ascendClassName");

  if (explicit) {
    return explicit;
  }

  const classId = attribute(activeTreeSpec, "classId");
  const ascendClassId = attribute(activeTreeSpec, "ascendClassId");
  const inferred = ascendancyByClassId[classId]?.[ascendClassId];

  return inferred ?? (className === "Scion" ? "Ascendant" : t("importer.unknownAscendancy"));
}

function resolveBuildName(buildElement: Element | null, className: string, ascendancy: string, mainSkill?: string) {
  const explicit = attribute(buildElement, "title");

  if (explicit) {
    return explicit;
  }

  if (mainSkill) {
    return `${className} ${ascendancy} ${mainSkill}`;
  }

  return `${className} ${ascendancy}`;
}

function gemCategoryFromGroup(group: PobSkillGroup, mainSkill?: string): GemCategory {
  const slot = (group.slot ?? "").toLowerCase();
  const label = group.label.toLowerCase();

  if (mainSkill && group.label === mainSkill) {
    return "main";
  }

  if (slot.includes("boots") || slot.includes("gloves") || label.includes("dash") || label.includes("flame dash")) {
    return "movement";
  }

  if (label.includes("aura") || label.includes("herald") || label.includes("banner")) {
    return "aura";
  }

  return "utility";
}

function stagePassive(stageId: string, index: number, targetName: string, pointsRequired: number, instructions: string): PassiveMilestone {
  return {
    id: `${stageId}-passive-${index}`,
    targetName,
    pointsRequired,
    instructions,
  };
}

function stageGem(
  stageId: string,
  index: number,
  category: GemCategory,
  mainGem: string,
  supportGems: string[],
  optionalGems: string[],
  notes: string,
): GemSetup {
  return {
    id: `${stageId}-gem-${index}`,
    stageId,
    category,
    mainGem,
    supportGems,
    optionalGems,
    notes,
  };
}

function stageGear(
  stageId: string,
  index: number,
  slot: string,
  requiredStats: string[],
  preferredStats: string[],
  uniqueSuggestion: string | undefined,
  notes: string,
): GearPriority {
  return {
    id: `${stageId}-gear-${index}`,
    slot,
    requiredStats,
    preferredStats,
    uniqueSuggestion,
    notes,
  };
}

function stageChecklist(
  stageId: string,
  index: number,
  text: string,
  type: ChecklistItem["type"],
  required = true,
): ChecklistItem {
  return {
    id: `${stageId}-check-${index}`,
    text,
    type,
    required,
  };
}

async function resolvePobXml(sourceType: BuildSourceType, sourceValue: string) {
  const trimmed = sourceValue.trim();

  if ((sourceType === "file" || sourceType === "code") && trimmed.startsWith("<")) {
    return trimmed;
  }

  return getDesktopBridge().resolvePobSource(sourceType, sourceValue);
}

function parsePobData(xml: string): {
  name: string;
  className: string;
  ascendancy: string;
  notes: string;
  pob: PobData;
} {
  const document = parseXmlDocument(xml);
  const root = document.documentElement;
  const buildElement = firstElement(document, "Build");
  const treeElement = firstElement(document, "Tree");
  const skillsElement = firstElement(document, "Skills");
  const itemsElement = firstElement(document, "Items");
  const notesElement = firstElement(document, "Notes");

  const activeTreeSpecId = attribute(treeElement, "activeSpec");
  const treeSpecElements = treeElement ? childElements(treeElement, "Spec") : [];
  const activeTreeSpecElement =
    treeSpecElements.find((spec) => attribute(spec, "id") === activeTreeSpecId) ??
    treeSpecElements[0] ??
    null;

  const className = inferClassName(buildElement, activeTreeSpecElement);
  const ascendancy = inferAscendancy(buildElement, activeTreeSpecElement, className);

  const treeSpecs: PobTreeSpec[] = treeSpecElements.map((spec, index) => {
    const id = attribute(spec, "id") || String(index + 1);
    const title = attribute(spec, "title") || `Tree ${index + 1}`;

    // PoB stores the tree URL as textContent inside <Spec>, not as an attribute.
    // Also try "url" attribute as fallback for other formats.
    const specText = (spec.textContent ?? "").trim();
    const url =
      attribute(spec, "url") ||
      (specText.includes("passive-skill-tree") ? specText : undefined);

    return {
      id,
      title,
      levelHint: extractLevelHint(title),
      treeVersion: attribute(spec, "treeVersion") || undefined,
      url,
      isActive: id === activeTreeSpecId || (!activeTreeSpecId && index === 0),
    };
  });

  const activeSkillSetId =
    attribute(skillsElement, "activeSkillSet") || attribute(buildElement, "activeSkillSet");
  const skillSetElements = skillsElement ? childElements(skillsElement, "SkillSet") : [];
  const skillGroups: PobSkillGroup[] = [];

  skillSetElements.forEach((skillSet, setIndex) => {
    const setId = attribute(skillSet, "id") || String(setIndex + 1);
    const setTitle = attribute(skillSet, "title") || `Skill Set ${setId}`;

    childElements(skillSet, "Skill").forEach((skill, groupIndex) => {
      const gems: PobGem[] = childElements(skill, "Gem").map((gem, gemIndex) => {
        const skillId = attribute(gem, "skillId");
        const nameSpec = attribute(gem, "nameSpec");

        return {
          id: `${setId}-${groupIndex + 1}-${gemIndex + 1}`,
          name: buildGemName(skillId, nameSpec),
          rawName: skillId || nameSpec || `Gem ${gemIndex + 1}`,
          level: attributeNumber(gem, "level"),
          quality: attributeNumber(gem, "quality"),
          enabled: attributeBoolean(gem, "enabled"),
        };
      });

      const label =
        attribute(skill, "label") ||
        gems.find((gem) => !gem.rawName.toLowerCase().includes("support"))?.name ||
        gems[0]?.name ||
        t("importer.group", { index: groupIndex + 1 });

      skillGroups.push({
        id: `${setId}-${groupIndex + 1}`,
        setId,
        setTitle,
        label,
        slot: attribute(skill, "slot") || undefined,
        enabled: attributeBoolean(skill, "enabled"),
        isSelected: setId === activeSkillSetId || (!activeSkillSetId && setIndex === 0),
        gems,
      });
    });
  });

  const mainSkill =
    skillGroups.find((group) => group.isSelected && group.enabled)?.label ||
    skillGroups.find((group) => group.enabled)?.label ||
    skillGroups[0]?.label;

  const activeItemSetId =
    attribute(itemsElement, "activeItemSet") || attribute(buildElement, "activeItemSet");
  const itemElements = itemsElement ? childElements(itemsElement, "Item") : [];
  const rawItemsById = new Map<string, string>();

  itemElements.forEach((item, index) => {
    const id = attribute(item, "id") || String(index + 1);
    rawItemsById.set(id, (item.textContent ?? "").trim());
  });

  const itemSetElements = itemsElement ? childElements(itemsElement, "ItemSet") : [];
  const itemSets: PobItemSet[] = itemSetElements.map((itemSet, index) => {
    const id = attribute(itemSet, "id") || String(index + 1);
    const title = attribute(itemSet, "title") || `Item Set ${id}`;

    return {
      id,
      title,
      isActive: id === activeItemSetId || (!activeItemSetId && index === 0),
      slots: childElements(itemSet, "Slot").map((slot) => ({
        name: attribute(slot, "name") || "Slot",
        itemId: attribute(slot, "itemId") || undefined,
      })),
    };
  });

  const items: PobItem[] = itemSets.flatMap((itemSet) =>
    itemSet.slots
      .filter((slot) => slot.itemId && rawItemsById.has(slot.itemId))
      .map((slot) => {
        const rawText = rawItemsById.get(slot.itemId!) ?? "";
        const parsed = parseItemHeader(rawText);

        return {
          id: `${itemSet.id}-${slot.name}`,
          setId: itemSet.id,
          setTitle: itemSet.title,
          slot: slot.name,
          title: parsed.title,
          baseType: parsed.baseType,
          rarity: parsed.rarity,
          rawText,
        };
      }),
  );

  const notes = sanitizePobNotes(notesElement?.textContent ?? "");

  // Resolve icon URLs from poe-icons.json
  const allGems = skillGroups.flatMap((g) => g.gems);
  resolveGemIcons(allGems);
  resolveItemIcons(items);

  const pob: PobData = {
    version: attribute(root, "version") || undefined,
    level: attributeNumber(buildElement, "level") ?? 1,
    bandit: attribute(buildElement, "bandit") || undefined,
    pantheonMajor:
      attribute(buildElement, "pantheonMajorGod") ||
      attribute(buildElement, "pantheonMajor") ||
      undefined,
    pantheonMinor:
      attribute(buildElement, "pantheonMinorGod") ||
      attribute(buildElement, "pantheonMinor") ||
      undefined,
    activeTreeSpecId: treeSpecs.find((spec) => spec.isActive)?.id,
    activeItemSetId: itemSets.find((itemSet) => itemSet.isActive)?.id,
    activeSkillSetId:
      skillGroups.find((group) => group.isSelected)?.setId ||
      skillGroups[0]?.setId,
    mainSkill,
    treeSpecs,
    skillGroups,
    itemSets,
    items,
    notes,
  };

  return {
    name: resolveBuildName(buildElement, className, ascendancy, mainSkill),
    className,
    ascendancy,
    notes,
    pob,
  };
}

function createSummary(pob: PobData): BuildSummary {
  const activeItemSet = pob.itemSets.find((itemSet) => itemSet.isActive);
  const firstAction = createSnapshotActions(pob)[0]?.text;

  return {
    tagline: t("importer.tagline", {
      treeSpecs: pob.treeSpecs.length,
      skillGroups: pob.skillGroups.length,
      items: pob.items.length,
    }),
    playstyle: pob.mainSkill
      ? t("importer.mainSkillPlaystyle", { name: sanitizePobInlineText(pob.mainSkill) })
      : t("importer.exactImport"),
    nextUpgrade:
      firstAction ||
      (activeItemSet
        ? t("importer.reviewGearSet", { name: sanitizePobInlineText(activeItemSet.title) })
        : t("importer.reviewPobNotes")),
    warningCards: [],
  };
}

function createSnapshotStage(buildId: string, name: string, pob: PobData): BuildStage {
  const activeSpec = pob.treeSpecs.find((spec) => spec.isActive) ?? pob.treeSpecs[0];
  const activeItemSet = pob.itemSets.find((itemSet) => itemSet.isActive) ?? pob.itemSets[0];
  const activeSkillGroups = pob.skillGroups.filter((group) => group.isSelected);
  const displaySkillGroups = activeSkillGroups.length > 0 ? activeSkillGroups : pob.skillGroups;
  const snapshotActions = createSnapshotActions(pob);
  const snapshotNotes =
    pob.notes
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 3);
  const stageId = `${buildId}-stage-1`;

  return {
    id: stageId,
    buildId,
    order: 1,
    label: "PoB Snapshot",
    levelMin: 1,
    levelMax: 100,
    title: sanitizePobInlineText(activeSpec?.title || t("importer.snapshotImported")),
    summary:
      snapshotActions[0]?.text ||
      t("importer.snapshotSummary", {
        mainSkill: pob.mainSkill ? ` · ${sanitizePobInlineText(pob.mainSkill)}` : "",
        itemSet: activeItemSet ? ` · ${sanitizePobInlineText(activeItemSet.title)}` : "",
      }),
    passives:
      pob.treeSpecs.length > 0
        ? pob.treeSpecs.map((spec, index) =>
            stagePassive(
              stageId,
              index + 1,
              spec.title,
              spec.levelHint ?? 0,
              spec.url ? t("importer.treeUrl", { url: spec.url }) : t("importer.treeSpecImported"),
            ),
          )
        : [stagePassive(stageId, 1, name, pob.level, t("importer.buildImported"))],
    gems: displaySkillGroups.slice(0, 4).map((group, index) => {
      const gems = group.gems.filter((gem) => gem.enabled);
      const primaryGem = gems[0]?.name || group.label;

      return stageGem(
        stageId,
        index + 1,
        gemCategoryFromGroup(group, pob.mainSkill),
        primaryGem,
        gems.slice(1, 4).map((gem) => gem.name),
        group.gems.filter((gem) => !gem.enabled).slice(0, 2).map((gem) => gem.name),
        `${group.setTitle}${group.slot ? ` · ${group.slot}` : ""}`,
      );
    }),
    gear: pob.items.slice(0, 8).map((item, index) =>
      stageGear(
        stageId,
        index + 1,
        item.slot || "Item",
        [item.title],
        item.baseType ? [item.baseType] : [],
        item.rarity,
        item.rawText || `${item.title}${item.baseType ? ` · ${item.baseType}` : ""}`,
      ),
    ),
    checklist: snapshotActions.map((action, index) =>
      stageChecklist(
        stageId,
        index + 1,
        action.text,
        action.type,
        action.required ?? true,
      ),
    ),
    notes:
      snapshotNotes.length > 0
        ? snapshotNotes
        : [t("importer.snapshotGenerated")],
  };
}

function createCharacterCards(buildId: string, ascendancy: string, pob: PobData): LabStep[] {
  const cards: Array<[string, string, string]> = [];

  cards.push(["Ascendancy", ascendancy, t("importer.ascendancyImported")]);

  if (pob.bandit) {
    cards.push(["Bandit", pob.bandit, t("importer.banditImported")]);
  }

  if (pob.pantheonMajor || pob.pantheonMinor) {
    cards.push([
      "Pantheon",
      [pob.pantheonMajor, pob.pantheonMinor].filter(Boolean).join(" · "),
      t("importer.pantheonImported"),
    ]);
  }

  const activeItemSet = pob.itemSets.find((itemSet) => itemSet.isActive);
  if (activeItemSet) {
    cards.push(["Item Set", activeItemSet.title, t("importer.activeSetImported")]);
  }

  return cards.map(([title, ascendancyChoice, notes], index) => ({
    id: `${buildId}-character-${index + 1}`,
    order: index + 1,
    title,
    levelHint: index === 0 ? `Lvl ${pob.level}` : "PoB",
    ascendancyChoice,
    notes,
  }));
}

export async function createImportedBuild(sourceType: BuildSourceType, sourceValue: string): Promise<Build> {
  const xml = await resolvePobXml(sourceType, sourceValue);
  const { name, className, ascendancy, notes, pob } = parsePobData(xml);
  const id = crypto.randomUUID();

  return {
    id,
    name,
    className,
    ascendancy,
    sourceType,
    sourceValue,
    importedAt: new Date().toISOString(),
    notes,
    warnings: [],
    summary: createSummary(pob),
    stages: [createSnapshotStage(id, name, pob)],
    labs: createCharacterCards(id, ascendancy, pob),
    pob,
  };
}

export function rehydrateImportedBuild(build: Build): Build {
  if (!build.pob) {
    return build;
  }

  // Re-resolve icon URLs for existing builds (covers builds imported before icon support)
  const allGems = build.pob.skillGroups.flatMap((g) => g.gems);
  resolveGemIcons(allGems);
  resolveItemIcons(build.pob.items);

  return {
    ...build,
    notes: sanitizePobNotes(build.pob.notes || build.notes),
    summary: createSummary(build.pob),
    stages: [createSnapshotStage(build.id, build.name, build.pob)],
    labs: createCharacterCards(build.id, build.ascendancy, build.pob),
  };
}

export function createInitialProgress(build: Build): UserProgress {
  const firstStage = build.stages[0];
  const importedLevel = build.pob?.level ?? firstStage?.levelMin ?? 1;

  return {
    id: crypto.randomUUID(),
    buildId: build.id,
    playerLevel: Math.max(1, Math.min(100, importedLevel)),
    currentStageId: firstStage?.id ?? "",
    completedChecklistIds: [],
    pinnedItemIds: [],
    updatedAt: new Date().toISOString(),
  };
}

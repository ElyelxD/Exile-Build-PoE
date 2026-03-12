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
import { sanitizePobNotes } from "@/services/pob-display";

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
    throw new Error("A importação exata de Path of Building precisa do app desktop.");
  }

  return window.desktop;
}

function parseXmlDocument(xml: string) {
  const document = new DOMParser().parseFromString(xml, "text/xml");

  if (document.getElementsByTagName("parsererror").length > 0) {
    throw new Error("O XML do Path of Building está inválido.");
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
    return `${baseName} (${nameSpec})`;
  }

  if (nameSpec) {
    return nameSpec;
  }

  return baseName || "Gem importada";
}

function extractLevelHint(title: string) {
  const match = title.match(/\b(?:level|lvl)\s*(\d{1,3})\b/i);

  if (!match) {
    return undefined;
  }

  const level = Number(match[1]);
  return Number.isFinite(level) ? level : undefined;
}

function firstMeaningfulLine(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
}

function parseItemHeader(rawText: string) {
  const lines = rawText
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const rarity = lines[0]?.startsWith("Rarity:") ? lines[0].replace("Rarity:", "").trim() : undefined;

  if (!rarity) {
    return {
      title: lines[0] ?? "Item importado",
      baseType: lines[1],
      rarity: undefined,
    };
  }

  if ((rarity === "Rare" || rarity === "Unique") && lines.length >= 3) {
    return {
      title: lines[1],
      baseType: lines[2],
      rarity,
    };
  }

  return {
    title: lines[1] ?? "Item importado",
    baseType: lines[2],
    rarity,
  };
}

function inferClassName(buildElement: Element | null, activeTreeSpec: Element | null) {
  const explicit = attribute(buildElement, "className");

  if (explicit) {
    return explicit;
  }

  const classId = attribute(activeTreeSpec, "classId");
  return classIdToName[classId] ?? "Classe desconhecida";
}

function inferAscendancy(buildElement: Element | null, activeTreeSpec: Element | null, className: string) {
  const explicit = attribute(buildElement, "ascendClassName");

  if (explicit) {
    return explicit;
  }

  const classId = attribute(activeTreeSpec, "classId");
  const ascendClassId = attribute(activeTreeSpec, "ascendClassId");
  const inferred = ascendancyByClassId[classId]?.[ascendClassId];

  return inferred ?? (className === "Scion" ? "Ascendant" : "Ascendancy desconhecida");
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

    return {
      id,
      title,
      levelHint: extractLevelHint(title),
      treeVersion: attribute(spec, "treeVersion") || undefined,
      url: attribute(spec, "url") || undefined,
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
        `Grupo ${groupIndex + 1}`;

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
  const firstNote = firstMeaningfulLine(pob.notes);

  return {
    tagline: `Import exato do PoB com ${pob.treeSpecs.length} tree spec${pob.treeSpecs.length === 1 ? "" : "s"}, ${pob.skillGroups.length} grupo${pob.skillGroups.length === 1 ? "" : "s"} de skill e ${pob.items.length} item${pob.items.length === 1 ? "" : "s"} no snapshot.`,
    playstyle: pob.mainSkill ? `Skill principal: ${pob.mainSkill}` : "Import exato do Path of Building.",
    nextUpgrade:
      firstNote ||
      (activeItemSet ? `Item set ativo: ${activeItemSet.title}` : "Revisar as notas do PoB."),
    warningCards: [],
  };
}

function createSnapshotStage(buildId: string, name: string, pob: PobData): BuildStage {
  const activeSpec = pob.treeSpecs.find((spec) => spec.isActive) ?? pob.treeSpecs[0];
  const activeItemSet = pob.itemSets.find((itemSet) => itemSet.isActive) ?? pob.itemSets[0];
  const activeSkillGroups = pob.skillGroups.filter((group) => group.isSelected);
  const displaySkillGroups = activeSkillGroups.length > 0 ? activeSkillGroups : pob.skillGroups;
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
    title: activeSpec?.title || "Snapshot importado",
    summary: `Snapshot exato do Path of Building${pob.mainSkill ? ` · ${pob.mainSkill}` : ""}${activeItemSet ? ` · ${activeItemSet.title}` : ""}.`,
    passives:
      pob.treeSpecs.length > 0
        ? pob.treeSpecs.map((spec, index) =>
            stagePassive(
              stageId,
              index + 1,
              spec.title,
              spec.levelHint ?? 0,
              spec.url ? `Tree URL: ${spec.url}` : "Tree spec importada exatamente do PoB.",
            ),
          )
        : [stagePassive(stageId, 1, name, pob.level, "Build importada exatamente do Path of Building.")],
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
    checklist: [
      stageChecklist(
        stageId,
        1,
        activeSpec ? `Tree ativa: ${activeSpec.title}` : "Conferir tree importada do PoB",
        "quest",
        true,
      ),
      stageChecklist(
        stageId,
        2,
        pob.mainSkill ? `Skill principal: ${pob.mainSkill}` : "Conferir skill set ativo",
        "gem",
        true,
      ),
      stageChecklist(
        stageId,
        3,
        activeItemSet ? `Item set ativo: ${activeItemSet.title}` : "Conferir gear do PoB",
        "gear",
        true,
      ),
      ...(pob.notes
        ? [stageChecklist(stageId, 4, "Revisar notas exatas do PoB", "note", false)]
        : []),
    ],
    notes:
      snapshotNotes.length > 0
        ? snapshotNotes
        : ["Snapshot gerado exatamente a partir do Path of Building importado."],
  };
}

function createCharacterCards(buildId: string, ascendancy: string, pob: PobData): LabStep[] {
  const cards: Array<[string, string, string]> = [];

  cards.push(["Ascendancy", ascendancy, "Classe e ascendancy importadas exatamente do PoB."]);

  if (pob.bandit) {
    cards.push(["Bandit", pob.bandit, "Escolha de bandit importada do PoB."]);
  }

  if (pob.pantheonMajor || pob.pantheonMinor) {
    cards.push([
      "Pantheon",
      [pob.pantheonMajor, pob.pantheonMinor].filter(Boolean).join(" · "),
      "Pantheon major/minor importado do PoB.",
    ]);
  }

  const activeItemSet = pob.itemSets.find((itemSet) => itemSet.isActive);
  if (activeItemSet) {
    cards.push(["Item Set", activeItemSet.title, "Conjunto ativo importado do PoB."]);
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

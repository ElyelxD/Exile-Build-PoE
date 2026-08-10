/**
 * Turn a ChallengeSpec into a regular `Build`, so a challenge inherits the build
 * list, the overlay, the checklist hotkeys and progress persistence for free.
 *
 * The synthetic `PobData` is a *requirements sheet*, never a simulated build:
 * it contains the mandated skill, the mandated item and the mandated passive
 * nodes and nothing else. Empty stays empty (src/services/challenge/README.md §4, M1).
 */

import type {
  Build,
  BuildStage,
  BuildSummary,
  ChecklistItem,
  ChecklistType,
  GearPriority,
  GemSetup,
  LabStep,
  PobData,
  PobGem,
  PobItem,
  PobSkillGroup,
} from "@/domain/models";
import type { ChallengeDifficulty, ChallengeRule, ChallengeRuleKind, ChallengeSpec } from "@/domain/challenge";
import { gemColorOf, type GemGroupKind } from "@/services/challenge/gem-planner";
import type { TranslationKey } from "@/i18n/locales/en";
import { resolveGemColor } from "@/services/gem-colors";
import { resolveGemIcon, resolveItemIcon } from "@/services/poe-icons";
import { encodeTreeUrl } from "@/services/tree-encoder";
import { DIFFICULTY_LABEL_KEYS, generateChallenge } from "@/services/challenge/generator";
import { createSeed, formatChallengeCode, parseChallengeCode } from "@/services/challenge/rng";
import { t } from "@/i18n";

/** Group headings, so the gem board says what each socketed item is for. */
const GEM_GROUP_LABEL_KEYS: Record<GemGroupKind, TranslationKey> = {
  main: "challenge.group.main",
  aura: "challenge.group.aura",
  guard: "challenge.group.guard",
  movement: "challenge.group.movement",
  curse: "challenge.group.curse",
};

/** Which checklist bucket each rule belongs to — drives the overlay's objective icons. */
const RULE_CHECKLIST_TYPE: Record<ChallengeRuleKind, ChecklistType> = {
  class: "quest",
  skill: "gem",
  level: "quest",
  weapon: "gear",
  unique: "gear",
  keystone: "note",
  "ban-movement": "gem",
  "ban-uniques": "gear",
  "ban-supports": "gem",
  extra: "note",
};

function difficultyLabel(difficulty: ChallengeDifficulty): string {
  return t(DIFFICULTY_LABEL_KEYS[difficulty]);
}

function createChecklist(stageId: string, rules: ChallengeRule[]): ChecklistItem[] {
  return rules.map((rule, index) => ({
    // Index-based so the ids survive a locale change and a regeneration (M3).
    id: `${stageId}-rule-${index + 1}`,
    text: rule.text,
    type: RULE_CHECKLIST_TYPE[rule.kind],
    required: true,
  }));
}

function createGems(stageId: string, spec: ChallengeSpec): GemSetup[] {
  const setups: GemSetup[] = [
    {
      id: `${stageId}-gem-main`,
      stageId,
      category: "main",
      mainGem: spec.skill.name,
      supportGems: spec.links,
      optionalGems: [],
      notes:
        spec.bannedSupports.length > 0
          ? t("challenge.rule.banSupports", { supports: spec.bannedSupports.join(", ") })
          : t("challenge.gemNotes"),
    },
  ];

  for (const group of spec.gemGroups) {
    if (group.kind === "main") {
      continue;
    }

    setups.push({
      id: `${stageId}-gem-${group.kind}`,
      stageId,
      category: group.kind === "movement" ? "movement" : "utility",
      mainGem: group.gems[0],
      supportGems: group.gems.slice(1),
      optionalGems: [],
      notes: group.slot
        ? t("challenge.gemGroupSlotNotes", { slot: group.slot })
        : t("challenge.gemSuggestedNotes"),
    });
  }

  return setups;
}

function createGear(stageId: string, spec: ChallengeSpec): GearPriority[] {
  const gear: GearPriority[] = [];
  // Life and resistances carry every build; the skill's own tags add the rest.
  const priorities = [t("challenge.stat.life"), t("challenge.stat.resistances"), ...spec.statPriorities];

  if (spec.unique) {
    gear.push({
      id: `${stageId}-gear-unique`,
      slot: spec.unique.slot,
      requiredStats: [spec.unique.name],
      preferredStats: [],
      uniqueSuggestion: spec.unique.name,
      notes: t("challenge.gearUniqueNotes"),
    });
  }

  for (const pick of spec.gear) {
    gear.push({
      id: `${stageId}-gear-${pick.slot.replace(/\s+/g, "-").toLowerCase()}`,
      slot: pick.slot,
      requiredStats: [pick.baseName],
      preferredStats: priorities,
      notes: pick.defence
        ? t("challenge.gearBaseNotes", { level: pick.baseLevel, defence: pick.defence })
        : t("challenge.gearBaseNotesPlain", { level: pick.baseLevel }),
    });
  }

  if (spec.banOtherUniques) {
    gear.push({
      id: `${stageId}-gear-ban`,
      slot: t("challenge.gearAllSlots"),
      requiredStats: [],
      preferredStats: [],
      notes: spec.unique
        ? t("challenge.rule.banOtherUniques", { unique: spec.unique.name })
        : t("challenge.rule.banAllUniques"),
    });
  }

  return gear;
}

function createStage(buildId: string, spec: ChallengeSpec): BuildStage {
  const stageId = `${buildId}-stage-1`;

  return {
    id: stageId,
    buildId,
    order: 1,
    label: difficultyLabel(spec.difficulty),
    levelMin: 1,
    levelMax: 100,
    title: t("challenge.stageTitle", { skill: spec.skill.name, ascendancy: spec.ascendancy }),
    summary: t("challenge.stageSummary", {
      difficulty: difficultyLabel(spec.difficulty),
      count: spec.rules.length,
    }),
    passives: [
      ...(spec.keystone
        ? [
            {
              id: `${stageId}-passive-keystone`,
              targetName: spec.keystone.name,
              pointsRequired: 0,
              instructions: t("challenge.keystoneInstructions"),
            },
          ]
        : []),
      {
        id: `${stageId}-passive-plan`,
        targetName: t("challenge.treePlanTitle"),
        pointsRequired: spec.tree.pointsUsed,
        instructions: t("challenge.treePlanNote", {
          points: spec.tree.pointsUsed,
          available: spec.tree.pointsAvailable,
          highlights: spec.tree.highlights.slice(0, 8).join(", "),
        }),
      },
    ],
    gems: createGems(stageId, spec),
    gear: createGear(stageId, spec),
    checklist: createChecklist(stageId, spec.rules),
    notes: [t("challenge.seedNote", { code: spec.code })],
  };
}

function createLabs(buildId: string, spec: ChallengeSpec): LabStep[] {
  const cards: Array<[string, string, string]> = [
    [t("challenge.card.ascendancy"), spec.ascendancy, t("challenge.card.ascendancyNote")],
    [t("challenge.card.mainSkill"), spec.skill.name, t("challenge.card.mainSkillNote")],
    [t("challenge.card.seed"), spec.code, t("challenge.card.seedNote")],
  ];

  if (spec.keystone) {
    cards.push([
      t("challenge.card.keystone"),
      spec.keystone.name,
      t("challenge.keystoneInstructions"),
    ]);
  }

  cards.push([
    t("challenge.card.treePoints"),
    `${spec.tree.pointsUsed} / ${spec.tree.pointsAvailable}`,
    t("challenge.card.treePointsNote"),
  ]);

  return cards.map(([title, ascendancyChoice, notes], index) => ({
    id: `${buildId}-character-${index + 1}`,
    order: index + 1,
    title,
    levelHint: index === 0 ? `Lvl ${spec.targetLevel}` : difficultyLabel(spec.difficulty),
    ascendancyChoice,
    notes,
  }));
}

function createSummary(spec: ChallengeSpec): BuildSummary {
  return {
    tagline: t("challenge.tagline", {
      difficulty: difficultyLabel(spec.difficulty),
      seed: spec.seed,
      count: spec.rules.length,
    }),
    playstyle: t("challenge.playstyle", { skill: spec.skill.name, ascendancy: spec.ascendancy }),
    nextUpgrade: spec.rules[0]?.text ?? "",
    warningCards: [],
  };
}

/**
 * A PoB-shaped view of the mandated picks. Every entry is a rule the player must
 * respect — there are no invented mods, no invented tree path and no filler items.
 */
function createRequirementsSheet(spec: ChallengeSpec): PobData {
  const setId = `${spec.code}-set`;
  const requiredTitle = t("challenge.requiredSetup");
  const suggestedTitle = t("challenge.suggestedSetup");

  const toGem = (name: string, isSupport: boolean): PobGem => ({
    id: `${spec.code}-gem-${name.replace(/\s+/g, "-").toLowerCase()}`,
    name,
    rawName: name,
    enabled: true,
    isSupport,
    // PoB's gem data is the newer source; the bundled colour table is the fallback
    // for anything it does not know.
    gemColor: (gemColorOf(name) as PobGem["gemColor"]) ?? resolveGemColor(name),
    iconUrl: resolveGemIcon(name),
  });

  const skillGroups: PobSkillGroup[] = spec.gemGroups.map((group) => ({
    id: `${spec.code}-group-${group.kind}`,
    setId,
    // Only the main skill is a rule; every other group is a starting point.
    setTitle: group.kind === "main" ? requiredTitle : suggestedTitle,
    label: group.kind === "main" ? spec.skill.name : t(GEM_GROUP_LABEL_KEYS[group.kind]),
    slot: group.slot,
    enabled: true,
    isSelected: group.kind === "main",
    gems: group.gems.map((name, index) =>
      toGem(name, group.kind === "main" ? index > 0 : name.endsWith("Support")),
    ),
  }));

  const items: PobItem[] = spec.unique
    ? [
        {
          id: `${spec.code}-item-unique`,
          setId,
          setTitle: requiredTitle,
          slot: spec.unique.slot,
          title: spec.unique.name,
          rarity: "UNIQUE",
          // Header lines only: the item card renders name and rarity without a
          // fabricated mod list.
          rawText: `Rarity: UNIQUE\n${spec.unique.name}`,
          iconUrl: resolveItemIcon({ title: spec.unique.name, rarity: "UNIQUE" }),
        },
      ]
    : [];

  // Suggested bases fill the rest of the paper doll. They are real base types the
  // character can wear at the target level — with no mods, because no mod data
  // exists to draw them from.
  for (const pick of spec.gear) {
    items.push({
      id: `${spec.code}-item-${pick.slot.replace(/\s+/g, "-").toLowerCase()}`,
      setId,
      setTitle: suggestedTitle,
      slot: pick.slot,
      title: pick.baseName,
      baseType: pick.baseName,
      rarity: "NORMAL",
      rawText: `Rarity: NORMAL\n${pick.baseName}`,
      iconUrl: resolveItemIcon({ title: pick.baseName, rarity: "NORMAL" }),
    });
  }

  return {
    level: spec.targetLevel,
    mainSkill: spec.skill.name,
    activeTreeSpecId: `${spec.code}-tree`,
    activeItemSetId: setId,
    activeSkillSetId: setId,
    treeSpecs: [
      {
        id: `${spec.code}-tree`,
        title: t("challenge.treeSpecTitle", { points: spec.tree.pointsUsed }),
        levelHint: spec.targetLevel,
        url: encodeTreeUrl({
          classId: Number(spec.classId),
          ascendancyId: Number(spec.ascendancyId),
          nodes: spec.tree.nodes,
        }),
        isActive: true,
      },
    ],
    skillGroups,
    itemSets: [{ id: setId, title: requiredTitle, isActive: true, slots: [] }],
    items,
    notes: spec.rules.map((rule) => `- ${rule.text}`).join("\n"),
  };
}

function assembleBuild(id: string, spec: ChallengeSpec, importedAt: string): Build {
  return {
    id,
    name: t("challenge.buildName", { skill: spec.skill.name, ascendancy: spec.ascendancy }),
    className: spec.className,
    ascendancy: spec.ascendancy,
    // Reuses the existing league chip and league filter to group challenges by tier.
    league: t("challenge.leagueLabel", { difficulty: difficultyLabel(spec.difficulty) }),
    sourceType: "random",
    sourceValue: spec.code,
    importedAt,
    notes: spec.rules.map((rule) => `- ${rule.text}`).join("\n"),
    warnings: [],
    summary: createSummary(spec),
    stages: [createStage(id, spec)],
    labs: createLabs(id, spec),
    pob: createRequirementsSheet(spec),
  };
}

/** Roll a brand new challenge. The only place a challenge touches Math.random. */
export function createChallengeBuild(difficulty: ChallengeDifficulty, seed = createSeed()): Build {
  const spec = generateChallenge(difficulty, seed);

  return assembleBuild(crypto.randomUUID(), spec, new Date().toISOString());
}

/** Regenerate a stored challenge from its seed, keeping its id and timestamp (M3). */
export function rehydrateChallengeBuild(build: Build): Build {
  const parsed = parseChallengeCode(build.sourceValue);

  if (!parsed) {
    // A stored challenge whose code cannot be parsed cannot be rebuilt. Surfacing
    // it as a warning beats silently showing a half-empty build.
    return { ...build, warnings: [...build.warnings, t("challenge.invalidCode", { code: build.sourceValue })] };
  }

  const spec = generateChallenge(parsed.difficulty, parsed.seed);

  return assembleBuild(build.id, spec, build.importedAt);
}

/** The code a user can share or paste to reproduce a challenge. */
export function challengeCodeOf(difficulty: ChallengeDifficulty, seed: string): string {
  return formatChallengeCode(difficulty, seed);
}

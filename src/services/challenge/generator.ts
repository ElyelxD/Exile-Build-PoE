/**
 * Challenge generator — pure, seeded, offline.
 *
 * Every decision reads from the curated pool in `src/data/challenge-pool.json`
 * and from a roller bound to the seed, so `generateChallenge` is a pure function
 * of (difficulty, seed). See src/services/challenge/README.md for the rules implemented here.
 */

import poolData from "@/data/challenge-pool.json";
import {
  type ChallengeDifficulty,
  type ChallengeExtraRule,
  type ChallengeKeystone,
  type ChallengeRule,
  type ChallengeSkill,
  type ChallengeSkillTag,
  type ChallengeSpec,
  type ChallengeUnique,
  type WeaponFamily,
} from "@/domain/challenge";
import { ASCENDANCY_BY_CLASS_ID, CLASS_ID_TO_NAME, CLASS_IDS, ascendancyIdsForClass } from "@/domain/poe-classes";
import { planGear, preferredDefences, statPrioritiesFor } from "@/services/challenge/gear-planner";
import {
  bannableSupports,
  planGemGroups,
  planLinks,
  withSupportSuffix,
} from "@/services/challenge/gem-planner";
import { planTree } from "@/services/challenge/tree-planner";
import { createRoller, formatChallengeCode, type Roller } from "@/services/challenge/rng";
import { t } from "@/i18n";
import type { TranslationKey } from "@/i18n/locales/en";

interface PoolSkill {
  name: string;
  tags: string[];
  weaponGroup: string;
}

interface ChallengePool {
  weaponGroups: Record<string, string[]>;
  skills: PoolSkill[];
  uniques: ChallengeUnique[];
  keystones: ChallengeKeystone[];
  extraRules: ChallengeExtraRule[];
}

const pool = poolData as unknown as ChallengePool;

interface DifficultyConfig {
  targetLevel: number;
  mandatesWeapon: boolean;
  mandatesUnique: boolean;
  bansMovementSkills: boolean;
  mandatesKeystone: boolean;
  bansOtherUniques: boolean;
  bannedSupportCount: number;
  extraRuleCount: number;
}

/** The difficulty rubric from src/services/challenge/README.md §2 — cumulative by construction. */
export const DIFFICULTY_CONFIG: Record<ChallengeDifficulty, DifficultyConfig> = {
  easy: {
    targetLevel: 70,
    mandatesWeapon: false,
    mandatesUnique: false,
    bansMovementSkills: false,
    mandatesKeystone: false,
    bansOtherUniques: false,
    bannedSupportCount: 0,
    extraRuleCount: 0,
  },
  medium: {
    targetLevel: 80,
    mandatesWeapon: true,
    mandatesUnique: true,
    bansMovementSkills: true,
    mandatesKeystone: false,
    bansOtherUniques: false,
    bannedSupportCount: 0,
    extraRuleCount: 0,
  },
  hard: {
    targetLevel: 90,
    mandatesWeapon: true,
    mandatesUnique: true,
    bansMovementSkills: true,
    mandatesKeystone: true,
    bansOtherUniques: true,
    bannedSupportCount: 2,
    extraRuleCount: 0,
  },
  extreme: {
    targetLevel: 95,
    mandatesWeapon: true,
    mandatesUnique: true,
    bansMovementSkills: true,
    mandatesKeystone: true,
    bansOtherUniques: true,
    bannedSupportCount: 2,
    extraRuleCount: 2,
  },
};

const WEAPON_LABEL_KEYS: Record<WeaponFamily, TranslationKey> = {
  any: "challenge.weapon.any",
  bow: "challenge.weapon.bow",
  wand: "challenge.weapon.wand",
  sceptre: "challenge.weapon.sceptre",
  staff: "challenge.weapon.staff",
  dagger: "challenge.weapon.dagger",
  claw: "challenge.weapon.claw",
  oneHandSword: "challenge.weapon.oneHandSword",
  twoHandSword: "challenge.weapon.twoHandSword",
  oneHandAxe: "challenge.weapon.oneHandAxe",
  twoHandAxe: "challenge.weapon.twoHandAxe",
  oneHandMace: "challenge.weapon.oneHandMace",
  twoHandMace: "challenge.weapon.twoHandMace",
  unarmed: "challenge.weapon.unarmed",
};

const EXTRA_RULE_KEYS: Record<string, TranslationKey> = {
  ssf: "challenge.extra.ssf",
  noDeathsUntilMaps: "challenge.extra.noDeathsUntilMaps",
  noLifeFlask: "challenge.extra.noLifeFlask",
  singleFlask: "challenge.extra.singleFlask",
  maxFourLink: "challenge.extra.maxFourLink",
  noRareJewels: "challenge.extra.noRareJewels",
  budgetOneDivine: "challenge.extra.budgetOneDivine",
  noLifeOnGear: "challenge.extra.noLifeOnGear",
  noVendorRecipes: "challenge.extra.noVendorRecipes",
  noSecondWeaponSet: "challenge.extra.noSecondWeaponSet",
  noAuras: "challenge.extra.noAuras",
  noMovementSpeedBoots: "challenge.extra.noMovementSpeedBoots",
};

export const DIFFICULTY_LABEL_KEYS: Record<ChallengeDifficulty, TranslationKey> = {
  easy: "challenge.difficulty.easy",
  medium: "challenge.difficulty.medium",
  hard: "challenge.difficulty.hard",
  extreme: "challenge.difficulty.extreme",
};

function toSkill(raw: PoolSkill): ChallengeSkill {
  return {
    name: raw.name,
    tags: raw.tags as ChallengeSkillTag[],
    weapons: expandWeaponGroup(raw.weaponGroup),
  };
}

function expandWeaponGroup(group: string): WeaponFamily[] {
  const families = pool.weaponGroups[group];

  if (!families) {
    throw new Error(`Unknown weapon group "${group}" in challenge pool`);
  }

  return families as WeaponFamily[];
}

function hasAllTags(skill: ChallengeSkill, required: readonly string[] | undefined): boolean {
  return (required ?? []).every((tag) => skill.tags.includes(tag as ChallengeSkillTag));
}

function hasNoTags(skill: ChallengeSkill, forbidden: readonly string[] | undefined): boolean {
  return !(forbidden ?? []).some((tag) => skill.tags.includes(tag as ChallengeSkillTag));
}

/** Rule C4 — a keystone is eligible only if it fits what the skill actually is. */
function eligibleKeystones(skill: ChallengeSkill): ChallengeKeystone[] {
  return pool.keystones.filter(
    (keystone) => hasAllTags(skill, keystone.requires) && hasNoTags(skill, keystone.forbids),
  );
}

/** Rule C5 — a weapon unique may only be mandated alongside its own weapon family. */
function eligibleUniques(weapon: WeaponFamily | undefined): ChallengeUnique[] {
  return pool.uniques.filter((unique) => !unique.weapon || unique.weapon === weapon);
}

/** Rule C7 — an extra rule already implied by the mandated keystone adds nothing. */
function eligibleExtraRules(keystone: ChallengeKeystone | undefined): ChallengeExtraRule[] {
  return pool.extraRules.filter(
    (rule) => !keystone || !(rule.redundantWithKeystones ?? []).includes(keystone.name),
  );
}

function pickWeapon(roller: Roller, skill: ChallengeSkill): WeaponFamily {
  return roller.pick(skill.weapons);
}

function weaponLabel(weapon: WeaponFamily): string {
  return t(WEAPON_LABEL_KEYS[weapon]);
}

function buildRules(spec: Omit<ChallengeSpec, "rules">): ChallengeRule[] {
  const rules: ChallengeRule[] = [
    {
      kind: "class",
      text: t("challenge.rule.class", { className: spec.className, ascendancy: spec.ascendancy }),
    },
    { kind: "skill", text: t("challenge.rule.skill", { skill: spec.skill.name }) },
    { kind: "level", text: t("challenge.rule.level", { level: spec.targetLevel }) },
  ];

  if (spec.weapon) {
    rules.push({
      kind: "weapon",
      text:
        spec.weapon === "unarmed"
          ? t("challenge.rule.unarmed")
          : t("challenge.rule.weapon", { weapon: weaponLabel(spec.weapon) }),
    });
  }

  if (spec.unique) {
    rules.push({
      kind: "unique",
      text: t("challenge.rule.unique", { unique: spec.unique.name, slot: spec.unique.slot }),
    });
  }

  if (spec.keystone) {
    rules.push({ kind: "keystone", text: t("challenge.rule.keystone", { keystone: spec.keystone.name }) });
  }

  if (spec.banMovementSkills) {
    rules.push({ kind: "ban-movement", text: t("challenge.rule.banMovement") });
  }

  if (spec.banOtherUniques) {
    rules.push({
      kind: "ban-uniques",
      text: spec.unique
        ? t("challenge.rule.banOtherUniques", { unique: spec.unique.name })
        : t("challenge.rule.banAllUniques"),
    });
  }

  if (spec.bannedSupports.length > 0) {
    rules.push({
      kind: "ban-supports",
      text: t("challenge.rule.banSupports", { supports: spec.bannedSupports.join(", ") }),
    });
  }

  for (const rule of spec.extraRules) {
    const key = EXTRA_RULE_KEYS[rule.id];

    if (!key) {
      throw new Error(`Extra rule "${rule.id}" has no translation key`);
    }

    rules.push({ kind: "extra", text: t(key) });
  }

  return rules;
}

export function generateChallenge(difficulty: ChallengeDifficulty, seed: string): ChallengeSpec {
  const config = DIFFICULTY_CONFIG[difficulty];
  const classId = createRoller(seed, "class").pick(CLASS_IDS);
  const ascendancyId = createRoller(seed, "ascendancy").pick(ascendancyIdsForClass(classId));
  const skill = toSkill(createRoller(seed, "skill").pick(pool.skills));

  const weapon = config.mandatesWeapon ? pickWeapon(createRoller(seed, "weapon"), skill) : undefined;
  const unique = config.mandatesUnique
    ? createRoller(seed, "unique").pick(eligibleUniques(weapon))
    : undefined;
  const keystone = config.mandatesKeystone
    ? createRoller(seed, "keystone").pick(eligibleKeystones(skill))
    : undefined;
  // Drawn from the supports this skill would actually have used, per the game's
  // own link rules — banning something it could never socket costs nothing (C6).
  const bannedSupports = createRoller(seed, "supports")
    .pickMany(bannableSupports(skill.name, skill.tags), config.bannedSupportCount)
    .map(withSupportSuffix);
  const extraRules = createRoller(seed, "extra").pickMany(
    eligibleExtraRules(keystone),
    config.extraRuleCount,
  );

  // The suggested build: a real tree path and real base items. These are
  // suggestions layered on top of the rules, never extra constraints.
  const tree = planTree({
    classId,
    tags: skill.tags,
    level: config.targetLevel,
    requiredNodeId: keystone?.nodeId,
  });

  const links = planLinks(skill.name, skill.tags, bannedSupports).map(withSupportSuffix);

  const gearPicks = planGear({
    classId,
    level: config.targetLevel,
    weapon,
    occupiedSlots: unique ? [unique.slot] : [],
    roller: createRoller(seed, "gear"),
  });

  const gear = gearPicks.map((suggestion) => ({
    slot: suggestion.slot,
    baseName: suggestion.base!.name,
    baseLevel: suggestion.base!.level,
    defence: suggestion.base!.subType,
    sockets: suggestion.base!.sockets,
  }));

  // Gem groups are laid out across the suggested items, so each group is capped by
  // the sockets that item really has.
  const gemGroups = planGemGroups({
    skillName: skill.name,
    tags: skill.tags,
    links,
    weapon,
    defences: preferredDefences(classId),
    gearSlots: gear.map((pick) => ({ slot: pick.slot, sockets: pick.sockets })),
    bansMovementSkills: config.bansMovementSkills,
    bansAuras: extraRules.some((rule) => rule.id === "noAuras"),
  });

  const base: Omit<ChallengeSpec, "rules"> = {
    difficulty,
    seed,
    code: formatChallengeCode(difficulty, seed),
    classId,
    className: CLASS_ID_TO_NAME[classId],
    ascendancyId,
    ascendancy: ASCENDANCY_BY_CLASS_ID[classId][ascendancyId],
    skill,
    targetLevel: config.targetLevel,
    weapon,
    unique,
    keystone,
    bannedSupports,
    banMovementSkills: config.bansMovementSkills,
    banOtherUniques: config.bansOtherUniques,
    extraRules,
    tree,
    gear,
    links,
    gemGroups,
    statPriorities: statPrioritiesFor(skill.tags),
  };

  return { ...base, rules: buildRules(base) };
}

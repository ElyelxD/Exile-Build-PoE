/**
 * Challenge mode domain types.
 *
 * A challenge is a set of *rules* the player must respect while building their own
 * character — never a generated Path of Building build. See src/services/challenge/README.md
 * for the business rules this file encodes.
 */

import type { PlannedGemGroup } from "@/services/challenge/gem-planner";

export const CHALLENGE_DIFFICULTIES = ["easy", "medium", "hard", "extreme"] as const;

export type ChallengeDifficulty = (typeof CHALLENGE_DIFFICULTIES)[number];

/**
 * Coarse skill classification used by the coherence rules (C3, C4) and by the
 * tree planner's node scoring. Exported as a value as well as a type so the pool
 * data — which TypeScript can only take on trust — can be validated against it.
 */
export const CHALLENGE_SKILL_TAGS = [
  "attack",
  "spell",
  "melee",
  "projectile",
  "aoe",
  "minion",
  "totem",
  "trap",
  "mine",
  "channelling",
  "dot",
  "crit",
  "chaos",
  "fire",
  "cold",
  "lightning",
  "physical",
] as const;

export type ChallengeSkillTag = (typeof CHALLENGE_SKILL_TAGS)[number];

/** Weapon families a mandated weapon rule can name. `any` means "no weapon restriction". */
export type WeaponFamily =
  | "any"
  | "bow"
  | "wand"
  | "sceptre"
  | "staff"
  | "dagger"
  | "claw"
  | "oneHandSword"
  | "twoHandSword"
  | "oneHandAxe"
  | "twoHandAxe"
  | "oneHandMace"
  | "twoHandMace"
  | "unarmed";

export interface ChallengeSkill {
  name: string;
  tags: ChallengeSkillTag[];
  /** Weapon families this skill can actually be used with. */
  weapons: WeaponFamily[];
}

export interface ChallengeUnique {
  name: string;
  slot: string;
  /** Weapon family this unique occupies, when it is a weapon (C5). */
  weapon?: WeaponFamily;
}

export interface ChallengeKeystone {
  name: string;
  /** Node id in tree-default.json — verified by test against the bundled tree (S2). */
  nodeId: number;
  /** Tags the main skill must have for this keystone to be eligible. */
  requires?: ChallengeSkillTag[];
  /** Tags that make this keystone incompatible with the main skill. */
  forbids?: ChallengeSkillTag[];
}

/** An extra rule used only by the `extreme` tier. `id` is an i18n key suffix. */
export interface ChallengeExtraRule {
  id: string;
  /** Rendered redundant by these keystones — filtered out to avoid duplicate rules (C7). */
  redundantWithKeystones?: string[];
}

export type ChallengeRuleKind =
  | "class"
  | "skill"
  | "weapon"
  | "unique"
  | "keystone"
  | "ban-movement"
  | "ban-uniques"
  | "ban-supports"
  | "level"
  | "extra";

/** One rendered rule: the unit the UI, the checklist and the overlay all consume. */
export interface ChallengeRule {
  kind: ChallengeRuleKind;
  /** Localized, ready to display. */
  text: string;
}

/** A real, connected allocation over the bundled passive tree. */
export interface ChallengeTreePlan {
  nodes: number[];
  highlights: string[];
  pointsUsed: number;
  pointsAvailable: number;
}

/** A real base item the character can wear at the target level. No mods: none exist to draw from. */
export interface ChallengeGearPick {
  slot: string;
  baseName: string;
  baseLevel: number;
  defence: string;
  /** Sockets this base allows — the budget for the gem group that lives in it. */
  sockets: number;
}

export interface ChallengeSpec {
  difficulty: ChallengeDifficulty;
  seed: string;
  /** `${difficulty}:${seed}` — the build's `sourceValue`, the whole identity of a challenge. */
  code: string;
  classId: string;
  className: string;
  ascendancyId: string;
  ascendancy: string;
  skill: ChallengeSkill;
  targetLevel: number;
  weapon?: WeaponFamily;
  unique?: ChallengeUnique;
  keystone?: ChallengeKeystone;
  bannedSupports: string[];
  banMovementSkills: boolean;
  banOtherUniques: boolean;
  extraRules: ChallengeExtraRule[];
  /** Suggested passive allocation — real, connected, within the level's point budget. */
  tree: ChallengeTreePlan;
  /** Suggested base items per slot, excluding slots a mandated unique already fills. */
  gear: ChallengeGearPick[];
  /** Support gems that can legally link to the main skill, minus any the challenge banned. */
  links: string[];
  /** The whole gem layout: main links plus one utility group per socketed item. */
  gemGroups: PlannedGemGroup[];
  /** Stat priorities the gear should roll, derived from the main skill's tags. */
  statPriorities: string[];
  /** Every rule above, localized and ordered — one checklist item each. */
  rules: ChallengeRule[];
}

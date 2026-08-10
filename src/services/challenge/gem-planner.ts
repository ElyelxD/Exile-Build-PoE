/**
 * Builds a gem setup for a challenge: the mandated skill with support gems that
 * can legally link to it, plus the utility gems the challenge's own rules allow.
 *
 * Legality is not guessed. `src/data/gems.json` carries, straight from Path of
 * Building's data, the `skillTypes` each active skill has and the
 * `requireSkillTypes` / `excludeSkillTypes` each support declares — the game's own
 * rule for whether a support does anything in those links. A support that would
 * be dead weight can never be suggested.
 *
 * Which of the legal supports to pick *is* a judgement call, and it lives in
 * SUPPORT_PRIORITY below: an ordered list of the supports that carry a build,
 * archetype-defining ones first. Anything that changes how a skill is delivered
 * (totems, traps, mines, triggers) is excluded outright — that is a different
 * build, not a support choice, and the player did not ask for it.
 */

import gemData from "@/data/gems.json";
import type { ChallengeSkillTag, WeaponFamily } from "@/domain/challenge";

interface GemDatabase {
  actives: Record<string, { types: string[]; color: string }>;
  supports: Array<{
    name: string;
    color: string;
    requires: string[];
    excludes: string[];
    description: string;
  }>;
}

const gems = gemData as unknown as GemDatabase;

/** The app names supports with the suffix; PoB's data does not. */
export function withSupportSuffix(name: string): string {
  return name.endsWith("Support") ? name : `${name} Support`;
}

export function stripSupportSuffix(name: string): string {
  return name.replace(/\s+Support$/, "");
}

/**
 * Supports that change how a skill is delivered rather than how strong it is.
 * Suggesting one would quietly rewrite the build the player was handed.
 */
const NEVER_SUGGEST = new Set([
  "Spell Totem", "Ballista Totem", "Blastchain Mine", "High-Impact Mine",
  "Trap", "Cluster Traps", "Multiple Traps", "Charged Traps",
  "Cast on Critical Strike", "Cast when Damage Taken", "Cast when Stunned",
  "Cast on Death", "Cast on Melee Kill", "Cast on Ward Break", "Cast while Channelling",
  "Spellslinger", "Manaforged Arrows", "Automation", "Archmage",
  "Awakened Cast on Critical Strike", "Awakened Cast While Channelling",
  "Awakened Spell Cascade", "Sacrifice",
]);

/**
 * Ordered by how much the support defines or carries a build. Awakened variants
 * are deliberately absent: they are the same support at a price no challenge
 * should assume.
 */
const SUPPORT_PRIORITY = [
  // Archetype-defining multipliers
  "Multistrike", "Spell Echo", "Minion Damage", "Greater Multiple Projectiles",
  "Melee Physical Damage", "Controlled Destruction", "Trap and Mine Damage",
  "Multiple Totems", "Minefield", "Advanced Traps",
  // Core damage
  "Brutality", "Elemental Focus", "Vicious Projectiles", "Deadly Ailments",
  "Void Manipulation", "Swift Affliction", "Efficacy", "Hypothermia",
  "Elemental Damage with Attacks", "Added Fire Damage", "Added Cold Damage",
  "Added Lightning Damage", "Added Chaos Damage", "Impale", "Damage on Full Life",
  // Shaping and speed
  "Concentrated Effect", "Increased Area of Effect", "Increased Critical Strikes",
  "Increased Critical Damage", "Faster Attacks", "Faster Casting", "Mirage Archer",
  "Melee Splash", "Chain", "Pierce", "Fork", "Volley",
  // Minion and totem specifics
  "Feeding Frenzy", "Elemental Army", "Minion Speed", "Melee Splash",
  // Utility that still adds damage
  "Combustion", "Innervate", "Unbound Ailments", "Vile Toxins", "Ruthless",
  "Close Combat", "Pulverise", "Fortify", "Inspiration", "Empower",
];

/**
 * PoB's `requireSkillTypes` answers "can this be socketed here", not "is this
 * worth socketing": Brutality legally supports any damaging skill, including a
 * chaos one whose damage it would delete. These gates add the second question —
 * the support is only suggested when the skill carries one of these tags.
 */
const SUPPORT_TAG_GATES: Record<string, ChallengeSkillTag[]> = {
  Brutality: ["physical"],
  "Elemental Focus": ["fire", "cold", "lightning"],
  "Elemental Damage with Attacks": ["fire", "cold", "lightning"],
  Combustion: ["fire"],
  Hypothermia: ["cold"],
  Innervate: ["lightning"],
  "Void Manipulation": ["chaos"],
  "Deadly Ailments": ["dot"],
  "Swift Affliction": ["dot"],
  Efficacy: ["dot", "spell"],
  "Unbound Ailments": ["dot"],
  "Vile Toxins": ["chaos", "dot"],
  "Controlled Destruction": ["spell"],
  "Spell Echo": ["spell"],
  "Faster Casting": ["spell"],
  "Melee Physical Damage": ["melee"],
  "Melee Splash": ["melee"],
  "Close Combat": ["melee"],
  Pulverise: ["melee"],
  Multistrike: ["melee"],
  Ruthless: ["melee"],
  Fortify: ["melee"],
  Impale: ["physical"],
  "Vicious Projectiles": ["physical", "dot"],
  "Added Fire Damage": ["attack"],
  "Added Cold Damage": ["attack"],
  "Added Lightning Damage": ["attack"],
  "Added Chaos Damage": ["attack"],
  "Damage on Full Life": ["attack"],
  "Faster Attacks": ["attack"],
  "Minion Damage": ["minion"],
  "Minion Speed": ["minion"],
  "Feeding Frenzy": ["minion"],
  "Elemental Army": ["minion"],
  "Multiple Totems": ["totem"],
  "Trap and Mine Damage": ["trap", "mine"],
  "Advanced Traps": ["trap"],
  Minefield: ["mine"],
  "Concentrated Effect": ["aoe"],
  "Increased Area of Effect": ["aoe"],
};

/** Support pairs that cancel each other out. Never suggested together. */
const SUPPORT_CONFLICTS: Array<[string, string]> = [
  ["Brutality", "Elemental Focus"],
  ["Brutality", "Elemental Damage with Attacks"],
  ["Brutality", "Added Fire Damage"],
  ["Brutality", "Added Cold Damage"],
  ["Brutality", "Added Lightning Damage"],
  ["Brutality", "Added Chaos Damage"],
  ["Brutality", "Combustion"],
  ["Brutality", "Hypothermia"],
  ["Brutality", "Innervate"],
  ["Brutality", "Void Manipulation"],
  ["Elemental Focus", "Combustion"],
  ["Elemental Focus", "Innervate"],
  ["Elemental Focus", "Deadly Ailments"],
  ["Elemental Focus", "Unbound Ailments"],
  ["Concentrated Effect", "Increased Area of Effect"],
  ["Chain", "Fork"],
  ["Chain", "Pierce"],
  ["Fork", "Pierce"],
  // One flat-damage support earns its socket; stacking three of them does not.
  ["Added Fire Damage", "Added Cold Damage"],
  ["Added Fire Damage", "Added Lightning Damage"],
  ["Added Fire Damage", "Added Chaos Damage"],
  ["Added Cold Damage", "Added Lightning Damage"],
  ["Added Cold Damage", "Added Chaos Damage"],
  ["Added Lightning Damage", "Added Chaos Damage"],
];

function conflictsWith(candidate: string, picked: readonly string[]): boolean {
  return SUPPORT_CONFLICTS.some(
    ([left, right]) =>
      (candidate === left && picked.includes(right)) ||
      (candidate === right && picked.includes(left)),
  );
}

/**
 * The mirror of the gates: supports the game lets you socket but that do nothing
 * for a skill of this kind. Spell Echo on Raise Spectre is legal and pointless —
 * the damage belongs to the minions, not to the cast that summoned them.
 */
const SUPPORT_TAG_BLOCKS: Record<string, ChallengeSkillTag[]> = {
  "Spell Echo": ["minion", "totem"],
  "Faster Casting": ["minion"],
  "Controlled Destruction": ["minion"],
  "Concentrated Effect": ["minion"],
  "Increased Area of Effect": ["minion"],
  "Elemental Focus": ["minion"],
  Efficacy: ["minion"],
  Multistrike: ["minion", "totem"],
  "Melee Physical Damage": ["minion"],
};

function passesTagGate(support: string, tags: readonly ChallengeSkillTag[]): boolean {
  const blocked = SUPPORT_TAG_BLOCKS[support];

  if (blocked?.some((tag) => tags.includes(tag))) {
    return false;
  }

  const gate = SUPPORT_TAG_GATES[support];

  return !gate || gate.some((tag) => tags.includes(tag));
}

function activeTypes(skillName: string): Set<string> | undefined {
  const active = gems.actives[skillName];
  return active ? new Set(active.types) : undefined;
}

/** Every support the game would let you socket alongside this skill. */
export function eligibleSupports(skillName: string): string[] {
  const types = activeTypes(skillName);

  if (!types) {
    return [];
  }

  return gems.supports
    .filter((support) => {
      if (NEVER_SUGGEST.has(support.name)) return false;
      if (support.name.startsWith("Awakened ")) return false;
      if (support.excludes.some((type) => types.has(type))) return false;
      // No requirement at all means the support is universal.
      return support.requires.length === 0 || support.requires.some((type) => types.has(type));
    })
    .map((support) => support.name);
}

/**
 * The supports worth banning at higher difficulties: the ones this skill would
 * actually have wanted. Banning something the build would never socket is a rule
 * that costs the player nothing.
 */
export function bannableSupports(
  skillName: string,
  tags: readonly ChallengeSkillTag[],
  limit = 8,
): string[] {
  const eligible = new Set(eligibleSupports(skillName));

  return SUPPORT_PRIORITY.filter(
    (name) => eligible.has(name) && passesTagGate(name, tags),
  ).slice(0, limit);
}

/**
 * The suggested links: the highest-priority supports that are legal for this
 * skill, relevant to what it does, and not cancelled out by one already picked.
 * Anything the challenge banned is excluded — a challenge must not suggest what
 * it forbids.
 */
export function planLinks(
  skillName: string,
  tags: readonly ChallengeSkillTag[],
  banned: readonly string[] = [],
  count = 5,
): string[] {
  const eligible = new Set(eligibleSupports(skillName));
  const bannedBase = new Set(banned.map(stripSupportSuffix));
  const picked: string[] = [];

  for (const name of SUPPORT_PRIORITY) {
    if (picked.length === count) break;
    if (!eligible.has(name) || bannedBase.has(name) || picked.includes(name)) continue;
    if (!passesTagGate(name, tags)) continue;
    if (conflictsWith(name, picked)) continue;
    picked.push(name);
  }

  return picked;
}

export function gemColorOf(name: string): string | undefined {
  const active = gems.actives[name];
  if (active) return active.color;

  const support = gems.supports.find((entry) => entry.name === stripSupportSuffix(name));
  return support?.color;
}

/* ── Utility groups ── */

export interface GemGroup {
  /** i18n key suffix identifying what this group is for. */
  kind: "main" | "movement" | "aura";
  gems: string[];
}

/** Movement skills that work with the weapon the challenge mandated. */
const MOVEMENT_BY_WEAPON: Partial<Record<WeaponFamily, string>> = {
  oneHandSword: "Whirling Blades",
  twoHandSword: "Leap Slam",
  oneHandAxe: "Leap Slam",
  twoHandAxe: "Leap Slam",
  oneHandMace: "Leap Slam",
  twoHandMace: "Leap Slam",
  staff: "Leap Slam",
  dagger: "Whirling Blades",
  claw: "Whirling Blades",
};

/** Flame Dash needs no weapon at all, so it is the safe default. */
const DEFAULT_MOVEMENT = "Flame Dash";

/** One defensive aura, matching what the class's gear is already stacking. */
const AURA_BY_DEFENCE: Record<string, string> = {
  Armour: "Determination",
  Evasion: "Grace",
  "Energy Shield": "Discipline",
};

export function planMovementGem(weapon?: WeaponFamily): string | undefined {
  const candidate = (weapon && MOVEMENT_BY_WEAPON[weapon]) || DEFAULT_MOVEMENT;

  return gems.actives[candidate] ? candidate : undefined;
}

export function planAuraGem(defences: readonly string[]): string | undefined {
  for (const defence of defences) {
    const aura = AURA_BY_DEFENCE[defence];
    if (aura && gems.actives[aura]) {
      return aura;
    }
  }

  return undefined;
}

/** A herald that matches what the skill actually deals. */
const HERALD_BY_TAG: Partial<Record<ChallengeSkillTag, string>> = {
  fire: "Herald of Ash",
  cold: "Herald of Ice",
  lightning: "Herald of Thunder",
  physical: "Herald of Purity",
  minion: "Herald of Purity",
};

/** A curse that matches what the skill actually deals. */
const CURSE_BY_TAG: Partial<Record<ChallengeSkillTag, string>> = {
  fire: "Flammability",
  cold: "Frostbite",
  lightning: "Conductivity",
  chaos: "Despair",
  physical: "Vulnerability",
  minion: "Vulnerability",
};

function firstMatch(
  table: Partial<Record<ChallengeSkillTag, string>>,
  tags: readonly ChallengeSkillTag[],
): string | undefined {
  for (const tag of tags) {
    const name = table[tag];
    if (name && gems.actives[name]) {
      return name;
    }
  }

  return undefined;
}

export type GemGroupKind = "main" | "aura" | "guard" | "movement" | "curse";

export interface PlannedGemGroup {
  kind: GemGroupKind;
  /** The equipped item this group lives in, when a suggested base can hold it. */
  slot?: string;
  /** Display names — supports already carry the app's " Support" suffix. */
  gems: string[];
}

export interface GemGroupRequest {
  skillName: string;
  tags: readonly ChallengeSkillTag[];
  /** The already-planned support links, suffixed. */
  links: string[];
  weapon?: WeaponFamily;
  /** Defence types the class stacks, used to pick the aura. */
  defences: readonly string[];
  /** Suggested gear, so groups can be sized to the sockets each item really has. */
  gearSlots: ReadonlyArray<{ slot: string; sockets: number }>;
  bansMovementSkills: boolean;
  bansAuras: boolean;
}

/** Slots get filled in the order a player would actually think about them. */
const SLOT_FILL_ORDER = ["Helmet", "Gloves", "Boots", "Weapon 2", "Weapon 1", "Body Armour"];

const MAIN_LINK_SOCKETS = 6;

/**
 * A gem layout across the character's items: the main links in whatever suggested
 * item can hold six, then one utility group per remaining socketed item, each cut
 * to the sockets that item actually has.
 *
 * Only the main skill and the banned supports are rules; every group here is a
 * starting point the player is free to rearrange.
 */
export function planGemGroups({
  skillName,
  tags,
  links,
  weapon,
  defences,
  gearSlots,
  bansMovementSkills,
  bansAuras,
}: GemGroupRequest): PlannedGemGroup[] {
  const socketed = gearSlots.filter((entry) => entry.sockets >= 2);
  const mainHome = socketed.find((entry) => entry.sockets >= MAIN_LINK_SOCKETS);

  const groups: PlannedGemGroup[] = [
    { kind: "main", slot: mainHome?.slot, gems: [skillName, ...links] },
  ];

  const templates: PlannedGemGroup[] = [];

  if (!bansAuras) {
    const aura = planAuraGem(defences);
    const herald = firstMatch(HERALD_BY_TAG, tags);
    const auraGems = [aura, herald, "Precision"].filter((name): name is string => Boolean(name));

    if (auraGems.length > 0) {
      templates.push({ kind: "aura", gems: auraGems });
    }
  }

  // A guard skill on a trigger is standard practice and costs no rule.
  templates.push({ kind: "guard", gems: ["Molten Shell", withSupportSuffix("Cast when Damage Taken")] });

  if (!bansMovementSkills) {
    const movement = planMovementGem(weapon);

    if (movement) {
      const movementGems = [movement];
      // Faster Casting only does anything for the spell-based travel skills.
      if (movement === DEFAULT_MOVEMENT) {
        movementGems.push(withSupportSuffix("Faster Casting"));
      }
      templates.push({ kind: "movement", gems: movementGems });
    }
  }

  const curse = firstMatch(CURSE_BY_TAG, tags);
  if (curse) {
    templates.push({ kind: "curse", gems: [curse] });
  }

  const available = socketed
    .filter((entry) => entry.slot !== mainHome?.slot)
    .sort((a, b) => {
      const left = SLOT_FILL_ORDER.indexOf(a.slot);
      const right = SLOT_FILL_ORDER.indexOf(b.slot);
      return (left === -1 ? 99 : left) - (right === -1 ? 99 : right);
    });

  for (const template of templates) {
    const home = available.shift();
    if (!home) break;

    groups.push({ ...template, slot: home.slot, gems: template.gems.slice(0, home.sockets) });
  }

  return groups;
}

/**
 * Picks real base items for a challenge, slot by slot.
 *
 * Every suggestion is an actual Path of Exile base type whose level requirement
 * the character will have met and whose attribute requirements the class can
 * meet. What this deliberately does *not* do is invent modifiers: no mod pool
 * exists in the bundled data, so gear is expressed as "this base, and these stat
 * priorities" rather than as a fake rolled item.
 */

import baseItemsData from "@/data/base-items.json";
import type { ChallengeSkillTag, WeaponFamily } from "@/domain/challenge";
import type { Roller } from "@/services/challenge/rng";

export interface BaseItem {
  name: string;
  type: string;
  subType: string;
  level: number;
  str: number;
  dex: number;
  int: number;
  sockets: number;
}

const baseItems = baseItemsData as BaseItem[];

/** Attributes each class scales naturally, and therefore the bases it can wear. */
const CLASS_ATTRIBUTES: Record<string, Array<"str" | "dex" | "int">> = {
  "0": ["str", "dex", "int"], // Scion
  "1": ["str"], // Marauder
  "2": ["dex"], // Ranger
  "3": ["int"], // Witch
  "4": ["str", "dex"], // Duelist
  "5": ["str", "int"], // Templar
  "6": ["dex", "int"], // Shadow
};

/** Weapon families as this app names them → the item type PoB's data uses. */
const WEAPON_FAMILY_TO_TYPE: Record<WeaponFamily, string | null> = {
  any: null,
  unarmed: null,
  bow: "Bow",
  wand: "Wand",
  sceptre: "Sceptre",
  staff: "Staff",
  dagger: "Dagger",
  claw: "Claw",
  oneHandSword: "One Handed Sword",
  twoHandSword: "Two Handed Sword",
  oneHandAxe: "One Handed Axe",
  twoHandAxe: "Two Handed Axe",
  oneHandMace: "One Handed Mace",
  twoHandMace: "Two Handed Mace",
};

const TWO_HANDED: WeaponFamily[] = ["bow", "staff", "twoHandSword", "twoHandAxe", "twoHandMace"];

export const ARMOUR_SLOTS = ["Helmet", "Body Armour", "Gloves", "Boots"] as const;

export interface GearSuggestion {
  /** PoB slot name, so the gear board places it on the paper doll. */
  slot: string;
  base?: BaseItem;
}

function attributesFit(base: BaseItem, attributes: Array<"str" | "dex" | "int">) {
  return (["str", "dex", "int"] as const).every(
    (attribute) => base[attribute] === 0 || attributes.includes(attribute),
  );
}

/**
 * The highest-requirement base the character can actually wear: within the level
 * budget, within the class's attributes. Ties are broken by the seed so two
 * challenges of the same class do not always name the same base.
 */
export function pickBase(
  type: string,
  level: number,
  classId: string,
  roller: Roller,
  preferredSubTypes: string[] = [],
  /**
   * The mandated weapon ignores the class's attribute profile on purpose: making
   * a Ranger wield a wand is exactly the kind of constraint a challenge exists to
   * impose, and refusing to name one would leave the weapon slot empty.
   */
  ignoreClassAttributes = false,
): BaseItem | undefined {
  const attributes = CLASS_ATTRIBUTES[classId] ?? ["str", "dex", "int"];
  const eligible = baseItems.filter(
    (base) =>
      base.type === type &&
      base.level <= level &&
      (ignoreClassAttributes || attributesFit(base, attributes)),
  );

  if (eligible.length === 0) {
    return undefined;
  }

  const preferred = preferredSubTypes.length
    ? eligible.filter((base) => preferredSubTypes.includes(base.subType))
    : [];
  const pool = preferred.length > 0 ? preferred : eligible;
  const highest = Math.max(...pool.map((base) => base.level));
  const top = pool.filter((base) => base.level === highest);

  return roller.pick(top);
}

/** Defence flavour a build wants, inferred from the class's attributes. */
export function preferredDefences(classId: string): string[] {
  const attributes = CLASS_ATTRIBUTES[classId] ?? [];
  const hasStr = attributes.includes("str");
  const hasDex = attributes.includes("dex");
  const hasInt = attributes.includes("int");

  if (attributes.length === 1) {
    if (hasStr) return ["Armour"];
    if (hasDex) return ["Evasion"];
    return ["Energy Shield"];
  }

  if (hasStr && hasDex) return ["Armour/Evasion", "Armour", "Evasion"];
  if (hasStr && hasInt) return ["Armour/Energy Shield", "Armour", "Energy Shield"];
  if (hasDex && hasInt) return ["Evasion/Energy Shield", "Evasion", "Energy Shield"];

  return ["Armour/Evasion/Energy Shield", "Armour/Evasion", "Armour/Energy Shield", "Evasion/Energy Shield"];
}

export interface GearPlanRequest {
  classId: string;
  level: number;
  weapon?: WeaponFamily;
  /** Slots already taken by a mandated unique; never suggested a base. */
  occupiedSlots: string[];
  roller: Roller;
}

export function planGear({ classId, level, weapon, occupiedSlots, roller }: GearPlanRequest): GearSuggestion[] {
  const defences = preferredDefences(classId);
  const taken = new Set(occupiedSlots);
  const suggestions: GearSuggestion[] = [];

  const push = (slot: string, base?: BaseItem) => {
    if (taken.has(slot) || !base) return;
    suggestions.push({ slot, base });
  };

  const weaponType = weapon ? WEAPON_FAMILY_TO_TYPE[weapon] : null;

  if (weaponType) {
    push("Weapon 1", pickBase(weaponType, level, classId, roller, [], true));
  }

  // A shield only makes sense next to a one-handed weapon.
  if (weapon && !TWO_HANDED.includes(weapon) && weapon !== "any") {
    push("Weapon 2", pickBase("Shield", level, classId, roller, defences));
  }

  push("Helmet", pickBase("Helmet", level, classId, roller, defences));
  push("Body Armour", pickBase("Body Armour", level, classId, roller, defences));
  push("Gloves", pickBase("Gloves", level, classId, roller, defences));
  push("Boots", pickBase("Boots", level, classId, roller, defences));
  push("Amulet", pickBase("Amulet", level, classId, roller));
  push("Ring 1", pickBase("Ring", level, classId, roller));
  push("Ring 2", pickBase("Ring", level, classId, roller));
  push("Belt", pickBase("Belt", level, classId, roller));

  if (weapon === "bow") {
    push("Weapon 2", pickBase("Quiver", level, classId, roller));
  }

  return suggestions;
}

/* ── Stat priorities ── */

/** Damage stat a slot should look for, per skill tag. */
const TAG_PRIORITY: Partial<Record<ChallengeSkillTag, string>> = {
  attack: "Attack Speed",
  spell: "Cast Speed",
  minion: "Minion Damage",
  totem: "Totem Damage",
  trap: "Trap Damage",
  mine: "Mine Damage",
  projectile: "Projectile Damage",
  aoe: "Area of Effect",
  dot: "Damage over Time Multiplier",
  physical: "Added Physical Damage",
  fire: "Added Fire Damage",
  cold: "Added Cold Damage",
  lightning: "Added Lightning Damage",
  chaos: "Added Chaos Damage",
  crit: "Critical Strike Multiplier",
  melee: "Melee Damage",
  channelling: "Cast Speed",
};

export function statPrioritiesFor(tags: readonly ChallengeSkillTag[]): string[] {
  const priorities: string[] = [];

  for (const tag of tags) {
    const priority = TAG_PRIORITY[tag];
    if (priority && !priorities.includes(priority)) {
      priorities.push(priority);
    }
  }

  return priorities;
}

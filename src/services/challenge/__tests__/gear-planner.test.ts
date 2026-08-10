import { describe, it, expect } from "vitest";
import baseItemsData from "@/data/base-items.json";
import type { WeaponFamily } from "@/domain/challenge";
import { createRoller } from "../rng";
import { planGear, pickBase, preferredDefences, statPrioritiesFor } from "../gear-planner";

/**
 * Business rules under test — from how Path of Exile gear works:
 *
 * Wearability
 *   - A suggested base must have a level requirement the character has met.
 *     Naming a base the player cannot equip is advice that wastes their time.
 *   - Armour bases must fit the class's attributes: a Marauder is not going to
 *     meet the intelligence requirement of an Energy Shield chest.
 *   - The mandated weapon is the exception, on purpose: a challenge that forces a
 *     wand onto a Ranger is a challenge, and the slot must still be filled.
 *
 * Slots
 *   - A slot already filled by a mandated unique is never given a base as well.
 *   - Each slot appears at most once; a paper doll has one item per slot.
 *   - A shield is only suggested next to a one-handed weapon, and a quiver only
 *     next to a bow.
 *
 * Determinism — same seed, same gear.
 */

interface BaseItem {
  name: string;
  type: string;
  level: number;
  str: number;
  dex: number;
  int: number;
}

const baseItems = baseItemsData as BaseItem[];
const byName = new Map(baseItems.map((base) => [base.name, base]));

const CLASS_ATTRIBUTES: Record<string, Array<"str" | "dex" | "int">> = {
  "0": ["str", "dex", "int"],
  "1": ["str"],
  "2": ["dex"],
  "3": ["int"],
  "4": ["str", "dex"],
  "5": ["str", "int"],
  "6": ["dex", "int"],
};

const WEAPONS: WeaponFamily[] = [
  "bow", "wand", "sceptre", "staff", "dagger", "claw",
  "oneHandSword", "twoHandSword", "oneHandAxe", "twoHandAxe",
  "oneHandMace", "twoHandMace",
];

function plan(classId: string, level: number, weapon?: WeaponFamily, occupied: string[] = []) {
  return planGear({
    classId,
    level,
    weapon,
    occupiedSlots: occupied,
    roller: createRoller("8F3K22", "gear"),
  });
}

describe("base item data", () => {
  it("carries the level and attribute requirements the planner needs", () => {
    expect(baseItems.length).toBeGreaterThan(500);

    for (const base of baseItems.slice(0, 50)) {
      expect(base.name).toBeTruthy();
      expect(base.type).toBeTruthy();
      expect(base.level).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("planGear", () => {
  it("only names bases the character's level allows", () => {
    for (const classId of Object.keys(CLASS_ATTRIBUTES)) {
      for (const level of [70, 80, 90, 95]) {
        for (const suggestion of plan(classId, level, "oneHandSword")) {
          expect(suggestion.base!.level).toBeLessThanOrEqual(level);
        }
      }
    }
  });

  it("only names armour the class can meet the attributes of", () => {
    for (const [classId, attributes] of Object.entries(CLASS_ATTRIBUTES)) {
      for (const suggestion of plan(classId, 90, "oneHandSword")) {
        // The mandated weapon is deliberately exempt (see the rules above).
        if (suggestion.slot === "Weapon 1") continue;

        for (const attribute of ["str", "dex", "int"] as const) {
          if (suggestion.base![attribute] > 0) {
            expect(attributes, `${classId} ${suggestion.slot}`).toContain(attribute);
          }
        }
      }
    }
  });

  it("fills the weapon slot with the mandated family, even off-class", () => {
    const expectedType: Record<string, string> = {
      bow: "Bow", wand: "Wand", sceptre: "Sceptre", staff: "Staff",
      dagger: "Dagger", claw: "Claw",
      oneHandSword: "One Handed Sword", twoHandSword: "Two Handed Sword",
      oneHandAxe: "One Handed Axe", twoHandAxe: "Two Handed Axe",
      oneHandMace: "One Handed Mace", twoHandMace: "Two Handed Mace",
    };

    for (const classId of Object.keys(CLASS_ATTRIBUTES)) {
      for (const weapon of WEAPONS) {
        const weaponSlot = plan(classId, 90, weapon).find((s) => s.slot === "Weapon 1");

        expect(weaponSlot, `${classId} ${weapon}`).toBeDefined();
        expect(byName.get(weaponSlot!.base!.name)!.type).toBe(expectedType[weapon]);
      }
    }
  });

  it("suggests no weapon at all for an unarmed challenge", () => {
    expect(plan("1", 90, "unarmed").some((s) => s.slot === "Weapon 1")).toBe(false);
  });

  it("suggests a shield beside a one-handed weapon and never beside a two-hander", () => {
    expect(plan("1", 90, "oneHandMace").some((s) => s.slot === "Weapon 2")).toBe(true);
    expect(plan("1", 90, "twoHandMace").some((s) => s.slot === "Weapon 2")).toBe(false);
    expect(plan("1", 90, "staff").some((s) => s.slot === "Weapon 2")).toBe(false);
  });

  it("suggests a quiver beside a bow", () => {
    const offhand = plan("2", 90, "bow").find((s) => s.slot === "Weapon 2");

    expect(byName.get(offhand!.base!.name)!.type).toBe("Quiver");
  });

  it("leaves a slot alone when a mandated unique already fills it", () => {
    const suggestions = plan("1", 90, "oneHandMace", ["Body Armour", "Boots"]);
    const slots = suggestions.map((s) => s.slot);

    expect(slots).not.toContain("Body Armour");
    expect(slots).not.toContain("Boots");
    expect(slots).toContain("Helmet");
  });

  it("never suggests two items for the same slot", () => {
    for (const weapon of WEAPONS) {
      const slots = plan("0", 95, weapon).map((s) => s.slot);

      expect(new Set(slots).size).toBe(slots.length);
    }
  });

  it("is deterministic", () => {
    expect(plan("5", 90, "sceptre")).toEqual(plan("5", 90, "sceptre"));
  });
});

describe("pickBase", () => {
  it("prefers the highest requirement the character can still meet", () => {
    const roller = createRoller("8F3K22", "gear");
    const helmet = pickBase("Helmet", 84, "3", roller, ["Energy Shield"])!;
    const capped = pickBase("Helmet", 40, "3", roller, ["Energy Shield"])!;

    expect(helmet.level).toBeLessThanOrEqual(84);
    expect(capped.level).toBeLessThanOrEqual(40);
    expect(helmet.level).toBeGreaterThan(capped.level);
  });

  it("falls back to any eligible base when the preferred defence has none", () => {
    const roller = createRoller("8F3K22", "gear");

    expect(pickBase("Ring", 90, "1", roller, ["Energy Shield"])).toBeDefined();
  });
});

describe("preferredDefences", () => {
  it("matches each class's defensive identity", () => {
    expect(preferredDefences("1")).toEqual(["Armour"]);
    expect(preferredDefences("2")).toEqual(["Evasion"]);
    expect(preferredDefences("3")).toEqual(["Energy Shield"]);
    expect(preferredDefences("4")[0]).toBe("Armour/Evasion");
    expect(preferredDefences("5")[0]).toBe("Armour/Energy Shield");
    expect(preferredDefences("6")[0]).toBe("Evasion/Energy Shield");
  });
});

describe("statPrioritiesFor", () => {
  it("turns skill tags into gear priorities without repeating itself", () => {
    const priorities = statPrioritiesFor(["spell", "fire", "aoe", "channelling"]);

    expect(priorities).toContain("Cast Speed");
    expect(priorities).toContain("Added Fire Damage");
    expect(new Set(priorities).size).toBe(priorities.length);
  });
});

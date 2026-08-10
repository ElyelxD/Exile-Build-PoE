import { describe, it, expect } from "vitest";
import gemData from "@/data/gems.json";
import type { ChallengeSkillTag } from "@/domain/challenge";
import {
  bannableSupports,
  eligibleSupports,
  gemColorOf,
  planAuraGem,
  planGemGroups,
  planLinks,
  planMovementGem,
  stripSupportSuffix,
  withSupportSuffix,
} from "../gem-planner";

/**
 * Business rules under test — these come from how Path of Exile links work, and
 * every one of them is a mistake a player would spot immediately:
 *
 * Legality (from PoB's own skill data, not from guessing)
 *   - Greater Multiple Projectiles does nothing in a Cyclone; Multistrike does
 *     nothing on a spell. A support that cannot apply must never be suggested.
 *   - Supports that change *how* a skill is delivered — totems, traps, mines,
 *     triggers — are never auto-suggested: that is a different build.
 *
 * Relevance (the game allows it, but the player would still call it wrong)
 *   - Brutality deletes non-physical damage, so it must not land on a chaos or
 *     elemental skill.
 *   - Elemental Focus makes damage elemental-only, so it must not land on a pure
 *     physical skill, and never alongside Brutality.
 *   - Two supports that cancel each other out must never be suggested together.
 *
 * Consistency with the challenge
 *   - A support the challenge banned must never be suggested.
 */

const gems = gemData as unknown as {
  actives: Record<string, { types: string[]; color: string }>;
  supports: Array<{ name: string }>;
};

const CYCLONE: ChallengeSkillTag[] = ["attack", "melee", "aoe", "channelling", "physical"];
const ARC: ChallengeSkillTag[] = ["spell", "lightning", "aoe"];
const BANE: ChallengeSkillTag[] = ["spell", "chaos", "dot", "aoe"];
const TORNADO_SHOT: ChallengeSkillTag[] = ["attack", "projectile", "physical"];
const SPECTRE: ChallengeSkillTag[] = ["spell", "minion"];

describe("gem data", () => {
  it("knows the skills and supports the planner reads", () => {
    expect(Object.keys(gems.actives).length).toBeGreaterThan(300);
    expect(gems.supports.length).toBeGreaterThan(150);
    expect(gems.actives["Cyclone"]).toBeDefined();
  });
});

describe("eligibleSupports", () => {
  it("refuses a projectile support on a skill with no projectiles", () => {
    expect(eligibleSupports("Cyclone")).not.toContain("Greater Multiple Projectiles");
  });

  it("refuses a melee support on a spell", () => {
    expect(eligibleSupports("Arc")).not.toContain("Multistrike");
  });

  it("accepts the supports the skill is actually built around", () => {
    expect(eligibleSupports("Arc")).toContain("Spell Echo");
    expect(eligibleSupports("Cyclone")).toContain("Melee Physical Damage");
    expect(eligibleSupports("Tornado Shot")).toContain("Greater Multiple Projectiles");
    expect(eligibleSupports("Raise Spectre")).toContain("Minion Damage");
  });

  it("never offers a support that changes how the skill is delivered", () => {
    const forbidden = ["Spell Totem", "Ballista Totem", "Blastchain Mine", "Cast on Critical Strike"];

    for (const skill of ["Cyclone", "Arc", "Tornado Shot", "Fire Trap"]) {
      for (const support of forbidden) {
        expect(eligibleSupports(skill), `${skill} / ${support}`).not.toContain(support);
      }
    }
  });

  it("returns nothing for a skill it has no data for", () => {
    expect(eligibleSupports("Definitely Not A Gem")).toEqual([]);
  });
});

describe("planLinks", () => {
  it("suggests five supports for a normal skill", () => {
    expect(planLinks("Cyclone", CYCLONE)).toHaveLength(5);
    expect(planLinks("Arc", ARC)).toHaveLength(5);
  });

  it("keeps Brutality away from skills whose damage it would delete", () => {
    expect(planLinks("Bane", BANE)).not.toContain("Brutality");
    expect(planLinks("Arc", ARC)).not.toContain("Brutality");
  });

  it("keeps Elemental Focus away from a pure physical skill", () => {
    expect(planLinks("Cyclone", CYCLONE)).not.toContain("Elemental Focus");
  });

  it("never suggests two supports that cancel each other out", () => {
    const conflicts: Array<[string, string]> = [
      ["Brutality", "Elemental Focus"],
      ["Concentrated Effect", "Increased Area of Effect"],
      ["Chain", "Pierce"],
      ["Added Fire Damage", "Added Cold Damage"],
    ];

    for (const [skill, tags] of [
      ["Cyclone", CYCLONE], ["Arc", ARC], ["Bane", BANE],
      ["Tornado Shot", TORNADO_SHOT], ["Raise Spectre", SPECTRE],
    ] as const) {
      const links = planLinks(skill, tags);

      for (const [left, right] of conflicts) {
        expect(links.includes(left) && links.includes(right), `${skill}: ${left} + ${right}`).toBe(false);
      }
    }
  });

  it("keeps cast-speed supports away from minion skills, where they do nothing", () => {
    const links = planLinks("Raise Spectre", SPECTRE);

    expect(links).not.toContain("Spell Echo");
    expect(links).not.toContain("Controlled Destruction");
  });

  it("leads with the support that defines the archetype", () => {
    expect(planLinks("Arc", ARC)[0]).toBe("Spell Echo");
    expect(planLinks("Raise Spectre", SPECTRE)[0]).toBe("Minion Damage");
    expect(planLinks("Tornado Shot", TORNADO_SHOT)[0]).toBe("Greater Multiple Projectiles");
  });

  it("excludes anything the challenge banned", () => {
    const banned = ["Spell Echo Support", "Controlled Destruction Support"];
    const links = planLinks("Arc", ARC, banned);

    expect(links).not.toContain("Spell Echo");
    expect(links).not.toContain("Controlled Destruction");
    expect(links).toHaveLength(5);
  });

  it("never repeats a support", () => {
    for (const [skill, tags] of [["Cyclone", CYCLONE], ["Bane", BANE]] as const) {
      const links = planLinks(skill, tags);
      expect(new Set(links).size).toBe(links.length);
    }
  });

  it("is deterministic", () => {
    expect(planLinks("Cyclone", CYCLONE)).toEqual(planLinks("Cyclone", CYCLONE));
  });
});

describe("bannableSupports", () => {
  it("offers to ban only supports the build actually wanted", () => {
    const wanted = bannableSupports("Arc", ARC);

    expect(wanted).toContain("Spell Echo");
    expect(wanted).not.toContain("Multistrike");
  });
});

describe("utility gems", () => {
  it("matches the movement skill to the mandated weapon", () => {
    expect(planMovementGem("oneHandMace")).toBe("Leap Slam");
    expect(planMovementGem("dagger")).toBe("Whirling Blades");
    expect(planMovementGem("bow")).toBe("Flame Dash");
    expect(planMovementGem(undefined)).toBe("Flame Dash");
  });

  it("matches the aura to what the class's gear already stacks", () => {
    expect(planAuraGem(["Armour"])).toBe("Determination");
    expect(planAuraGem(["Evasion"])).toBe("Grace");
    expect(planAuraGem(["Energy Shield"])).toBe("Discipline");
    expect(planAuraGem(["Evasion/Energy Shield", "Evasion"])).toBe("Grace");
  });
});

describe("planGemGroups", () => {
  const GEAR = [
    { slot: "Weapon 1", sockets: 3 },
    { slot: "Weapon 2", sockets: 3 },
    { slot: "Helmet", sockets: 4 },
    { slot: "Body Armour", sockets: 6 },
    { slot: "Gloves", sockets: 4 },
    { slot: "Boots", sockets: 4 },
    { slot: "Ring 1", sockets: 0 },
    { slot: "Belt", sockets: 0 },
  ];

  function layout(overrides: Partial<Parameters<typeof planGemGroups>[0]> = {}) {
    return planGemGroups({
      skillName: "Cyclone",
      tags: CYCLONE,
      links: ["Melee Physical Damage Support", "Brutality Support"],
      weapon: "oneHandMace",
      defences: ["Armour"],
      gearSlots: GEAR,
      bansMovementSkills: false,
      bansAuras: false,
      ...overrides,
    });
  }

  it("puts the main links in an item that can hold six gems", () => {
    const main = layout().find((group) => group.kind === "main")!;

    expect(main.slot).toBe("Body Armour");
    expect(main.gems[0]).toBe("Cyclone");
  });

  it("leaves the main links unassigned when nothing can hold six", () => {
    const noSixSocket = GEAR.filter((entry) => entry.sockets < 6);
    const main = layout({ gearSlots: noSixSocket }).find((group) => group.kind === "main")!;

    expect(main.slot).toBeUndefined();
  });

  it("spreads utility groups over the remaining socketed items", () => {
    const groups = layout();
    const slots = groups.map((group) => group.slot);

    expect(groups.length).toBeGreaterThan(3);
    expect(new Set(slots).size).toBe(slots.length);
    expect(slots).not.toContain("Ring 1");
    expect(slots).not.toContain("Belt");
  });

  it("never puts more gems in a group than the item has sockets", () => {
    const sockets = new Map(GEAR.map((entry) => [entry.slot, entry.sockets]));

    for (const group of layout()) {
      if (!group.slot) continue;
      expect(group.gems.length).toBeLessThanOrEqual(sockets.get(group.slot)!);
    }
  });

  it("drops the movement group when the challenge bans movement skills", () => {
    const groups = layout({ bansMovementSkills: true });

    expect(groups.some((group) => group.kind === "movement")).toBe(false);
  });

  it("drops the aura group when the challenge bans auras", () => {
    const groups = layout({ bansAuras: true });

    expect(groups.some((group) => group.kind === "aura")).toBe(false);
  });

  it("matches the herald and the curse to what the skill deals", () => {
    const cold = layout({ skillName: "Ice Nova", tags: ["spell", "cold", "aoe"] });

    expect(cold.find((group) => group.kind === "aura")!.gems).toContain("Herald of Ice");
    expect(cold.find((group) => group.kind === "curse")?.gems).toEqual(["Frostbite"]);
  });

  it("is deterministic", () => {
    expect(layout()).toEqual(layout());
  });
});

describe("names and colours", () => {
  it("round-trips the support suffix the app uses", () => {
    expect(withSupportSuffix("Spell Echo")).toBe("Spell Echo Support");
    expect(withSupportSuffix("Spell Echo Support")).toBe("Spell Echo Support");
    expect(stripSupportSuffix("Spell Echo Support")).toBe("Spell Echo");
  });

  it("resolves a colour for actives and supports alike", () => {
    // Cyclone is a dexterity gem: both PoB's data and the bundled colour table agree.
    expect(gemColorOf("Cyclone")).toBe("green");
    expect(gemColorOf("Arc")).toBe("blue");
    expect(gemColorOf("Spell Echo Support")).toBe("blue");
    expect(gemColorOf("Not A Gem")).toBeUndefined();
  });
});

import { describe, it, expect } from "vitest";
import treeRaw from "@/data/tree-default.json";
import { CLASS_IDS } from "@/domain/poe-classes";
import type { ChallengeSkillTag, WeaponFamily } from "@/domain/challenge";
import { classStartNodeId, passivePointsForLevel, planTree } from "../tree-planner";

/**
 * Business rules under test — these come from how Path of Exile's passive tree
 * works, not from reading the planner:
 *
 * Legality — an allocation the game would reject is worse than none at all
 *   - Every allocated node must be connected to the character's start node
 *     through other allocated nodes. Passive trees are walked, not teleported to.
 *   - The number of allocated nodes must never exceed the points the character
 *     actually has: one per level after the first, plus 22 from act quests.
 *   - Ascendancy nodes come from a separate point pool and mastery nodes need
 *     their group allocated first, so neither may appear in a main-tree plan.
 *
 * Usefulness
 *   - A mandated keystone must always end up allocated; it is a rule, not a hint.
 *   - A higher level must be able to allocate more, never less.
 *   - The plan must be deterministic, like everything else derived from a seed.
 *
 * Equipment — a notable whose bonus needs gear the build does not hold is a dead
 * point, however well its words match the skill (regression: medium:K4MN03, a
 * Rain of Arrows bow build, was handed axe, sword, mace, two-handed, shield and
 * dual-wield notables)
 *   - Weapon-specific notables ("with Axes", "with Two Handed Melee Weapons") are
 *     taken only when the build wields that weapon.
 *   - Dual wielding is never suggested, so its notables are never taken.
 *   - Shield notables need a shield, which only fits beside a one-handed weapon:
 *     never beside a bow (quiver) or a two-handed weapon.
 *   - "Maces or Sceptres" holds for either family.
 *   - "Melee" bonuses need a melee skill; text about the enemy's melee
 *     ("Reflects ... to Melee Attackers") is not a condition on the player.
 *   - With no mandated weapon, a notable must suit every family the skill allows.
 */

type RawNode = [number, number, number, number, string, string, string, number, number, number, unknown, number[]?];

const nodes = (treeRaw as unknown as { nodes: RawNode[] }).nodes;

/** Adjacency rebuilt independently of the planner, so it can act as an oracle. */
const adjacency = new Map<number, Set<number>>();
const nodeById = new Map<number, RawNode>();

for (const node of nodes) {
  nodeById.set(node[0], node);
}

for (const node of nodes) {
  for (const target of node[11] ?? []) {
    if (!nodeById.has(target)) continue;
    if (!adjacency.has(node[0])) adjacency.set(node[0], new Set());
    if (!adjacency.has(target)) adjacency.set(target, new Set());
    adjacency.get(node[0])!.add(target);
    adjacency.get(target)!.add(node[0]);
  }
}

function isConnected(classId: string, allocated: number[]): boolean {
  const start = classStartNodeId(classId)!;
  const inPlan = new Set([...allocated, start]);
  const seen = new Set([start]);
  const queue = [start];

  for (let head = 0; head < queue.length; head++) {
    for (const next of adjacency.get(queue[head]) ?? []) {
      if (!inPlan.has(next) || seen.has(next)) continue;
      seen.add(next);
      queue.push(next);
    }
  }

  return seen.size === inPlan.size;
}

const CASES: Array<{ classId: string; tags: ChallengeSkillTag[]; weapons: WeaponFamily[]; label: string }> = [
  { classId: "0", tags: ["attack", "projectile", "physical"], weapons: ["bow"], label: "Scion bow" },
  { classId: "1", tags: ["attack", "melee", "physical", "aoe"], weapons: ["twoHandMace"], label: "Marauder slam" },
  { classId: "2", tags: ["attack", "projectile", "chaos", "dot"], weapons: ["bow"], label: "Ranger poison bow" },
  { classId: "3", tags: ["spell", "fire", "aoe"], weapons: ["wand", "staff"], label: "Witch fire caster" },
  { classId: "4", tags: ["attack", "melee", "physical"], weapons: ["oneHandSword"], label: "Duelist melee" },
  { classId: "5", tags: ["spell", "minion"], weapons: ["sceptre"], label: "Templar minions" },
  { classId: "6", tags: ["spell", "chaos", "dot"], weapons: ["dagger"], label: "Shadow chaos" },
];

describe("passivePointsForLevel", () => {
  it("grants one point per level after the first, plus the 22 quest points", () => {
    expect(passivePointsForLevel(1)).toBe(22);
    expect(passivePointsForLevel(70)).toBe(91);
    expect(passivePointsForLevel(90)).toBe(111);
    expect(passivePointsForLevel(100)).toBe(121);
  });
});

describe("planTree", () => {
  it("produces a fully connected allocation for every class", () => {
    for (const testCase of CASES) {
      const plan = planTree({ classId: testCase.classId, tags: testCase.tags, weapons: testCase.weapons, level: 90 });

      expect(plan.nodes.length, testCase.label).toBeGreaterThan(0);
      expect(isConnected(testCase.classId, plan.nodes), testCase.label).toBe(true);
    }
  });

  it("never spends more points than the character has", () => {
    for (const level of [40, 70, 90, 95, 100]) {
      for (const testCase of CASES) {
        const plan = planTree({ classId: testCase.classId, tags: testCase.tags, weapons: testCase.weapons, level });

        expect(plan.pointsUsed).toBeLessThanOrEqual(passivePointsForLevel(level));
        expect(plan.pointsUsed).toBe(plan.nodes.length);
        expect(plan.pointsAvailable).toBe(passivePointsForLevel(level));
      }
    }
  });

  it("excludes the class start node, which costs no point", () => {
    for (const classId of CLASS_IDS) {
      const plan = planTree({ classId, tags: ["attack"], weapons: ["twoHandAxe"], level: 70 });

      expect(plan.nodes).not.toContain(classStartNodeId(classId));
    }
  });

  it("never allocates ascendancy or mastery nodes", () => {
    const plan = planTree({ classId: "3", tags: ["spell", "cold"], weapons: ["wand"], level: 95 });

    for (const id of plan.nodes) {
      const node = nodeById.get(id)!;
      const extra = node[10] as { asc?: string } | null;

      expect(extra?.asc).toBeUndefined();
      expect(node[3]).not.toBe(3);
    }
  });

  it("always allocates a mandated keystone", () => {
    const chaosInoculation = 11455;

    for (const classId of CLASS_IDS) {
      const plan = planTree({
        classId,
        tags: ["spell", "chaos"],
        weapons: ["wand"],
        level: 90,
        requiredNodeId: chaosInoculation,
      });

      expect(plan.nodes).toContain(chaosInoculation);
      expect(plan.highlights[0]).toBe("Chaos Inoculation");
      expect(isConnected(classId, plan.nodes)).toBe(true);
    }
  });

  it("keeps the allocation connected once a distant keystone is forced in", () => {
    // Resolute Technique sits in the Marauder corner: forcing it on a Witch pulls
    // a long path across the tree, which is exactly where connectivity breaks if
    // the path is stitched together carelessly.
    const plan = planTree({
      classId: "3",
      tags: ["attack", "physical"],
      weapons: ["twoHandAxe"],
      level: 90,
      requiredNodeId: 31961,
    });

    expect(plan.nodes).toContain(31961);
    expect(isConnected("3", plan.nodes)).toBe(true);
  });

  it("allocates more with more levels", () => {
    const low = planTree({ classId: "1", tags: ["attack", "melee"], weapons: ["twoHandAxe"], level: 40 });
    const high = planTree({ classId: "1", tags: ["attack", "melee"], weapons: ["twoHandAxe"], level: 90 });

    expect(high.pointsUsed).toBeGreaterThan(low.pointsUsed);
  });

  it("is deterministic", () => {
    const first = planTree({ classId: "6", tags: ["spell", "cold"], weapons: ["wand"], level: 85, requiredNodeId: 22088 });
    const second = planTree({ classId: "6", tags: ["spell", "cold"], weapons: ["wand"], level: 85, requiredNodeId: 22088 });

    expect(first).toEqual(second);
  });

  it("picks different nodes for different skills on the same class", () => {
    const minions = planTree({ classId: "3", tags: ["spell", "minion"], weapons: ["wand"], level: 90 });
    const fire = planTree({ classId: "3", tags: ["spell", "fire"], weapons: ["wand"], level: 90 });

    expect(minions.highlights.join()).not.toBe(fire.highlights.join());
  });

  it("names the notables it allocated", () => {
    const plan = planTree({ classId: "2", tags: ["attack", "projectile"], weapons: ["bow"], level: 90 });

    expect(plan.highlights.length).toBeGreaterThan(5);
    for (const name of plan.highlights) {
      expect(name.trim()).not.toBe("");
    }
  });
});

describe("planTree respects the build's equipment", () => {
  const notablesOf = (nodes: number[]) =>
    nodes.map((id) => nodeById.get(id)!).filter((node) => node[3] === 1);
  const withText = (nodes: number[], pattern: RegExp) =>
    notablesOf(nodes).filter((node) => pattern.test(node[6])).map((node) => node[5]);

  const OTHER_WEAPONS = /\b(axes?|swords?|maces?|sceptres?|daggers?|claws?|wands?|staff|staves|unarmed|one handed|two handed melee|melee weapons?)\b/i;
  const DUAL_WIELD = /dual wield/i;
  const SHIELD = /(?<!energy )\bshields?\b/i;

  it("gives a bow build no notable for another weapon, a shield or dual wielding (medium:K4MN03)", () => {
    for (const classId of CLASS_IDS) {
      const plan = planTree({ classId, tags: ["attack", "projectile", "physical", "aoe"], weapons: ["bow"], level: 80 });

      expect(withText(plan.nodes, OTHER_WEAPONS), classId).toEqual([]);
      expect(withText(plan.nodes, DUAL_WIELD), classId).toEqual([]);
      expect(withText(plan.nodes, SHIELD), classId).toEqual([]);
    }
  });

  it("never chooses a melee notable for a non-melee skill", () => {
    const plan = planTree({ classId: "1", tags: ["attack", "projectile", "physical"], weapons: ["bow"], level: 90 });
    const chosen = plan.nodes.filter((id) => plan.highlights.includes(nodeById.get(id)![5]));

    // Asserted on what was chosen, not on every allocated node: Master of the Arena
    // is the only junction between the Marauder's Strength and Life nodes, so a path
    // may pass through it without it ever being a target.
    expect(withText(chosen, /melee (damage|physical|strike|critical)/i)).toEqual([]);
  });

  it("still takes the notables of the weapon the build does wield", () => {
    // The Marauder sits next to the axe cluster: a physical axe slam is its natural fit.
    const plan = planTree({ classId: "1", tags: ["attack", "melee", "physical"], weapons: ["twoHandAxe"], level: 90 });

    expect(withText(plan.nodes, /\baxes?\b/i).length).toBeGreaterThan(0);
    expect(withText(plan.nodes, /\b(swords?|maces?|claws?|daggers?|bows?|wands?)\b/i)).toEqual([]);
    expect(withText(plan.nodes, SHIELD)).toEqual([]);
  });

  it("accepts either family of 'Maces or Sceptres'", () => {
    const plan = planTree({ classId: "1", tags: ["attack", "melee", "physical"], weapons: ["sceptre"], level: 90 });

    expect(withText(plan.nodes, /maces or sceptres/i).length).toBeGreaterThan(0);
  });

  it("takes shield notables beside a one-handed weapon and never dual-wield ones", () => {
    const plan = planTree({ classId: "1", tags: ["attack", "melee", "physical"], weapons: ["oneHandMace"], level: 95 });

    expect(withText(plan.nodes, SHIELD).length).toBeGreaterThan(0);
    for (const name of withText(plan.nodes, DUAL_WIELD)) {
      // Only allowed when the line also offers the shield ("Dual Wielding or holding a Shield").
      const stats = notablesOf(plan.nodes).find((node) => node[5] === name)![6];
      for (const line of stats.split("\n").filter((l) => DUAL_WIELD.test(l))) {
        expect(SHIELD.test(line), `${name}: ${line}`).toBe(true);
      }
    }
  });

  it("with no mandated weapon, takes only notables that suit every family the skill allows", () => {
    const plan = planTree({
      classId: "4",
      tags: ["attack", "melee", "physical"],
      weapons: ["oneHandSword", "twoHandAxe", "unarmed"],
      level: 90,
    });

    expect(withText(plan.nodes, /\b(axes?|swords?|two handed|one handed|melee weapons?|unarmed|shields?)\b/i)).toEqual([]);
  });

  it("refuses to plan without any weapon family to fit", () => {
    expect(() => planTree({ classId: "1", tags: ["attack"], weapons: [], level: 70 })).toThrow();
  });
});

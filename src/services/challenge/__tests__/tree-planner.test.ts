import { describe, it, expect } from "vitest";
import treeRaw from "@/data/tree-default.json";
import { CLASS_IDS } from "@/domain/poe-classes";
import type { ChallengeSkillTag } from "@/domain/challenge";
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

const CASES: Array<{ classId: string; tags: ChallengeSkillTag[]; label: string }> = [
  { classId: "0", tags: ["attack", "projectile", "physical"], label: "Scion bow" },
  { classId: "1", tags: ["attack", "melee", "physical", "aoe"], label: "Marauder slam" },
  { classId: "2", tags: ["attack", "projectile", "chaos", "dot"], label: "Ranger poison bow" },
  { classId: "3", tags: ["spell", "fire", "aoe"], label: "Witch fire caster" },
  { classId: "4", tags: ["attack", "melee", "physical"], label: "Duelist melee" },
  { classId: "5", tags: ["spell", "minion"], label: "Templar minions" },
  { classId: "6", tags: ["spell", "chaos", "dot"], label: "Shadow chaos" },
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
      const plan = planTree({ classId: testCase.classId, tags: testCase.tags, level: 90 });

      expect(plan.nodes.length, testCase.label).toBeGreaterThan(0);
      expect(isConnected(testCase.classId, plan.nodes), testCase.label).toBe(true);
    }
  });

  it("never spends more points than the character has", () => {
    for (const level of [40, 70, 90, 95, 100]) {
      for (const testCase of CASES) {
        const plan = planTree({ classId: testCase.classId, tags: testCase.tags, level });

        expect(plan.pointsUsed).toBeLessThanOrEqual(passivePointsForLevel(level));
        expect(plan.pointsUsed).toBe(plan.nodes.length);
        expect(plan.pointsAvailable).toBe(passivePointsForLevel(level));
      }
    }
  });

  it("excludes the class start node, which costs no point", () => {
    for (const classId of CLASS_IDS) {
      const plan = planTree({ classId, tags: ["attack"], level: 70 });

      expect(plan.nodes).not.toContain(classStartNodeId(classId));
    }
  });

  it("never allocates ascendancy or mastery nodes", () => {
    const plan = planTree({ classId: "3", tags: ["spell", "cold"], level: 95 });

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
      level: 90,
      requiredNodeId: 31961,
    });

    expect(plan.nodes).toContain(31961);
    expect(isConnected("3", plan.nodes)).toBe(true);
  });

  it("allocates more with more levels", () => {
    const low = planTree({ classId: "1", tags: ["attack", "melee"], level: 40 });
    const high = planTree({ classId: "1", tags: ["attack", "melee"], level: 90 });

    expect(high.pointsUsed).toBeGreaterThan(low.pointsUsed);
  });

  it("is deterministic", () => {
    const first = planTree({ classId: "6", tags: ["spell", "cold"], level: 85, requiredNodeId: 22088 });
    const second = planTree({ classId: "6", tags: ["spell", "cold"], level: 85, requiredNodeId: 22088 });

    expect(first).toEqual(second);
  });

  it("picks different nodes for different skills on the same class", () => {
    const minions = planTree({ classId: "3", tags: ["spell", "minion"], level: 90 });
    const fire = planTree({ classId: "3", tags: ["spell", "fire"], level: 90 });

    expect(minions.highlights.join()).not.toBe(fire.highlights.join());
  });

  it("names the notables it allocated", () => {
    const plan = planTree({ classId: "2", tags: ["attack", "projectile"], level: 90 });

    expect(plan.highlights.length).toBeGreaterThan(5);
    for (const name of plan.highlights) {
      expect(name.trim()).not.toBe("");
    }
  });
});

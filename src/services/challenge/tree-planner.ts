/**
 * Builds a real, connected passive tree allocation for a challenge.
 *
 * This is genuine pathfinding over the bundled tree graph — every node is a real
 * node id, every allocation is reachable from the character's start node, and the
 * point total never exceeds what the target level actually grants. It is a
 * *suggested* path, not the optimum Path of Building would solve for; the UI
 * labels it as such.
 *
 * Algorithm: a greedy Steiner-tree approximation.
 *   1. Start from the class start node.
 *   2. Connect the mandated keystone first, if the challenge has one.
 *   3. Repeatedly attach the notable with the best score-per-extra-point, where
 *      score comes from matching the notable's own stat text against the main
 *      skill's tags.
 *   4. Stop when the point budget is spent.
 *
 * Keystones are never picked up opportunistically: they redefine how a build
 * works, so taking one by accident would sabotage the player.
 */

import treeRaw from "@/data/tree-default.json";
import type { ChallengeSkillTag } from "@/domain/challenge";

type RawNode = [number, number, number, number, string, string, string, number, number, number, unknown, number[]?];

interface PlannerNode {
  id: number;
  type: number;
  name: string;
  stats: string;
  isAscendancy: boolean;
}

const tree = treeRaw as unknown as { nodes: RawNode[] };

const NODE_TYPE_NOTABLE = 1;
const NODE_TYPE_KEYSTONE = 2;
const NODE_TYPE_MASTERY = 3;
const NODE_TYPE_CLASS_START = 5;

/**
 * Class start nodes carry placeholder names in the exported data ("SIX",
 * "Seven"), so they are identified by position instead: each class starts at a
 * fixed corner of the tree and the Scion starts at the centre.
 */
const CLASS_START_POSITION: Record<string, [number, number]> = {
  "0": [0, 0], // Scion — centre
  "1": [-2824, 1642], // Marauder — bottom left
  "2": [2844, 1642], // Ranger — bottom right
  "3": [-4, -3180], // Witch — top centre
  "4": [3, 3188], // Duelist — bottom centre
  "5": [-2837, -1629], // Templar — top left
  "6": [2844, -1628], // Shadow — top right
};

/** Stat-text keywords that make a node relevant to a skill carrying that tag. */
const TAG_KEYWORDS: Record<ChallengeSkillTag, string[]> = {
  attack: ["attack"],
  spell: ["spell", "cast speed"],
  melee: ["melee"],
  projectile: ["projectile", "arrow", "bow"],
  aoe: ["area of effect", "area damage"],
  minion: ["minion"],
  totem: ["totem"],
  trap: ["trap"],
  mine: ["mine"],
  channelling: ["channelling"],
  dot: ["damage over time", "poison", "ignite", "bleed"],
  crit: ["critical"],
  chaos: ["chaos", "poison"],
  fire: ["fire", "burning", "ignite"],
  cold: ["cold", "freeze", "chill"],
  lightning: ["lightning", "shock"],
  physical: ["physical", "bleed", "impale"],
};

/** Always worth something: a build that cannot survive cannot finish the challenge. */
const DEFENCE_KEYWORDS = [
  "maximum life",
  "life regeneration",
  "maximum energy shield",
  "elemental resistance",
  "chaos resistance",
  "armour",
  "evasion",
  "suppress",
  "block",
];

const TAG_WEIGHT = 3;
const DEFENCE_WEIGHT = 2;
/** Share of the budget that may go to nodes offering defence and nothing else. */
const MAX_DEFENCE_SHARE = 0.35;

/* ── Graph, built once ── */

const nodesById = new Map<number, PlannerNode>();
const neighbours = new Map<number, number[]>();
const classStartByClassId = new Map<string, number>();

{
  const adjacency = new Map<number, Set<number>>();
  const link = (a: number, b: number) => {
    if (!adjacency.has(a)) adjacency.set(a, new Set());
    adjacency.get(a)!.add(b);
  };

  const startCandidates: Array<{ id: number; x: number; y: number }> = [];

  for (const raw of tree.nodes) {
    const extra = raw[10] as { asc?: string } | null;
    const node: PlannerNode = {
      id: raw[0],
      type: raw[3],
      name: raw[5],
      stats: raw[6],
      isAscendancy: Boolean(extra?.asc),
    };

    // Ascendancy nodes live on a separate budget and masteries need their group
    // allocated first — neither belongs in main-tree pathfinding.
    if (node.isAscendancy || node.type === NODE_TYPE_MASTERY) {
      continue;
    }

    nodesById.set(node.id, node);

    if (node.type === NODE_TYPE_CLASS_START) {
      startCandidates.push({ id: node.id, x: raw[1], y: raw[2] });
    }
  }

  for (const raw of tree.nodes) {
    const from = raw[0];
    if (!nodesById.has(from)) continue;

    for (const to of raw[11] ?? []) {
      if (!nodesById.has(to)) continue;
      link(from, to);
      link(to, from);
    }
  }

  for (const [id, set] of adjacency) {
    neighbours.set(id, [...set]);
  }

  for (const [classId, [x, y]] of Object.entries(CLASS_START_POSITION)) {
    let best: { id: number; distance: number } | null = null;

    for (const candidate of startCandidates) {
      const distance = (candidate.x - x) ** 2 + (candidate.y - y) ** 2;
      if (!best || distance < best.distance) {
        best = { id: candidate.id, distance };
      }
    }

    if (best) {
      classStartByClassId.set(classId, best.id);
    }
  }
}

/* ── Scoring ── */

function scoreNode(node: PlannerNode, tags: readonly ChallengeSkillTag[]) {
  const stats = node.stats.toLowerCase();
  let offence = 0;
  let defence = 0;

  for (const tag of tags) {
    for (const keyword of TAG_KEYWORDS[tag]) {
      if (stats.includes(keyword)) {
        offence += TAG_WEIGHT;
      }
    }
  }

  for (const keyword of DEFENCE_KEYWORDS) {
    if (stats.includes(keyword)) {
      defence += DEFENCE_WEIGHT;
    }
  }

  return { offence, defence };
}

/* ── Point budget ── */

/**
 * Passive points available at a given level: one per level after the first, plus
 * the 22 granted by act quests. Ascendancy points are separate and not counted.
 */
const QUEST_PASSIVE_POINTS = 22;

export function passivePointsForLevel(level: number): number {
  return Math.max(0, level - 1) + QUEST_PASSIVE_POINTS;
}

/* ── Planning ── */

export interface TreePlan {
  /** Allocated node ids, excluding the class start node (PoB omits it too). */
  nodes: number[];
  /** Names of the allocated notables and keystones, in allocation order. */
  highlights: string[];
  pointsUsed: number;
  pointsAvailable: number;
}

interface PlanRequest {
  classId: string;
  tags: readonly ChallengeSkillTag[];
  level: number;
  /** Mandated keystone, connected before anything else. */
  requiredNodeId?: number;
}

/** Breadth-first distances and parents from the whole allocated set at once. */
function distancesFromTree(allocated: Set<number>) {
  const distance = new Map<number, number>();
  const parent = new Map<number, number>();
  const queue: number[] = [];

  for (const id of allocated) {
    distance.set(id, 0);
    queue.push(id);
  }

  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];

    for (const next of neighbours.get(current) ?? []) {
      if (distance.has(next)) continue;
      distance.set(next, distance.get(current)! + 1);
      parent.set(next, current);
      queue.push(next);
    }
  }

  return { distance, parent };
}

export function planTree({ classId, tags, level, requiredNodeId }: PlanRequest): TreePlan {
  const start = classStartByClassId.get(classId);

  if (start === undefined) {
    throw new Error(`No start node for class ${classId}`);
  }

  const budget = passivePointsForLevel(level);
  const allocated = new Set<number>([start]);
  const highlights: string[] = [];
  let defencePoints = 0;

  const used = () => allocated.size - 1;

  const attach = (target: number, distance: Map<number, number>, parent: Map<number, number>) => {
    const cost = distance.get(target);

    if (cost === undefined || used() + cost > budget) {
      return 0;
    }

    let cursor = target;
    let added = 0;

    while (!allocated.has(cursor)) {
      allocated.add(cursor);
      added++;
      const next = parent.get(cursor);
      if (next === undefined) break;
      cursor = next;
    }

    return added;
  };

  if (requiredNodeId !== undefined) {
    const { distance, parent } = distancesFromTree(allocated);

    if (attach(requiredNodeId, distance, parent) > 0) {
      highlights.push(nodesById.get(requiredNodeId)?.name ?? String(requiredNodeId));
    }
  }

  // Scoring depends only on the skill's tags, so it is done once for the whole
  // plan rather than on every pass. Rescoring inside the loop made a plan cost a
  // quarter of a second, and rehydrating stored challenges runs on every startup.
  const candidates: Array<{ node: PlannerNode; value: number; pureDefence: boolean }> = [];

  for (const node of nodesById.values()) {
    if (node.type !== NODE_TYPE_NOTABLE) continue;

    const { offence, defence } = scoreNode(node, tags);
    if (offence === 0 && defence < DEFENCE_WEIGHT * 2) continue;

    candidates.push({
      node,
      value: offence + defence * 0.75,
      pureDefence: offence === 0,
    });
  }

  for (;;) {
    const { distance, parent } = distancesFromTree(allocated);
    let best: { ratio: number; node: PlannerNode; pureDefence: boolean } | null = null;

    for (const candidate of candidates) {
      const { node, value, pureDefence } = candidate;
      if (allocated.has(node.id)) continue;

      const cost = distance.get(node.id);
      if (cost === undefined || used() + cost > budget) continue;

      if (pureDefence && defencePoints > MAX_DEFENCE_SHARE * used()) continue;

      const ratio = value / cost;

      if (!best || ratio > best.ratio) {
        best = { ratio, node, pureDefence };
      }
    }

    if (!best) break;

    const added = attach(best.node.id, distance, parent);
    if (added === 0) break;

    highlights.push(best.node.name);
    if (best.pureDefence) {
      defencePoints += added;
    }
  }

  allocated.delete(start);

  return {
    nodes: [...allocated],
    highlights,
    pointsUsed: allocated.size,
    pointsAvailable: budget,
  };
}

/** Exposed for the data-integrity test: the start node the planner will use. */
export function classStartNodeId(classId: string): number | undefined {
  return classStartByClassId.get(classId);
}

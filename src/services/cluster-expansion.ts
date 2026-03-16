/**
 * Cluster Jewel Expansion — PoB-compatible layout
 *
 * Generates virtual passive nodes around a jewel socket using the same
 * orbit geometry and index placement algorithm as Path of Building.
 *
 * Key concepts:
 *  - Cluster passives are placed on a ring (orbit) around a center point
 *  - The center point = the Position Proxy node's group center
 *  - Large clusters → orbit 3 (radius 335), Medium → orbit 2 (radius 162)
 *  - Positions use a 12-index system, translated to 16-space for orbits 2&3
 *  - The proxy node's orbitIndex provides the rotation offset
 *  - Index 0 = entrance node (connects to the parent jewel socket)
 */

import clusterNotablesDb from "@/data/cluster-notables.json";

export interface ClusterNode {
  id: number;
  x: number;
  y: number;
  name: string;
  stats: string;
  nodeType: "notable" | "small" | "socket";
  /** Sprite icon key (from tree iconActive/iconInactive) for rendering */
  icon?: string;
}

export interface ClusterExpansion {
  socketId: number;
  nodes: ClusterNode[];
  connections: Array<[number, number]>;
  /** Orbit center (proxy group center) for arc drawing */
  center: { x: number; y: number };
  /** Orbit radius */
  radius: number;
  /** Orbit positions (for angle calculation) */
  orbitPositions: number;
  /** Map from virtual node id → orbit index (for computing arc angles) */
  nodeOrbitIndex: Map<number, number>;
}

/* ── GGG/PoB cluster index priority lists ── */

const LARGE = {
  orbit: 3,
  totalIndices: 12,
  smallIndices:    [0, 4, 6, 8, 10, 2, 7, 5, 9, 3, 11, 1],
  notableIndices:  [6, 4, 8, 10, 2],
  socketIndices:   [4, 8, 6],
};

const MEDIUM = {
  orbit: 2,
  totalIndices: 12,
  smallIndices:    [0, 6, 8, 4, 10, 2],
  notableIndices:  [6, 10, 2, 0],
  socketIndices:   [6],
};

const SMALL_CFG = {
  orbit: 1,
  totalIndices: 6,
  smallIndices:    [0, 4, 2],
  notableIndices:  [4],
  socketIndices:   [4],
};

type SizeConfig = typeof LARGE;

/* ── 12↔16 orbit index translation ── */
const TRANSLATE_12_TO_16 = [0, 1, 3, 4, 5, 7, 8, 9, 11, 12, 13, 15];
const TRANSLATE_16_TO_12 = [0, 1, 1, 2, 3, 4, 4, 5, 6, 7, 7, 8, 9, 10, 10, 11];

/* ── Icon mapping for cluster nodes ── */
// Maps keywords from small passive grants → sprite icon key in tree data
const P = "Art/2DArt/SkillIcons/passives/";
const SMALL_ICON_MAP: Array<[RegExp, string]> = [
  [/minion/i,          `${P}miniondamage.png`],
  [/totem/i,           `${P}TotemNode.png`],
  [/trap/i,            `${P}TrapNode.png`],
  [/mine/i,            `${P}MineNode.png`],
  [/brand/i,           `${P}BrandDmgNode.png`],
  [/fire damage/i,     `${P}FireDamagenode.png`],
  [/cold damage/i,     `${P}ColdDamagenode.png`],
  [/lightning damage/i,`${P}LightningDamagenode.png`],
  [/chaos damage/i,    `${P}ChaosDamagenode.png`],
  [/physical damage/i, `${P}PhysicalDamageNode.png`],
  [/elemental damage/i,`${P}ElementalDamagenode.png`],
  [/spell damage/i,    `${P}SpellDamageNode.png`],
  [/attack/i,          `${P}DmgAttackSpeed.png`],
  [/critical/i,        `${P}DmgCrit.png`],
  [/life/i,            `${P}LifeNode.png`],
  [/energy shield/i,   `${P}EnergyShieldNode.png`],
  [/mana/i,            `${P}ManaNode.png`],
  [/armour/i,          `${P}ArmourNode.png`],
  [/evasion/i,         `${P}EvasionNode.png`],
  [/resist/i,          `${P}ElementalResistancesNode.png`],
  [/speed/i,           `${P}AttackSpeedNode.png`],
  [/damage over time/i,`${P}DamageOverTimeNode.png`],
  [/damage/i,          `${P}DmgAttackSpeed.png`],
];
const NOTABLE_ICON_MAP: Array<[RegExp, string]> = [
  [/minion/i,          `${P}IncreasedMinionDamageNotable.png`],
  [/totem/i,           `${P}TotemNotable.png`],
  [/fire/i,            `${P}FireDamageNotable.png`],
  [/cold/i,            `${P}ColdDamageNotable.png`],
  [/lightning/i,       `${P}LightningDamageNotable.png`],
  [/chaos/i,           `${P}ChaosDamageNotable.png`],
  [/physical/i,        `${P}PhysicalDamageNotable.png`],
  [/elemental/i,       `${P}ElementalDamageNotable.png`],
  [/spell/i,           `${P}SpellDamageNotable.png`],
  [/life/i,            `${P}LifeNotable.png`],
  [/energy shield/i,   `${P}EnergyShieldNotable.png`],
  [/armour|armor/i,    `${P}ArmourNotable.png`],
  [/evasion/i,         `${P}EvasionNotable.png`],
];
const FALLBACK_SMALL = `${P}clustersLinknode1.png`;
const FALLBACK_NOTABLE = `${P}clustersLink2.png`;

function resolveIcon(stats: string, map: Array<[RegExp, string]>, fallback: string): string {
  for (const [re, icon] of map) {
    if (re.test(stats)) return icon;
  }
  return fallback;
}

/* ── Mod parsing ── */

interface ParsedClusterMods {
  totalPassives: number;
  jewelSocketCount: number;
  notableNames: string[];
  smallPassiveGrants: string[];
}

export function parseClusterMods(mods: string[]): ParsedClusterMods {
  let totalPassives = 0;
  let jewelSocketCount = 0;
  const notableNames: string[] = [];
  const smallPassiveGrants: string[] = [];

  for (const mod of mods) {
    const addMatch = mod.match(/Adds (\d+) Passive Skill/i);
    if (addMatch) { totalPassives = parseInt(addMatch[1]); continue; }

    const socketMatch = mod.match(/(\d+) Added Passive Skills? are Jewel Socket/i);
    if (socketMatch) { jewelSocketCount = parseInt(socketMatch[1]); continue; }

    const notableMatch = mod.match(/\d+ Added Passive Skill is (.+)/i);
    if (notableMatch) { notableNames.push(notableMatch[1]); continue; }

    const grantMatch = mod.match(/Added Small Passive Skills (?:also )?grant:\s*(.+)/i);
    if (grantMatch) { smallPassiveGrants.push(grantMatch[1]); continue; }
  }

  return { totalPassives, jewelSocketCount, notableNames, smallPassiveGrants };
}

/* ── Public API ── */

export interface SocketLayoutInfo {
  x: number;
  y: number;
  /** Center of the cluster ring (proxy group center) */
  groupCenter?: { x: number; y: number };
  /** Proxy orbitIndex in 16-position tree-space (rotation offset) */
  proxyOrbitIndex?: number;
  /** PoB base ID for this expansion (0x10000 + expansion hierarchy bits) */
  pobBaseId?: number;
}

export function buildClusterExpansions(
  socketInfo: Map<number, SocketLayoutInfo>,
  jewelSocketMap: Map<number, string | { name: string; mods?: string[]; baseType?: string }>,
  orbitRadii: number[],
  skillsPerOrbit: number[],
  /** Map from parent socket ID → real sub-socket node IDs (for using real IDs instead of virtual) */
  subSocketIds?: Map<number, number[]>,
): ClusterExpansion[] {
  const expansions: ClusterExpansion[] = [];

  for (const [socketId, jewelEntry] of jewelSocketMap) {
    if (typeof jewelEntry === "string") continue;
    if (!jewelEntry.mods || jewelEntry.mods.length === 0) continue;

    const baseType = (jewelEntry.baseType ?? "").toLowerCase();
    if (!baseType.includes("cluster")) continue;

    const isLarge  = baseType.includes("large");
    const isMedium = baseType.includes("medium");
    const isSmall  = baseType.includes("small");
    if (!isLarge && !isMedium && !isSmall) continue;

    const parsed = parseClusterMods(jewelEntry.mods);
    if (parsed.totalPassives === 0) continue;

    const info = socketInfo.get(socketId);
    if (!info) continue;

    const cfg: SizeConfig = isLarge ? LARGE : isMedium ? MEDIUM : SMALL_CFG;
    const radius = orbitRadii[cfg.orbit] ?? 335;
    const orbitPositions = skillsPerOrbit[cfg.orbit] ?? 16;

    // Center & rotation from proxy data, or fallback to socket position
    const center = info.groupCenter ?? info;
    const proxyOidx16 = info.proxyOrbitIndex ?? estimateRotation(info, orbitPositions);

    const realSubIds = subSocketIds?.get(socketId) ?? [];
    const sizeIndex = isLarge ? 2 : isMedium ? 1 : 0;
    const expansion = generateLayout(
      socketId, info, parsed, cfg, center, proxyOidx16, radius, orbitPositions, realSubIds,
      info.pobBaseId, sizeIndex,
    );
    if (expansion.nodes.length > 0) expansions.push(expansion);
  }

  return expansions;
}

/* ── Layout generator ── */

function generateLayout(
  socketId: number,
  socketPos: { x: number; y: number },
  parsed: ParsedClusterMods,
  cfg: SizeConfig,
  center: { x: number; y: number },
  proxyOidx16: number,
  radius: number,
  orbitPositions: number,
  realSubSocketIds: number[],
  pobBaseId: number | undefined,
  sizeIndex: number,
): ClusterExpansion {
  // Step 1: Assign node roles to cluster-space indices
  const occupied = new Map<number, { role: "notable" | "small" | "socket"; name: string; stats: string; icon?: string }>();

  // Sockets first (from priority list)
  // Sub-socket size: Large→Medium, Medium→Small
  const subSocketLabel = cfg === LARGE ? "Medium Jewel Socket" : "Small Jewel Socket";
  let si = 0;
  for (const idx of cfg.socketIndices) {
    if (si >= parsed.jewelSocketCount) break;
    occupied.set(idx, { role: "socket", name: subSocketLabel, stats: "" });
    si++;
  }

  // Notables second (skip occupied) — look up stats from cluster notables database
  const notableDb = clusterNotablesDb as Record<string, string[]>;
  let ni = 0;
  for (const idx of cfg.notableIndices) {
    if (ni >= parsed.notableNames.length) break;
    if (occupied.has(idx)) continue;
    const nName = parsed.notableNames[ni];
    const nStats = notableDb[nName]?.join("\n") ?? "";
    const nIcon = resolveIcon(nStats || nName, NOTABLE_ICON_MAP, FALLBACK_NOTABLE);
    occupied.set(idx, { role: "notable", name: nName, stats: nStats, icon: nIcon });
    ni++;
  }

  // Small passives fill remaining (skip occupied)
  const smallCount = parsed.totalPassives - parsed.jewelSocketCount - parsed.notableNames.length;
  const smallStats = parsed.smallPassiveGrants.join("\n");
  const smallIcon = resolveIcon(smallStats, SMALL_ICON_MAP, FALLBACK_SMALL);
  let pi = 0;
  for (const idx of cfg.smallIndices) {
    if (pi >= smallCount) break;
    if (occupied.has(idx)) continue;
    occupied.set(idx, { role: "small", name: "Small Passive", stats: smallStats, icon: smallIcon });
    pi++;
  }

  // Step 2: Compute rotation in cluster-space
  // For 12-index orbits (Large/Medium): use the standard 16→12 translation table
  // For 6-index orbits (Small): convert via angle proportion since modulo doesn't preserve position
  const proxyOidxCluster = cfg.totalIndices === 12
    ? TRANSLATE_16_TO_12[proxyOidx16 % 16]
    : Math.round(proxyOidx16 * cfg.totalIndices / 16) % cfg.totalIndices;

  // Step 3: Place nodes at orbit positions
  const nodes: ClusterNode[] = [];
  const rotatedIdToVirtual = new Map<number, number>(); // orbit index → virtualId
  const nodeOrbitIndex = new Map<number, number>(); // virtualId → orbit index

  let realSocketIdx = 0; // index into realSubSocketIds for socket-type nodes
  for (const [clusterIdx, info] of occupied) {
    const rotated = (clusterIdx + proxyOidxCluster) % cfg.totalIndices;
    const orbitIdx = cfg.totalIndices === 12
      ? TRANSLATE_12_TO_16[rotated]
      : rotated;

    const angle = (2 * Math.PI * orbitIdx) / orbitPositions - Math.PI / 2;
    const x = Math.round((center.x + radius * Math.cos(angle)) * 100) / 100;
    const y = Math.round((center.y + radius * Math.sin(angle)) * 100) / 100;

    // Use real tree node ID for socket nodes (so jewelSocketMap lookups work).
    // For non-socket nodes, use PoB-compatible IDs when available (enables allocation tracking).
    // PoB ID formula: pobBaseId + (sizeIndex << 4) + clusterOrbitIndex
    let nodeId: number;
    if (info.role === "socket" && realSocketIdx < realSubSocketIds.length) {
      nodeId = realSubSocketIds[realSocketIdx++];
    } else if (pobBaseId != null) {
      nodeId = pobBaseId + (sizeIndex << 4) + clusterIdx;
    } else {
      nodeId = -(socketId * 100 + clusterIdx + 1);
    }
    nodes.push({ id: nodeId, x, y, name: info.name, stats: info.stats, nodeType: info.role, icon: info.icon });
    rotatedIdToVirtual.set(orbitIdx, nodeId);
    nodeOrbitIndex.set(nodeId, orbitIdx);
  }

  // Step 4: Connect adjacent nodes around the ring (sorted by orbit position)
  const sortedOrbitIds = [...rotatedIdToVirtual.keys()].sort((a, b) => a - b);
  const connections: Array<[number, number]> = [];

  for (let i = 0; i < sortedOrbitIds.length - 1; i++) {
    connections.push([
      rotatedIdToVirtual.get(sortedOrbitIds[i])!,
      rotatedIdToVirtual.get(sortedOrbitIds[i + 1])!,
    ]);
  }
  // Close the ring for Large and Medium
  if (cfg.totalIndices === 12 && sortedOrbitIds.length > 2) {
    connections.push([
      rotatedIdToVirtual.get(sortedOrbitIds[sortedOrbitIds.length - 1])!,
      rotatedIdToVirtual.get(sortedOrbitIds[0])!,
    ]);
  }

  // Step 5: Entrance node (cluster index 0 after rotation) connects to parent socket
  const entranceOrbitIdx = cfg.totalIndices === 12
    ? TRANSLATE_12_TO_16[(0 + proxyOidxCluster) % 12]
    : (0 + proxyOidxCluster) % cfg.totalIndices;
  const entranceId = rotatedIdToVirtual.get(entranceOrbitIdx);
  if (entranceId != null) {
    connections.push([socketId, entranceId]);
  }

  return { socketId, nodes, connections, center, radius, orbitPositions, nodeOrbitIndex };
}

/** Fallback: estimate rotation from socket direction relative to tree center. */
function estimateRotation(socketPos: { x: number; y: number }, orbitPositions: number): number {
  // Angle from tree center (0,0) to socket — convert to orbit index
  const angle = Math.atan2(socketPos.y, socketPos.x) + Math.PI / 2; // +π/2 to match tree convention
  const normalized = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return Math.round((normalized / (2 * Math.PI)) * orbitPositions) % orbitPositions;
}

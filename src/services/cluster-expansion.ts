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

export interface ClusterNode {
  id: number;
  x: number;
  y: number;
  name: string;
  stats: string;
  nodeType: "notable" | "small" | "socket";
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
}

export function buildClusterExpansions(
  socketInfo: Map<number, SocketLayoutInfo>,
  jewelSocketMap: Map<number, string | { name: string; mods?: string[]; baseType?: string }>,
  orbitRadii: number[],
  skillsPerOrbit: number[],
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

    const expansion = generateLayout(
      socketId, info, parsed, cfg, center, proxyOidx16, radius, orbitPositions,
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
): ClusterExpansion {
  // Step 1: Assign node roles to cluster-space indices
  const occupied = new Map<number, { role: "notable" | "small" | "socket"; name: string; stats: string }>();

  // Sockets first (from priority list)
  let si = 0;
  for (const idx of cfg.socketIndices) {
    if (si >= parsed.jewelSocketCount) break;
    occupied.set(idx, { role: "socket", name: "Jewel Socket", stats: "" });
    si++;
  }

  // Notables second (skip occupied)
  let ni = 0;
  for (const idx of cfg.notableIndices) {
    if (ni >= parsed.notableNames.length) break;
    if (occupied.has(idx)) continue;
    occupied.set(idx, { role: "notable", name: parsed.notableNames[ni], stats: "" });
    ni++;
  }

  // Small passives fill remaining (skip occupied)
  const smallCount = parsed.totalPassives - parsed.jewelSocketCount - parsed.notableNames.length;
  const smallStats = parsed.smallPassiveGrants.join("\n");
  let pi = 0;
  for (const idx of cfg.smallIndices) {
    if (pi >= smallCount) break;
    if (occupied.has(idx)) continue;
    occupied.set(idx, { role: "small", name: "Small Passive", stats: smallStats });
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

  for (const [clusterIdx, info] of occupied) {
    const rotated = (clusterIdx + proxyOidxCluster) % cfg.totalIndices;
    const orbitIdx = cfg.totalIndices === 12
      ? TRANSLATE_12_TO_16[rotated]
      : rotated;

    const angle = (2 * Math.PI * orbitIdx) / orbitPositions - Math.PI / 2;
    const x = Math.round((center.x + radius * Math.cos(angle)) * 100) / 100;
    const y = Math.round((center.y + radius * Math.sin(angle)) * 100) / 100;

    const virtualId = -(socketId * 100 + clusterIdx + 1);
    nodes.push({ id: virtualId, x, y, name: info.name, stats: info.stats, nodeType: info.role });
    rotatedIdToVirtual.set(orbitIdx, virtualId);
    nodeOrbitIndex.set(virtualId, orbitIdx);
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

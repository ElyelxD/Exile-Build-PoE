import { useEffect, useRef, useCallback, useState } from "react";
import treeRaw from "@/data/tree-default.json";
import { getSheet, loadAllSheets, type SheetKey } from "@/services/tree-sprites";

/* ── Types for the compact tree data ── */

// [id, x, y, type, icon, name, stats, group, orbit, orbitIndex, extra, out?]
type RawNode =
  | [number, number, number, number, string, string, string, number, number, number, unknown]
  | [number, number, number, number, string, string, string, number, number, number, unknown, number[]];

type SpriteCoord = [number, number, number, number]; // sx, sy, sw, sh

interface GroupData {
  x: number;
  y: number;
  bg?: string;
  half?: boolean;
  orbits?: number[];
}

interface TreeData {
  bounds: [number, number, number, number];
  nodes: RawNode[];
  groups: Record<string, GroupData>;
  ascendancies: Record<string, number[]>;
  ascArt: Record<string, string>;
  orbits: { radii: number[]; skills: number[] };
  sheets: Record<string, string>;
  iconActive: Record<string, SpriteCoord>;
  iconInactive: Record<string, SpriteCoord>;
  frameCoords: Record<string, SpriteCoord>;
  groupBgCoords: Record<string, SpriteCoord>;
  startNodeCoords: Record<string, SpriteCoord>;
  lineCoords: Record<string, SpriteCoord>;
  ascCoords: Record<string, SpriteCoord>;
  bgCoords: Record<string, SpriteCoord>;
  jewelCoords: Record<string, SpriteCoord>;
}

const tree = treeRaw as unknown as TreeData;

/* ── Pre-process nodes (once) ── */

interface NodeExtra {
  csi?: number;
  asc?: string;
  ascStart?: boolean;
  notable?: boolean;
  blighted?: boolean;
  me?: string[]; // mastery effects (each string = one choosable option)
}

interface TreeNode {
  id: number;
  x: number;
  y: number;
  type: number;
  icon: string;
  name: string;
  stats: string;
  group: number;
  orbit: number;
  orbitIndex: number;
  extra: NodeExtra | null;
  out: number[];
}

const nodeMap = new Map<number, TreeNode>();
const allNodes: TreeNode[] = [];

// Ascendancy names to include: standard (7 classes + Scion) + alternate/bloodline (3.25+).
// Only filter out far-flung boss clusters (Farrul, Aul, Catarina, etc.) that expand bounds too much.
const STANDARD_ASC = new Set([
  // Standard
  "Ascendant", "Reliquarian",
  "Juggernaut", "Berserker", "Chieftain",
  "Deadeye", "Warden", "Pathfinder",
  "Elementalist", "Occultist", "Necromancer",
  "Gladiator", "Champion", "Slayer",
  "Guardian", "Hierophant", "Inquisitor",
  "Saboteur", "Assassin", "Trickster",
  "Raider", // Legacy
  // Alternate ascendancies (Wildwood + Bloodline system, 3.25)
  "Warlock", "Primalist", "Trialmaster",
]);

for (const raw of tree.nodes) {
  const extra = raw[10] as NodeExtra | null;
  // Skip non-standard ascendancy nodes (boss-themed clusters not shown in PoB)
  if (extra?.asc && !STANDARD_ASC.has(extra.asc)) continue;

  const n: TreeNode = {
    id: raw[0],
    x: raw[1],
    y: raw[2],
    type: raw[3],
    icon: raw[4],
    name: raw[5],
    stats: raw[6],
    group: raw[7],
    orbit: raw[8],
    orbitIndex: raw[9],
    extra,
    out: raw.length > 11 ? (raw[11] as number[]) : [],
  };
  nodeMap.set(n.id, n);
  allNodes.push(n);
}

// Identify "expansion" jewel sockets (medium/small cluster slots):
// These are type-4 nodes where ALL neighbours are also type-4.
// Main-tree jewel sockets (large cluster + regular) connect to non-type-4 nodes → always visible.
// Expansion sockets are hidden when not allocated.
const expansionJewels = new Set<number>();
{
  // Build reverse adjacency so we can check incoming edges too
  const inbound = new Map<number, number[]>();
  for (const n of allNodes) {
    for (const t of n.out) {
      let arr = inbound.get(t);
      if (!arr) { arr = []; inbound.set(t, arr); }
      arr.push(n.id);
    }
  }
  for (const n of allNodes) {
    if (n.type !== 4) continue;
    const neighbours = [...n.out, ...(inbound.get(n.id) || [])];
    const allJewel = neighbours.every(id => { const nb = nodeMap.get(id); return nb && nb.type === 4; });
    if (allJewel) expansionJewels.add(n.id);
  }
}

// Recalculate bounds from filtered nodes (excludes far-away extra asc clusters)
let boundsMinX = Infinity, boundsMinY = Infinity, boundsMaxX = -Infinity, boundsMaxY = -Infinity;
for (const n of allNodes) {
  if (n.x < boundsMinX) boundsMinX = n.x;
  if (n.y < boundsMinY) boundsMinY = n.y;
  if (n.x > boundsMaxX) boundsMaxX = n.x;
  if (n.y > boundsMaxY) boundsMaxY = n.y;
}
const treeWidth = boundsMaxX - boundsMinX;
const treeHeight = boundsMaxY - boundsMinY;

/* ── Draw sizes (in tree-space units) ── */

const SIZE: Record<number, number> = {
  0: 26, 1: 38, 2: 54, 3: 40, 4: 40, 5: 60, 6: 26,
};
const ASC_SIZE_NOTABLE = 36;
const ASC_SIZE_START = 50;

const CLASS_ART_KEYS = [
  "centerscion", "centermarauder", "centerranger",
  "centerwitch", "centerduelist", "centertemplar", "centershadow",
];

/* ── Component ── */

interface Props {
  allocatedNodes: Set<number>;
  jewelSocketMap?: Map<number, string>;
  height?: number;
}

export function PassiveTreeCanvas({ allocatedNodes, jewelSocketMap, height: fixedHeight }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spritesReady, setSpritesReady] = useState(false);
  const [size, setSize] = useState({ width: 720, height: fixedHeight ?? 520 });
  const stateRef = useRef({
    offsetX: 0, offsetY: 0, scale: 1,
    dragging: false, lastX: 0, lastY: 0, initialFit: false,
  });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setSize({ width: w, height: fixedHeight ?? Math.round(w * 0.72) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fixedHeight]);

  useEffect(() => {
    loadAllSheets().then(() => setSpritesReady(true));
  }, []);

  const [tooltip, setTooltip] = useState<{ node: TreeNode; x: number; y: number } | null>(null);

  function sh(key: SheetKey) { return getSheet(key); }

  /* ═══════════════════════════════════════════════════════════════
     DRAW — the main render pipeline
     ═══════════════════════════════════════════════════════════════ */

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx: CanvasRenderingContext2D = maybeCtx;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { offsetX, offsetY, scale } = stateRef.current;

    // ── Background ──
    ctx.fillStyle = "#080604";
    ctx.fillRect(0, 0, size.width, size.height);

    // Transform into tree space
    ctx.save();
    ctx.translate(size.width / 2 + offsetX, size.height / 2 + offsetY);
    ctx.scale(scale, scale);
    const cx = (boundsMinX + boundsMaxX) / 2;
    const cy = (boundsMinY + boundsMaxY) / 2;
    ctx.translate(-cx, -cy);

    const activeSheet = sh("active");
    const inactiveSheet = sh("inactive");
    const frameSheet = sh("frame");
    const masterySheet = sh("mastery");
    const masteryActiveSheet = sh("masteryActive");
    const groupBgSheet = sh("groupBackground");
    const startNodeSheet = sh("startNode");
    const ascSheet = sh("ascendancy");
    const bgSheet = sh("background");
    const jewelSheet = sh("jewel");
    const hasSprites = !!(activeSheet && inactiveSheet);

    // ═══ Layer 0: Background tile + center glow ═══
    // Tile the background sprite across the visible tree area
    if (bgSheet) {
      const bgCoord = tree.bgCoords["Background2"];
      if (bgCoord) {
        ctx.globalAlpha = 0.25;
        const tileSize = 154; // tree-space size per tile
        const startX = Math.floor(boundsMinX / tileSize) * tileSize;
        const startY = Math.floor(boundsMinY / tileSize) * tileSize;
        for (let tx = startX; tx < boundsMaxX; tx += tileSize) {
          for (let ty = startY; ty < boundsMaxY; ty += tileSize) {
            ctx.drawImage(bgSheet, bgCoord[0], bgCoord[1], bgCoord[2], bgCoord[3],
              tx, ty, tileSize, tileSize);
          }
        }
        ctx.globalAlpha = 1.0;
      }
    }

    // Center glow (warm amber, like PoB Scion area)
    const glowR = 4000;
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR);
    glow.addColorStop(0, "rgba(180,120,40,0.18)");
    glow.addColorStop(0.4, "rgba(140,90,20,0.08)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(-glowR, -glowR, glowR * 2, glowR * 2);

    // ═══ Layer 1: Group backgrounds ═══
    // Only draw backgrounds for groups that contain at least one visible node
    if (groupBgSheet) {
      const visibleGroups = new Set<number>();
      for (const n of allNodes) {
        // Skip hidden expansion jewel sockets (medium/small cluster slots)
        if (n.type === 4 && !allocatedNodes.has(n.id) && expansionJewels.has(n.id)) continue;
        visibleGroups.add(n.group);
      }

      ctx.globalAlpha = 0.40;
      for (const [gid, g] of Object.entries(tree.groups)) {
        if (!g.bg) continue;
        if (!visibleGroups.has(Number(gid))) continue;
        const coord = tree.groupBgCoords[g.bg];
        if (!coord) continue;
        const maxOrbit = g.orbits ? Math.max(...g.orbits) : 0;
        const orbitR = tree.orbits.radii[maxOrbit] || 82;
        const bgSz = orbitR * 2.6;

        if (g.half) {
          ctx.drawImage(groupBgSheet, coord[0], coord[1], coord[2], coord[3],
            g.x - bgSz, g.y - bgSz, bgSz * 2, bgSz);
          ctx.save();
          ctx.translate(g.x, g.y); ctx.scale(1, -1); ctx.translate(-g.x, -g.y);
          ctx.drawImage(groupBgSheet, coord[0], coord[1], coord[2], coord[3],
            g.x - bgSz, g.y - bgSz, bgSz * 2, bgSz);
          ctx.restore();
        } else {
          ctx.drawImage(groupBgSheet, coord[0], coord[1], coord[2], coord[3],
            g.x - bgSz, g.y - bgSz, bgSz * 2, bgSz * 2);
        }
      }
      ctx.globalAlpha = 1.0;
    }

    // ═══ Layer 2: Connections ═══
    // All lineWidths use screen-space: X / scale (clamped to avoid extreme values)
    ctx.lineCap = "round";
    const drawnEdges = new Set<string>();

    function drawEdge(n: TreeNode, t: TreeNode) {
      const isArc = n.group === t.group && n.orbit === t.orbit && n.orbit > 0;
      if (isArc) {
        const g = tree.groups[n.group];
        if (!g) return;
        const orbitR = tree.orbits.radii[n.orbit] || 82;
        const total = tree.orbits.skills[n.orbit] || 1;
        const a1 = (2 * Math.PI * n.orbitIndex) / total - Math.PI / 2;
        const a2 = (2 * Math.PI * t.orbitIndex) / total - Math.PI / 2;
        // Always take the shortest arc: normalize diff to [-PI, PI]
        let diff = a2 - a1;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        // diff>0 → clockwise short arc; diff<0 → counterclockwise short arc
        ctx.beginPath();
        ctx.arc(g.x, g.y, orbitR, a1, a1 + diff, diff < 0);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(t.x, t.y);
        ctx.stroke();
      }
    }

    // Skip cross-zone connections (ascendancy ↔ main tree = long ugly lines).
    // Use extra?.asc (not type===6) because asc notables get type=1, asc keystones get type=2.
    function shouldDrawEdge(a: TreeNode, b: TreeNode): boolean {
      const aIsAsc = !!(a.extra?.asc);
      const bIsAsc = !!(b.extra?.asc);
      if (aIsAsc !== bIsAsc) return false;
      if (aIsAsc && bIsAsc && a.extra!.asc !== b.extra!.asc) return false; // different ascendancies
      return true;
    }

    // Helper: iterate allocated edges
    function forEachAllocatedEdge(fn: (a: TreeNode, b: TreeNode) => void) {
      drawnEdges.clear();
      for (const node of allNodes) {
        if (node.type === 3) continue;
        if (!allocatedNodes.has(node.id)) continue;
        for (const outId of node.out) {
          if (!allocatedNodes.has(outId)) continue;
          const t = nodeMap.get(outId);
          if (!t || !shouldDrawEdge(node, t)) continue;
          const key = Math.min(node.id, outId) + "," + Math.max(node.id, outId);
          if (drawnEdges.has(key)) continue;
          drawnEdges.add(key);
          fn(node, t);
        }
      }
    }

    // Pass 1: Unallocated connections — tree-space width (scales with zoom, like PoE game)
    // Hide connections to/from hidden expansion jewel sockets
    ctx.strokeStyle = "rgba(90,78,58,0.55)";
    ctx.lineWidth = 20; // 20 tree units, same as pobb.in/GGG
    for (const node of allNodes) {
      if (node.type === 3) continue;
      if (node.type === 4 && !allocatedNodes.has(node.id) && expansionJewels.has(node.id)) continue;
      for (const outId of node.out) {
        const t = nodeMap.get(outId);
        if (!t) continue;
        if (t.type === 4 && !allocatedNodes.has(outId) && expansionJewels.has(outId)) continue;
        if (!shouldDrawEdge(node, t)) continue;
        const key = Math.min(node.id, outId) + "," + Math.max(node.id, outId);
        if (drawnEdges.has(key)) continue;
        drawnEdges.add(key);
        if (allocatedNodes.has(node.id) && allocatedNodes.has(outId)) continue;
        drawEdge(node, t);
      }
    }

    // Pass 2: Allocated connections — screen-space golden pipe (constant px regardless of zoom)
    if (allocatedNodes.size > 0) {
      // Layer 1: Soft glow
      ctx.strokeStyle = "rgba(160,120,30,0.15)";
      ctx.lineWidth = 12 / scale;
      forEachAllocatedEdge(drawEdge);

      // Layer 2: Dark gold border (outer edge of the "pipe")
      ctx.strokeStyle = "#6b5218";
      ctx.lineWidth = 7 / scale;
      forEachAllocatedEdge(drawEdge);

      // Layer 3: Main gold body
      ctx.strokeStyle = "#c8952c";
      ctx.lineWidth = 5 / scale;
      forEachAllocatedEdge(drawEdge);

      // Layer 4: Bright center highlight
      ctx.strokeStyle = "#f0c860";
      ctx.lineWidth = 2 / scale;
      forEachAllocatedEdge(drawEdge);
    }

    // ═══ Layer 3: Nodes ═══
    // Unallocated first, allocated on top
    const sortedNodes = [...allNodes].sort((a, b) => {
      const aa = allocatedNodes.has(a.id) ? 1 : 0;
      const ba = allocatedNodes.has(b.id) ? 1 : 0;
      return aa - ba;
    });

    for (const node of sortedNodes) {
      const isAlloc = allocatedNodes.has(node.id);

      // Hide expansion jewel sockets (medium/small cluster slots) when not allocated
      if (node.type === 4 && !isAlloc && expansionJewels.has(node.id)) continue;

      // Dim unallocated nodes when build has allocated nodes
      if (!isAlloc && allocatedNodes.size > 0) {
        ctx.globalAlpha = 0.65;
      } else {
        ctx.globalAlpha = 1.0;
      }

      if (node.type === 5 && startNodeSheet) {
        drawClassStartNode(ctx, node, isAlloc, startNodeSheet);
        ctx.globalAlpha = 1.0;
        continue;
      }

      // Route ALL ascendancy nodes (type 6, but also asc notables=type1, asc keystones=type2)
      if (node.type === 6 || node.extra?.asc) {
        const sz = node.extra?.notable ? ASC_SIZE_NOTABLE
          : node.extra?.ascStart ? ASC_SIZE_START
          : node.type === 2 ? ASC_SIZE_NOTABLE // asc keystone
          : SIZE[6];
        if (hasSprites && node.icon) {
          const drawn = drawSpriteNode(ctx, node, isAlloc, sz,
            activeSheet!, inactiveSheet!, frameSheet, masterySheet, masteryActiveSheet, ascSheet);
          if (drawn) { ctx.globalAlpha = 1.0; continue; }
        }
        drawShapeNode(ctx, node, isAlloc, sz, scale);
        ctx.globalAlpha = 1.0;
        continue;
      }

      const sz = SIZE[node.type] ?? 26;
      if (hasSprites && node.icon) {
        const drawn = drawSpriteNode(ctx, node, isAlloc, sz,
          activeSheet!, inactiveSheet!, frameSheet, masterySheet, masteryActiveSheet, ascSheet);
        if (drawn) { ctx.globalAlpha = 1.0; continue; }
      }
      drawShapeNode(ctx, node, isAlloc, sz, scale);
      ctx.globalAlpha = 1.0;
    }

    // ═══ Layer 4: Jewel socket indicators ═══
    // Draw jewel frame sprites on socketed jewel nodes
    if (jewelSocketMap && jewelSocketMap.size > 0) {
      ctx.globalAlpha = 1.0;
      for (const [nodeId, jewelName] of jewelSocketMap) {
        const node = nodeMap.get(nodeId);
        if (!node) continue;

        // Determine jewel type for sprite selection
        const isCrimson = /crimson|str/i.test(jewelName);
        const isViridian = /viridian|dex/i.test(jewelName);
        const isCobalt = /cobalt|int/i.test(jewelName);
        const isTimeless = /timeless|legion|brutal|elegant|militant|glorious/i.test(jewelName);
        const isAbyss = /abyss|stygian|ghastly|murderous|searching/i.test(jewelName);

        const spriteKey = isCrimson ? "JewelSocketActiveRed"
          : isViridian ? "JewelSocketActiveGreen"
          : isCobalt ? "JewelSocketActiveBlue"
          : isTimeless ? "JewelSocketActiveLegion"
          : isAbyss ? "JewelSocketActiveAbyss"
          : "JewelSocketActivePrismatic";

        const jc = tree.jewelCoords?.[spriteKey];
        if (jewelSheet && jc) {
          const sz = 38;
          ctx.drawImage(jewelSheet, jc[0], jc[1], jc[2], jc[3],
            node.x - sz, node.y - sz, sz * 2, sz * 2);
        } else {
          // Fallback: colored circle if sprite not available
          const fillColor = isCrimson ? "rgba(200,50,50,0.85)"
            : isViridian ? "rgba(50,180,80,0.85)"
            : isCobalt ? "rgba(60,120,220,0.85)"
            : "rgba(200,160,60,0.85)";
          ctx.strokeStyle = "#c8952c";
          ctx.lineWidth = 3 / scale;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 22, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = fillColor;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 16, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }, [allocatedNodes, jewelSocketMap, size.width, size.height, spritesReady]);

  /* ── Sprite drawing ── */

  function drawSpriteNode(
    ctx: CanvasRenderingContext2D, node: TreeNode, isAlloc: boolean, sz: number,
    activeSheet: HTMLImageElement, inactiveSheet: HTMLImageElement,
    frameSheet: HTMLImageElement | null, masterySheet: HTMLImageElement | null,
    _masteryActiveSheet: HTMLImageElement | null, ascSheet: HTMLImageElement | null,
  ): boolean {
    // Mastery nodes — always use mastery sheet + iconInactive coords
    // (masteryActive sheet has different coord layout, so we draw from mastery sheet
    //  and add a golden glow for allocated state)
    if (node.type === 3) {
      const coord = tree.iconInactive[node.icon];
      if (masterySheet && coord) {
        if (isAlloc) {
          // Golden glow behind allocated mastery
          ctx.fillStyle = "rgba(212,160,74,0.25)";
          ctx.beginPath();
          ctx.arc(node.x, node.y, sz * 1.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(212,160,74,0.7)";
          ctx.lineWidth = Math.min(2 / stateRef.current.scale, 6);
          ctx.beginPath();
          ctx.arc(node.x, node.y, sz * 1.1, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x, node.y, sz * 0.92, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(masterySheet, coord[0], coord[1], coord[2], coord[3],
          node.x - sz, node.y - sz, sz * 2, sz * 2);
        ctx.restore();
        return true;
      }
      return false;
    }

    // Ascendancy nodes (type 6 + notable/keystone with extra.asc)
    if ((node.type === 6 || node.extra?.asc) && ascSheet) {
      return drawAscendancyNode(ctx, node, isAlloc, sz, activeSheet, inactiveSheet, ascSheet);
    }

    // Regular nodes
    const coordMap = isAlloc ? tree.iconActive : tree.iconInactive;
    const coord = coordMap[node.icon];
    if (!coord) return false;
    const iconSheet = isAlloc ? activeSheet : inactiveSheet;

    // Allocated glow ring behind everything
    if (isAlloc) {
      ctx.fillStyle = "rgba(212,160,74,0.12)";
      ctx.beginPath();
      ctx.arc(node.x, node.y, sz * 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(212,160,74,0.55)";
      ctx.lineWidth = Math.min(1.5 / stateRef.current.scale, 4);
      ctx.beginPath();
      ctx.arc(node.x, node.y, sz * 1.15, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Frame
    if (frameSheet) {
      const frameKey = getFrameKey(node.type, isAlloc, node.extra?.blighted);
      if (frameKey) {
        const fc = tree.frameCoords[frameKey];
        if (fc) {
          const frameSz = node.type === 0 ? sz * 1.3 : sz * 1.45;
          ctx.drawImage(frameSheet, fc[0], fc[1], fc[2], fc[3],
            node.x - frameSz, node.y - frameSz, frameSz * 2, frameSz * 2);
        }
      }
    }

    // Icon clipped to circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(node.x, node.y, sz * 0.92, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(iconSheet, coord[0], coord[1], coord[2], coord[3],
      node.x - sz, node.y - sz, sz * 2, sz * 2);
    ctx.restore();

    return true;
  }

  /* ── Ascendancy node ── */

  function drawAscendancyNode(
    ctx: CanvasRenderingContext2D, node: TreeNode, isAlloc: boolean, sz: number,
    activeSheet: HTMLImageElement, inactiveSheet: HTMLImageElement,
    ascSheet: HTMLImageElement,
  ): boolean {
    const coordMap = isAlloc ? tree.iconActive : tree.iconInactive;
    const coord = coordMap[node.icon];
    const iconSheet = isAlloc ? activeSheet : inactiveSheet;

    if (node.extra?.ascStart && node.extra.asc) {
      const artKey = tree.ascArt[node.extra.asc];
      if (artKey) {
        const artCoord = tree.ascCoords[artKey];
        if (artCoord) {
          const portraitSz = sz * 2.5;
          ctx.save();
          ctx.globalAlpha = isAlloc ? 0.9 : 0.65;
          ctx.beginPath();
          ctx.arc(node.x, node.y, portraitSz * 0.9, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(ascSheet, artCoord[0], artCoord[1], artCoord[2], artCoord[3],
            node.x - portraitSz, node.y - portraitSz, portraitSz * 2, portraitSz * 2);
          ctx.restore();
        }
      }
      const midCoord = tree.ascCoords["AscendancyMiddle"];
      if (midCoord) {
        const midSz = sz * 0.6;
        ctx.drawImage(ascSheet, midCoord[0], midCoord[1], midCoord[2], midCoord[3],
          node.x - midSz, node.y - midSz, midSz * 2, midSz * 2);
      }
      return true;
    }

    // Asc notables (extra.notable) and asc keystones (type 2) use the large frame
    const isNotable = node.extra?.notable || node.type === 2 || node.type === 1;
    const framePrefix = isNotable ? "AscendancyFrameLarge" : "AscendancyFrameSmall";
    const frameSuffix = isAlloc ? "Allocated" : "Normal";
    const fc = tree.ascCoords[framePrefix + frameSuffix];
    if (fc) {
      const frameSz = isNotable ? sz * 1.5 : sz * 1.3;
      ctx.drawImage(ascSheet, fc[0], fc[1], fc[2], fc[3],
        node.x - frameSz, node.y - frameSz, frameSz * 2, frameSz * 2);
    }

    if (coord && iconSheet) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, sz * 0.85, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(iconSheet, coord[0], coord[1], coord[2], coord[3],
        node.x - sz, node.y - sz, sz * 2, sz * 2);
      ctx.restore();
      return true;
    }
    return false;
  }

  /* ── Class start ── */

  function drawClassStartNode(
    ctx: CanvasRenderingContext2D, node: TreeNode, isAlloc: boolean,
    startNodeSheet: HTMLImageElement,
  ) {
    const csi = node.extra?.csi;
    if (csi == null) return;

    const artKey = CLASS_ART_KEYS[csi];
    const artCoord = artKey ? tree.startNodeCoords[artKey] : null;

    if (!isAlloc) {
      const bgCoord = tree.startNodeCoords["PSStartNodeBackgroundInactive"];
      if (bgCoord) {
        const bgSz = 110;
        ctx.drawImage(startNodeSheet, bgCoord[0], bgCoord[1], bgCoord[2], bgCoord[3],
          node.x - bgSz, node.y - bgSz, bgSz * 2, bgSz * 2);
      }
    }

    if (artCoord) {
      const artSz = 130;
      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, artSz * 0.85, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(startNodeSheet, artCoord[0], artCoord[1], artCoord[2], artCoord[3],
        node.x - artSz, node.y - artSz * 0.92,
        artSz * 2, artSz * 2 * (artCoord[3] / artCoord[2]));
      ctx.restore();
    }
  }

  function getFrameKey(type: number, isAlloc: boolean, blighted?: boolean): string | null {
    if (blighted) return isAlloc ? "BlightedNotableFrameAllocated" : "BlightedNotableFrameUnallocated";
    switch (type) {
      case 1: return isAlloc ? "NotableFrameAllocated" : "NotableFrameUnallocated";
      case 2: return isAlloc ? "KeystoneFrameAllocated" : "KeystoneFrameUnallocated";
      case 4: return isAlloc ? "JewelFrameAllocated" : "JewelFrameUnallocated";
      default: return isAlloc ? "PSSkillFrameActive" : "PSSkillFrame";
    }
  }

  /* ── Shape fallback ── */

  function drawShapeNode(ctx: CanvasRenderingContext2D, node: TreeNode, isAlloc: boolean, sz: number, scale: number) {
    const r = sz * (1 / Math.max(scale, 0.3));
    const dr = r * scale < 2 ? 2 / scale : r;

    if (node.type === 3) {
      ctx.fillStyle = isAlloc ? "rgba(212,160,74,0.5)" : "rgba(90,80,70,0.2)";
      ctx.beginPath();
      const mr = dr * 0.8;
      ctx.moveTo(node.x, node.y - mr); ctx.lineTo(node.x + mr, node.y);
      ctx.lineTo(node.x, node.y + mr); ctx.lineTo(node.x - mr, node.y);
      ctx.closePath(); ctx.fill();
      return;
    }
    if (node.type === 2) {
      ctx.fillStyle = isAlloc ? "#ffd700" : "rgba(140,130,115,0.55)";
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8 - Math.PI / 8;
        const px = node.x + dr * Math.cos(a), py = node.y + dr * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      if (isAlloc) { ctx.strokeStyle = "#ffd700"; ctx.lineWidth = 3 / scale; ctx.stroke(); }
      return;
    }
    if (node.type === 1) {
      ctx.fillStyle = isAlloc ? "#e8c36a" : "rgba(140,130,115,0.45)";
      ctx.beginPath(); ctx.arc(node.x, node.y, dr, 0, Math.PI * 2); ctx.fill();
      if (isAlloc) { ctx.strokeStyle = "#f2a95b"; ctx.lineWidth = 2.5 / scale; ctx.stroke(); }
      return;
    }
    if (node.type === 4) {
      ctx.fillStyle = isAlloc ? "#f2a95b" : "rgba(140,130,115,0.30)";
      const half = dr * 0.7;
      ctx.fillRect(node.x - half, node.y - half, half * 2, half * 2);
      return;
    }
    if (node.type === 5) {
      ctx.strokeStyle = isAlloc ? "#f2a95b" : "rgba(180,170,150,0.5)";
      ctx.lineWidth = 3 / scale;
      ctx.beginPath(); ctx.arc(node.x, node.y, dr, 0, Math.PI * 2); ctx.stroke();
      return;
    }
    if (node.type === 6) {
      ctx.fillStyle = isAlloc ? "#f2a95b" : "rgba(120,110,100,0.35)";
      ctx.beginPath(); ctx.arc(node.x, node.y, dr * 0.6, 0, Math.PI * 2); ctx.fill();
      if (isAlloc) { ctx.strokeStyle = "#f2a95b"; ctx.lineWidth = 2 / scale; ctx.stroke(); }
      return;
    }
    ctx.fillStyle = isAlloc ? "#f2a95b" : "rgba(140,130,115,0.30)";
    ctx.beginPath(); ctx.arc(node.x, node.y, dr * 0.5, 0, Math.PI * 2); ctx.fill();
  }

  /* ── Fit / Interaction ── */

  useEffect(() => {
    if (stateRef.current.initialFit) return;
    stateRef.current.initialFit = true;
    fitTree(); draw();
  }, [size.width, size.height, draw]);

  useEffect(() => { draw(); }, [draw]);

  function fitTree() {
    const pad = 100;
    const sx = size.width / (treeWidth + pad);
    const sy = size.height / (treeHeight + pad);
    stateRef.current.scale = Math.min(sx, sy, 0.06);
    stateRef.current.offsetX = 0;
    stateRef.current.offsetY = 0;
  }

  const wheelRef = useRef(draw);
  wheelRef.current = draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault(); e.stopPropagation();
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const s = stateRef.current;
      const ns = Math.min(Math.max(s.scale * factor, 0.005), 0.5);
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left - size.width / 2;
      const my = e.clientY - rect.top - size.height / 2;
      const ratio = 1 - ns / s.scale;
      s.offsetX += (mx - s.offsetX) * ratio;
      s.offsetY += (my - s.offsetY) * ratio;
      s.scale = ns;
      wheelRef.current();
    };
    canvas.addEventListener("wheel", handler, { passive: false });
    return () => canvas.removeEventListener("wheel", handler);
  }, [size.width, size.height]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    stateRef.current.dragging = true;
    stateRef.current.lastX = e.clientX;
    stateRef.current.lastY = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  function screenToTree(sx: number, sy: number): [number, number] {
    const s = stateRef.current;
    const tx = (sx - size.width / 2 - s.offsetX) / s.scale + (boundsMinX + boundsMaxX) / 2;
    const ty = (sy - size.height / 2 - s.offsetY) / s.scale + (boundsMinY + boundsMaxY) / 2;
    return [tx, ty];
  }

  function hitTest(sx: number, sy: number): TreeNode | null {
    const [tx, ty] = screenToTree(sx, sy);
    const hr = 50 / stateRef.current.scale;
    const maxR2 = hr * hr;
    let best: TreeNode | null = null, bestD2 = maxR2;
    for (const n of allNodes) {
      const d2 = (n.x - tx) ** 2 + (n.y - ty) ** 2;
      if (d2 < bestD2) { bestD2 = d2; best = n; }
    }
    return best;
  }

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const s = stateRef.current;
    if (s.dragging) {
      s.offsetX += e.clientX - s.lastX; s.offsetY += e.clientY - s.lastY;
      s.lastX = e.clientX; s.lastY = e.clientY;
      setTooltip(null); draw(); return;
    }
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const lx = e.clientX - rect.left, ly = e.clientY - rect.top;
    const hit = hitTest(lx, ly);
    if (hit && hit.name) setTooltip({ node: hit, x: lx, y: ly });
    else setTooltip(null);
  }, [draw, size.width, size.height]);

  const onPointerUp = useCallback(() => { stateRef.current.dragging = false; }, []);
  const onPointerLeave = useCallback(() => { setTooltip(null); }, []);
  const recenter = useCallback(() => { fitTree(); draw(); }, [size.width, size.height, draw]);

  return (
    <div className="tree-canvas-wrap" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className="tree-canvas"
        style={{ width: size.width, height: size.height }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerLeave}
      />
      <div className="tree-canvas-controls">
        <button type="button" className="tree-ctrl-btn" onClick={() => { stateRef.current.scale = Math.min(stateRef.current.scale * 1.3, 0.5); draw(); }}>+</button>
        <button type="button" className="tree-ctrl-btn" onClick={() => { stateRef.current.scale = Math.max(stateRef.current.scale / 1.3, 0.005); draw(); }}>−</button>
        <button type="button" className="tree-ctrl-btn" onClick={recenter}>⌂</button>
      </div>
      {!spritesReady && <div className="tree-loading">Loading tree assets…</div>}
      {tooltip && (
        <div className="tree-tooltip" style={{
          left: Math.min(tooltip.x + 12, size.width - 220),
          top: tooltip.y > size.height - 120 ? tooltip.y - 80 : tooltip.y + 16,
        }}>
          <strong className="tree-tooltip-name">{tooltip.node.name}</strong>
          {tooltip.node.stats && (
            <div className="tree-tooltip-stats">
              {tooltip.node.stats.split("\n").map((line, i) => <span key={i}>{line}</span>)}
            </div>
          )}
          {tooltip.node.extra?.me && tooltip.node.extra.me.length > 0 && (
            <div className="tree-tooltip-mastery">
              {tooltip.node.extra.me.map((eff, i) => (
                <span key={i} className="tree-tooltip-mastery-opt">{eff}</span>
              ))}
            </div>
          )}
          {jewelSocketMap?.has(tooltip.node.id) && (
            <span className="tree-tooltip-jewel">{jewelSocketMap.get(tooltip.node.id)}</span>
          )}
          {allocatedNodes.has(tooltip.node.id) && (
            <span className="tree-tooltip-alloc">Allocated</span>
          )}
        </div>
      )}
    </div>
  );
}

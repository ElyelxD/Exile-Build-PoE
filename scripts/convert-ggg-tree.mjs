#!/usr/bin/env node
/**
 * Converts the official GGG passive skill tree data (data.json) into the
 * compact format consumed by PassiveTreeCanvas.
 *
 * Usage:
 *   node scripts/convert-ggg-tree.mjs [--fetch]
 *
 *   --fetch   Download latest data.json from GGG GitHub before converting
 *
 * Reads:  /tmp/ggg-tree.json  (or fetches from GitHub with --fetch)
 * Writes: src/data/tree-default.json
 */

import { writeFileSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "../src/data/tree-default.json");
const GGG_URL = "https://raw.githubusercontent.com/grindinggear/skilltree-export/master/data.json";
const ZOOM = "0.3835"; // Corresponds to "-3" sprite sheet suffix

async function main() {
  const doFetch = process.argv.includes("--fetch");
  let raw;

  if (doFetch) {
    console.log("Fetching latest tree data from GGG...");
    const res = await fetch(GGG_URL);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    raw = await res.text();
    writeFileSync("/tmp/ggg-tree.json", raw);
    console.log("Saved to /tmp/ggg-tree.json");
  } else {
    raw = readFileSync("/tmp/ggg-tree.json", "utf-8");
  }

  const ggg = JSON.parse(raw);
  console.log(`GGG tree version: "${ggg.tree}"`);
  console.log(`Nodes: ${Object.keys(ggg.nodes).length}, Groups: ${Object.keys(ggg.groups).length}`);

  const orbitRadii = ggg.constants.orbitRadii;
  const skillsPerOrbit = ggg.constants.skillsPerOrbit;

  // ── Build group map ──
  const groups = {};
  for (const [gid, g] of Object.entries(ggg.groups)) {
    const entry = { x: Math.round(g.x * 100) / 100, y: Math.round(g.y * 100) / 100 };
    if (g.orbits) entry.orbits = g.orbits;
    if (g.background) {
      entry.bg = g.background.image;
      if (g.background.isHalfImage) entry.half = true;
    }
    groups[gid] = entry;
  }

  // ── Build class start index map ──
  const classStartMap = new Map(); // nodeId → classIndex
  for (const cls of ggg.classes) {
    const idx = ggg.constants.classes[
      Object.keys(ggg.constants.classes).find(
        (k) => ggg.constants.classes[k] === ggg.classes.indexOf(cls)
      )
    ];
    // Find the start node for this class
    for (const [nid, node] of Object.entries(ggg.nodes)) {
      if (node.classStartIndex === ggg.classes.indexOf(cls)) {
        classStartMap.set(nid, ggg.classes.indexOf(cls));
      }
    }
  }

  // ── Ascendancy tracking ──
  const ascendancies = {}; // ascName → [nodeIds]
  const ascArt = {};       // ascName → artKey

  // Build ascendancy art mapping from classes
  for (const cls of ggg.classes) {
    for (const asc of cls.ascendancies || []) {
      ascArt[asc.id] = `Classes${asc.id}`;
    }
  }
  // Also from alternate_ascendancies
  if (ggg.alternate_ascendancies) {
    for (const asc of ggg.alternate_ascendancies) {
      ascArt[asc.id] = `Classes${asc.id}`;
    }
  }

  // ── Convert nodes ──
  const nodes = [];
  for (const [nid, node] of Object.entries(ggg.nodes)) {
    if (nid === "root") continue;

    const id = node.skill ?? parseInt(nid);
    const group = node.group;
    const orbit = node.orbit ?? 0;
    const orbitIndex = node.orbitIndex ?? 0;
    const g = ggg.groups[String(group)];

    if (!g) continue;

    // Compute position from group + orbit
    const radius = orbitRadii[orbit] ?? 0;
    const total = skillsPerOrbit[orbit] ?? 1;
    const angle = (2 * Math.PI * orbitIndex) / total - Math.PI / 2;
    const x = Math.round((g.x + radius * Math.cos(angle)) * 100) / 100;
    const y = Math.round((g.y + radius * Math.sin(angle)) * 100) / 100;

    // Determine type
    let type = 0; // normal
    if (node.isKeystone) type = 2;
    else if (node.isNotable) type = 1;
    else if (node.isMastery) type = 3;
    else if (node.isJewelSocket) type = 4;
    else if (node.classStartIndex != null) type = 5;
    else if (node.ascendancyName && !node.isNotable && !node.isKeystone) type = 6;

    const icon = node.icon || "";
    const name = (node.name || "").trim();
    const stats = (node.stats || []).join("\n");

    // Build extra
    const extra = {};
    if (node.classStartIndex != null) extra.csi = node.classStartIndex;
    if (node.ascendancyName) {
      extra.asc = node.ascendancyName;
      // Track ascendancy nodes
      if (!ascendancies[node.ascendancyName]) ascendancies[node.ascendancyName] = [];
      ascendancies[node.ascendancyName].push(id);
    }
    if (node.isAscendancyStart) extra.ascStart = true;
    if (node.isNotable && node.ascendancyName) extra.notable = true;
    if (node.isBlighted) extra.blighted = true;
    if (node.isProxy) extra.proxy = true;
    if (node.expansionJewel) {
      extra.ej = { s: node.expansionJewel.size };
      if (node.expansionJewel.index != null) extra.ej.i = node.expansionJewel.index;
      if (node.expansionJewel.parent) {
        const parentNode = ggg.nodes[node.expansionJewel.parent];
        extra.ej.p = parentNode?.skill ?? parseInt(node.expansionJewel.parent);
      }
      if (node.expansionJewel.proxy) {
        const proxyNode = ggg.nodes[node.expansionJewel.proxy];
        extra.ej.pr = proxyNode?.skill ?? parseInt(node.expansionJewel.proxy);
      }
    }
    if (node.masteryEffects && node.masteryEffects.length > 0) {
      extra.me = node.masteryEffects.map((eff) => [
        eff.effect,                       // numeric effect ID (encoded in tree URL)
        (eff.stats || []).join(", "),      // display text
      ]);
    }

    // Connections (outgoing only)
    const out = (node.out || []).map((id) => {
      const target = ggg.nodes[id];
      return target?.skill ?? parseInt(id);
    }).filter((id) => id > 0);

    const entry = [id, x, y, type, icon, name, stats, group, orbit, orbitIndex,
      Object.keys(extra).length > 0 ? extra : null];
    if (out.length > 0) entry.push(out);

    nodes.push(entry);
  }

  console.log(`Converted ${nodes.length} nodes`);

  // ── Sprite coordinates (zoom 0.3835 → "-3" suffix) ──
  function extractCoords(spriteData) {
    const zoomData = spriteData?.[ZOOM];
    if (!zoomData?.coords) return {};
    const result = {};
    for (const [key, val] of Object.entries(zoomData.coords)) {
      result[key] = [val.x, val.y, val.w, val.h];
    }
    return result;
  }

  function extractUrl(spriteData) {
    return spriteData?.[ZOOM]?.filename || "";
  }

  // Merge normal + notable + keystone icons into one map.
  // Mastery icons go into iconInactive ONLY from the `mastery` sprite sheet
  // (coords must match the sheet the canvas uses — mixing sheets causes wrong draws).
  const iconActive = {
    ...extractCoords(ggg.sprites.normalActive),
    ...extractCoords(ggg.sprites.notableActive),
    ...extractCoords(ggg.sprites.keystoneActive),
  };

  const iconInactive = {
    ...extractCoords(ggg.sprites.normalInactive),
    ...extractCoords(ggg.sprites.notableInactive),
    ...extractCoords(ggg.sprites.keystoneInactive),
    ...extractCoords(ggg.sprites.mastery), // mastery-3.png coords (matches masterySheet)
  };

  // Frame coords
  const frameCoords = extractCoords(ggg.sprites.frame);

  // Group background coords
  const groupBgCoords = extractCoords(ggg.sprites.groupBackground);

  // Start node coords (shares sheet with groupBackground)
  const startNodeCoords = extractCoords(ggg.sprites.startNode);

  // Line coords
  const lineCoords = extractCoords(ggg.sprites.line);

  // Ascendancy coords — merge standard + all bloodline sheets
  const ascCoords = { ...extractCoords(ggg.sprites.ascendancy) };
  for (const key of Object.keys(ggg.sprites)) {
    if (key.endsWith("Bloodline")) {
      Object.assign(ascCoords, extractCoords(ggg.sprites[key]));
    }
  }

  // Background
  const bgCoords = extractCoords(ggg.sprites.background);

  // Jewel sheet coords
  const jewelCoords = extractCoords(ggg.sprites.jewel);

  // Sheet URLs
  const sheets = {
    active: extractUrl(ggg.sprites.normalActive),
    inactive: extractUrl(ggg.sprites.normalInactive),
    mastery: extractUrl(ggg.sprites.mastery),
    masteryActive: extractUrl(ggg.sprites.masteryActiveSelected),
    masteryInactive: extractUrl(ggg.sprites.masteryInactive || ggg.sprites.masteryConnected),
    frame: extractUrl(ggg.sprites.frame),
    jewel: extractUrl(ggg.sprites.jewel),
    groupBackground: extractUrl(ggg.sprites.groupBackground),
    startNode: extractUrl(ggg.sprites.startNode),
    line: extractUrl(ggg.sprites.line),
    ascendancy: extractUrl(ggg.sprites.ascendancy),
    bloodline: extractUrl(ggg.sprites.ascendancyBloodline || Object.entries(ggg.sprites).find(([k]) => k.endsWith("Bloodline"))?.[1]),
    background: extractUrl(ggg.sprites.background),
  };

  // ── Assemble output ──
  const output = {
    bounds: [ggg.min_x, ggg.min_y, ggg.max_x, ggg.max_y],
    nodes,
    groups,
    ascendancies,
    ascArt,
    orbits: { radii: orbitRadii, skills: skillsPerOrbit },
    sheets,
    iconActive,
    iconInactive,
    frameCoords,
    groupBgCoords,
    startNodeCoords,
    lineCoords,
    ascCoords,
    bgCoords,
    jewelCoords,
  };

  const json = JSON.stringify(output);
  writeFileSync(OUT_PATH, json);
  console.log(`Written ${(json.length / 1024).toFixed(0)} KB to ${OUT_PATH}`);

  // Verify
  const parsed = JSON.parse(json);
  console.log(`Verification: ${parsed.nodes.length} nodes, ${Object.keys(parsed.groups).length} groups`);
  console.log(`Sheets: ${Object.keys(parsed.sheets).join(", ")}`);
  console.log(`Icon coords: ${Object.keys(parsed.iconActive).length} active, ${Object.keys(parsed.iconInactive).length} inactive`);
  console.log("Done!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

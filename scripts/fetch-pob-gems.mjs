#!/usr/bin/env node
/**
 * Fetches gem data from the Path of Building Community repository and writes a
 * compact lookup to src/data/gems.json.
 *
 * The point of this file is *link legality*. Path of Building's skill data
 * carries, for every active skill, the `skillTypes` it has, and for every support
 * gem the `requireSkillTypes` it needs and the `excludeSkillTypes` it refuses.
 * That is the game's own rule for whether a support can go in the same links as a
 * skill, so challenge mode can suggest a gem setup that actually works in game
 * instead of one that merely looks plausible.
 *
 * Usage:  node scripts/fetch-pob-gems.mjs
 *
 * Gem data (c) Grinding Gear Games.
 */

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "../src/data/gems.json");
const BASE_URL =
  "https://raw.githubusercontent.com/PathOfBuildingCommunity/PathOfBuilding/master/src/Data/Skills";

const ACTIVE_FILES = ["act_str", "act_dex", "act_int"];
const SUPPORT_FILES = ["sup_str", "sup_dex", "sup_int"];

/** PoB colour ids. Gems with no attribute requirement are white. */
const COLOR_BY_ID = { 1: "red", 2: "green", 3: "blue", 4: "white" };

/**
 * Every `skills["Id"] = {` block, cut at the next one. Only the head of a block
 * is of interest — everything this script reads sits before `statMap`, which is
 * where the deeply nested data starts.
 */
function splitBlocks(lua) {
  const blocks = [];
  const pattern = /skills\["([^"]+)"\]\s*=\s*\{/g;
  let match;

  while ((match = pattern.exec(lua)) !== null) {
    const next = lua.indexOf('skills["', match.index + 1);
    const body = lua.slice(match.index, next === -1 ? undefined : next);
    const head = body.split("statMap")[0];
    blocks.push({ id: match[1], body, head });
  }

  return blocks;
}

function readString(head, key) {
  const match = head.match(new RegExp(`\\b${key}\\s*=\\s*"((?:[^"\\\\]|\\\\.)*)"`));
  return match ? match[1] : "";
}

function readNumber(head, key) {
  const match = head.match(new RegExp(`\\b${key}\\s*=\\s*(\\d+)`));
  return match ? Number(match[1]) : 0;
}

/** `skillTypes = { [SkillType.Projectile] = true, ... }` → ["Projectile", ...] */
function readSkillTypeSet(head, key) {
  const match = head.match(new RegExp(`\\b${key}\\s*=\\s*\\{([^}]*)\\}`));
  if (!match) return [];

  return [...match[1].matchAll(/SkillType\.(\w+)/g)].map((entry) => entry[1]);
}

async function fetchLua(file) {
  const response = await fetch(`${BASE_URL}/${file}.lua`);

  if (!response.ok) {
    throw new Error(`Fetch failed for ${file}: ${response.status}`);
  }

  return response.text();
}

async function main() {
  const actives = {};
  const supports = [];

  for (const file of ACTIVE_FILES) {
    const lua = await fetchLua(file);
    let count = 0;

    for (const block of splitBlocks(lua)) {
      const name = readString(block.head, "name");
      const types = readSkillTypeSet(block.head, "skillTypes");

      // Blocks with no skill types are granted effects (item procs, minion
      // skills), not gems a player can socket.
      if (!name || types.length === 0 || actives[name]) continue;

      actives[name] = { types, color: COLOR_BY_ID[readNumber(block.head, "color")] ?? "white" };
      count++;
    }

    console.log(`  ${file}  ${String(count).padStart(4)} active skills`);
  }

  for (const file of SUPPORT_FILES) {
    const lua = await fetchLua(file);
    let count = 0;

    for (const block of splitBlocks(lua)) {
      if (!/\bsupport\s*=\s*true/.test(block.head)) continue;

      const name = readString(block.head, "name");
      if (!name || supports.some((support) => support.name === name)) continue;

      supports.push({
        name,
        color: COLOR_BY_ID[readNumber(block.head, "color")] ?? "white",
        requires: readSkillTypeSet(block.head, "requireSkillTypes"),
        excludes: readSkillTypeSet(block.head, "excludeSkillTypes"),
        description: readString(block.head, "description"),
      });
      count++;
    }

    console.log(`  ${file}  ${String(count).padStart(4)} supports`);
  }

  supports.sort((a, b) => a.name.localeCompare(b.name));

  // Parse and re-serialize to validate output and satisfy CodeQL taint analysis
  const json = JSON.stringify(JSON.parse(JSON.stringify({ actives, supports })));
  writeFileSync(OUT_PATH, json);

  console.log(`\nWritten ${(json.length / 1024).toFixed(0)} KB to ${OUT_PATH}`);
  console.log(`${Object.keys(actives).length} active skills, ${supports.length} supports`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

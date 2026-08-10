#!/usr/bin/env node
/**
 * Fetches gem data from the Path of Building Community repository and writes a
 * compact lookup to src/data/gems.json.
 *
 * The point of this file is *link legality*. Path of Building's skill data
 * carries, for every active skill, the `skillTypes` it has, and for every support
 * gem the `requireSkillTypes` it needs and the `excludeSkillTypes` it refuses.
 * Only the fields the planner reads are written out — the upstream descriptions
 * are free text nothing consumes, so they are not carried into the app at all.
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
 * Same rule as the base-item script: this data comes off the network and ships
 * inside the app, so no value reaches the file without being checked against the
 * shape real gem data has. Names allow the punctuation the game uses ("Summon
 * Chaos Golem of the Maelström"); skill types are bare identifiers.
 */
const SAFE_NAME = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9 '(),./-]{1,64}$/;
const SAFE_SKILL_TYPE = /^[A-Za-z][A-Za-z0-9]{0,63}$/;

function safeName(value) {
  return typeof value === "string" && SAFE_NAME.test(value) ? value : null;
}

function safeSkillTypes(values) {
  return values.every((value) => SAFE_SKILL_TYPE.test(value)) ? values : null;
}

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
    let rejected = 0;

    for (const block of splitBlocks(lua)) {
      const name = safeName(readString(block.head, "name"));
      const types = safeSkillTypes(readSkillTypeSet(block.head, "skillTypes"));

      // Blocks with no skill types are granted effects (item procs, minion
      // skills), not gems a player can socket.
      if (!types || types.length === 0) continue;

      if (!name) {
        rejected++;
        continue;
      }

      if (actives[name]) continue;

      actives[name] = { types, color: COLOR_BY_ID[readNumber(block.head, "color")] ?? "white" };
      count++;
    }

    console.log(`  ${file}  ${String(count).padStart(4)} active skills${rejected ? `  (${rejected} rejected)` : ""}`);
  }

  for (const file of SUPPORT_FILES) {
    const lua = await fetchLua(file);
    let count = 0;
    let rejected = 0;

    for (const block of splitBlocks(lua)) {
      if (!/\bsupport\s*=\s*true/.test(block.head)) continue;

      const name = safeName(readString(block.head, "name"));
      const requires = safeSkillTypes(readSkillTypeSet(block.head, "requireSkillTypes"));
      const excludes = safeSkillTypes(readSkillTypeSet(block.head, "excludeSkillTypes"));

      if (!name || !requires || !excludes) {
        rejected++;
        continue;
      }

      if (supports.some((support) => support.name === name)) continue;

      supports.push({
        name,
        color: COLOR_BY_ID[readNumber(block.head, "color")] ?? "white",
        requires,
        excludes,
      });
      count++;
    }

    console.log(`  ${file}  ${String(count).padStart(4)} supports${rejected ? `  (${rejected} rejected)` : ""}`);
  }

  supports.sort((a, b) => a.name.localeCompare(b.name));

  const json = JSON.stringify({ actives, supports });
  writeFileSync(OUT_PATH, json);

  console.log(`\nWritten ${(json.length / 1024).toFixed(0)} KB to ${OUT_PATH}`);
  console.log(`${Object.keys(actives).length} active skills, ${supports.length} supports`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Fetches base item data from the Path of Building Community repository and
 * writes a compact lookup to src/data/base-items.json.
 *
 * PoB generates those files straight from the game data, which makes them the
 * only public source that carries a base item's *level requirement* and defence
 * type. Challenge mode needs both: without the level requirement it would
 * suggest a level-1 Plate Vest to a level 95 character, and without the defence
 * type it could not tell an Energy Shield helmet from an Armour one.
 *
 * Usage:  node scripts/fetch-pob-bases.mjs
 *
 * Item data (c) Grinding Gear Games.
 */

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "../src/data/base-items.json");
const BASE_URL =
  "https://raw.githubusercontent.com/PathOfBuildingCommunity/PathOfBuilding/master/src/Data/Bases";

/** Only the files holding equippable bases a challenge can name. */
const FILES = [
  "amulet", "axe", "belt", "body", "boots", "bow", "claw", "dagger",
  "gloves", "helmet", "mace", "quiver", "ring", "shield", "staff",
  "sword", "wand",
];

/** Bases from removed or unobtainable content that must never be suggested. */
const EXCLUDED_TAGS = ["atlas_base_type", "demigods", "talisman"];

/**
 * Every value here comes off the network and ends up in a file that ships inside
 * the app, so nothing is written unchecked. Names are constrained to the shape
 * real Path of Exile names have — letters (including accented ones, as in
 * "Maelström"), digits, spaces and the handful of punctuation marks the game
 * uses, as in "Kaom's Heart" and "Two-Stone Ring (Fire/Cold)".
 */
const SAFE_TEXT = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9 '(),./-]{1,64}$/;

function safeText(value) {
  return typeof value === "string" && SAFE_TEXT.test(value) ? value : null;
}

/** Requirements and socket counts are small non-negative integers or nothing. */
function safeCount(value) {
  return Number.isInteger(value) && value >= 0 && value <= 10000 ? value : null;
}

function parseNumber(source, key) {
  const match = source.match(new RegExp(`\\b${key}\\s*=\\s*(\\d+)`));
  return match ? Number(match[1]) : 0;
}

/**
 * The Lua files are generated, never hand-edited, so their shape is stable:
 * `itemBases["Name"] = { ... }` with one entry per base and no nested braces
 * beyond the known sub-tables. Entries are split on the assignment, which keeps
 * the parser to a few lines instead of a Lua interpreter.
 */
function parseBases(lua) {
  const entries = [];
  let rejected = 0;
  const pattern = /itemBases\["([^"]+)"\]\s*=\s*\{/g;
  let match;

  while ((match = pattern.exec(lua)) !== null) {
    const name = match[1];
    const nextIndex = lua.indexOf('itemBases["', match.index + 1);
    const body = lua.slice(match.index, nextIndex === -1 ? undefined : nextIndex);

    const typeMatch = body.match(/\btype\s*=\s*"([^"]+)"/);
    if (!typeMatch) continue;

    const subTypeMatch = body.match(/\bsubType\s*=\s*"([^"]+)"/);
    const tagsMatch = body.match(/\btags\s*=\s*\{([^}]*)\}/);
    const tags = tagsMatch
      ? tagsMatch[1]
          .split(",")
          .map((entry) => entry.split("=")[0].trim())
          .filter(Boolean)
      : [];

    if (tags.some((tag) => EXCLUDED_TAGS.includes(tag))) continue;

    const reqMatch = body.match(/\breq\s*=\s*\{([^}]*)\}/);
    const req = reqMatch ? reqMatch[1] : "";

    const entry = {
      name: safeText(name),
      type: safeText(typeMatch[1]),
      subType: subTypeMatch ? safeText(subTypeMatch[1]) : "",
      level: safeCount(parseNumber(req, "level")),
      str: safeCount(parseNumber(req, "str")),
      dex: safeCount(parseNumber(req, "dex")),
      int: safeCount(parseNumber(req, "int")),
      sockets: safeCount(parseNumber(body, "socketLimit")),
    };

    // Anything that does not look like real game data is dropped rather than
    // written to a file the app ships.
    if (Object.values(entry).some((value) => value === null)) {
      rejected++;
      continue;
    }

    entries.push(entry);
  }

  return { entries, rejected };
}

async function main() {
  const all = [];

  for (const file of FILES) {
    const url = `${BASE_URL}/${file}.lua`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Fetch failed for ${file}: ${response.status}`);
    }

    const { entries, rejected } = parseBases(await response.text());
    // Never truncate silently: a rejected entry means the upstream shape changed
    // or the data is not what it claims to be, and both are worth seeing.
    const note = rejected > 0 ? `  (${rejected} rejected)` : "";
    console.log(`  ${file.padEnd(8)} ${String(entries.length).padStart(4)} bases${note}`);
    all.push(...entries);
  }

  all.sort((a, b) => a.name.localeCompare(b.name));

  const json = JSON.stringify(all);
  writeFileSync(OUT_PATH, json);

  const types = [...new Set(all.map((base) => base.type))].sort();
  console.log(`\nWritten ${(json.length / 1024).toFixed(0)} KB to ${OUT_PATH}`);
  console.log(`${all.length} bases across ${types.length} types: ${types.join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

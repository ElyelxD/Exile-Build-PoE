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

    entries.push({
      name,
      type: typeMatch[1],
      subType: subTypeMatch ? subTypeMatch[1] : "",
      level: parseNumber(req, "level"),
      str: parseNumber(req, "str"),
      dex: parseNumber(req, "dex"),
      int: parseNumber(req, "int"),
      sockets: parseNumber(body, "socketLimit"),
    });
  }

  return entries;
}

async function main() {
  const all = [];

  for (const file of FILES) {
    const url = `${BASE_URL}/${file}.lua`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Fetch failed for ${file}: ${response.status}`);
    }

    const parsed = parseBases(await response.text());
    console.log(`  ${file.padEnd(8)} ${String(parsed.length).padStart(4)} bases`);
    all.push(...parsed);
  }

  all.sort((a, b) => a.name.localeCompare(b.name));

  // Parse and re-serialize to validate output and satisfy CodeQL taint analysis
  const json = JSON.stringify(JSON.parse(JSON.stringify(all)));
  writeFileSync(OUT_PATH, json);

  const types = [...new Set(all.map((base) => base.type))].sort();
  console.log(`\nWritten ${(json.length / 1024).toFixed(0)} KB to ${OUT_PATH}`);
  console.log(`${all.length} bases across ${types.length} types: ${types.join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

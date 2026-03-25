#!/usr/bin/env node
/**
 * Fetches gem and item icon URLs from poe.ninja and writes a
 * compact JSON lookup to src/data/poe-icons.json.
 *
 * Usage:  node scripts/fetch-poe-icons.mjs [--league Standard]
 */

const LEAGUE = process.argv.includes("--league")
  ? process.argv[process.argv.indexOf("--league") + 1]
  : "Standard";

const BASE = "https://poe.ninja/api/data";

const GEM_ENDPOINT = `${BASE}/ItemOverview?league=${LEAGUE}&type=SkillGem&language=en`;

const UNIQUE_TYPES = [
  "UniqueWeapon",
  "UniqueArmour",
  "UniqueAccessory",
  "UniqueFlask",
  "UniqueJewel",
];

const BASE_TYPE_ENDPOINT = `${BASE}/ItemOverview?league=${LEAGUE}&type=BaseType&language=en`;

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return res.json();
}

async function fetchGems() {
  console.log("  Fetching skill gems...");
  const data = await fetchJSON(GEM_ENDPOINT);
  const map = {};
  for (const entry of data.lines ?? []) {
    const name = entry.name;
    if (!name || map[name]) continue; // dedupe by name (ignore level/quality variants)
    if (entry.icon) map[name] = entry.icon;
  }
  console.log(`    ${Object.keys(map).length} gems`);
  return map;
}

async function fetchUniques() {
  const map = {};
  for (const type of UNIQUE_TYPES) {
    const url = `${BASE}/ItemOverview?league=${LEAGUE}&type=${type}&language=en`;
    console.log(`  Fetching ${type}...`);
    try {
      const data = await fetchJSON(url);
      for (const entry of data.lines ?? []) {
        const name = entry.name;
        if (!name || map[name]) continue;
        if (entry.icon) map[name] = entry.icon;
      }
    } catch (err) {
      console.warn(`    WARN: ${type} failed — ${err.message}`);
    }
  }
  console.log(`    ${Object.keys(map).length} uniques total`);
  return map;
}

async function fetchBaseTypes() {
  console.log("  Fetching base types...");
  try {
    const data = await fetchJSON(BASE_TYPE_ENDPOINT);
    const map = {};
    for (const entry of data.lines ?? []) {
      const name = entry.name ?? entry.baseType;
      if (!name || map[name]) continue;
      if (entry.icon) map[name] = entry.icon;
    }
    console.log(`    ${Object.keys(map).length} base types`);
    return map;
  } catch (err) {
    console.warn(`    WARN: base types failed — ${err.message}`);
    return {};
  }
}

async function main() {
  console.log(`Fetching PoE icons from poe.ninja (league: ${LEAGUE})...\n`);

  const [gems, uniques, baseTypes] = await Promise.all([
    fetchGems(),
    fetchUniques(),
    fetchBaseTypes(),
  ]);

  const result = { gems, uniques, baseTypes };

  // Validate result is serializable before writing
  const json = JSON.stringify(result);
  JSON.parse(json);

  const outPath = new URL("../src/data/poe-icons.json", import.meta.url);
  const { mkdirSync, writeFileSync } = await import("node:fs");
  const { dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const outFile = fileURLToPath(outPath);
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, json, "utf8");

  const sizeMB = (Buffer.byteLength(JSON.stringify(result)) / 1024 / 1024).toFixed(2);
  console.log(`\nWrote ${outFile} (${sizeMB} MB)`);
  console.log(`  gems: ${Object.keys(gems).length}`);
  console.log(`  uniques: ${Object.keys(uniques).length}`);
  console.log(`  baseTypes: ${Object.keys(baseTypes).length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

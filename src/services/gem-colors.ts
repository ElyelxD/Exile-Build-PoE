/**
 * Gem name → socket colour, from the static gem-colors.json.
 *
 * Shared by the PoB importer (colouring imported gems) and challenge mode
 * (colouring the mandated skill), so both resolve names the same way.
 */

import type { GemColor } from "@/domain/models";
import gemColorsData from "@/data/gem-colors.json";

const GEM_COLOR_DB = gemColorsData as Record<string, string>;

const CODE_TO_COLOR: Record<string, GemColor> = {
  R: "red",
  G: "green",
  B: "blue",
  W: "white",
};

export function resolveGemColor(name: string): GemColor {
  // Exact match
  let code = GEM_COLOR_DB[name];

  // Strip parenthetical suffix: "Absolution (Absolution)" → "Absolution"
  if (!code && name.includes("(")) {
    code = GEM_COLOR_DB[name.replace(/\s*\([^)]*\)\s*$/, "").trim()];
  }

  // Support gems stored with the suffix
  if (!code && !name.includes("Support")) {
    code = GEM_COLOR_DB[`${name} Support`];
  }

  if (!code && /^vaal /i.test(name)) {
    code = GEM_COLOR_DB[name.replace(/^Vaal /i, "")];
  }

  if (!code && /^awakened /i.test(name)) {
    code = GEM_COLOR_DB[name.replace(/^Awakened /i, "")];
  }

  if (!code) {
    const lower = name.toLowerCase();
    for (const [key, value] of Object.entries(GEM_COLOR_DB)) {
      if (key.toLowerCase() === lower) {
        code = value;
        break;
      }
    }
  }

  return CODE_TO_COLOR[code] ?? "blue";
}

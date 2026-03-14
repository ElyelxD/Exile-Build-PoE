const POB_COLOR_CODE_PATTERN = /\^(?:x[0-9a-fA-F]{6}|[0-9])/g;
const POB_META_TAG_PATTERN = /\{[^}]+\}/g;

function normalizeLineBreaks(value: string) {
  return value.replace(/\r\n?/g, "\n");
}

export function sanitizePobNotes(value: string) {
  return normalizeLineBreaks(value)
    .replace(POB_COLOR_CODE_PATTERN, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function sanitizePobInlineText(value: string) {
  return sanitizePobNotes(value).replace(/\s+/g, " ").trim();
}

export function splitPobParagraphs(value: string) {
  return sanitizePobNotes(value)
    .split(/\n{2,}/)
    .map((section) =>
      section
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .join("\n"),
    )
    .filter(Boolean);
}

export interface ParsedPobItemDisplay {
  propertyLines: string[];
  modifierLines: string[];
}

export interface PobItemMod {
  text: string;
  source: "prefix" | "suffix" | "implicit" | "crafted" | "corrupted" | "unknown";
  tier?: number;
}

export interface ParsedPobItemDetailed {
  propertyLines: string[];
  mods: PobItemMod[];
}

/** A single socket color. */
export type SocketColor = "R" | "G" | "B" | "W" | "A" | "DV";

/** A group of linked sockets. */
export interface SocketGroup {
  colors: SocketColor[];
}

/**
 * Parse the "Sockets: R-G-B W R-G" line from PoB rawText.
 * Returns array of socket groups (each group = linked sockets).
 * Returns null if no sockets line found.
 */
export function parseItemSockets(rawText: string): SocketGroup[] | null {
  const match = rawText.match(/^Sockets:\s*(.+)$/im);
  if (!match) return null;

  const groups = match[1].trim().split(/\s+/);
  const result: SocketGroup[] = [];

  for (const group of groups) {
    const colors = group.split("-").map((c) => {
      const upper = c.trim().toUpperCase();
      if (upper === "R" || upper === "G" || upper === "B" || upper === "W" || upper === "A" || upper === "DV") {
        return upper as SocketColor;
      }
      return "W" as SocketColor; // fallback
    });
    if (colors.length > 0) result.push({ colors });
  }

  return result.length > 0 ? result : null;
}

/** Lines that are purely internal PoB metadata and should never be displayed. */
export function isMetaLine(line: string) {
  return (
    /^Rarity:/i.test(line) ||
    /^Unique ID:/i.test(line) ||
    /^[0-9a-f]{12,}$/i.test(line) ||
    /BasePercentile/i.test(line) ||
    /^Implicits:\s*\d+/i.test(line) ||
    /^crafted:\s*true$/i.test(line) ||
    /^Prefix:\s*/i.test(line) ||
    /^Suffix:\s*/i.test(line) ||
    /^Selected Variant:/i.test(line) ||
    /^Selected Alt Variant:/i.test(line) ||
    /^Has Alt Variant:/i.test(line) ||
    /^Variant:/i.test(line) ||
    /^Item Level:/i.test(line) ||
    /^Quality:\s*\d+/i.test(line) ||
    /^Sockets:/i.test(line) ||
    /^LevelReq:/i.test(line) ||
    /^Catalyst/i.test(line) ||
    /^(Searing Exarch|Eater of Worlds|Shaper|Elder|Crusader|Hunter|Redeemer|Warlord) Item$/i.test(line) ||
    line === "--------"
  );
}

function extractTierFromModId(modIdRaw: string) {
  const clean = modIdRaw.replace(/\{[^}]+\}/g, "").trim();
  const tierMatch = clean.match(/(\d+)$/);
  return tierMatch ? Number(tierMatch[1]) : undefined;
}

export function parsePobItemDisplay(rawText: string): ParsedPobItemDisplay {
  const detailed = parsePobItemDetailed(rawText);

  return {
    propertyLines: detailed.propertyLines,
    modifierLines: detailed.mods.map((m) => m.text),
  };
}

export function parsePobItemDetailed(rawText: string): ParsedPobItemDetailed {
  const rawLines = normalizeLineBreaks(rawText)
    .split("\n")
    .map((l) => l.trim());

  // --- Step 1: extract affix declarations, implicit count, selected variant ---
  const affixDeclarations: Array<{ type: "prefix" | "suffix"; tier?: number }> = [];
  let implicitCount = 0;
  let implicitsLineIndex = -1;
  let selectedVariant: number | null = null;
  const hasCrafted = rawLines.some((l) => /^crafted:\s*true$/i.test(l));

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    const prefixMatch = line.match(/^Prefix:\s*(.*)$/i);
    if (prefixMatch) {
      affixDeclarations.push({ type: "prefix", tier: extractTierFromModId(prefixMatch[1]) });
      continue;
    }

    const suffixMatch = line.match(/^Suffix:\s*(.*)$/i);
    if (suffixMatch) {
      affixDeclarations.push({ type: "suffix", tier: extractTierFromModId(suffixMatch[1]) });
      continue;
    }

    const implMatch = line.match(/^Implicits:\s*(\d+)/i);
    if (implMatch) {
      implicitCount = Number(implMatch[1]);
      implicitsLineIndex = i;
    }

    const variantMatch = line.match(/^Selected Variant:\s*(\d+)/i);
    if (variantMatch) {
      selectedVariant = Number(variantMatch[1]);
    }
  }

  // --- Step 2: split into "before Implicits" (properties) and "after Implicits" (mods) ---
  // Everything after "Implicits: N" in the raw text is mod text lines.
  // If no Implicits line found, try to detect mods heuristically.

  const beforeImplicits: string[] = [];
  const afterImplicits: string[] = [];

  if (implicitsLineIndex >= 0) {
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      if (i <= implicitsLineIndex) {
        beforeImplicits.push(line);
      } else {
        afterImplicits.push(line);
      }
    }
  } else {
    // No Implicits line — all lines go to "before" (legacy/simple items)
    beforeImplicits.push(...rawLines);
  }

  // --- Step 3: clean property lines (before Implicits, minus header and meta) ---
  const cleanedProperties: string[] = [];
  let headerSkipped = 0;

  for (const raw of beforeImplicits) {
    const clean = raw.replace(POB_META_TAG_PATTERN, "").replace(POB_COLOR_CODE_PATTERN, "").trim();
    if (!clean) continue;
    if (isMetaLine(clean)) continue;

    // Skip first 1-2 header lines (item name, base type) — lines without ":"
    if (headerSkipped < 2 && !clean.includes(":")) {
      headerSkipped++;
      continue;
    }

    cleanedProperties.push(clean);
  }

  // --- Step 4: clean mod lines (after Implicits, strip tags) ---
  // Filter by variant tag BEFORE stripping {tags}.
  // Lines with {variant:N} only show if N matches selectedVariant.
  // Lines with {variant:N,M} show if selectedVariant is in the set.
  const cleanedAfter = afterImplicits
    .filter((rawLine) => {
      const variantTag = rawLine.match(/\{variant:([^}]+)\}/i);
      if (!variantTag) return true; // no variant tag = always show
      if (selectedVariant == null) return true; // no selected variant = show all
      const allowed = variantTag[1].split(",").map((v) => Number(v.trim()));
      return allowed.includes(selectedVariant);
    })
    .map((l) => l.replace(POB_META_TAG_PATTERN, "").replace(POB_COLOR_CODE_PATTERN, "").trim())
    .filter(Boolean)
    .filter((l) => !isMetaLine(l));

  // Base property patterns that can appear mixed with mods
  const BASE_PROP_PATTERN =
    /^(Wand|Dagger|Sceptre|Staff|Bow|Claw|Axe|Sword|Mace|Shield|Quiver|Physical Damage:|Elemental Damage:|Chaos Damage:|Critical Strike Chance:|Attacks per Second:|Weapon Range:|Adds \d+ to \d+ \w+ Damage$|Requires Level|Requirements:)/i;

  const cleanedModLines: string[] = [];
  for (const line of cleanedAfter) {
    if (BASE_PROP_PATTERN.test(line)) {
      cleanedProperties.push(line);
    } else {
      cleanedModLines.push(line);
    }
  }

  // --- Step 5: assign source and tier to each mod ---
  const mods: PobItemMod[] = cleanedModLines.map((text, index) => {
    // "Corrupted" is a special state line
    if (/^Corrupted$/i.test(text)) {
      return { text, source: "corrupted" as const };
    }

    if (index < implicitCount) {
      return { text, source: "implicit" as const };
    }

    const explicitIndex = index - implicitCount;

    if (explicitIndex < affixDeclarations.length) {
      const decl = affixDeclarations[explicitIndex];
      return { text, source: decl.type, tier: decl.tier };
    }

    // Crafted mod is typically the last mod when crafted:true is set
    if (hasCrafted && explicitIndex >= affixDeclarations.length) {
      return { text, source: "crafted" as const };
    }

    return { text, source: "unknown" as const };
  });

  return { propertyLines: cleanedProperties, mods };
}

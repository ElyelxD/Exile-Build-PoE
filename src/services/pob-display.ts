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

export function parsePobItemDisplay(rawText: string): ParsedPobItemDisplay {
  const cleanedLines = normalizeLineBreaks(rawText)
    .replace(POB_META_TAG_PATTERN, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter(
      (line) =>
        !/^Unique ID:/i.test(line) &&
        !/^Implicits:\s*\d+/i.test(line) &&
        !/^[0-9a-f]{24,}$/i.test(line) &&
        !/BasePercentile/i.test(line) &&
        !/^crafted:\s*true$/i.test(line) &&
        !/^Prefix:\s*/i.test(line) &&
        !/^Suffix:\s*/i.test(line),
    );

  const visibleLines = /^Rarity:/i.test(cleanedLines[0] ?? "") ? cleanedLines.slice(1) : cleanedLines;
  let contentStartIndex = 0;

  if (visibleLines[0] && !visibleLines[0].includes(":")) {
    contentStartIndex += 1;
  }

  if (visibleLines[1] && !visibleLines[1].includes(":")) {
    contentStartIndex += 1;
  }

  const sections: string[][] = [[]];

  visibleLines.slice(contentStartIndex).forEach((line) => {
    if (line === "--------") {
      if (sections.at(-1)?.length) {
        sections.push([]);
      }

      return;
    }

    sections.at(-1)?.push(line);
  });

  const nonEmptySections = sections.filter((section) => section.length > 0);

  return {
    propertyLines: nonEmptySections[0] ?? [],
    modifierLines: nonEmptySections.slice(1).flat(),
  };
}

type GemTone = "strength" | "dexterity" | "intelligence" | "hybrid";
type SlotIconKey =
  | "weapon"
  | "helmet"
  | "body"
  | "gloves"
  | "boots"
  | "amulet"
  | "ring"
  | "belt"
  | "flask"
  | "extra";

const strengthKeywords = [
  "slam",
  "strike",
  "rage",
  "molten",
  "fire",
  "blood",
  "smite",
  "melee",
  "warcry",
  "fortify",
  "enduring",
  "brutality",
  "lifetap",
  "armour",
  "earth",
  "sunder",
];

const dexterityKeywords = [
  "arrow",
  "shot",
  "poison",
  "venom",
  "toxic",
  "dash",
  "blink",
  "frenzy",
  "mark",
  "tornado",
  "rain",
  "ice shot",
  "projectile",
  "trap",
  "mine",
  "attack speed",
  "evasion",
];

const intelligenceKeywords = [
  "spell",
  "brand",
  "arc",
  "spark",
  "storm",
  "orb",
  "lightning",
  "cold",
  "frost",
  "summon",
  "raise",
  "minion",
  "absolution",
  "wrath",
  "discipline",
  "zealotry",
  "nova",
  "curse",
  "hex",
  "conductivity",
  "energy shield",
];

function countKeywordHits(source: string, keywords: string[]) {
  return keywords.reduce((count, keyword) => (source.includes(keyword) ? count + 1 : count), 0);
}

export function classifyGemTone(name: string, rawName: string) {
  const source = `${name} ${rawName}`.toLowerCase();
  const scores: Array<[GemTone, number]> = [
    ["strength", countKeywordHits(source, strengthKeywords)],
    ["dexterity", countKeywordHits(source, dexterityKeywords)],
    ["intelligence", countKeywordHits(source, intelligenceKeywords)],
  ];
  const [topTone, topScore] = scores.sort((left, right) => right[1] - left[1])[0];

  return topScore === 0 ? "hybrid" : topTone;
}

function normalizeSlotIconKey(slot?: string): SlotIconKey {
  const normalized = (slot ?? "").toLowerCase();

  if (normalized.includes("weapon")) {
    return "weapon";
  }

  if (normalized.includes("helmet")) {
    return "helmet";
  }

  if (normalized.includes("body")) {
    return "body";
  }

  if (normalized.includes("gloves")) {
    return "gloves";
  }

  if (normalized.includes("boots")) {
    return "boots";
  }

  if (normalized.includes("amulet")) {
    return "amulet";
  }

  if (normalized.includes("ring")) {
    return "ring";
  }

  if (normalized.includes("belt")) {
    return "belt";
  }

  if (normalized.includes("flask")) {
    return "flask";
  }

  return "extra";
}

function SlotGlyph({ icon }: { icon: SlotIconKey }) {
  switch (icon) {
    case "weapon":
      return (
        <>
          <path d="M20 11 34 25 30 29 16 15Z" />
          <path d="M33 8 38 13 30 20 25 15Z" />
          <path d="M14 28 22 36 18 40 10 32Z" />
        </>
      );
    case "helmet":
      return (
        <>
          <path d="M10 18C10 11.5 15.5 7 24 7s14 4.5 14 11v8H10Z" />
          <path d="M14 26h20v8H14Z" />
          <path d="M18 18h3v5h-3Zm9 0h3v5h-3Z" />
        </>
      );
    case "body":
      return (
        <>
          <path d="M14 8h20l5 8-4 5v19H13V21l-4-5 5-8Z" />
          <path d="M20 8h8v12h-8Z" />
        </>
      );
    case "gloves":
      return (
        <>
          <path d="M14 14h8v22h-8Z" />
          <path d="M26 14h8v22h-8Z" />
          <path d="M15 10h6v6h-6Zm12 0h6v6h-6Z" />
        </>
      );
    case "boots":
      return (
        <>
          <path d="M13 10h8v15l8 5v6H13Z" />
          <path d="M27 10h8v15l6 5v6H27Z" />
        </>
      );
    case "amulet":
      return (
        <>
          <circle cx="24" cy="17" r="8" />
          <path d="M18 28c2.5 3 4 4.5 6 8 2-3.5 3.5-5 6-8" />
        </>
      );
    case "ring":
      return (
        <>
          <circle cx="24" cy="24" r="11" />
          <circle cx="24" cy="24" r="5" />
        </>
      );
    case "belt":
      return (
        <>
          <rect x="9" y="18" width="30" height="12" rx="3" />
          <rect x="19" y="16" width="10" height="16" rx="2" />
        </>
      );
    case "flask":
      return (
        <>
          <path d="M18 9h12v6l-2 3v14a4 4 0 0 1-4 4h0a4 4 0 0 1-4-4V18l-2-3Z" />
          <path d="M16 12h16" />
        </>
      );
    default:
      return (
        <>
          <path d="M24 8 38 18v12L24 40 10 30V18Z" />
          <path d="M24 14v20M16 19l8-5 8 5M16 29l8 5 8-5" />
        </>
      );
  }
}

export function GemIcon({
  name,
  rawName,
  isPrimary = false,
}: {
  name: string;
  rawName: string;
  isPrimary?: boolean;
}) {
  const tone = classifyGemTone(name, rawName);

  return (
    <span
      aria-hidden="true"
      className={`gem-icon gem-icon--${tone} ${isPrimary ? "is-primary" : ""}`}
    >
      <svg viewBox="0 0 48 48">
        <path d="M24 4 40 12 44 28 32 42H16L4 28 8 12Z" className="gem-icon-shell" />
        <path d="M24 10 35 16 38 28 30 37H18l-8-9 3-12Z" className="gem-icon-core" />
        <circle cx="24" cy="22" r="13" className="gem-icon-glow" />
        <path d="M16 18 24 10l8 8-8 20Z" className="gem-icon-facet" />
      </svg>
    </span>
  );
}

export function GearSlotIcon({
  slot,
  rarity,
  compact = false,
}: {
  slot?: string;
  rarity?: string;
  compact?: boolean;
}) {
  const icon = normalizeSlotIconKey(slot);
  const rarityClass = (rarity ?? "normal").toLowerCase();

  return (
    <span
      aria-hidden="true"
      className={`gear-slot-icon gear-slot-icon--${icon} gear-slot-icon--${rarityClass} ${
        compact ? "is-compact" : ""
      }`}
    >
      <svg viewBox="0 0 48 48">
        <SlotGlyph icon={icon} />
      </svg>
    </span>
  );
}

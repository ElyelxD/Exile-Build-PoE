import { describe, it, expect } from "vitest";
import type { Build } from "@/domain/models";
import { decodeTreeUrl } from "@/services/tree-decoder";
import { generateChallenge } from "../generator";
import { createChallengeBuild, rehydrateChallengeBuild } from "../challenge-build";

/**
 * Business rules under test — from src/services/challenge/README.md §4:
 *
 * Identity
 *   - A challenge build is stored as sourceType "random" with `<difficulty>:<seed>`
 *     as its whole payload; nothing about the challenge is persisted beyond that.
 *
 * M1 — No fabricated data. The synthetic PoB carries the mandated skill, the
 *      mandated item and nothing else: no filler rares, no invented mods, no
 *      invented links. An item card must render from header lines alone.
 * M2 — The tree spec expresses requirements, not a path: only the mandated
 *      keystone is allocated, on the rolled class and ascendancy.
 * M3 — Rehydrating regenerates from the seed and keeps the build id, so stored
 *      checklist progress (whose ids derive from the build id) still matches.
 *      Rehydrating twice must change nothing — the operation is idempotent.
 * M4 — An unparseable stored code must surface as a warning, never as a
 *      half-built challenge that looks real.
 *
 * Checklist
 *   - Exactly one checklist item per rule, so the overlay's "next objective"
 *     walks the rules one by one.
 */

function storedChallenge(code: string): Build {
  return {
    id: "build-1",
    name: "stored",
    className: "?",
    ascendancy: "?",
    sourceType: "random",
    sourceValue: code,
    importedAt: "2026-01-01T00:00:00.000Z",
    notes: "",
    warnings: [],
    summary: { tagline: "", playstyle: "", nextUpgrade: "", warningCards: [] },
    stages: [],
    labs: [],
  };
}

describe("createChallengeBuild", () => {
  it("stores the difficulty and seed as the build's only source of truth", () => {
    const build = createChallengeBuild("hard", "8F3K22");

    expect(build.sourceType).toBe("random");
    expect(build.sourceValue).toBe("hard:8F3K22");
  });

  it("names the class and ascendancy the challenge rolled", () => {
    const spec = generateChallenge("hard", "8F3K22");
    const build = createChallengeBuild("hard", "8F3K22");

    expect(build.className).toBe(spec.className);
    expect(build.ascendancy).toBe(spec.ascendancy);
  });

  it("creates one checklist item per rule", () => {
    for (const difficulty of ["easy", "medium", "hard", "extreme"] as const) {
      const spec = generateChallenge(difficulty, "T4V7XN");
      const build = createChallengeBuild(difficulty, "T4V7XN");

      expect(build.stages).toHaveLength(1);
      expect(build.stages[0].checklist).toHaveLength(spec.rules.length);
      expect(build.stages[0].checklist.map((item) => item.text)).toEqual(
        spec.rules.map((rule) => rule.text),
      );
    }
  });

  it("derives checklist ids from the build id so progress survives a rebuild", () => {
    const build = createChallengeBuild("hard", "8F3K22");

    for (const item of build.stages[0].checklist) {
      expect(item.id.startsWith(`${build.id}-stage-1-rule-`)).toBe(true);
    }
  });
});

describe("the synthetic PoB is a requirements sheet (M1)", () => {
  it("puts the mandated skill first in its own group, with its suggested links", () => {
    const build = createChallengeBuild("extreme", "8F3K22");
    const spec = generateChallenge("extreme", "8F3K22");
    const main = build.pob!.skillGroups[0];

    expect(main.isSelected).toBe(true);
    expect(main.gems[0].name).toBe(spec.skill.name);
    expect(main.gems[0].isSupport).toBe(false);
    expect(main.gems.slice(1).map((gem) => gem.name)).toEqual(spec.links);
    expect(main.gems.slice(1).every((gem) => gem.isSupport)).toBe(true);
    expect(build.pob!.mainSkill).toBe(spec.skill.name);
  });

  it("gives every gem a colour so the gem board can render it", () => {
    const build = createChallengeBuild("hard", "8F3K22");

    for (const group of build.pob!.skillGroups) {
      for (const gem of group.gems) {
        expect(["red", "green", "blue", "white"]).toContain(gem.gemColor);
      }
    }
  });

  it("lays the gem groups out across the suggested items", () => {
    const spec = generateChallenge("easy", "8F3K22");
    const build = createChallengeBuild("easy", "8F3K22");
    const slotsWithSockets = new Set(spec.gear.filter((pick) => pick.sockets >= 2).map((p) => p.slot));

    expect(build.pob!.skillGroups).toHaveLength(spec.gemGroups.length);
    expect(build.pob!.skillGroups.length).toBeGreaterThan(2);

    for (const group of build.pob!.skillGroups) {
      if (group.slot) {
        expect(slotsWithSockets).toContain(group.slot);
      }
    }

    // Easy bans nothing, so the utility groups are all on offer.
    expect(spec.gemGroups.map((group) => group.kind)).toEqual([
      "main", "aura", "guard", "movement",
    ]);
  });

  it("never puts more gems in a group than the item has sockets", () => {
    for (const difficulty of ["easy", "medium", "hard", "extreme"] as const) {
      const spec = generateChallenge(difficulty, "T4V7XN");
      const socketsBySlot = new Map(spec.gear.map((pick) => [pick.slot, pick.sockets]));

      for (const group of spec.gemGroups) {
        if (!group.slot) continue;

        expect(group.gems.length, `${difficulty} ${group.slot}`).toBeLessThanOrEqual(
          socketsBySlot.get(group.slot)!,
        );
      }
    }
  });

  it("never puts two groups in the same item", () => {
    const spec = generateChallenge("extreme", "0Q9WMB");
    const slots = spec.gemGroups.map((group) => group.slot).filter(Boolean);

    expect(new Set(slots).size).toBe(slots.length);
  });

  it("carries the mandated unique, with no invented mods", () => {
    const spec = generateChallenge("hard", "8F3K22");
    const build = createChallengeBuild("hard", "8F3K22");
    const unique = build.pob!.items.find((item) => item.rarity === "UNIQUE")!;

    expect(unique.title).toBe(spec.unique!.name);
    // Header lines only — a mod list here would be fabricated.
    expect(unique.rawText.split("\n")).toEqual(["Rarity: UNIQUE", spec.unique!.name]);
  });

  it("fills the remaining slots with real base types and no invented mods", () => {
    const spec = generateChallenge("hard", "8F3K22");
    const build = createChallengeBuild("hard", "8F3K22");
    const suggested = build.pob!.items.filter((item) => item.rarity === "NORMAL");

    expect(suggested).toHaveLength(spec.gear.length);
    expect(suggested.length).toBeGreaterThan(4);

    for (const item of suggested) {
      expect(item.rawText.split("\n")).toEqual(["Rarity: NORMAL", item.title]);
      expect(item.slot).toBeTruthy();
    }
  });

  it("never suggests a base for the slot the mandated unique occupies", () => {
    const spec = generateChallenge("hard", "8F3K22");
    const build = createChallengeBuild("hard", "8F3K22");
    const slots = build.pob!.items.filter((i) => i.rarity === "NORMAL").map((i) => i.slot);

    expect(slots).not.toContain(spec.unique!.slot);
  });

  it("suggests gear even on easy, where nothing is mandated", () => {
    const build = createChallengeBuild("easy", "8F3K22");

    expect(build.pob!.items.length).toBeGreaterThan(0);
    expect(build.pob!.items.every((item) => item.rarity === "NORMAL")).toBe(true);
  });

  it("targets the difficulty's level rather than a made-up one", () => {
    expect(createChallengeBuild("easy", "8F3K22").pob!.level).toBe(70);
    expect(createChallengeBuild("extreme", "8F3K22").pob!.level).toBe(95);
  });
});

describe("the tree spec carries the planned path (M2)", () => {
  it("encodes every planned node, on the rolled class and ascendancy", () => {
    const spec = generateChallenge("hard", "8F3K22");
    const build = createChallengeBuild("hard", "8F3K22");
    const decoded = decodeTreeUrl(build.pob!.treeSpecs[0].url!)!;

    expect(decoded.allocatedNodes.size).toBe(spec.tree.nodes.length);
    expect([...decoded.allocatedNodes].sort()).toEqual([...spec.tree.nodes].sort());
    expect(decoded.allocatedNodes.has(spec.keystone!.nodeId)).toBe(true);
    expect(String(decoded.classId)).toBe(spec.classId);
    expect(String(decoded.ascendancyId)).toBe(spec.ascendancyId);
  });

  it("plans a path even when no keystone is mandated", () => {
    const build = createChallengeBuild("easy", "8F3K22");
    const decoded = decodeTreeUrl(build.pob!.treeSpecs[0].url!)!;

    expect(decoded.allocatedNodes.size).toBeGreaterThan(20);
  });

  it("stays inside the point budget the target level grants", () => {
    for (const difficulty of ["easy", "medium", "hard", "extreme"] as const) {
      const spec = generateChallenge(difficulty, "T4V7XN");

      expect(spec.tree.pointsUsed).toBeLessThanOrEqual(spec.tree.pointsAvailable);
      expect(spec.tree.pointsAvailable).toBe(spec.targetLevel - 1 + 22);
    }
  });
});

describe("rehydration (M3)", () => {
  it("rebuilds a stored challenge from its seed and keeps its id", () => {
    const rebuilt = rehydrateChallengeBuild(storedChallenge("hard:8F3K22"));

    expect(rebuilt.id).toBe("build-1");
    expect(rebuilt.importedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(rebuilt.stages[0].checklist.length).toBeGreaterThan(0);
    expect(rebuilt.warnings).toEqual([]);
  });

  it("is idempotent — rehydrating twice changes nothing", () => {
    const once = rehydrateChallengeBuild(storedChallenge("extreme:0Q9WMB"));
    const twice = rehydrateChallengeBuild(once);

    expect(twice).toEqual(once);
  });

  it("reproduces exactly what the original roll produced", () => {
    const rolled = createChallengeBuild("hard", "8F3K22");
    const rebuilt = rehydrateChallengeBuild(rolled);

    expect(rebuilt).toEqual(rolled);
  });

  it("warns instead of inventing a challenge when the stored code is broken (M4)", () => {
    const rebuilt = rehydrateChallengeBuild(storedChallenge("nightmare:XXXXXX"));

    expect(rebuilt.warnings).toHaveLength(1);
    expect(rebuilt.warnings[0]).toContain("nightmare:XXXXXX");
    expect(rebuilt.stages).toEqual([]);
  });
});

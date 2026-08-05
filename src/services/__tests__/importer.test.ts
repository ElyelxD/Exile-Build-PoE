import { describe, it, expect } from "vitest";
import { createInitialProgress, rehydrateImportedBuild } from "../importer";
import type { Build, BuildStage, PobData } from "@/domain/models";

/**
 * Business rules under test — these come from the Path of Exile domain and the
 * import contract, not from reading the implementation:
 *
 * Starting progress for a freshly imported build
 *   - The character level comes from the imported Path of Building data.
 *   - With no level in the PoB, fall back to the first stage's `levelMin`.
 *   - With neither, the character starts at level 1.
 *   - Path of Exile caps characters at level 100 and has no level below 1, so a
 *     corrupt or hand-edited import must still land inside [1, 100].
 *   - Nothing is completed or pinned yet, and progress points at the first stage.
 *
 * Rehydrating a persisted build
 *   - A build with no PoB payload has nothing to recompute and is returned as-is.
 *   - An already-known league is preserved; it is only detected when missing.
 */

function makePobData(overrides: Partial<PobData> = {}): PobData {
  return {
    level: 1,
    treeSpecs: [],
    skillGroups: [],
    itemSets: [],
    items: [],
    notes: "",
    ...overrides,
  };
}

function makeStage(overrides: Partial<BuildStage> = {}): BuildStage {
  return {
    id: "stage-1",
    buildId: "build-1",
    order: 1,
    label: "Act 1",
    levelMin: 1,
    levelMax: 12,
    title: "Twilight Strand",
    summary: "",
    passives: [],
    gems: [],
    gear: [],
    checklist: [],
    notes: [],
    ...overrides,
  };
}

function makeBuild(overrides: Partial<Build> = {}): Build {
  return {
    id: "build-1",
    name: "Test Build",
    className: "Witch",
    ascendancy: "Occultist",
    sourceType: "code",
    sourceValue: "<PathOfBuilding/>",
    importedAt: "2026-01-01T00:00:00.000Z",
    notes: "",
    warnings: [],
    summary: { tagline: "", playstyle: "", nextUpgrade: "", warningCards: [] },
    stages: [makeStage()],
    labs: [],
    ...overrides,
  };
}

describe("createInitialProgress", () => {
  it("takes the character level from the imported PoB data", () => {
    const progress = createInitialProgress(
      makeBuild({ pob: makePobData({ level: 68 }) }),
    );

    expect(progress.playerLevel).toBe(68);
  });

  it("falls back to the first stage's minimum level when the PoB has none", () => {
    const build = makeBuild({ stages: [makeStage({ levelMin: 12 })] });

    expect(createInitialProgress(build).playerLevel).toBe(12);
  });

  it("starts at level 1 when neither PoB data nor stages are available", () => {
    const build = makeBuild({ stages: [] });

    expect(createInitialProgress(build).playerLevel).toBe(1);
  });

  it("clamps a level above the level 100 cap", () => {
    const build = makeBuild({ pob: makePobData({ level: 123 }) });

    expect(createInitialProgress(build).playerLevel).toBe(100);
  });

  it("clamps a zero or negative level up to 1", () => {
    expect(
      createInitialProgress(makeBuild({ pob: makePobData({ level: 0 }) })).playerLevel,
    ).toBe(1);
    expect(
      createInitialProgress(makeBuild({ pob: makePobData({ level: -5 }) })).playerLevel,
    ).toBe(1);
  });

  it("starts with an empty checklist, no pins, and points at the first stage", () => {
    const build = makeBuild({
      stages: [makeStage({ id: "stage-a" }), makeStage({ id: "stage-b", order: 2 })],
    });

    const progress = createInitialProgress(build);

    expect(progress.buildId).toBe("build-1");
    expect(progress.currentStageId).toBe("stage-a");
    expect(progress.completedChecklistIds).toEqual([]);
    expect(progress.pinnedItemIds).toEqual([]);
  });
});

describe("rehydrateImportedBuild", () => {
  it("returns a build without PoB data untouched", () => {
    const build = makeBuild({ stages: [], labs: [] });

    expect(rehydrateImportedBuild(build)).toBe(build);
  });

  it("keeps a league that is already known", () => {
    const build = makeBuild({ league: "Settlers", pob: makePobData() });

    expect(rehydrateImportedBuild(build).league).toBe("Settlers");
  });
});

import { describe, it, expect } from "vitest";
import {
  getSelectedBuild,
  getBuildProgress,
  findStageForLevel,
  getCurrentStage,
  getNextObjectives,
  getPinnedItems,
} from "../selectors";
import type { AppState, Build, BuildStage, UserProgress, ChecklistItem } from "@/domain/models";

function makeChecklistItem(overrides: Partial<ChecklistItem> & { id: string }): ChecklistItem {
  return {
    text: `Item ${overrides.id}`,
    type: "quest",
    required: true,
    ...overrides,
  };
}

function makeStage(overrides: Partial<BuildStage> & { id: string }): BuildStage {
  return {
    buildId: "build-1",
    order: 1,
    label: "Act 1",
    levelMin: 1,
    levelMax: 30,
    title: `Stage ${overrides.id}`,
    summary: "",
    passives: [],
    gems: [],
    gear: [],
    checklist: [],
    notes: [],
    ...overrides,
  };
}

function makeBuild(overrides: Partial<Build> & { id: string }): Build {
  return {
    name: "Test Build",
    className: "Marauder",
    ascendancy: "Juggernaut",
    sourceType: "link",
    sourceValue: "https://example.com",
    importedAt: "2025-01-01",
    notes: "",
    warnings: [],
    summary: { tagline: "", playstyle: "", nextUpgrade: "", warningCards: [] },
    stages: [],
    labs: [],
    ...overrides,
  };
}

function makeProgress(overrides: Partial<UserProgress> & { buildId: string }): UserProgress {
  return {
    id: `prog-${overrides.buildId}`,
    playerLevel: 1,
    currentStageId: "stage-1",
    completedChecklistIds: [],
    pinnedItemIds: [],
    updatedAt: "2025-01-01",
    ...overrides,
  };
}

function makeState(overrides: Partial<AppState> = {}): AppState {
  return {
    builds: [],
    selectedBuildId: null,
    progressByBuildId: {},
    activeTab: "overview",
    overlayOpacity: 85,
    ...overrides,
  };
}

describe("getSelectedBuild", () => {
  it("returns the build matching selectedBuildId", () => {
    const build1 = makeBuild({ id: "b1" });
    const build2 = makeBuild({ id: "b2" });
    const state = makeState({
      builds: [build1, build2],
      selectedBuildId: "b2",
    });

    expect(getSelectedBuild(state)).toBe(build2);
  });

  it("returns undefined when selectedBuildId is null", () => {
    const state = makeState({
      builds: [makeBuild({ id: "b1" })],
      selectedBuildId: null,
    });

    expect(getSelectedBuild(state)).toBeUndefined();
  });

  it("returns undefined when selectedBuildId does not match any build", () => {
    const state = makeState({
      builds: [makeBuild({ id: "b1" })],
      selectedBuildId: "nonexistent",
    });

    expect(getSelectedBuild(state)).toBeUndefined();
  });
});

describe("getBuildProgress", () => {
  it("returns progress for the given buildId", () => {
    const progress = makeProgress({ buildId: "b1", playerLevel: 50 });
    const state = makeState({
      progressByBuildId: { b1: progress },
    });

    expect(getBuildProgress(state, "b1")).toBe(progress);
  });

  it("returns undefined for unknown buildId", () => {
    const state = makeState({ progressByBuildId: {} });
    expect(getBuildProgress(state, "unknown")).toBeUndefined();
  });
});

describe("findStageForLevel", () => {
  const stages = [
    makeStage({ id: "s1", levelMin: 1, levelMax: 30, order: 1 }),
    makeStage({ id: "s2", levelMin: 31, levelMax: 60, order: 2 }),
    makeStage({ id: "s3", levelMin: 61, levelMax: 100, order: 3 }),
  ];
  const build = makeBuild({ id: "b1", stages });

  it("returns the stage containing the player level", () => {
    expect(findStageForLevel(build, 15)).toBe(stages[0]);
    expect(findStageForLevel(build, 45)).toBe(stages[1]);
    expect(findStageForLevel(build, 80)).toBe(stages[2]);
  });

  it("returns first stage when level is below all ranges", () => {
    // Level 0 is below stage[0].levelMin=1, but the find will match
    // since 0 >= 1 is false, so falls through to the below-minimum check
    expect(findStageForLevel(build, 0)).toBe(stages[0]);
  });

  it("returns last stage when level exceeds all ranges", () => {
    expect(findStageForLevel(build, 200)).toBe(stages[2]);
  });

  it("returns matching stage at boundary values", () => {
    expect(findStageForLevel(build, 1)).toBe(stages[0]);
    expect(findStageForLevel(build, 30)).toBe(stages[0]);
    expect(findStageForLevel(build, 31)).toBe(stages[1]);
    expect(findStageForLevel(build, 100)).toBe(stages[2]);
  });

  it("throws when build has no stages", () => {
    const emptyBuild = makeBuild({ id: "b2", stages: [] });
    expect(() => findStageForLevel(emptyBuild, 50)).toThrow("has no stages");
  });
});

describe("getCurrentStage", () => {
  const stages = [
    makeStage({ id: "s1", levelMin: 1, levelMax: 30 }),
    makeStage({ id: "s2", levelMin: 31, levelMax: 60 }),
  ];
  const build = makeBuild({ id: "b1", stages });

  it("returns the stage matching progress.currentStageId", () => {
    const progress = makeProgress({ buildId: "b1", currentStageId: "s2", playerLevel: 10 });
    expect(getCurrentStage(build, progress)).toBe(stages[1]);
  });

  it("falls back to findStageForLevel when currentStageId does not match", () => {
    const progress = makeProgress({ buildId: "b1", currentStageId: "nonexistent", playerLevel: 45 });
    expect(getCurrentStage(build, progress)).toBe(stages[1]);
  });
});

describe("getNextObjectives", () => {
  const items1 = [
    makeChecklistItem({ id: "c1" }),
    makeChecklistItem({ id: "c2" }),
    makeChecklistItem({ id: "c3" }),
  ];
  const items2 = [
    makeChecklistItem({ id: "c4" }),
    makeChecklistItem({ id: "c5" }),
  ];
  const stages = [
    makeStage({ id: "s1", levelMin: 1, levelMax: 30, checklist: items1 }),
    makeStage({ id: "s2", levelMin: 31, levelMax: 60, checklist: items2 }),
  ];
  const build = makeBuild({ id: "b1", stages });

  it("returns up to 3 uncompleted objectives from current stage first", () => {
    const progress = makeProgress({
      buildId: "b1",
      currentStageId: "s1",
      completedChecklistIds: [],
    });

    const result = getNextObjectives(build, progress);
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.id)).toEqual(["c1", "c2", "c3"]);
    expect(result[0].stageTitle).toBe("Stage s1");
  });

  it("skips completed items", () => {
    const progress = makeProgress({
      buildId: "b1",
      currentStageId: "s1",
      completedChecklistIds: ["c1", "c2"],
    });

    const result = getNextObjectives(build, progress);
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.id)).toEqual(["c3", "c4", "c5"]);
  });

  it("respects custom limit", () => {
    const progress = makeProgress({
      buildId: "b1",
      currentStageId: "s1",
      completedChecklistIds: [],
    });

    const result = getNextObjectives(build, progress, 2);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(["c1", "c2"]);
  });

  it("returns empty array when all items completed", () => {
    const progress = makeProgress({
      buildId: "b1",
      currentStageId: "s1",
      completedChecklistIds: ["c1", "c2", "c3", "c4", "c5"],
    });

    const result = getNextObjectives(build, progress);
    expect(result).toHaveLength(0);
  });

  it("includes stageTitle on each returned item", () => {
    const progress = makeProgress({
      buildId: "b1",
      currentStageId: "s1",
      completedChecklistIds: ["c1", "c2", "c3"],
    });

    const result = getNextObjectives(build, progress);
    expect(result[0].stageTitle).toBe("Stage s2");
  });
});

describe("getPinnedItems", () => {
  const items = [
    makeChecklistItem({ id: "c1" }),
    makeChecklistItem({ id: "c2" }),
    makeChecklistItem({ id: "c3" }),
  ];
  const stages = [
    makeStage({ id: "s1", levelMin: 1, levelMax: 50, checklist: items }),
  ];
  const build = makeBuild({ id: "b1", stages });

  it("returns items matching pinnedItemIds", () => {
    const progress = makeProgress({
      buildId: "b1",
      pinnedItemIds: ["c1", "c3"],
    });

    const result = getPinnedItems(build, progress);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(["c1", "c3"]);
  });

  it("includes stageTitle on each pinned item", () => {
    const progress = makeProgress({
      buildId: "b1",
      pinnedItemIds: ["c2"],
    });

    const result = getPinnedItems(build, progress);
    expect(result[0].stageTitle).toBe("Stage s1");
  });

  it("returns empty array when no items are pinned", () => {
    const progress = makeProgress({
      buildId: "b1",
      pinnedItemIds: [],
    });

    const result = getPinnedItems(build, progress);
    expect(result).toHaveLength(0);
  });

  it("ignores pinned IDs that don't exist in any stage", () => {
    const progress = makeProgress({
      buildId: "b1",
      pinnedItemIds: ["nonexistent"],
    });

    const result = getPinnedItems(build, progress);
    expect(result).toHaveLength(0);
  });

  it("returns pinned items across multiple stages", () => {
    const itemsA = [makeChecklistItem({ id: "a1" })];
    const itemsB = [makeChecklistItem({ id: "b1" })];
    const multiStages = [
      makeStage({ id: "s1", checklist: itemsA }),
      makeStage({ id: "s2", checklist: itemsB }),
    ];
    const multiBuild = makeBuild({ id: "mb1", stages: multiStages });
    const progress = makeProgress({
      buildId: "mb1",
      pinnedItemIds: ["a1", "b1"],
    });

    const result = getPinnedItems(multiBuild, progress);
    expect(result).toHaveLength(2);
    expect(result[0].stageTitle).toBe("Stage s1");
    expect(result[1].stageTitle).toBe("Stage s2");
  });
});

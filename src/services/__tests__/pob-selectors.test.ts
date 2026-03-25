import { describe, it, expect } from "vitest";
import {
  getActivePobTreeSpec,
  getSuggestedPobTreeSpecForLevel,
  getNextPobTreeSpecForLevel,
  getActivePobItemSet,
  getActivePobSkillGroups,
} from "../pob-selectors";
import type { PobData, PobTreeSpec, PobItemSet, PobSkillGroup } from "@/domain/models";

function makeSpec(overrides: Partial<PobTreeSpec> & { id: string; title: string }): PobTreeSpec {
  return {
    isActive: false,
    ...overrides,
  };
}

function makeItemSet(overrides: Partial<PobItemSet> & { id: string; title: string }): PobItemSet {
  return {
    isActive: false,
    slots: [],
    ...overrides,
  };
}

function makeSkillGroup(
  overrides: Partial<PobSkillGroup> & { id: string; setId: string; setTitle: string },
): PobSkillGroup {
  return {
    label: "",
    enabled: true,
    isSelected: false,
    gems: [],
    ...overrides,
  };
}

function makePob(overrides: Partial<PobData> = {}): PobData {
  return {
    level: 90,
    treeSpecs: [],
    skillGroups: [],
    itemSets: [],
    items: [],
    notes: "",
    ...overrides,
  };
}

describe("getActivePobTreeSpec", () => {
  it("returns undefined when pob is undefined", () => {
    expect(getActivePobTreeSpec(undefined)).toBeUndefined();
  });

  it("returns the spec matching activeTreeSpecId", () => {
    const spec1 = makeSpec({ id: "1", title: "Leveling", isActive: false });
    const spec2 = makeSpec({ id: "2", title: "Endgame", isActive: false });
    const pob = makePob({
      activeTreeSpecId: "2",
      treeSpecs: [spec1, spec2],
    });

    expect(getActivePobTreeSpec(pob)).toBe(spec2);
  });

  it("falls back to isActive spec when activeTreeSpecId does not match", () => {
    const spec1 = makeSpec({ id: "1", title: "Leveling", isActive: true });
    const spec2 = makeSpec({ id: "2", title: "Endgame", isActive: false });
    const pob = makePob({
      activeTreeSpecId: "nonexistent",
      treeSpecs: [spec1, spec2],
    });

    expect(getActivePobTreeSpec(pob)).toBe(spec1);
  });

  it("falls back to first spec when nothing else matches", () => {
    const spec1 = makeSpec({ id: "1", title: "Leveling", isActive: false });
    const spec2 = makeSpec({ id: "2", title: "Endgame", isActive: false });
    const pob = makePob({
      activeTreeSpecId: "nonexistent",
      treeSpecs: [spec1, spec2],
    });

    expect(getActivePobTreeSpec(pob)).toBe(spec1);
  });

  it("returns undefined for pob with empty treeSpecs", () => {
    const pob = makePob({ treeSpecs: [] });
    expect(getActivePobTreeSpec(pob)).toBeUndefined();
  });
});

describe("getSuggestedPobTreeSpecForLevel", () => {
  it("returns undefined when pob is undefined", () => {
    expect(getSuggestedPobTreeSpecForLevel(undefined, 50)).toBeUndefined();
  });

  it("returns the spec whose level hint is <= playerLevel (highest match)", () => {
    const specs = [
      makeSpec({ id: "1", title: "Level 30 tree", isActive: false }),
      makeSpec({ id: "2", title: "Level 60 tree", isActive: false }),
      makeSpec({ id: "3", title: "Level 90 tree", isActive: false }),
    ];
    const pob = makePob({ treeSpecs: specs });

    const result = getSuggestedPobTreeSpecForLevel(pob, 75);
    // Level 75 >= 60 but < 90, so should match "Level 60 tree"
    expect(result).toBe(specs[1]);
  });

  it("returns the first (lowest level) spec when player level is below all hints", () => {
    const specs = [
      makeSpec({ id: "1", title: "Level 30 tree", isActive: false }),
      makeSpec({ id: "2", title: "Level 60 tree", isActive: false }),
    ];
    const pob = makePob({ treeSpecs: specs });

    const result = getSuggestedPobTreeSpecForLevel(pob, 10);
    expect(result).toBe(specs[0]);
  });

  it("returns the highest-level spec when player level exceeds all", () => {
    const specs = [
      makeSpec({ id: "1", title: "Level 30 tree", isActive: false }),
      makeSpec({ id: "2", title: "Level 60 tree", isActive: false }),
    ];
    const pob = makePob({ treeSpecs: specs });

    const result = getSuggestedPobTreeSpecForLevel(pob, 100);
    expect(result).toBe(specs[1]);
  });

  it("falls back to active spec when no specs have level hints", () => {
    const specs = [
      makeSpec({ id: "1", title: "Main tree", isActive: true }),
      makeSpec({ id: "2", title: "Alternate", isActive: false }),
    ];
    const pob = makePob({ treeSpecs: specs });

    const result = getSuggestedPobTreeSpecForLevel(pob, 50);
    // No level hints → falls back to getActivePobTreeSpec
    expect(result).toBe(specs[0]);
  });
});

describe("getNextPobTreeSpecForLevel", () => {
  it("returns undefined when pob is undefined", () => {
    expect(getNextPobTreeSpecForLevel(undefined, 50)).toBeUndefined();
  });

  it("returns the next spec whose level hint is above playerLevel", () => {
    const specs = [
      makeSpec({ id: "1", title: "Level 30 tree", isActive: false }),
      makeSpec({ id: "2", title: "Level 60 tree", isActive: false }),
      makeSpec({ id: "3", title: "Level 90 tree", isActive: false }),
    ];
    const pob = makePob({ treeSpecs: specs });

    const result = getNextPobTreeSpecForLevel(pob, 50);
    expect(result).toBe(specs[1]); // Level 60 > 50
  });

  it("returns undefined when playerLevel exceeds all level hints", () => {
    const specs = [
      makeSpec({ id: "1", title: "Level 30 tree", isActive: false }),
      makeSpec({ id: "2", title: "Level 60 tree", isActive: false }),
    ];
    const pob = makePob({ treeSpecs: specs });

    expect(getNextPobTreeSpecForLevel(pob, 100)).toBeUndefined();
  });

  it("returns undefined when no specs have level hints", () => {
    const specs = [
      makeSpec({ id: "1", title: "Main tree", isActive: false }),
    ];
    const pob = makePob({ treeSpecs: specs });

    expect(getNextPobTreeSpecForLevel(pob, 50)).toBeUndefined();
  });
});

describe("getActivePobItemSet", () => {
  it("returns undefined when pob is undefined", () => {
    expect(getActivePobItemSet(undefined)).toBeUndefined();
  });

  it("returns the item set matching activeItemSetId", () => {
    const set1 = makeItemSet({ id: "is1", title: "Leveling gear" });
    const set2 = makeItemSet({ id: "is2", title: "Endgame gear" });
    const pob = makePob({
      activeItemSetId: "is2",
      itemSets: [set1, set2],
    });

    expect(getActivePobItemSet(pob)).toBe(set2);
  });

  it("falls back to isActive item set when id does not match", () => {
    const set1 = makeItemSet({ id: "is1", title: "Leveling gear", isActive: true });
    const set2 = makeItemSet({ id: "is2", title: "Endgame gear" });
    const pob = makePob({
      activeItemSetId: "nonexistent",
      itemSets: [set1, set2],
    });

    expect(getActivePobItemSet(pob)).toBe(set1);
  });

  it("falls back to first item set when nothing else matches", () => {
    const set1 = makeItemSet({ id: "is1", title: "Leveling gear" });
    const set2 = makeItemSet({ id: "is2", title: "Endgame gear" });
    const pob = makePob({
      itemSets: [set1, set2],
    });

    expect(getActivePobItemSet(pob)).toBe(set1);
  });

  it("uses title matching to correlate tree spec with item set", () => {
    const spec = makeSpec({ id: "t1", title: "Endgame Level 90", isActive: true });
    const set1 = makeItemSet({ id: "is1", title: "Leveling" });
    const set2 = makeItemSet({ id: "is2", title: "Endgame Level 90" });
    const pob = makePob({
      activeTreeSpecId: "t1",
      treeSpecs: [spec],
      itemSets: [set1, set2],
      activeItemSetId: "is1",
    });

    // The function uses title matching to prefer set2 because it matches the tree spec title
    const result = getActivePobItemSet(pob);
    expect(result).toBe(set2);
  });
});

describe("getActivePobSkillGroups", () => {
  it("returns empty array when pob is undefined", () => {
    expect(getActivePobSkillGroups(undefined)).toEqual([]);
  });

  it("returns skill groups matching activeSkillSetId", () => {
    const g1 = makeSkillGroup({ id: "g1", setId: "s1", setTitle: "Set 1" });
    const g2 = makeSkillGroup({ id: "g2", setId: "s1", setTitle: "Set 1" });
    const g3 = makeSkillGroup({ id: "g3", setId: "s2", setTitle: "Set 2" });
    const pob = makePob({
      activeSkillSetId: "s1",
      skillGroups: [g1, g2, g3],
    });

    const result = getActivePobSkillGroups(pob);
    expect(result).toEqual([g1, g2]);
  });

  it("falls back to isSelected groups when no set ID matches", () => {
    const g1 = makeSkillGroup({ id: "g1", setId: "s1", setTitle: "Set 1", isSelected: true });
    const g2 = makeSkillGroup({ id: "g2", setId: "s1", setTitle: "Set 1", isSelected: false });
    const pob = makePob({
      skillGroups: [g1, g2],
    });

    const result = getActivePobSkillGroups(pob);
    expect(result).toEqual([g1]);
  });

  it("returns all groups when no isSelected groups exist and no activeSkillSetId", () => {
    const g1 = makeSkillGroup({ id: "g1", setId: "s1", setTitle: "Set 1" });
    const g2 = makeSkillGroup({ id: "g2", setId: "s1", setTitle: "Set 1" });
    const pob = makePob({
      skillGroups: [g1, g2],
    });

    const result = getActivePobSkillGroups(pob);
    expect(result).toEqual([g1, g2]);
  });

  it("returns empty array for pob with no skill groups", () => {
    const pob = makePob({ skillGroups: [] });
    expect(getActivePobSkillGroups(pob)).toEqual([]);
  });
});

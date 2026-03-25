import { describe, it, expect } from "vitest";
import { parseClusterMods } from "../cluster-expansion";

describe("parseClusterMods", () => {
  describe("totalPassives extraction", () => {
    it("extracts total passives from 'Adds N Passive Skills' mod", () => {
      const result = parseClusterMods(["Adds 8 Passive Skills"]);
      expect(result.totalPassives).toBe(8);
    });

    it("extracts total passives from singular form", () => {
      const result = parseClusterMods(["Adds 3 Passive Skill"]);
      expect(result.totalPassives).toBe(3);
    });

    it("returns 0 total passives when no matching mod", () => {
      const result = parseClusterMods(["Some other mod"]);
      expect(result.totalPassives).toBe(0);
    });
  });

  describe("jewelSocketCount extraction", () => {
    it("extracts jewel socket count from '1 Added Passive Skill are Jewel Socket'", () => {
      const result = parseClusterMods(["1 Added Passive Skill are Jewel Socket"]);
      expect(result.jewelSocketCount).toBe(1);
    });

    it("extracts jewel socket count from plural form", () => {
      const result = parseClusterMods(["2 Added Passive Skills are Jewel Sockets"]);
      // The regex matches "Jewel Socket" with optional "s" — let's check
      // Regex: /(\d+) Added Passive Skills? are Jewel Socket/i
      // "2 Added Passive Skills are Jewel Sockets" — "Skills" matches "Skills?", "Jewel Sockets" starts with "Jewel Socket"
      expect(result.jewelSocketCount).toBe(2);
    });

    it("returns 0 when no socket mod present", () => {
      const result = parseClusterMods(["Adds 8 Passive Skills"]);
      expect(result.jewelSocketCount).toBe(0);
    });
  });

  describe("notableNames extraction", () => {
    it("extracts a single notable name", () => {
      const result = parseClusterMods([
        "1 Added Passive Skill is Fuel the Fight",
      ]);
      expect(result.notableNames).toEqual(["Fuel the Fight"]);
    });

    it("extracts multiple notable names from separate mods", () => {
      const result = parseClusterMods([
        "1 Added Passive Skill is Feed the Fury",
        "1 Added Passive Skill is Fuel the Fight",
      ]);
      expect(result.notableNames).toEqual(["Feed the Fury", "Fuel the Fight"]);
    });

    it("returns empty array when no notable mods", () => {
      const result = parseClusterMods(["Adds 4 Passive Skills"]);
      expect(result.notableNames).toEqual([]);
    });
  });

  describe("smallPassiveGrants extraction", () => {
    it("extracts small passive grants", () => {
      const result = parseClusterMods([
        "Added Small Passive Skills grant: 12% increased Attack Damage",
      ]);
      expect(result.smallPassiveGrants).toEqual([
        "12% increased Attack Damage",
      ]);
    });

    it("extracts small passive grants with 'also' keyword", () => {
      const result = parseClusterMods([
        "Added Small Passive Skills also grant: +5% to Fire Resistance",
      ]);
      expect(result.smallPassiveGrants).toEqual(["+5% to Fire Resistance"]);
    });

    it("extracts multiple grant mods", () => {
      const result = parseClusterMods([
        "Added Small Passive Skills grant: 12% increased Attack Damage",
        "Added Small Passive Skills also grant: +5% to Fire Resistance",
      ]);
      expect(result.smallPassiveGrants).toEqual([
        "12% increased Attack Damage",
        "+5% to Fire Resistance",
      ]);
    });

    it("returns empty array when no grant mods", () => {
      const result = parseClusterMods(["Adds 4 Passive Skills"]);
      expect(result.smallPassiveGrants).toEqual([]);
    });
  });

  describe("complete cluster jewel parsing", () => {
    it("parses a typical large cluster jewel", () => {
      const mods = [
        "Adds 8 Passive Skills",
        "2 Added Passive Skills are Jewel Sockets",
        "1 Added Passive Skill is Feed the Fury",
        "1 Added Passive Skill is Fuel the Fight",
        "Added Small Passive Skills grant: 12% increased Attack Damage",
      ];

      const result = parseClusterMods(mods);
      expect(result.totalPassives).toBe(8);
      expect(result.jewelSocketCount).toBe(2);
      expect(result.notableNames).toEqual(["Feed the Fury", "Fuel the Fight"]);
      expect(result.smallPassiveGrants).toEqual([
        "12% increased Attack Damage",
      ]);
    });

    it("parses a medium cluster jewel", () => {
      const mods = [
        "Adds 4 Passive Skills",
        "1 Added Passive Skill are Jewel Socket",
        "1 Added Passive Skill is Wish for Death",
        "Added Small Passive Skills grant: 10% increased Damage over Time",
      ];

      const result = parseClusterMods(mods);
      expect(result.totalPassives).toBe(4);
      expect(result.jewelSocketCount).toBe(1);
      expect(result.notableNames).toEqual(["Wish for Death"]);
      expect(result.smallPassiveGrants).toEqual([
        "10% increased Damage over Time",
      ]);
    });

    it("parses a small cluster jewel (no sockets)", () => {
      const mods = [
        "Adds 2 Passive Skills",
        "1 Added Passive Skill is Self-Fulfilling Prophecy",
        "Added Small Passive Skills grant: 6% increased Spell Damage",
      ];

      const result = parseClusterMods(mods);
      expect(result.totalPassives).toBe(2);
      expect(result.jewelSocketCount).toBe(0);
      expect(result.notableNames).toEqual(["Self-Fulfilling Prophecy"]);
      expect(result.smallPassiveGrants).toEqual([
        "6% increased Spell Damage",
      ]);
    });
  });

  describe("edge cases", () => {
    it("handles empty mod array", () => {
      const result = parseClusterMods([]);
      expect(result.totalPassives).toBe(0);
      expect(result.jewelSocketCount).toBe(0);
      expect(result.notableNames).toEqual([]);
      expect(result.smallPassiveGrants).toEqual([]);
    });

    it("ignores unrecognized mod lines", () => {
      const result = parseClusterMods([
        "Adds 6 Passive Skills",
        "This is not a real mod",
        "Another random string",
        "1 Added Passive Skill is Adrenaline",
      ]);
      expect(result.totalPassives).toBe(6);
      expect(result.notableNames).toEqual(["Adrenaline"]);
    });

    it("handles mods with varied casing", () => {
      const result = parseClusterMods([
        "adds 5 passive skills",
        "added small passive skills grant: 10% increased damage",
      ]);
      expect(result.totalPassives).toBe(5);
      expect(result.smallPassiveGrants).toEqual(["10% increased damage"]);
    });
  });
});

import { describe, it, expect } from "vitest";
import { createRoller, createSeed, formatChallengeCode, normalizeSeed, parseChallengeCode } from "../rng";

/**
 * Business rules under test — from src/services/challenge/README.md §1:
 *
 * Seed format
 *   - 6 characters over Crockford base32 (no I, L, O, U), so a seed read out loud
 *     or copied by hand is unambiguous.
 *   - The characters a human is likely to type instead (I, L → 1; O → 0; U → V)
 *     are repaired rather than rejected; anything else is rejected outright,
 *     because silently loading a *different* challenge is worse than an error.
 *   - A challenge code is `<difficulty>:<SEED>`.
 *
 * Determinism
 *   - A roller is a pure function of (seed, channel): same inputs, same picks.
 *   - Different channels must not move together, so adding a rule to one tier
 *     cannot shift the picks of another.
 *   - Picking from an empty pool is a programming error and must throw rather
 *     than return undefined.
 */

describe("createSeed", () => {
  it("produces 6 characters from the unambiguous alphabet", () => {
    const seed = createSeed(() => 0.5);

    expect(seed).toHaveLength(6);
    expect(seed).toMatch(/^[0-9A-HJKMNP-TV-Z]{6}$/);
  });

  it("is driven entirely by the random source it is given", () => {
    expect(createSeed(() => 0)).toBe("000000");
    expect(createSeed(() => 0.999999)).toBe("ZZZZZZ");
  });
});

describe("normalizeSeed", () => {
  it("uppercases user input", () => {
    expect(normalizeSeed("8f3k22")).toBe("8F3K22");
  });

  it("repairs the characters the alphabet deliberately excludes", () => {
    expect(normalizeSeed("IL0UAB")).toBe("110VAB");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeSeed("  8F3K22 ")).toBe("8F3K22");
  });

  it("rejects a seed of the wrong length", () => {
    expect(normalizeSeed("8F3K2")).toBeNull();
    expect(normalizeSeed("8F3K222")).toBeNull();
  });

  it("rejects characters outside the alphabet", () => {
    expect(normalizeSeed("8F3K2-")).toBeNull();
  });
});

describe("parseChallengeCode", () => {
  it("round-trips a formatted code", () => {
    expect(parseChallengeCode(formatChallengeCode("hard", "8F3K22"))).toEqual({
      difficulty: "hard",
      seed: "8F3K22",
    });
  });

  it("accepts a hand-typed code and repairs it", () => {
    expect(parseChallengeCode("EXTREME:8f3k2o")).toEqual({
      difficulty: "extreme",
      seed: "8F3K20",
    });
  });

  it("rejects an unknown difficulty", () => {
    expect(parseChallengeCode("nightmare:8F3K22")).toBeNull();
  });

  it("rejects a malformed code", () => {
    expect(parseChallengeCode("8F3K22")).toBeNull();
    expect(parseChallengeCode("hard:8F3K22:extra")).toBeNull();
    expect(parseChallengeCode("hard:")).toBeNull();
  });
});

describe("createRoller", () => {
  const items = ["a", "b", "c", "d", "e", "f", "g", "h"];

  it("gives the same picks for the same seed and channel", () => {
    const first = createRoller("8F3K22", "skill");
    const second = createRoller("8F3K22", "skill");

    expect(first.pickMany(items, 4)).toEqual(second.pickMany(items, 4));
  });

  it("gives different picks for different seeds", () => {
    const sequences = new Set(
      ["AAAAAA", "AAAAAB", "AAAAAC", "AAAAAD", "ZZZZZZ"].map((seed) =>
        createRoller(seed, "skill").pickMany(items, 4).join(),
      ),
    );

    expect(sequences.size).toBeGreaterThan(1);
  });

  it("keeps channels independent", () => {
    const seed = "8F3K22";
    const skill = createRoller(seed, "skill").pickMany(items, 8).join();
    const weapon = createRoller(seed, "weapon").pickMany(items, 8).join();

    expect(skill).not.toBe(weapon);
  });

  it("never repeats an item within one pickMany", () => {
    const picked = createRoller("8F3K22", "supports").pickMany(items, 5);

    expect(new Set(picked).size).toBe(picked.length);
  });

  it("returns everything it can when asked for more than the pool holds", () => {
    expect(createRoller("8F3K22", "x").pickMany(items, 99)).toHaveLength(items.length);
  });

  it("throws when picking from an empty pool", () => {
    expect(() => createRoller("8F3K22", "x").pick([])).toThrow(/empty pool/i);
  });

  it("keeps int() inside the requested bounds", () => {
    const roller = createRoller("8F3K22", "x");

    for (let i = 0; i < 200; i++) {
      const value = roller.int(3, 7);
      expect(value).toBeGreaterThanOrEqual(3);
      expect(value).toBeLessThanOrEqual(7);
    }
  });
});

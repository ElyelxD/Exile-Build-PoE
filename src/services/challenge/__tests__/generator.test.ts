import { describe, it, expect } from "vitest";
import { CHALLENGE_DIFFICULTIES, type ChallengeDifficulty } from "@/domain/challenge";
import { ASCENDANCY_BY_CLASS_ID, CLASS_ID_TO_NAME } from "@/domain/poe-classes";
import poolData from "@/data/challenge-pool.json";
import { DIFFICULTY_CONFIG, generateChallenge } from "../generator";
import { bannableSupports, eligibleSupports, stripSupportSuffix, withSupportSuffix } from "../gem-planner";

/**
 * Business rules under test — from src/services/challenge/README.md §2 and §3:
 *
 * Determinism (D1)
 *   - generateChallenge(difficulty, seed) is pure: same inputs, deeply equal output.
 *   - Different seeds must actually explore the pool, otherwise "random" is a lie.
 *
 * Rubric (R1)
 *   - Constraints are cumulative: easy < medium < hard < extreme in rule count.
 *   - Target levels are 70 / 80 / 90 / 95.
 *   - Only medium and up mandate a weapon and a unique; only hard and up mandate a
 *     keystone, ban other uniques and ban exactly two supports; only extreme adds
 *     exactly two extra rules.
 *
 * Coherence (C2–C7) — a roll that cannot be played is worthless
 *   - The ascendancy always belongs to the rolled class.
 *   - The mandated weapon is one the mandated skill can actually use.
 *   - The mandated keystone fits the skill's tags (requires ⊆ tags, forbids ∩ tags = ∅).
 *   - A mandated weapon unique only appears alongside its own weapon family.
 *   - Banned supports are supports the skill could actually have used, and distinct.
 *   - Extreme's extra rules are distinct and never redundant with the keystone.
 */

const SEEDS = [
  "8F3K22", "AAAAAA", "ZZZZZZ", "0Q9WMB", "T4V7XN", "3B8HJK", "PPQR55", "1234ZZ",
  "MN0P2Q", "9WXYZ0", "5S6T7V", "HJKMNP", "22B33C", "QRSTVW", "0000ZZ", "G7H8J9",
];

const pool = poolData as unknown as {
  weaponGroups: Record<string, string[]>;
  skills: Array<{ name: string; tags: string[]; weaponGroup: string }>;
  keystones: Array<{ name: string; requires?: string[]; forbids?: string[] }>;
};

function everyRoll(callback: (difficulty: ChallengeDifficulty, seed: string) => void) {
  for (const difficulty of CHALLENGE_DIFFICULTIES) {
    for (const seed of SEEDS) {
      callback(difficulty, seed);
    }
  }
}

describe("determinism", () => {
  it("returns a deeply equal challenge for the same difficulty and seed", () => {
    everyRoll((difficulty, seed) => {
      expect(generateChallenge(difficulty, seed)).toEqual(generateChallenge(difficulty, seed));
    });
  });

  it("carries its own identity in `code`", () => {
    expect(generateChallenge("hard", "8F3K22").code).toBe("hard:8F3K22");
  });

  it("explores the pool across seeds instead of always rolling the same build", () => {
    const skills = new Set(SEEDS.map((seed) => generateChallenge("hard", seed).skill.name));
    const classes = new Set(SEEDS.map((seed) => generateChallenge("hard", seed).className));

    expect(skills.size).toBeGreaterThan(SEEDS.length / 2);
    expect(classes.size).toBeGreaterThan(2);
  });

  it("changes the challenge when only the difficulty changes", () => {
    const easy = generateChallenge("easy", "8F3K22");
    const extreme = generateChallenge("extreme", "8F3K22");

    // Same seed keeps the identity picks stable; the difficulty adds constraints.
    expect(extreme.skill.name).toBe(easy.skill.name);
    expect(extreme.className).toBe(easy.className);
    expect(extreme.rules.length).toBeGreaterThan(easy.rules.length);
  });
});

describe("difficulty rubric", () => {
  it("adds rules monotonically from easy to extreme", () => {
    for (const seed of SEEDS) {
      const counts = CHALLENGE_DIFFICULTIES.map(
        (difficulty) => generateChallenge(difficulty, seed).rules.length,
      );

      expect(counts[0]).toBeLessThan(counts[1]);
      expect(counts[1]).toBeLessThan(counts[2]);
      expect(counts[2]).toBeLessThan(counts[3]);
    }
  });

  it("uses the documented target levels", () => {
    const levels = Object.fromEntries(
      CHALLENGE_DIFFICULTIES.map((difficulty) => [
        difficulty,
        generateChallenge(difficulty, "8F3K22").targetLevel,
      ]),
    );

    expect(levels).toEqual({ easy: 70, medium: 80, hard: 90, extreme: 95 });
  });

  it("keeps easy free of gear, keystone and support constraints", () => {
    for (const seed of SEEDS) {
      const spec = generateChallenge("easy", seed);

      expect(spec.weapon).toBeUndefined();
      expect(spec.unique).toBeUndefined();
      expect(spec.keystone).toBeUndefined();
      expect(spec.bannedSupports).toEqual([]);
      expect(spec.extraRules).toEqual([]);
      expect(spec.banMovementSkills).toBe(false);
      expect(spec.banOtherUniques).toBe(false);
    }
  });

  it("mandates a weapon, a unique and bans movement skills from medium up", () => {
    for (const difficulty of ["medium", "hard", "extreme"] as const) {
      for (const seed of SEEDS) {
        const spec = generateChallenge(difficulty, seed);

        expect(spec.weapon).toBeDefined();
        expect(spec.unique).toBeDefined();
        expect(spec.banMovementSkills).toBe(true);
      }
    }
  });

  it("mandates a keystone and bans two supports and other uniques from hard up", () => {
    for (const difficulty of ["hard", "extreme"] as const) {
      for (const seed of SEEDS) {
        const spec = generateChallenge(difficulty, seed);

        expect(spec.keystone).toBeDefined();
        expect(spec.banOtherUniques).toBe(true);
        expect(spec.bannedSupports).toHaveLength(2);
      }
    }
  });

  it("adds exactly two extra rules on extreme and none below", () => {
    for (const seed of SEEDS) {
      expect(generateChallenge("extreme", seed).extraRules).toHaveLength(2);
      expect(generateChallenge("hard", seed).extraRules).toHaveLength(0);
    }
  });

  it("keeps the config table in step with the rubric", () => {
    expect(DIFFICULTY_CONFIG.extreme.extraRuleCount).toBe(2);
    expect(DIFFICULTY_CONFIG.hard.bannedSupportCount).toBe(2);
    expect(DIFFICULTY_CONFIG.easy.bannedSupportCount).toBe(0);
  });
});

describe("coherence", () => {
  it("only picks an ascendancy that belongs to the rolled class (C2)", () => {
    everyRoll((difficulty, seed) => {
      const spec = generateChallenge(difficulty, seed);

      expect(CLASS_ID_TO_NAME[spec.classId]).toBe(spec.className);
      expect(ASCENDANCY_BY_CLASS_ID[spec.classId][spec.ascendancyId]).toBe(spec.ascendancy);
    });
  });

  it("only mandates a weapon the skill can actually use (C3)", () => {
    everyRoll((difficulty, seed) => {
      const spec = generateChallenge(difficulty, seed);

      if (spec.weapon) {
        expect(spec.skill.weapons).toContain(spec.weapon);
      }
    });
  });

  it("never mandates a bow for a non-bow skill (C3, spot check)", () => {
    everyRoll((difficulty, seed) => {
      const spec = generateChallenge(difficulty, seed);
      const isBowSkill = pool.skills.find((s) => s.name === spec.skill.name)?.weaponGroup === "bow";

      if (spec.weapon === "bow") {
        expect(isBowSkill).toBe(true);
      }
    });
  });

  it("only mandates a keystone that fits the skill (C4)", () => {
    everyRoll((difficulty, seed) => {
      const spec = generateChallenge(difficulty, seed);

      if (!spec.keystone) {
        return;
      }

      const definition = pool.keystones.find((k) => k.name === spec.keystone!.name)!;

      for (const tag of definition.requires ?? []) {
        expect(spec.skill.tags).toContain(tag);
      }

      for (const tag of definition.forbids ?? []) {
        expect(spec.skill.tags).not.toContain(tag);
      }
    });
  });

  it("only mandates a weapon unique alongside its own weapon family (C5)", () => {
    everyRoll((difficulty, seed) => {
      const spec = generateChallenge(difficulty, seed);

      if (spec.unique?.weapon) {
        expect(spec.unique.weapon).toBe(spec.weapon);
      }
    });
  });

  it("only bans supports the skill could have used, without repeats (C6)", () => {
    everyRoll((difficulty, seed) => {
      const spec = generateChallenge(difficulty, seed);
      const wanted = bannableSupports(spec.skill.name, spec.skill.tags).map(withSupportSuffix);

      expect(new Set(spec.bannedSupports).size).toBe(spec.bannedSupports.length);

      for (const name of spec.bannedSupports) {
        expect(wanted).toContain(name);
      }
    });
  });

  it("never suggests a support it just banned", () => {
    everyRoll((difficulty, seed) => {
      const spec = generateChallenge(difficulty, seed);

      for (const banned of spec.bannedSupports) {
        expect(spec.links).not.toContain(banned);
      }
    });
  });

  it("suggests only supports that legally link to the skill", () => {
    everyRoll((difficulty, seed) => {
      const spec = generateChallenge(difficulty, seed);
      const legal = eligibleSupports(spec.skill.name);

      expect(spec.links.length).toBeGreaterThan(0);

      for (const link of spec.links) {
        expect(legal).toContain(stripSupportSuffix(link));
      }
    });
  });

  it("never suggests a movement skill a rule forbids", () => {
    everyRoll((difficulty, seed) => {
      const spec = generateChallenge(difficulty, seed);

      if (spec.banMovementSkills) {
        expect(spec.gemGroups.some((group) => group.kind === "movement")).toBe(false);
      }
    });
  });

  it("never suggests an aura when the challenge banned auras", () => {
    for (const seed of SEEDS) {
      const spec = generateChallenge("extreme", seed);

      if (spec.extraRules.some((rule) => rule.id === "noAuras")) {
        expect(spec.gemGroups.some((group) => group.kind === "aura")).toBe(false);
      }
    }
  });

  it("keeps extreme's extra rules distinct and non-redundant (C7)", () => {
    for (const seed of SEEDS) {
      const spec = generateChallenge("extreme", seed);
      const ids = spec.extraRules.map((rule) => rule.id);

      expect(new Set(ids).size).toBe(ids.length);

      for (const rule of spec.extraRules) {
        expect(rule.redundantWithKeystones ?? []).not.toContain(spec.keystone?.name);
      }
    }
  });
});

describe("rendered rules", () => {
  it("renders one non-empty rule line per constraint", () => {
    everyRoll((difficulty, seed) => {
      const spec = generateChallenge(difficulty, seed);

      expect(spec.rules.length).toBeGreaterThan(0);

      for (const rule of spec.rules) {
        expect(rule.text.trim()).not.toBe("");
        // An unresolved {{param}} means a missing interpolation, not a rule.
        expect(rule.text).not.toMatch(/\{\{/);
      }
    });
  });

  it("names the picked skill, class and level in the rule list", () => {
    const spec = generateChallenge("extreme", "8F3K22");
    const text = spec.rules.map((rule) => rule.text).join("\n");

    expect(text).toContain(spec.skill.name);
    expect(text).toContain(spec.className);
    expect(text).toContain(String(spec.targetLevel));
    expect(text).toContain(spec.keystone!.name);
    expect(text).toContain(spec.unique!.name);
  });
});

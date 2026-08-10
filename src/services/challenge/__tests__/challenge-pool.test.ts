import { describe, it, expect } from "vitest";
import { CHALLENGE_SKILL_TAGS, type ChallengeSkillTag } from "@/domain/challenge";
import { bannableSupports, planLinks, withSupportSuffix } from "../gem-planner";
import poolData from "@/data/challenge-pool.json";
import gemColors from "@/data/gem-colors.json";
import poeIcons from "@/data/poe-icons.json";
import treeData from "@/data/tree-default.json";

/**
 * Business rules under test — from src/services/challenge/README.md §5:
 *
 * S1 — The pool is curated, and every name in it must be a real Path of Exile
 *      name as the bundled game data spells it. A typo here would surface to the
 *      player as an impossible rule ("use Ancestral Warchief" for a gem that no
 *      longer exists), so it must fail in CI instead.
 * S2 — Keystone node ids must exist in the bundled tree and still be keystones
 *      (node type 2), so a tree update that moves or removes one breaks the build
 *      rather than silently producing a challenge nobody can complete.
 *
 * Playability
 *   - Every skill must have at least one eligible keystone and at least two
 *     eligible supports, otherwise hard/extreme would silently drop rules for
 *     that skill and the difficulty rubric would not hold.
 */

interface PoolSkill {
  name: string;
  tags: string[];
  weaponGroup: string;
}

const pool = poolData as unknown as {
  weaponGroups: Record<string, string[]>;
  skills: PoolSkill[];
  uniques: Array<{ name: string; slot: string; weapon?: string }>;
  keystones: Array<{ name: string; nodeId: number; requires?: string[]; forbids?: string[] }>;
  extraRules: Array<{ id: string; redundantWithKeystones?: string[] }>;
};

const gemNames = new Set(Object.keys(gemColors as Record<string, string>));
const uniqueNames = new Set(Object.keys((poeIcons as { uniques: Record<string, string> }).uniques));

type RawNode = [number, number, number, number, string, string, ...unknown[]];
const nodes = (treeData as unknown as { nodes: RawNode[] }).nodes;
const keystoneIdByName = new Map(nodes.filter((node) => node[3] === 2).map((node) => [node[5], node[0]]));

function hasAll(tags: string[], required: string[] | undefined) {
  return (required ?? []).every((tag) => tags.includes(tag));
}

function hasNone(tags: string[], forbidden: string[] | undefined) {
  return !(forbidden ?? []).some((tag) => tags.includes(tag));
}

describe("skill pool", () => {
  it("only names gems the bundled gem data knows (S1)", () => {
    const unknown = pool.skills.filter((skill) => !gemNames.has(skill.name)).map((skill) => skill.name);

    expect(unknown).toEqual([]);
  });

  it("never lists a support gem as a main skill", () => {
    const supports = pool.skills.filter((skill) => skill.name.endsWith("Support")).map((s) => s.name);

    expect(supports).toEqual([]);
  });

  it("references only weapon groups that exist", () => {
    const unknown = pool.skills
      .filter((skill) => !pool.weaponGroups[skill.weaponGroup])
      .map((skill) => skill.weaponGroup);

    expect(unknown).toEqual([]);
  });

  it("gives every skill at least one tag", () => {
    expect(pool.skills.filter((skill) => skill.tags.length === 0)).toEqual([]);
  });

  /**
   * The pool is JSON, so TypeScript takes its tags on trust. An unknown tag is
   * silently ignored by the coherence rules and blows up the tree planner, which
   * is why the data has to be checked rather than cast.
   */
  it("only uses tags the domain defines", () => {
    const known = new Set<string>(CHALLENGE_SKILL_TAGS);
    const unknown = pool.skills.flatMap((skill) =>
      skill.tags.filter((tag) => !known.has(tag)).map((tag) => `${skill.name}: ${tag}`),
    );

    expect(unknown).toEqual([]);
  });

  it("only requires known tags on its keystones", () => {
    const known = new Set<string>(CHALLENGE_SKILL_TAGS);
    const unknown = pool.keystones
      .flatMap((k) => [...(k.requires ?? []), ...(k.forbids ?? [])])
      .filter((tag) => !known.has(tag));

    expect(unknown).toEqual([]);
  });

  it("has no duplicate skills", () => {
    const names = pool.skills.map((skill) => skill.name);

    expect(new Set(names).size).toBe(names.length);
  });
});

describe("support suggestions", () => {
  /**
   * Supports are no longer curated here: they come from PoB's own link rules via
   * the gem planner. What still has to hold is that the names it produces are
   * names this app can colour and illustrate.
   */
  it("only proposes supports the bundled gem data knows (S1)", () => {
    const unknown = new Set<string>();

    for (const skill of pool.skills) {
      for (const support of bannableSupports(skill.name, skill.tags as ChallengeSkillTag[])) {
        if (!gemNames.has(withSupportSuffix(support))) {
          unknown.add(support);
        }
      }
    }

    expect([...unknown]).toEqual([]);
  });
});

describe("unique pool", () => {
  it("only names uniques the bundled icon data knows (S1)", () => {
    const unknown = pool.uniques.filter((u) => !uniqueNames.has(u.name)).map((u) => u.name);

    expect(unknown).toEqual([]);
  });

  it("only tags a weapon family on uniques in a weapon-ish slot", () => {
    const wrong = pool.uniques
      .filter((u) => u.weapon && u.weapon !== "unarmed" && u.slot !== "Weapon 1")
      .map((u) => u.name);

    expect(wrong).toEqual([]);
  });

  /**
   * Slot names must be the ones Path of Building writes, because the gear board
   * places items by slot name. A slot the board does not recognise silently drops
   * the mandated item into the "extra" pile instead of onto the paper doll.
   */
  it("uses slot names the gear board recognises", () => {
    const known = new Set([
      "Weapon 1", "Weapon 2", "Helmet", "Body Armour", "Gloves",
      "Boots", "Amulet", "Ring 1", "Ring 2", "Belt", "Flask",
    ]);
    const unknown = pool.uniques.filter((u) => !known.has(u.slot)).map((u) => `${u.name}: ${u.slot}`);

    expect(unknown).toEqual([]);
  });

  it("has no duplicate uniques", () => {
    const names = pool.uniques.map((u) => u.name);

    expect(new Set(names).size).toBe(names.length);
  });
});

describe("keystone pool", () => {
  it("uses node ids that still exist as keystones in the bundled tree (S2)", () => {
    const broken = pool.keystones
      .filter((keystone) => keystoneIdByName.get(keystone.name) !== keystone.nodeId)
      .map((keystone) => `${keystone.name} (${keystone.nodeId})`);

    expect(broken).toEqual([]);
  });

  it("never requires and forbids the same tag", () => {
    const contradictory = pool.keystones
      .filter((k) => (k.requires ?? []).some((tag) => (k.forbids ?? []).includes(tag)))
      .map((k) => k.name);

    expect(contradictory).toEqual([]);
  });
});

describe("playability of every skill", () => {
  it("leaves at least one eligible keystone for each skill", () => {
    const stranded = pool.skills
      .filter(
        (skill) =>
          !pool.keystones.some(
            (keystone) => hasAll(skill.tags, keystone.requires) && hasNone(skill.tags, keystone.forbids),
          ),
      )
      .map((skill) => skill.name);

    expect(stranded).toEqual([]);
  });

  it("leaves at least five linkable supports and two bannable ones for each skill", () => {
    const stranded = pool.skills
      .filter((skill) => {
        const tags = skill.tags as ChallengeSkillTag[];
        return planLinks(skill.name, tags).length < 5 || bannableSupports(skill.name, tags).length < 2;
      })
      .map((skill) => skill.name);

    expect(stranded).toEqual([]);
  });

  it("leaves at least two eligible extra rules for any keystone", () => {
    const stranded = pool.keystones
      .filter(
        (keystone) =>
          pool.extraRules.filter(
            (rule) => !(rule.redundantWithKeystones ?? []).includes(keystone.name),
          ).length < 2,
      )
      .map((keystone) => keystone.name);

    expect(stranded).toEqual([]);
  });
});

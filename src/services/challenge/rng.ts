/**
 * Seeded, deterministic randomness for challenge generation (rule D1).
 *
 * Nothing here may touch Math.random except `createSeed`, which is the single
 * point where a *new* challenge is minted. Everything downstream is a pure
 * function of the seed string.
 */

import { CHALLENGE_DIFFICULTIES, type ChallengeDifficulty } from "@/domain/challenge";

/** Crockford base32: no I, L, O or U, so a seed read out loud is unambiguous. */
const SEED_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const SEED_LENGTH = 6;

/** Characters a human is likely to type instead of the real ones. */
const SEED_CONFUSIONS: Record<string, string> = { I: "1", L: "1", O: "0", U: "V" };

export function createSeed(random: () => number = Math.random): string {
  let seed = "";

  for (let i = 0; i < SEED_LENGTH; i++) {
    seed += SEED_ALPHABET[Math.floor(random() * SEED_ALPHABET.length)];
  }

  return seed;
}

/**
 * Uppercase and repair the characters the alphabet deliberately excludes.
 * Returns null when the result still is not a valid seed — callers must not
 * silently fall back to a different challenge than the one that was asked for.
 */
export function normalizeSeed(input: string): string | null {
  const repaired = input
    .trim()
    .toUpperCase()
    .replace(/[ILOU]/g, (char) => SEED_CONFUSIONS[char]);

  if (repaired.length !== SEED_LENGTH) {
    return null;
  }

  for (const char of repaired) {
    if (!SEED_ALPHABET.includes(char)) {
      return null;
    }
  }

  return repaired;
}

export function formatChallengeCode(difficulty: ChallengeDifficulty, seed: string): string {
  return `${difficulty}:${seed}`;
}

export interface ParsedChallengeCode {
  difficulty: ChallengeDifficulty;
  seed: string;
}

export function parseChallengeCode(code: string): ParsedChallengeCode | null {
  const [rawDifficulty, rawSeed, ...rest] = code.split(":");

  if (rest.length > 0 || !rawDifficulty || !rawSeed) {
    return null;
  }

  const difficulty = rawDifficulty.trim().toLowerCase() as ChallengeDifficulty;

  if (!CHALLENGE_DIFFICULTIES.includes(difficulty)) {
    return null;
  }

  const seed = normalizeSeed(rawSeed);

  return seed ? { difficulty, seed } : null;
}

/** FNV-1a — spreads short, similar seeds ("AAAAA1"/"AAAAA2") into distant states. */
function hashString(value: string): number {
  let hash = 0x811c9dc5;

  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

/** mulberry32 — small, fast, and good enough for picking from lists. */
function mulberry32(state: number): () => number {
  let current = state;

  return () => {
    current = (current + 0x6d2b79f5) >>> 0;
    let t = current;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Roller {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number;
  /** One item; throws on an empty list rather than returning undefined (fail fast). */
  pick<T>(items: readonly T[]): T;
  /** `count` distinct items, or fewer if the list is shorter. Order is deterministic. */
  pickMany<T>(items: readonly T[], count: number): T[];
}

/**
 * A roller is bound to `${seed}:${channel}`. Channels keep independent decisions
 * independent: adding a rule to one tier cannot shift the picks of another.
 */
export function createRoller(seed: string, channel: string): Roller {
  const next = mulberry32(hashString(`${seed}:${channel}`));

  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));

  const pick = <T,>(items: readonly T[]): T => {
    if (items.length === 0) {
      throw new Error(`Cannot pick from an empty pool (seed ${seed}, channel ${channel})`);
    }

    return items[int(0, items.length - 1)];
  };

  const pickMany = <T,>(items: readonly T[], count: number): T[] => {
    const remaining = [...items];
    const picked: T[] = [];

    while (picked.length < count && remaining.length > 0) {
      picked.push(remaining.splice(int(0, remaining.length - 1), 1)[0]);
    }

    return picked;
  };

  return { next, int, pick, pickMany };
}

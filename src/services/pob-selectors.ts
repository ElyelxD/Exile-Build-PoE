import { PobData } from "@/domain/models";

function normalizePobTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/[()[\]{}.,/\\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractLevelHint(title: string) {
  const match = title.match(/\b(?:level|lvl)\s*(\d{1,3})\b/i);

  if (!match) {
    return undefined;
  }

  const level = Number(match[1]);
  return Number.isFinite(level) ? level : undefined;
}

function countSharedTokens(left: string, right: string) {
  const leftTokens = new Set(left.split(" ").filter((token) => token.length > 2));
  const rightTokens = new Set(right.split(" ").filter((token) => token.length > 2));
  let count = 0;

  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) {
      count += 1;
    }
  });

  return count;
}

function scoreTitleAgainstTree(
  treeTitle: string,
  candidateTitle: string,
  preferredId: string | undefined,
  candidateId: string,
) {
  const normalizedTreeTitle = normalizePobTitle(treeTitle);
  const normalizedCandidateTitle = normalizePobTitle(candidateTitle);
  const treeLevelHint = extractLevelHint(treeTitle);
  const candidateLevelHint = extractLevelHint(candidateTitle);
  let score = 0;

  if (normalizedCandidateTitle === normalizedTreeTitle) {
    score += 100;
  } else if (
    normalizedCandidateTitle.includes(normalizedTreeTitle) ||
    normalizedTreeTitle.includes(normalizedCandidateTitle)
  ) {
    score += 60;
  }

  score += countSharedTokens(normalizedTreeTitle, normalizedCandidateTitle) * 8;

  if (
    typeof treeLevelHint === "number" &&
    typeof candidateLevelHint === "number"
  ) {
    if (treeLevelHint === candidateLevelHint) {
      score += 24;
    } else if (Math.abs(treeLevelHint - candidateLevelHint) <= 3) {
      score += 10;
    }
  }

  if (candidateId === preferredId) {
    score += 4;
  }

  return score;
}

/**
 * Extract PoB spec-index references like {3} or {4,5} from a title string.
 * Returns the set of referenced spec indices (1-based).
 */
function extractSpecRefs(title: string): Set<number> {
  const refs = new Set<number>();
  for (const m of title.matchAll(/\{([^}]+)\}/g)) {
    for (const part of m[1].split(",")) {
      const n = parseInt(part.trim(), 10);
      if (Number.isFinite(n)) refs.add(n);
    }
  }
  return refs;
}

function pickBestTreeMatchedId(
  treeTitle: string | undefined,
  candidates: Array<{ id: string; title: string }>,
  preferredId: string | undefined,
  treeSpecIndex?: number,
) {
  if (!treeTitle || candidates.length <= 1) {
    return preferredId;
  }

  // Primary: match by PoB {N} spec-index references (most reliable)
  if (treeSpecIndex != null) {
    const treeRefs = extractSpecRefs(treeTitle);
    // Check if the tree spec itself declares a {N} that matches its own index
    // If so, find candidates whose {N} references include this spec index
    const specRef = treeRefs.size > 0 ? treeRefs : new Set([treeSpecIndex]);
    for (const candidate of candidates) {
      const candidateRefs = extractSpecRefs(candidate.title);
      if (candidateRefs.size > 0) {
        for (const ref of specRef) {
          if (candidateRefs.has(ref)) return candidate.id;
        }
        // Also check if candidate refs include the tree spec 1-based index
        if (candidateRefs.has(treeSpecIndex)) return candidate.id;
      }
    }
  }

  // Fallback: score-based title matching
  const bestMatch = candidates
    .map((candidate) => ({
      ...candidate,
      score: scoreTitleAgainstTree(treeTitle, candidate.title, preferredId, candidate.id),
    }))
    .sort((left, right) => right.score - left.score)[0];

  return bestMatch && bestMatch.score > 0 ? bestMatch.id : preferredId;
}

function getOrderedTreeSpecsByLevel(pob?: PobData) {
  if (!pob) {
    return [];
  }

  return pob.treeSpecs
    .map((spec) => ({
      spec,
      levelHint: extractLevelHint(spec.title),
    }))
    .filter((entry): entry is { spec: PobData["treeSpecs"][number]; levelHint: number } =>
      typeof entry.levelHint === "number",
    )
    .sort((left, right) => left.levelHint - right.levelHint);
}

export function getActivePobTreeSpec(pob?: PobData) {
  if (!pob) {
    return undefined;
  }

  return (
    pob.treeSpecs.find((spec) => spec.id === pob.activeTreeSpecId) ??
    pob.treeSpecs.find((spec) => spec.isActive) ??
    pob.treeSpecs[0]
  );
}

export function getSuggestedPobTreeSpecForLevel(pob: PobData | undefined, playerLevel: number) {
  if (!pob) {
    return undefined;
  }

  const orderedSpecs = getOrderedTreeSpecsByLevel(pob);

  if (orderedSpecs.length === 0) {
    return getActivePobTreeSpec(pob);
  }

  const exactOrPrevious =
    [...orderedSpecs]
      .reverse()
      .find((entry) => playerLevel >= entry.levelHint)?.spec;

  return exactOrPrevious ?? orderedSpecs[0].spec;
}

export function getNextPobTreeSpecForLevel(pob: PobData | undefined, playerLevel: number) {
  if (!pob) {
    return undefined;
  }

  return getOrderedTreeSpecsByLevel(pob).find((entry) => entry.levelHint > playerLevel)?.spec;
}

export function getActivePobItemSet(pob?: PobData) {
  if (!pob) {
    return undefined;
  }

  const activeTreeSpec = getActivePobTreeSpec(pob);
  const treeSpecIndex = activeTreeSpec
    ? pob.treeSpecs.indexOf(activeTreeSpec) + 1
    : undefined;
  const matchedItemSetId = pickBestTreeMatchedId(
    activeTreeSpec?.title,
    pob.itemSets.map((itemSet) => ({
      id: itemSet.id,
      title: itemSet.title,
    })),
    pob.activeItemSetId,
    treeSpecIndex ?? undefined,
  );

  return (
    pob.itemSets.find((itemSet) => itemSet.id === matchedItemSetId) ??
    pob.itemSets.find((itemSet) => itemSet.id === pob.activeItemSetId) ??
    pob.itemSets.find((itemSet) => itemSet.isActive) ??
    pob.itemSets[0]
  );
}

export function getActivePobSkillGroups(pob?: PobData) {
  if (!pob) {
    return [];
  }

  const activeTreeSpec = getActivePobTreeSpec(pob);
  const treeSpecIndex = activeTreeSpec
    ? pob.treeSpecs.indexOf(activeTreeSpec) + 1
    : undefined;
  const skillSets = Array.from(
    new Map(
      pob.skillGroups.map((group) => [
        group.setId,
        {
          id: group.setId,
          title: group.setTitle,
        },
      ]),
    ).values(),
  );

  let activeSetId = pob.activeSkillSetId;

  if (activeTreeSpec && skillSets.length > 1) {
    activeSetId = pickBestTreeMatchedId(
      activeTreeSpec.title,
      skillSets,
      pob.activeSkillSetId,
      treeSpecIndex ?? undefined,
    );
  }

  const selectedGroups =
    activeSetId
      ? pob.skillGroups.filter((group) => group.setId === activeSetId)
      : pob.skillGroups.filter((group) => group.isSelected);

  return selectedGroups.length > 0 ? selectedGroups : pob.skillGroups;
}

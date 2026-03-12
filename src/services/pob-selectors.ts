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

function pickBestTreeMatchedId(
  treeTitle: string | undefined,
  candidates: Array<{ id: string; title: string }>,
  preferredId: string | undefined,
) {
  if (!treeTitle || candidates.length <= 1) {
    return preferredId;
  }

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
  const matchedItemSetId = pickBestTreeMatchedId(
    activeTreeSpec?.title,
    pob.itemSets.map((itemSet) => ({
      id: itemSet.id,
      title: itemSet.title,
    })),
    pob.activeItemSetId,
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
    activeSetId = pickBestTreeMatchedId(activeTreeSpec.title, skillSets, pob.activeSkillSetId);
  }

  const selectedGroups =
    activeSetId
      ? pob.skillGroups.filter((group) => group.setId === activeSetId)
      : pob.skillGroups.filter((group) => group.isSelected);

  return selectedGroups.length > 0 ? selectedGroups : pob.skillGroups;
}

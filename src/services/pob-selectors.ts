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

  return (
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
    const normalizedTreeTitle = normalizePobTitle(activeTreeSpec.title);
    const treeLevelHint = extractLevelHint(activeTreeSpec.title);
    const scoredSets = skillSets.map((set) => {
      const normalizedSetTitle = normalizePobTitle(set.title);
      const setLevelHint = extractLevelHint(set.title);
      let score = 0;

      if (normalizedSetTitle === normalizedTreeTitle) {
        score += 100;
      } else if (
        normalizedSetTitle.includes(normalizedTreeTitle) ||
        normalizedTreeTitle.includes(normalizedSetTitle)
      ) {
        score += 60;
      }

      score += countSharedTokens(normalizedTreeTitle, normalizedSetTitle) * 8;

      if (
        typeof treeLevelHint === "number" &&
        typeof setLevelHint === "number"
      ) {
        if (treeLevelHint === setLevelHint) {
          score += 24;
        } else if (Math.abs(treeLevelHint - setLevelHint) <= 3) {
          score += 10;
        }
      }

      if (set.id === pob.activeSkillSetId) {
        score += 4;
      }

      return {
        ...set,
        score,
      };
    });

    const bestMatch = scoredSets.sort((left, right) => right.score - left.score)[0];

    if (bestMatch && bestMatch.score > 0) {
      activeSetId = bestMatch.id;
    }
  }

  const selectedGroups =
    activeSetId
      ? pob.skillGroups.filter((group) => group.setId === activeSetId)
      : pob.skillGroups.filter((group) => group.isSelected);

  return selectedGroups.length > 0 ? selectedGroups : pob.skillGroups;
}

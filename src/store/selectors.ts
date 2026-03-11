import { AppState, Build, BuildStage, ChecklistItem, UserProgress } from "@/domain/models";

export function getSelectedBuild(state: AppState) {
  return state.builds.find((build) => build.id === state.selectedBuildId);
}

export function getBuildProgress(state: AppState, buildId: string) {
  return state.progressByBuildId[buildId];
}

export function findStageForLevel(build: Build, playerLevel: number): BuildStage {
  if (build.stages.length === 0) {
    throw new Error(`Build ${build.id} has no stages`);
  }

  const matched = build.stages.find(
    (stage) => playerLevel >= stage.levelMin && playerLevel <= stage.levelMax,
  );

  if (matched) {
    return matched;
  }

  if (playerLevel < build.stages[0].levelMin) {
    return build.stages[0];
  }

  return build.stages[build.stages.length - 1];
}

export function getCurrentStage(build: Build, progress: UserProgress) {
  return (
    build.stages.find((stage) => stage.id === progress.currentStageId) ??
    findStageForLevel(build, progress.playerLevel)
  );
}

export function getNextObjectives(
  build: Build,
  progress: UserProgress,
  limit = 3,
): Array<ChecklistItem & { stageTitle: string }> {
  const completed = new Set(progress.completedChecklistIds);
  const currentStage = getCurrentStage(build, progress);
  const remaining: Array<ChecklistItem & { stageTitle: string }> = [];

  const candidateStages = [
    currentStage,
    ...build.stages.filter((stage) => stage.id !== currentStage.id),
  ];

  for (const stage of candidateStages) {
    for (const item of stage.checklist) {
      if (!completed.has(item.id)) {
        remaining.push({
          ...item,
          stageTitle: stage.title,
        });
      }

      if (remaining.length === limit) {
        return remaining;
      }
    }
  }

  return remaining;
}

export function getPinnedItems(build: Build, progress: UserProgress) {
  const pinned = new Set(progress.pinnedItemIds);

  return build.stages.flatMap((stage) =>
    stage.checklist
      .filter((item) => pinned.has(item.id))
      .map((item) => ({
        ...item,
        stageTitle: stage.title,
      })),
  );
}

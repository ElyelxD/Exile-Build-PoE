import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { AppState, Build, BUILD_TABS, BuildSourceType, BuildTab, UserProgress } from "@/domain/models";

import { createImportedBuild, createInitialProgress, rehydrateImportedBuild } from "@/services/importer";
import { getSuggestedPobTreeSpecForLevel } from "@/services/pob-selectors";
import { findStageForLevel, getCurrentStage, getNextObjectives } from "@/store/selectors";

const STORAGE_KEY = "exile-build-poe.state.v1";

type Direction = 1 | -1;

interface AppActions {
  importBuild: (sourceType: BuildSourceType, sourceValue: string) => Promise<void>;
  selectBuild: (buildId: string) => void;
  deleteBuild: (buildId: string) => void;
  reimportBuild: (buildId: string) => Promise<void>;
  setPobTreeSpec: (buildId: string, specId: string) => void;
  setActiveTab: (tab: BuildTab) => void;
  cycleTab: (direction: Direction) => void;

  setPlayerLevel: (buildId: string, level: number) => void;
  toggleChecklist: (buildId: string, itemId: string) => void;
  markNextObjective: (buildId: string) => void;
  togglePin: (buildId: string, itemId: string) => void;
  togglePinNextObjective: (buildId: string) => void;
  setOverlayOpacity: (opacity: number) => void;
}

interface AppStoreValue {
  state: AppState;
  actions: AppActions;
}

type Action =
  | { type: "hydrate"; payload: AppState }
  | { type: "import-build"; build: Build }
  | { type: "select-build"; buildId: string }
  | { type: "delete-build"; buildId: string }
  | { type: "replace-build"; oldBuildId: string; build: Build }
  | { type: "set-pob-tree-spec"; buildId: string; specId: string }
  | { type: "set-active-tab"; tab: BuildTab }
  | { type: "cycle-tab"; direction: Direction }
  | { type: "set-player-level"; buildId: string; level: number }
  | { type: "toggle-checklist"; buildId: string; itemId: string }
  | { type: "mark-next-objective"; buildId: string }
  | { type: "toggle-pin"; buildId: string; itemId: string }
  | { type: "toggle-pin-next-objective"; buildId: string }
  | { type: "set-overlay-opacity"; opacity: number };

const defaultState: AppState = {
  builds: [],
  selectedBuildId: null,
  progressByBuildId: {},
  activeTab: "overview",
  overlayOpacity: 85,
};

const AppStoreContext = createContext<AppStoreValue | null>(null);

function normalizeState(candidate: Partial<AppState>): AppState {
  const builds = (candidate.builds ?? []).map((build) => rehydrateImportedBuild(build));
  const selectedBuildId =
    (candidate.selectedBuildId && builds.some((build) => build.id === candidate.selectedBuildId)
      ? candidate.selectedBuildId
      : null) ??
    builds[0]?.id ??
    null;

  return {
    builds,
    selectedBuildId,
    progressByBuildId: candidate.progressByBuildId ?? {},
    activeTab: candidate.activeTab ?? "overview",
    overlayOpacity: candidate.overlayOpacity ?? 85,
  };
}

function loadStoredState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultState;
    }

    return normalizeState(JSON.parse(raw) as Partial<AppState>);
  } catch {
    return defaultState;
  }
}

function refreshProgress(buildId: string, buildState: AppState, nextProgress: UserProgress) {
  const build = buildState.builds.find((entry) => entry.id === buildId);
  if (!build) {
    return nextProgress;
  }

  const currentStage = findStageForLevel(build, nextProgress.playerLevel);

  return {
    ...nextProgress,
    currentStageId: currentStage.id,
    updatedAt: new Date().toISOString(),
  };
}

function updateBuild(state: AppState, buildId: string, updater: (build: Build) => Build) {
  let didUpdate = false;

  const builds = state.builds.map((build) => {
    if (build.id !== buildId) {
      return build;
    }

    didUpdate = true;
    return updater(build);
  });

  return didUpdate ? { ...state, builds } : state;
}

function updateProgress(
  state: AppState,
  buildId: string,
  updater: (progress: UserProgress) => UserProgress,
): AppState {
  const current = state.progressByBuildId[buildId];
  if (!current) {
    return state;
  }

  const nextProgress = refreshProgress(buildId, state, updater(current));

  return {
    ...state,
    progressByBuildId: {
      ...state.progressByBuildId,
      [buildId]: nextProgress,
    },
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "hydrate":
      return normalizeState(action.payload);
    case "import-build": {
      const { build } = action;
      const progress = createInitialProgress(build);

      return {
        ...state,
        builds: [build, ...state.builds],
        selectedBuildId: build.id,
        activeTab: "overview",
        progressByBuildId: {
          ...state.progressByBuildId,
          [build.id]: progress,
        },
      };
    }
    case "select-build":
      return {
        ...state,
        selectedBuildId: action.buildId,
      };
    case "delete-build": {
      const remaining = state.builds.filter((b) => b.id !== action.buildId);
      const { [action.buildId]: _removed, ...restProgress } = state.progressByBuildId;
      const nextSelectedId =
        state.selectedBuildId === action.buildId
          ? remaining[0]?.id ?? null
          : state.selectedBuildId;

      return {
        ...state,
        builds: remaining,
        selectedBuildId: nextSelectedId,
        progressByBuildId: restProgress,
      };
    }
    case "replace-build": {
      const { oldBuildId, build } = action;
      const progress = createInitialProgress(build);

      return {
        ...state,
        builds: state.builds.map((b) => (b.id === oldBuildId ? build : b)),
        selectedBuildId: state.selectedBuildId === oldBuildId ? build.id : state.selectedBuildId,
        progressByBuildId: {
          ...state.progressByBuildId,
          [oldBuildId]: undefined as never,
          [build.id]: progress,
        },
      };
    }
    case "set-pob-tree-spec":
      return updateBuild(state, action.buildId, (build) => {
        if (!build.pob || !build.pob.treeSpecs.some((spec) => spec.id === action.specId)) {
          return build;
        }

        return {
          ...build,
          pob: {
            ...build.pob,
            activeTreeSpecId: action.specId,
          },
        };
      });
    case "set-active-tab":
      return {
        ...state,
        activeTab: action.tab,
      };
    case "cycle-tab": {
      const currentIndex = BUILD_TABS.indexOf(state.activeTab);
      const nextIndex = (currentIndex + action.direction + BUILD_TABS.length) % BUILD_TABS.length;

      return {
        ...state,
        activeTab: BUILD_TABS[nextIndex],
      };
    }
    case "set-player-level":
      {
        const nextLevel = Math.max(1, Math.min(100, action.level));
        const nextState = updateProgress(state, action.buildId, (progress) => ({
          ...progress,
          playerLevel: nextLevel,
        }));

        return updateBuild(nextState, action.buildId, (build) => {
          const suggestedTreeSpec = getSuggestedPobTreeSpecForLevel(build.pob, nextLevel);

          if (!build.pob || !suggestedTreeSpec || build.pob.activeTreeSpecId === suggestedTreeSpec.id) {
            return build;
          }

          return {
            ...build,
            pob: {
              ...build.pob,
              activeTreeSpecId: suggestedTreeSpec.id,
            },
          };
        });
      }
    case "toggle-checklist":
      return updateProgress(state, action.buildId, (progress) => {
        const completed = new Set(progress.completedChecklistIds);

        if (completed.has(action.itemId)) {
          completed.delete(action.itemId);
        } else {
          completed.add(action.itemId);
        }

        return {
          ...progress,
          completedChecklistIds: [...completed],
        };
      });
    case "mark-next-objective": {
      const build = state.builds.find((entry) => entry.id === action.buildId);
      const progress = state.progressByBuildId[action.buildId];

      if (!build || !progress) {
        return state;
      }

      const nextObjective = getNextObjectives(build, progress, 1)[0];
      if (!nextObjective) {
        return state;
      }

      return reducer(state, {
        type: "toggle-checklist",
        buildId: action.buildId,
        itemId: nextObjective.id,
      });
    }
    case "toggle-pin":
      return updateProgress(state, action.buildId, (progress) => {
        const pinned = new Set(progress.pinnedItemIds);

        if (pinned.has(action.itemId)) {
          pinned.delete(action.itemId);
        } else {
          pinned.add(action.itemId);
        }

        return {
          ...progress,
          pinnedItemIds: [...pinned],
        };
      });
    case "toggle-pin-next-objective": {
      const build = state.builds.find((entry) => entry.id === action.buildId);
      const progress = state.progressByBuildId[action.buildId];

      if (!build || !progress) {
        return state;
      }

      const currentStage = getCurrentStage(build, progress);
      const nextObjective =
        getNextObjectives(build, progress, 1)[0] ??
        currentStage.checklist[0];

      if (!nextObjective) {
        return state;
      }

      return reducer(state, {
        type: "toggle-pin",
        buildId: action.buildId,
        itemId: nextObjective.id,
      });
    }
    case "set-overlay-opacity":
      return {
        ...state,
        overlayOpacity: Math.max(20, Math.min(100, action.opacity)),
      };
    default:
      return state;
  }
}

export function AppStoreProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, defaultState, () => loadStoredState());

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) {
        return;
      }

      try {
        dispatch({
          type: "hydrate",
          payload: normalizeState(JSON.parse(event.newValue) as Partial<AppState>),
        });
      } catch {
        return;
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const actions: AppActions = {
    importBuild: async (sourceType, sourceValue) => {
      const build = await createImportedBuild(sourceType, sourceValue);
      dispatch({ type: "import-build", build });
    },
    selectBuild: (buildId) => dispatch({ type: "select-build", buildId }),
    deleteBuild: (buildId) => dispatch({ type: "delete-build", buildId }),
    reimportBuild: async (buildId) => {
      const build = state.builds.find((b) => b.id === buildId);
      if (!build) return;
      try {
        const fresh = await createImportedBuild(build.sourceType, build.sourceValue);
        dispatch({ type: "replace-build", oldBuildId: buildId, build: fresh });
      } catch (err) {
        console.error("[Reimport] failed:", err);
      }
    },
    setPobTreeSpec: (buildId, specId) =>
      dispatch({ type: "set-pob-tree-spec", buildId, specId }),
    setActiveTab: (tab) => dispatch({ type: "set-active-tab", tab }),
    cycleTab: (direction) => dispatch({ type: "cycle-tab", direction }),
    setPlayerLevel: (buildId, level) => dispatch({ type: "set-player-level", buildId, level }),
    toggleChecklist: (buildId, itemId) =>
      dispatch({ type: "toggle-checklist", buildId, itemId }),
    markNextObjective: (buildId) => dispatch({ type: "mark-next-objective", buildId }),
    togglePin: (buildId, itemId) => dispatch({ type: "toggle-pin", buildId, itemId }),
    togglePinNextObjective: (buildId) =>
      dispatch({ type: "toggle-pin-next-objective", buildId }),
    setOverlayOpacity: (opacity) =>
      dispatch({ type: "set-overlay-opacity", opacity }),
  };

  return (
    <AppStoreContext.Provider value={{ state, actions }}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppStoreContext);

  if (!context) {
    throw new Error("useAppStore must be used within AppStoreProvider");
  }

  return context;
}

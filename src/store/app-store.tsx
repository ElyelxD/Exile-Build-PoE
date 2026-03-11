import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { AppState, BUILD_TABS, BuildSourceType, BuildTab, UserProgress } from "@/domain/models";
import { createImportedBuild, createInitialProgress } from "@/services/importer";
import { findStageForLevel, getCurrentStage, getNextObjectives } from "@/store/selectors";

const STORAGE_KEY = "overlay-poe-build.state.v1";

type Direction = 1 | -1;

interface AppActions {
  importBuild: (sourceType: BuildSourceType, sourceValue: string) => void;
  selectBuild: (buildId: string) => void;
  setActiveTab: (tab: BuildTab) => void;
  cycleTab: (direction: Direction) => void;
  toggleOverlayMode: () => void;
  setOverlayClickThrough: (enabled: boolean) => void;
  setPlayerLevel: (buildId: string, level: number) => void;
  toggleChecklist: (buildId: string, itemId: string) => void;
  markNextObjective: (buildId: string) => void;
  togglePin: (buildId: string, itemId: string) => void;
  togglePinNextObjective: (buildId: string) => void;
}

interface AppStoreValue {
  state: AppState;
  actions: AppActions;
}

type Action =
  | { type: "hydrate"; payload: AppState }
  | { type: "import-build"; sourceType: BuildSourceType; sourceValue: string }
  | { type: "select-build"; buildId: string }
  | { type: "set-active-tab"; tab: BuildTab }
  | { type: "cycle-tab"; direction: Direction }
  | { type: "toggle-overlay-mode" }
  | { type: "set-overlay-click-through"; enabled: boolean }
  | { type: "set-player-level"; buildId: string; level: number }
  | { type: "toggle-checklist"; buildId: string; itemId: string }
  | { type: "mark-next-objective"; buildId: string }
  | { type: "toggle-pin"; buildId: string; itemId: string }
  | { type: "toggle-pin-next-objective"; buildId: string };

const defaultState: AppState = {
  builds: [],
  selectedBuildId: null,
  progressByBuildId: {},
  activeTab: "overview",
  overlayMode: "compact",
  overlayClickThrough: false,
};

const AppStoreContext = createContext<AppStoreValue | null>(null);

function normalizeState(candidate: Partial<AppState>): AppState {
  const selectedBuildId =
    candidate.selectedBuildId ??
    candidate.builds?.[0]?.id ??
    null;

  return {
    builds: candidate.builds ?? [],
    selectedBuildId,
    progressByBuildId: candidate.progressByBuildId ?? {},
    activeTab: candidate.activeTab ?? "overview",
    overlayMode: candidate.overlayMode ?? "compact",
    overlayClickThrough: candidate.overlayClickThrough ?? false,
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
      const build = createImportedBuild(action.sourceType, action.sourceValue);
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
    case "toggle-overlay-mode":
      return {
        ...state,
        overlayMode: state.overlayMode === "compact" ? "expanded" : "compact",
      };
    case "set-overlay-click-through":
      return {
        ...state,
        overlayClickThrough: action.enabled,
      };
    case "set-player-level":
      return updateProgress(state, action.buildId, (progress) => ({
        ...progress,
        playerLevel: Math.max(1, Math.min(100, action.level)),
      }));
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
    importBuild: (sourceType, sourceValue) =>
      dispatch({ type: "import-build", sourceType, sourceValue }),
    selectBuild: (buildId) => dispatch({ type: "select-build", buildId }),
    setActiveTab: (tab) => dispatch({ type: "set-active-tab", tab }),
    cycleTab: (direction) => dispatch({ type: "cycle-tab", direction }),
    toggleOverlayMode: () => dispatch({ type: "toggle-overlay-mode" }),
    setOverlayClickThrough: (enabled) =>
      dispatch({ type: "set-overlay-click-through", enabled }),
    setPlayerLevel: (buildId, level) => dispatch({ type: "set-player-level", buildId, level }),
    toggleChecklist: (buildId, itemId) =>
      dispatch({ type: "toggle-checklist", buildId, itemId }),
    markNextObjective: (buildId) => dispatch({ type: "mark-next-objective", buildId }),
    togglePin: (buildId, itemId) => dispatch({ type: "toggle-pin", buildId, itemId }),
    togglePinNextObjective: (buildId) =>
      dispatch({ type: "toggle-pin-next-objective", buildId }),
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

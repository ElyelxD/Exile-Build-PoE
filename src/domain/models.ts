export const BUILD_TABS = ["overview", "tree", "gems", "gear", "labs", "notes"] as const;

export type BuildTab = (typeof BUILD_TABS)[number];
export type OverlayMode = "compact" | "expanded";
export type BuildSourceType = "link" | "code" | "file";
export type ChecklistType = "quest" | "gear" | "gem" | "lab" | "note";
export type GemCategory = "main" | "utility" | "movement" | "aura";

export interface BuildSummary {
  tagline: string;
  playstyle: string;
  nextUpgrade: string;
  warningCards: string[];
}

export interface PassiveMilestone {
  id: string;
  targetName: string;
  pointsRequired: number;
  instructions: string;
}

export interface GemSetup {
  id: string;
  stageId: string;
  category: GemCategory;
  mainGem: string;
  supportGems: string[];
  optionalGems: string[];
  notes: string;
}

export interface GearPriority {
  id: string;
  slot: string;
  requiredStats: string[];
  preferredStats: string[];
  uniqueSuggestion?: string;
  notes: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  type: ChecklistType;
  required: boolean;
}

export interface LabStep {
  id: string;
  order: number;
  title: string;
  levelHint: string;
  ascendancyChoice: string;
  notes: string;
}

export interface BuildStage {
  id: string;
  buildId: string;
  order: number;
  label: string;
  levelMin: number;
  levelMax: number;
  title: string;
  summary: string;
  passives: PassiveMilestone[];
  gems: GemSetup[];
  gear: GearPriority[];
  checklist: ChecklistItem[];
  notes: string[];
}

export interface Build {
  id: string;
  name: string;
  className: string;
  ascendancy: string;
  sourceType: BuildSourceType;
  sourceValue: string;
  importedAt: string;
  notes: string;
  warnings: string[];
  summary: BuildSummary;
  stages: BuildStage[];
  labs: LabStep[];
}

export interface UserProgress {
  id: string;
  buildId: string;
  playerLevel: number;
  currentStageId: string;
  completedChecklistIds: string[];
  pinnedItemIds: string[];
  updatedAt: string;
}

export interface AppState {
  builds: Build[];
  selectedBuildId: string | null;
  progressByBuildId: Record<string, UserProgress>;
  activeTab: BuildTab;
  overlayMode: OverlayMode;
}

export const BUILD_TABS = ["overview", "tree", "gems", "gear", "labs", "notes"] as const;

export type BuildTab = (typeof BUILD_TABS)[number];
export type BuildSourceType = "link" | "code" | "file";
export type ChecklistType = "quest" | "gear" | "gem" | "lab" | "note";
export type GemCategory = "main" | "utility" | "movement" | "aura";
export type PoeAssetStatus =
  | "idle"
  | "ready"
  | "missing-install"
  | "missing-extractor"
  | "syncing"
  | "error";

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

export interface PobTreeSocket {
  nodeId: number;
  itemId: string;
  jewelName?: string;
  jewelBaseType?: string;
  jewelRarity?: string;
  jewelMods?: string[];
}

export interface PobTreeSpec {
  id: string;
  title: string;
  levelHint?: number;
  treeVersion?: string;
  url?: string;
  sockets?: PobTreeSocket[];
  /** Mastery selections: nodeId → effectId (plain object for JSON persistence) */
  masteryEffects?: Record<string, number>;
  isActive: boolean;
}

export type GemColor = "red" | "green" | "blue" | "white";
export type GemQualityType = "Default" | "Anomalous" | "Divergent" | "Phantasmal";

export interface PobGem {
  id: string;
  name: string;
  rawName: string;
  level?: number;
  quality?: number;
  enabled: boolean;
  iconUrl?: string;
  isSupport?: boolean;
  isVaal?: boolean;
  isAwakened?: boolean;
  qualityType?: GemQualityType;
  gemColor?: GemColor;
}

export interface PobSkillGroup {
  id: string;
  setId: string;
  setTitle: string;
  label: string;
  slot?: string;
  enabled: boolean;
  isSelected: boolean;
  gems: PobGem[];
}

export interface PobItemSlot {
  name: string;
  itemId?: string;
}

export interface PobItemSet {
  id: string;
  title: string;
  isActive: boolean;
  slots: PobItemSlot[];
}

export type ItemInfluence = "shaper" | "elder" | "crusader" | "hunter" | "redeemer" | "warlord";

export interface PobItem {
  id: string;
  setId: string;
  setTitle: string;
  slot?: string;
  title: string;
  baseType?: string;
  rarity?: string;
  rawText: string;
  iconUrl?: string;
  itemLevel?: number;
  quality?: number;
  corrupted?: boolean;
  influences?: ItemInfluence[];
}

export interface PobData {
  version?: string;
  level: number;
  bandit?: string;
  pantheonMajor?: string;
  pantheonMinor?: string;
  activeTreeSpecId?: string;
  activeItemSetId?: string;
  activeSkillSetId?: string;
  mainSkill?: string;
  treeSpecs: PobTreeSpec[];
  skillGroups: PobSkillGroup[];
  itemSets: PobItemSet[];
  items: PobItem[];
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
  league?: string;
  sourceType: BuildSourceType;
  sourceValue: string;
  importedAt: string;
  notes: string;
  warnings: string[];
  summary: BuildSummary;
  stages: BuildStage[];
  labs: LabStep[];
  pob?: PobData;
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
  /** Overlay background opacity 0–100 (default 85). */
  overlayOpacity: number;
}

export interface PoeAssetsState {
  installPath?: string;
  extractorPath?: string;
  cacheDir?: string;
  extractorName?: string;
  manifestPath?: string;
  status: PoeAssetStatus;
  lastSyncAt?: string;
  lastError?: string;
}

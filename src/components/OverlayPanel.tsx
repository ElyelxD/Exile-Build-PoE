import { useEffect, useRef, useState } from "react";
import { BUILD_TABS, Build, BuildStage, BuildTab, UserProgress } from "@/domain/models";
import { BuildTabContent } from "@/components/BuildTabContent";
import { getActivePobTreeSpec } from "@/services/pob-selectors";
import { useI18n, SUPPORTED_LOCALES, type Locale } from "@/i18n";
import type { TranslationKey } from "@/i18n/locales/en";

const LOCALE_SHORT: Record<Locale, string> = {
  en: "EN",
  "pt-BR": "PT",
  es: "ES",
  fr: "FR",
  de: "DE",
  ru: "RU",
  ko: "한",
  "zh-CN": "中",
  ja: "日",
  th: "ไท",
};

const HOTKEY_ACTIONS: Array<{ action: HotkeyAction; labelKey: TranslationKey }> = [
  { action: "toggle-overlay", labelKey: "settings.hotkeyOverlay" },
  { action: "mark-objective", labelKey: "settings.hotkeyMark" },
  { action: "adjust-level", labelKey: "settings.hotkeyLevel" },
  { action: "next-tab", labelKey: "settings.hotkeyNextTab" },
  { action: "prev-tab", labelKey: "settings.hotkeyPrevTab" },
  { action: "toggle-pin", labelKey: "settings.hotkeyPin" },
];

function displayAccelerator(acc: string): string {
  return acc.replace(/CommandOrControl/g, "Ctrl").replace(/\+/g, " + ");
}

type DecoratedChecklistItem = {
  id: string;
  text: string;
  type: string;
  required: boolean;
  stageTitle: string;
};

interface OverlayPanelProps {
  build: Build;
  progress: UserProgress;
  currentStage: BuildStage;
  activeTab: BuildTab;
  nextObjectives: DecoratedChecklistItem[];
  pinnedItems: DecoratedChecklistItem[];
  onSetTab?: (tab: BuildTab) => void;
  onSetPobTreeSpec?: (specId: string) => void;
  onSetPlayerLevel?: (level: number) => void;
  onMarkObjective?: () => void;
  onTogglePin?: (itemId: string) => void;
  onToggleChecklist?: (itemId: string) => void;
  overlayOpacity?: number;
  onSetOverlayOpacity?: (opacity: number) => void;
  variant?: "preview" | "live";
}

export function OverlayPanel({
  build,
  progress,
  currentStage,
  activeTab,
  nextObjectives,
  pinnedItems,
  onSetTab,
  onSetPobTreeSpec,
  onSetPlayerLevel,
  onMarkObjective,
  onTogglePin,
  onToggleChecklist,
  overlayOpacity,
  onSetOverlayOpacity,
  variant = "preview",
}: OverlayPanelProps) {
  const { t, locale, setLocale } = useI18n();
  const activeTreeSpec = getActivePobTreeSpec(build.pob);
  const displayStageTitle = activeTreeSpec?.title ?? currentStage.title;

  // Settings panel state (only for live overlay)
  const [openPanel, setOpenPanel] = useState<"hotkeys" | "lang" | "opacity" | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [hotkeys, setHotkeys] = useState<HotkeyConfig | null>(null);
  const [recordingAction, setRecordingAction] = useState<HotkeyAction | null>(null);

  // Load hotkeys when panel opens
  useEffect(() => {
    if (openPanel === "hotkeys" && !hotkeys && window.desktop?.getHotkeys) {
      window.desktop.getHotkeys().then(setHotkeys);
    }
  }, [openPanel, hotkeys]);

  // Keyboard listener for recording mode
  useEffect(() => {
    if (!recordingAction) return;
    function onKeyDown(e: KeyboardEvent) {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") { setRecordingAction(null); return; }
      if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;

      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push("CommandOrControl");
      if (e.shiftKey) parts.push("Shift");
      if (e.altKey) parts.push("Alt");

      const keyMap: Record<string, string> = {
        ArrowUp: "Up", ArrowDown: "Down", ArrowLeft: "Left", ArrowRight: "Right",
        " ": "Space", Enter: "Return", Backspace: "Backspace", Delete: "Delete",
        Tab: "Tab", Home: "Home", End: "End", PageUp: "PageUp", PageDown: "PageDown",
        Insert: "Insert",
      };
      const key = keyMap[e.key] ?? (e.key.length === 1 ? e.key.toUpperCase() : e.key);
      parts.push(key);

      const accelerator = parts.join("+");
      if (window.desktop?.setHotkey && recordingAction) {
        window.desktop.setHotkey(recordingAction, accelerator).then((cfg) => {
          setHotkeys(cfg);
          setRecordingAction(null);
        });
      }
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [recordingAction]);

  // Close panel on outside click
  useEffect(() => {
    if (!openPanel) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpenPanel(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openPanel]);

  return (
    <section
      className={`overlay-panel is-expanded ${
        variant === "live" ? "is-live" : "is-preview"
      }`}
    >
      <header className="overlay-header">
        <div className="overlay-meta">
          <span className="eyebrow">{build.className + " · " + build.ascendancy}</span>
          <h2>{build.name}</h2>
          <p>
            Lvl {progress.playerLevel} · {displayStageTitle}
          </p>
        </div>

        {variant === "live" && (
          <div className="overlay-tools" ref={panelRef}>
            {/* Hotkeys icon */}
            <button
              className={`tool-trigger${openPanel === "hotkeys" ? " is-active" : ""}`}
              onClick={() => setOpenPanel(openPanel === "hotkeys" ? null : "hotkeys")}
              type="button"
              title={t("settings.hotkeys")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8" />
              </svg>
            </button>

            {/* Language icon */}
            <button
              className={`tool-trigger${openPanel === "lang" ? " is-active" : ""}`}
              onClick={() => setOpenPanel(openPanel === "lang" ? null : "lang")}
              type="button"
              title={t("settings.language")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />
              </svg>
            </button>

            {/* Opacity icon */}
            <button
              className={`tool-trigger${openPanel === "opacity" ? " is-active" : ""}`}
              onClick={() => setOpenPanel(openPanel === "opacity" ? null : "opacity")}
              type="button"
              title={t("settings.overlayOpacity")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2v20M12 2a10 10 0 0 1 0 20" fill="currentColor" opacity="0.3" />
              </svg>
            </button>

            {/* Hotkeys dropdown */}
            {openPanel === "hotkeys" && (
              <div className="settings-dropdown overlay-settings-dropdown">
                <span className="settings-section-title">{t("settings.hotkeys")}</span>
                <span className="settings-help">{t("settings.hotkeyHelp")}</span>
                {hotkeys && HOTKEY_ACTIONS.map(({ action, labelKey }) => (
                  <div className="settings-hotkey-row" key={action}>
                    <span>{t(labelKey)}</span>
                    <button
                      className={`hotkey-btn${recordingAction === action ? " is-recording" : ""}`}
                      type="button"
                      onClick={() => setRecordingAction(recordingAction === action ? null : action)}
                    >
                      {recordingAction === action
                        ? t("settings.hotkeyPress")
                        : displayAccelerator(hotkeys[action] || "—")}
                    </button>
                  </div>
                ))}
                {hotkeys && (
                  <button
                    className="hotkey-reset-btn"
                    type="button"
                    onClick={() => {
                      window.desktop?.resetHotkeys().then((cfg) => setHotkeys(cfg));
                    }}
                  >
                    {t("settings.hotkeyReset")}
                  </button>
                )}
              </div>
            )}

            {/* Language dropdown */}
            {openPanel === "lang" && (
              <div className="settings-dropdown overlay-settings-dropdown">
                <span className="settings-section-title">{t("settings.language")}</span>
                {SUPPORTED_LOCALES.map((loc) => (
                  <button
                    className={`lang-option ${locale === loc.value ? "is-active" : ""}`}
                    key={loc.value}
                    onClick={() => {
                      setLocale(loc.value);
                      setOpenPanel(null);
                    }}
                    type="button"
                  >
                    <span className="lang-option-short">{LOCALE_SHORT[loc.value]}</span>
                    <span>{loc.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Opacity dropdown */}
            {openPanel === "opacity" && onSetOverlayOpacity && (
              <div className="settings-dropdown overlay-settings-dropdown">
                <span className="settings-section-title">{t("settings.overlayOpacity")}</span>
                <div className="opacity-slider-row">
                  <input
                    type="range"
                    className="opacity-slider"
                    min={20}
                    max={100}
                    step={5}
                    value={overlayOpacity ?? 85}
                    onChange={(e) => onSetOverlayOpacity(Number(e.target.value))}
                  />
                  <span className="opacity-value">{overlayOpacity ?? 85}%</span>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      <div className="overlay-body">
        <nav className="tab-bar is-overlay">
          {BUILD_TABS.map((tab) => (
            <button
              className={`tab-button ${activeTab === tab ? "is-active" : ""}`}
              key={tab}
              onClick={() => onSetTab?.(tab)}
              type="button"
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="overlay-expanded-content">
          <BuildTabContent
            activeTab={activeTab}
            build={build}
            progress={progress}
            currentStage={currentStage}
            onSetPobTreeSpec={onSetPobTreeSpec}
            pinnedItems={pinnedItems}
            condensed
            onToggleChecklist={onToggleChecklist}
            onTogglePin={onTogglePin}
          />
        </div>
      </div>
    </section>
  );
}

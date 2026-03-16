import { ChangeEvent, FormEvent, useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { BuildTabContent } from "@/components/BuildTabContent";
import { BUILD_TABS, BuildSourceType } from "@/domain/models";
import { sanitizePobInlineText } from "@/services/pob-display";
import {
  getActivePobTreeSpec,
  getNextPobTreeSpecForLevel,
} from "@/services/pob-selectors";
import { useAppStore } from "@/store/app-store";
import {
  getBuildProgress,
  getCurrentStage,
  getNextObjectives,
  getPinnedItems,
  getSelectedBuild,
} from "@/store/selectors";
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

type ImportMode = "paste" | "file";

const HOTKEY_ACTIONS: Array<{ action: HotkeyAction; labelKey: TranslationKey }> = [
  { action: "toggle-overlay", labelKey: "settings.hotkeyOverlay" },
  { action: "mark-objective", labelKey: "settings.hotkeyMark" },
  { action: "adjust-level", labelKey: "settings.hotkeyLevel" },
  { action: "next-tab", labelKey: "settings.hotkeyNextTab" },
  { action: "prev-tab", labelKey: "settings.hotkeyPrevTab" },
  { action: "toggle-pin", labelKey: "settings.hotkeyPin" },
];

/** Convert Electron accelerator string to a human-readable display. */
function displayAccelerator(acc: string): string {
  return acc
    .replace(/CommandOrControl/g, "Ctrl")
    .replace(/\+/g, " + ");
}

export function MainShell() {
  const { state, actions } = useAppStore();
  const { t, locale, setLocale } = useI18n();
  const [importMode, setImportMode] = useState<ImportMode>("paste");
  const [openPanel, setOpenPanel] = useState<"hotkeys" | "lang" | "help" | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);
  const [sourceValue, setSourceValue] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [error, setError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [buildFilter, setBuildFilter] = useState("");
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [updateProgress, setUpdateProgress] = useState<number | null>(null);
  const [updateReady, setUpdateReady] = useState(false);
  const [hotkeys, setHotkeys] = useState<HotkeyConfig | null>(null);
  const [recordingAction, setRecordingAction] = useState<HotkeyAction | null>(null);

  // Load hotkeys when hotkeys panel opens
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
      // Ignore bare modifier presses
      if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;

      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push("CommandOrControl");
      if (e.shiftKey) parts.push("Shift");
      if (e.altKey) parts.push("Alt");

      // Map special keys to Electron accelerator names
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

  const importModeOptions: Array<{ value: ImportMode; label: string }> = [
    { value: "paste", label: t("import.pasteUrlOrCode") },
    { value: "file", label: t("import.pobFile") },
  ];

  const quickHotkeys = [
    t("hotkeys.openOverlay"),
    t("hotkeys.markNext"),
    t("hotkeys.adjustLevel"),
  ];

  const build = getSelectedBuild(state);
  const progress = build ? getBuildProgress(state, build.id) : undefined;
  const currentStage = build && progress ? getCurrentStage(build, progress) : undefined;
  const pob = build?.pob;
  const activeTreeSpec = getActivePobTreeSpec(pob);
  const nextUpgradeLabel = build ? sanitizePobInlineText(build.summary.nextUpgrade) : "";
  const displayStageTitle = activeTreeSpec?.title ?? currentStage?.title ?? t("session.currentStage");
  const isTreeDrivenBuild = Boolean(pob && pob.treeSpecs.length > 1);
  const nextTreeSpec = getNextPobTreeSpecForLevel(pob, progress?.playerLevel ?? 1);
  const nextObjectives =
    build && progress ? getNextObjectives(build, progress, 3) : [];
  const pinnedItems = build && progress ? getPinnedItems(build, progress) : [];

  useEffect(() => {
    document.body.dataset.view = "main";
  }, []);

  useEffect(() => {
    const d = window.desktop;
    if (!d) return;
    const unsub1 = d.onUpdateAvailable((version) => setUpdateVersion(version));
    const unsub2 = d.onDownloadProgress((percent) => setUpdateProgress(percent));
    const unsub3 = d.onUpdateDownloaded(() => { setUpdateReady(true); setUpdateProgress(null); });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  // Recalculate dropdown position when panel opens or window resizes
  const updateDropdownPos = useCallback(() => {
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
  }, []);

  useEffect(() => {
    if (!openPanel) { setDropdownPos(null); return; }
    updateDropdownPos();
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpenPanel(null);
    };
    window.addEventListener("resize", updateDropdownPos);
    document.addEventListener("mousedown", handleClick);
    return () => {
      window.removeEventListener("resize", updateDropdownPos);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [openPanel, updateDropdownPos]);

  const sourceLabel =
    importMode === "paste"
      ? t("import.pasteLabel")
      : selectedFileName || t("import.fileLabel");

  const detectPastedSourceType = (value: string): Extract<BuildSourceType, "link" | "code"> => {
    const trimmed = value.trim();

    if (
      /^https?:\/\//i.test(trimmed) ||
      /^(?:www\.)?(?:pobb\.in|pastebin\.com)\//i.test(trimmed)
    ) {
      return "link";
    }

    return "code";
  };

  const handleImport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!sourceValue.trim()) {
      setError(t("import.emptyError"));
      return;
    }

    try {
      setIsImporting(true);
      const sourceType: BuildSourceType =
        importMode === "file" ? "file" : detectPastedSourceType(sourceValue);
      await actions.importBuild(sourceType, sourceValue);
      setSourceValue("");
      setSelectedFileName("");
      setError("");
    } catch (caughtError) {
      const nextError =
        caughtError instanceof Error
          ? caughtError.message
          : t("import.genericError");
      setError(nextError);
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSourceValue(await file.text());
    setImportMode("file");
    setSelectedFileName(file.name);
    setError("");
  };

  const toggleOverlay = () => {
    if (window.desktop) {
      void window.desktop.toggleOverlay();
    }
  };

  const resetOverlayPosition = () => {
    if (window.desktop) {
      void window.desktop.resetOverlayPosition();
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <section className="sb-section">
          <div className="section-heading">
            <h2>{t("import.heading")}</h2>
            <span>{t("import.desktopOnly")}</span>
          </div>
          <form className="section-stack" onSubmit={handleImport}>
            <div className="source-toggle">
              {importModeOptions.map((option) => (
                <button
                  className={`toggle-chip ${importMode === option.value ? "is-active" : ""}`}
                  key={option.value}
                  onClick={() => {
                    setImportMode(option.value);
                    setError("");
                  }}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>

            {importMode === "file" ? (
              <label className="file-drop">
                <span>{sourceLabel}</span>
                <input onChange={handleFileImport} type="file" />
              </label>
            ) : (
              <label className="field">
                <span className="field-label">{sourceLabel}</span>
                <textarea
                  className="text-area"
                  onChange={(event) => setSourceValue(event.target.value)}
                  placeholder={t("import.pastePlaceholder")}
                  rows={6}
                  value={sourceValue}
                />
              </label>
            )}

            {error && <p className="error-copy">{error}</p>}

            <div className="inline-actions">
              <button className="primary-button" disabled={isImporting} type="submit">
                {isImporting ? t("import.importing") : t("import.importButton")}
              </button>
              <button className="ghost-button" onClick={toggleOverlay} type="button">
                {t("import.openOverlay")}
              </button>
            </div>
          </form>
        </section>

        <section className="sb-section">
          <div className="section-heading">
            <h2>{t("builds.heading")}</h2>
            <span>{state.builds.length}</span>
          </div>
          {state.builds.length === 0 ? (
            <p className="subtle">{t("builds.empty")}</p>
          ) : (
            <div className="build-list">
              {state.builds.length > 3 && (
                <input
                  className="build-filter"
                  type="text"
                  placeholder={t("builds.searchPlaceholder")}
                  value={buildFilter}
                  onChange={(e) => setBuildFilter(e.target.value)}
                />
              )}
              {(() => {
                const q = buildFilter.toLowerCase().trim();
                const filtered = q
                  ? state.builds.filter((b) =>
                      b.name.toLowerCase().includes(q) ||
                      b.className.toLowerCase().includes(q) ||
                      b.ascendancy.toLowerCase().includes(q) ||
                      (b.league ?? "").toLowerCase().includes(q)
                    )
                  : state.builds;
                const grouped = new Map<string, typeof state.builds>();
                for (const entry of filtered) {
                  const key = entry.league || t("builds.unknownLeague");
                  const group = grouped.get(key);
                  if (group) group.push(entry);
                  else grouped.set(key, [entry]);
                }
                return [...grouped.entries()].map(([league, entries]) => (
                  <div key={league} className="build-league-group">
                    <span className="build-league-label">{league}</span>
                    {entries.map((entry) => {
                      const isActive = entry.id === (state.selectedBuildId ?? state.builds[0]?.id);
                      return (
                        <div
                          key={entry.id}
                          className={`build-list-item ${isActive ? "is-active" : ""}`}
                        >
                          <button
                            className="build-list-select"
                            onClick={() => actions.selectBuild(entry.id)}
                            type="button"
                          >
                            <strong>{entry.name}</strong>
                            <span>{entry.className} · {entry.ascendancy}</span>
                          </button>
                          <button
                            className="build-list-reimport"
                            onClick={(e) => {
                              e.stopPropagation();
                              actions.reimportBuild(entry.id);
                            }}
                            title={t("builds.reimport")}
                            type="button"
                          >
                            ↻
                          </button>
                          <button
                            className="build-list-copy"
                            onClick={(e) => {
                              e.stopPropagation();
                              const text = entry.sourceType === "link"
                                ? entry.sourceValue
                                : entry.sourceValue;
                              navigator.clipboard.writeText(text).then(() => {
                                const btn = e.currentTarget;
                                btn.textContent = "✓";
                                setTimeout(() => { btn.textContent = "⎘"; }, 1200);
                              });
                            }}
                            title={t("builds.copySource")}
                            type="button"
                          >
                            ⎘
                          </button>
                          <button
                            className="build-list-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              actions.deleteBuild(entry.id);
                            }}
                            title={t("builds.delete")}
                            type="button"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
          )}
        </section>

        <p className="sidebar-legal">
          Game images © Grinding Gear Games.
        </p>
      </aside>

      <main className="workspace">
        <header className="header-bar">
          <div className="header-copy">
            <span className="eyebrow">{t("header.appName")}</span>
            <h1>{build ? build.name : t("header.tagline")}</h1>
            <p className="header-subcopy">
              {build
                ? `${build.className} · ${build.ascendancy} · ${displayStageTitle}`
                : t("header.importPrompt")}
            </p>
          </div>
          <div className="header-actions">
            <div className="header-tools" ref={panelRef}>
              {/* Shortcuts icon */}
              <button
                className={`tool-trigger${openPanel === "hotkeys" ? " is-active" : ""}`}
                onClick={() => setOpenPanel(openPanel === "hotkeys" ? null : "hotkeys")}
                type="button"
                aria-label={t("settings.hotkeys")}
                title={t("settings.hotkeys")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8" />
                </svg>
              </button>

              {/* Language icon */}
              <button
                className={`tool-trigger${openPanel === "lang" ? " is-active" : ""}`}
                onClick={() => setOpenPanel(openPanel === "lang" ? null : "lang")}
                type="button"
                aria-label={t("settings.language")}
                title={t("settings.language")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />
                </svg>
              </button>

              {/* Help icon */}
              <button
                className={`tool-trigger${openPanel === "help" ? " is-active" : ""}`}
                onClick={() => setOpenPanel(openPanel === "help" ? null : "help")}
                type="button"
                aria-label={t("help.title")}
                title={t("help.title")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </button>

              {/* Dropdowns rendered via portal — see below */}
            </div>
          </div>
        </header>

        {/* Settings dropdowns — rendered via portal to escape header stacking context */}
        {openPanel && dropdownPos && createPortal(
          <div
            ref={dropdownRef}
            className={`settings-dropdown settings-dropdown--portal${openPanel === "help" ? " help-dropdown" : ""}`}
            style={{ top: dropdownPos.top, right: dropdownPos.right }}
          >
            {openPanel === "hotkeys" && (
              <>
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
                <hr className="settings-divider" />
                <span className="settings-section-title">{t("settings.overlayOpacity")}</span>
                <div className="opacity-slider-row">
                  <input
                    type="range"
                    className="opacity-slider"
                    min={20}
                    max={100}
                    step={5}
                    value={state.overlayOpacity}
                    onChange={(e) => actions.setOverlayOpacity(Number(e.target.value))}
                  />
                  <span className="opacity-value">{state.overlayOpacity}%</span>
                </div>
              </>
            )}
            {openPanel === "lang" && (
              <>
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
              </>
            )}
            {openPanel === "help" && (
              <>
                <span className="settings-section-title">{t("help.title")}</span>
                <div className="help-step">
                  <span className="help-step-num">1</span>
                  <div>
                    <strong>{t("help.step1Title")}</strong>
                    <p>{t("help.step1Desc")}</p>
                  </div>
                </div>
                <div className="help-step">
                  <span className="help-step-num">2</span>
                  <div>
                    <strong>{t("help.step2Title")}</strong>
                    <p>{t("help.step2Desc")}</p>
                  </div>
                </div>
                <div className="help-step">
                  <span className="help-step-num">3</span>
                  <div>
                    <strong>{t("help.step3Title")}</strong>
                    <p>{t("help.step3Desc")}</p>
                  </div>
                </div>
                <hr className="settings-divider" />
                <div className="help-tip">
                  <strong>{t("help.tip")}</strong>
                  <p>{t("help.tipDesc")}</p>
                </div>
              </>
            )}
          </div>,
          document.body,
        )}

        {updateVersion && (
          <div className="update-banner">
            {updateReady ? (
              <>
                <span>{t("update.ready", { version: updateVersion })}</span>
                <button
                  className="ghost-button"
                  onClick={() => window.desktop?.updaterInstall()}
                  type="button"
                >
                  {t("update.installNow")}
                </button>
              </>
            ) : updateProgress != null ? (
              <>
                <span>{t("update.downloading", { percent: updateProgress })}</span>
                <div className="update-progress-bar">
                  <div className="update-progress-fill" style={{ width: `${updateProgress}%` }} />
                </div>
              </>
            ) : (
              <>
                <span>{t("update.available", { version: updateVersion })}</span>
                <button
                  className="ghost-button"
                  onClick={() => { setUpdateProgress(0); window.desktop?.updaterDownload(); }}
                  type="button"
                >
                  {t("update.download")}
                </button>
                <button
                  className="ghost-button"
                  onClick={() => setUpdateVersion(null)}
                  type="button"
                >
                  ✕
                </button>
              </>
            )}
          </div>
        )}

        {build && progress && currentStage && (
          <div className="session-strip">
            <span className="session-strip-label">
              {isTreeDrivenBuild ? t("session.activeTree") : t("session.currentStage")}
              {": "}
              <strong>{displayStageTitle}</strong>
            </span>

            <div className="level-controls">
              <button
                className="icon-button"
                onClick={() => actions.setPlayerLevel(build.id, progress.playerLevel - 1)}
                type="button"
              >
                −
              </button>
              <input
                className="level-input"
                max={100}
                min={1}
                onChange={(e) =>
                  actions.setPlayerLevel(build.id, Number(e.target.value) || 1)
                }
                type="number"
                value={progress.playerLevel}
              />
              <button
                className="icon-button"
                onClick={() => actions.setPlayerLevel(build.id, progress.playerLevel + 1)}
                type="button"
              >
                +
              </button>
            </div>

            {isTreeDrivenBuild && nextTreeSpec && (
              <span className="session-strip-hint">
                {t("session.nextTree", { title: nextTreeSpec.title })}
              </span>
            )}

            <div className="session-strip-actions">
              <button className="ghost-button" onClick={toggleOverlay} type="button">
                {t("session.showOverlay")}
              </button>
              <button className="ghost-button" onClick={resetOverlayPosition} type="button">
                {t("session.recenter")}
              </button>
            </div>
          </div>
        )}

        {!build || !progress || !currentStage ? (
          <section className="panel empty-state">
            <h2>{t("empty.heading")}</h2>
            <p>
              {t("empty.description")}
            </p>
          </section>
        ) : (
          <>
            <div className="hero-grid">
              <section className="hero-card">
                <div className="section-heading">
                  <h2>{t("hero.now")}</h2>
                  <span>{isTreeDrivenBuild ? t("hero.activeTree") : t("hero.activeStage")}</span>
                </div>
                <div className="hero-stage">
                  <span className="pill">
                    Lvl {currentStage.levelMin}-{currentStage.levelMax}
                  </span>
                  <h3>{displayStageTitle}</h3>
                  <p className="lead-copy">{currentStage.summary}</p>
                </div>
                <div className="metric-stack">
                  <div>
                    <span>{t("hero.nextAction")}</span>
                    <strong>{nextObjectives[0]?.text ?? t("hero.checklistComplete")}</strong>
                  </div>
                  <div>
                    <span>{t("hero.nextUpgrade")}</span>
                    <strong>{nextUpgradeLabel || t("hero.reviewSnapshot")}</strong>
                  </div>
                  <div>
                    <span>{t("hero.currentLevel")}</span>
                    <strong>{progress.playerLevel}</strong>
                  </div>
                </div>
                <div className="inline-actions">
                  <button
                    className="primary-button"
                    onClick={() => actions.markNextObjective(build.id)}
                    type="button"
                  >
                    {t("hero.completeNext")}
                  </button>
                  <button className="ghost-button" onClick={toggleOverlay} type="button">
                    {t("hero.showOverlay")}
                  </button>
                </div>
              </section>

              <section className="hero-card">
                <div className="section-heading">
                  <h2>{t("hero.shortQueue")}</h2>
                  <span>{t("hero.objectiveCount", { count: nextObjectives.length })}</span>
                </div>
                <div className="checklist">
                  {nextObjectives.map((item) => (
                    <div className="checklist-item" key={item.id}>
                      <div className="checklist-main">
                        <span className="check-badge">Now</span>
                        <strong>{item.text}</strong>
                        <span>{item.stageTitle}</span>
                      </div>
                      <button
                        aria-label={t("hero.markAsCompleted", { text: item.text })}
                        className="check-toggle-button"
                        onClick={() => actions.toggleChecklist(build.id, item.id)}
                        type="button"
                      >
                        ✓
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mini-help">
                  <>
                    <span className="mini-help-title">{t("hero.usefulHotkeys")}</span>
                    {quickHotkeys.map((item) => (
                      <div className="mini-help-row" key={item}>
                        <span>{item}</span>
                      </div>
                    ))}
                  </>
                </div>
              </section>
            </div>

            <nav className="tab-bar">
              {BUILD_TABS.map((tab) => (
                <button
                  className={`tab-button ${state.activeTab === tab ? "is-active" : ""}`}
                  key={tab}
                  onClick={() => actions.setActiveTab(tab)}
                  type="button"
                >
                  {tab}
                </button>
              ))}
            </nav>

            <section className="workspace-scroll">
              <BuildTabContent
                activeTab={state.activeTab}
                build={build}
                currentStage={currentStage}
                onSetPobTreeSpec={(specId) => actions.setPobTreeSpec(build.id, specId)}
                onToggleChecklist={(itemId) => actions.toggleChecklist(build.id, itemId)}
                onTogglePin={(itemId) => actions.togglePin(build.id, itemId)}
                pinnedItems={pinnedItems}
                progress={progress}
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}

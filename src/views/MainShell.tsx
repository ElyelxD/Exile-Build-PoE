import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
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

export function MainShell() {
  const { state, actions } = useAppStore();
  const { t, locale, setLocale } = useI18n();
  const [importMode, setImportMode] = useState<ImportMode>("paste");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [sourceValue, setSourceValue] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [error, setError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [updateProgress, setUpdateProgress] = useState<number | null>(null);
  const [updateReady, setUpdateReady] = useState(false);

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

  useEffect(() => {
    if (!settingsOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [settingsOpen]);

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
              {(() => {
                const grouped = new Map<string, typeof state.builds>();
                for (const entry of state.builds) {
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
          <div className="inline-actions header-actions">
            {build && (
              <button
                className="ghost-button"
                onClick={() => actions.markNextObjective(build.id)}
                type="button"
              >
                {t("header.markNext")}
              </button>
            )}
            <button className="primary-button" onClick={toggleOverlay} type="button">
              {t("header.openOverlay")}
            </button>
            <div className="settings-picker" ref={settingsRef}>
              <button
                className="settings-trigger"
                onClick={() => setSettingsOpen((v) => !v)}
                type="button"
                aria-label={t("settings.heading")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
              {settingsOpen && (
                <div className="settings-dropdown">
                  <span className="settings-section-title">{t("settings.hotkeys")}</span>
                  <div className="settings-hotkey-row">
                    <span>Open overlay</span>
                    <kbd>Ctrl+Shift+O</kbd>
                  </div>
                  <div className="settings-hotkey-row">
                    <span>Mark next</span>
                    <kbd>Ctrl+Shift+M</kbd>
                  </div>
                  <div className="settings-hotkey-row">
                    <span>Adjust level</span>
                    <kbd>Ctrl+Shift+L</kbd>
                  </div>
                  <hr className="settings-divider" />
                  <span className="settings-section-title">{t("settings.language")}</span>
                  {SUPPORTED_LOCALES.map((loc) => (
                    <button
                      className={`lang-option ${locale === loc.value ? "is-active" : ""}`}
                      key={loc.value}
                      onClick={() => {
                        setLocale(loc.value);
                        setSettingsOpen(false);
                      }}
                      type="button"
                    >
                      <span className="lang-option-short">{LOCALE_SHORT[loc.value]}</span>
                      <span>{loc.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

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

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { BuildTabContent } from "@/components/BuildTabContent";
import { BUILD_TABS, BuildSourceType } from "@/domain/models";
import { sanitizePobInlineText, splitPobParagraphs } from "@/services/pob-display";
import {
  getActivePobItemSet,
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
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const [sourceValue, setSourceValue] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [error, setError] = useState("");
  const [isImporting, setIsImporting] = useState(false);

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
  const activeItemSet = getActivePobItemSet(pob);
  const activePobItems =
    pob && activeItemSet
      ? pob.items.filter((item) => item.setId === activeItemSet.id)
      : pob?.items ?? [];
  const pobNotePreview = build
    ? splitPobParagraphs(build.notes)[0]?.split("\n")[0]
    : undefined;
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
    if (!langOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [langOpen]);

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
        <section className="panel import-card">
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

        <section className="panel">
          <div className="section-heading">
            <h2>{t("builds.heading")}</h2>
            <span>{state.builds.length}</span>
          </div>
          {state.builds.length === 0 ? (
            <p className="subtle">{t("builds.empty")}</p>
          ) : (
            <label className="field pob-spec-field">
              <span className="field-label">{t("builds.activeBuild")}</span>
              <select
                className="pob-spec-select"
                onChange={(event) => actions.selectBuild(event.target.value)}
                value={state.selectedBuildId ?? state.builds[0]?.id ?? ""}
              >
                {state.builds.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name} · {entry.className} · {entry.ascendancy}
                  </option>
                ))}
              </select>
            </label>
          )}
        </section>

        <section className="panel is-import-summary">
          <div className="section-heading">
            <h2>{pob ? t("snapshot.heading") : t("snapshot.legacyHeading")}</h2>
            <span>{pob ? t("snapshot.exactImport") : t("snapshot.reimport")}</span>
          </div>
          {pob ? (
            <>
              <div className="metric-stack">
                <div>
                  <span>{t("snapshot.mainSkill")}</span>
                  <strong>{pob.mainSkill ?? t("snapshot.noMainLabel")}</strong>
                </div>
                <div>
                  <span>{t("snapshot.activeTree")}</span>
                  <strong>{activeTreeSpec?.title ?? t("snapshot.noActiveSpec")}</strong>
                </div>
                <div>
                  <span>{t("snapshot.activeItemSet")}</span>
                  <strong>{activeItemSet?.title ?? t("snapshot.noActiveSet")}</strong>
                </div>
                <div>
                  <span>{t("snapshot.itemsInSet")}</span>
                  <strong>{activePobItems.length}</strong>
                </div>
              </div>
              {pob.treeSpecs.length > 1 && (
                <div className="pob-spec-switcher">
                  <span className="mini-help-title">{t("snapshot.pobTrees")}</span>
                  <label className="field pob-spec-field">
                    <span className="field-label">{t("snapshot.activeTreeInApp")}</span>
                    <select
                      className="pob-spec-select"
                      onChange={(event) => actions.setPobTreeSpec(build.id, event.target.value)}
                      value={activeTreeSpec?.id ?? ""}
                    >
                      {pob.treeSpecs.map((spec) => (
                        <option key={spec.id} value={spec.id}>
                          {spec.title}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
              <div className="mini-help">
                <span className="mini-help-title">{t("snapshot.importedContent")}</span>
                <div className="mini-help-row">
                  <strong>{t("snapshot.treeSpecCount", { count: pob.treeSpecs.length })}</strong>
                  <span>{t("snapshot.fromPoB")}</span>
                </div>
                <div className="mini-help-row">
                  <strong>{t("snapshot.skillGroupCount", { count: pob.skillGroups.length })}</strong>
                  <span>{t("snapshot.importedExactly")}</span>
                </div>
                <div className="mini-help-row">
                  <strong>{pob.bandit ?? t("snapshot.noBandit")}</strong>
                  <span>
                    {[pob.pantheonMajor, pob.pantheonMinor].filter(Boolean).join(" · ") ||
                      t("snapshot.pantheonNotSpecified")}
                  </span>
                </div>
                {pobNotePreview && (
                  <div className="mini-help-row">
                    <strong>{t("snapshot.notes")}</strong>
                    <span>{pobNotePreview}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="lead-copy">
                {t("snapshot.legacyDescription")}
              </p>
              <div className="mini-help">
                <span className="mini-help-title">{t("snapshot.nextStep")}</span>
                <div className="mini-help-row">
                  <strong>{t("snapshot.reimportPoB")}</strong>
                  <span>{t("snapshot.reimportDetail")}</span>
                </div>
                <div className="mini-help-row">
                  <strong>{t("snapshot.noDataLoss")}</strong>
                  <span>{t("snapshot.noDataLossDetail")}</span>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="panel">
          <div className="section-heading">
            <h2>{t("session.heading")}</h2>
            <span>{t("session.alwaysOnTop")}</span>
          </div>
          <p className="subtle">
            {t("session.displayTip")}
          </p>
          {build && progress && currentStage ? (
            <div className="section-stack">
              <div className="metric-stack">
                <div>
                  <span>{isTreeDrivenBuild ? t("session.activeTree") : t("session.currentStage")}</span>
                  <strong>{displayStageTitle}</strong>
                </div>
                <div>
                  <span>{t("session.playerLevel")}</span>
                  <strong>{progress.playerLevel}</strong>
                </div>
              </div>

              {isTreeDrivenBuild && (
                <p className="subtle">
                  {nextTreeSpec
                    ? t("session.nextTree", { title: nextTreeSpec.title })
                    : t("session.lastTreeActive")}
                </p>
              )}

              <div className="level-controls">
                <button
                  className="icon-button"
                  onClick={() => actions.setPlayerLevel(build.id, progress.playerLevel - 1)}
                  type="button"
                >
                  -
                </button>
                <input
                  className="level-input"
                  max={100}
                  min={1}
                  onChange={(event) =>
                    actions.setPlayerLevel(build.id, Number(event.target.value) || 1)
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

              <div className="inline-actions overlay-session-actions">
                <button className="ghost-button" onClick={toggleOverlay} type="button">
                  {t("session.showOverlay")}
                </button>
                <button className="ghost-button" onClick={resetOverlayPosition} type="button">
                  {t("session.recenter")}
                </button>
              </div>
            </div>
          ) : (
            <p className="subtle">{t("session.importToActivate")}</p>
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
            <div className="lang-picker" ref={langRef}>
              <button
                className="lang-trigger"
                onClick={() => setLangOpen((v) => !v)}
                type="button"
                aria-label={t("locale.label")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />
                </svg>
                <span>{LOCALE_SHORT[locale]}</span>
              </button>
              {langOpen && (
                <div className="lang-dropdown">
                  {SUPPORTED_LOCALES.map((loc) => (
                    <button
                      className={`lang-option ${locale === loc.value ? "is-active" : ""}`}
                      key={loc.value}
                      onClick={() => {
                        setLocale(loc.value);
                        setLangOpen(false);
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

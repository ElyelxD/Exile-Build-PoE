import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { BuildTabContent } from "@/components/BuildTabContent";
import { BUILD_TABS, BuildSourceType, PoeAssetsState } from "@/domain/models";
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

type ImportMode = "paste" | "file";

const importModeOptions: Array<{ value: ImportMode; label: string }> = [
  { value: "paste", label: "Colar URL ou code" },
  { value: "file", label: "PoB file" },
];

const quickHotkeys = [
  "Ctrl + Shift + O abre o overlay",
  "Ctrl + Shift + M marca o próximo objetivo",
  "Ctrl + Shift + L ajusta o nível rapidamente",
];

export function MainShell() {
  const { state, actions } = useAppStore();
  const [importMode, setImportMode] = useState<ImportMode>("paste");
  const [sourceValue, setSourceValue] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [error, setError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [poeAssetsState, setPoeAssetsState] = useState<PoeAssetsState | null>(null);
  const [isSyncingAssets, setIsSyncingAssets] = useState(false);

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
  const displayStageTitle = activeTreeSpec?.title ?? currentStage?.title ?? "Sem stage";
  const isTreeDrivenBuild = Boolean(pob && pob.treeSpecs.length > 1);
  const nextTreeSpec = getNextPobTreeSpecForLevel(pob, progress?.playerLevel ?? 1);
  const nextObjectives =
    build && progress ? getNextObjectives(build, progress, 3) : [];
  const pinnedItems = build && progress ? getPinnedItems(build, progress) : [];

  useEffect(() => {
    document.body.dataset.view = "main";
  }, []);

  useEffect(() => {
    if (!window.desktop?.getPoeAssetsState) {
      return;
    }

    let isMounted = true;

    void window.desktop.getPoeAssetsState().then((nextState) => {
      if (isMounted) {
        setPoeAssetsState(nextState);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const sourceLabel =
    importMode === "paste"
      ? "Cole um link do pobb.in/pastebin ou o código exportado do Path of Building"
      : selectedFileName || "Selecione um arquivo exportado do Path of Building";

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
      setError("Informe um link, código ou arquivo do Path of Building.");
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
          : "Não foi possível importar esse Path of Building.";
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

  const choosePoeInstallPath = async () => {
    if (!window.desktop?.choosePoeInstallPath) {
      return;
    }

    setPoeAssetsState(await window.desktop.choosePoeInstallPath());
  };

  const choosePoeExtractorPath = async () => {
    if (!window.desktop?.choosePoeExtractorPath) {
      return;
    }

    setPoeAssetsState(await window.desktop.choosePoeExtractorPath());
  };

  const syncPoeAssets = async () => {
    if (!window.desktop?.syncPoeAssets) {
      return;
    }

    try {
      setIsSyncingAssets(true);
      setPoeAssetsState(await window.desktop.syncPoeAssets());
    } finally {
      setIsSyncingAssets(false);
    }
  };

  const poeAssetsStatusLabel = {
    idle: "Ainda não configurado",
    ready: "Cache local pronto",
    "missing-install": "Pasta do PoE pendente",
    "missing-extractor": "Extractor local pendente",
    syncing: "Sincronizando",
    error: "Erro de sincronização",
  } as const;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <section className="panel import-card">
          <div className="section-heading">
            <h2>PoB Import</h2>
            <span>Desktop only</span>
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
                  placeholder="https://pobb.in/... ou cole aqui o código exportado do Path of Building"
                  rows={6}
                  value={sourceValue}
                />
              </label>
            )}

            {error && <p className="error-copy">{error}</p>}

            <div className="inline-actions">
              <button className="primary-button" disabled={isImporting} type="submit">
                {isImporting ? "Importando..." : "Importar PoB"}
              </button>
              <button className="ghost-button" onClick={toggleOverlay} type="button">
                Abrir overlay
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="section-heading">
            <h2>PoE assets</h2>
            <span>Mining local</span>
          </div>
          <div className="mini-help">
            <div className="mini-help-row">
              <strong>Status</strong>
              <span>{poeAssetsState ? poeAssetsStatusLabel[poeAssetsState.status] : "Carregando..."}</span>
            </div>
            <div className="mini-help-row">
              <strong>Pasta do PoE</strong>
              <span>{poeAssetsState?.installPath ?? "Não definida"}</span>
            </div>
            <div className="mini-help-row">
              <strong>Biblioteca</strong>
              <span>{poeAssetsState?.extractorPath ?? "Python env / não definida"}</span>
            </div>
            {poeAssetsState?.lastError && (
              <div className="mini-help-row">
                <strong>Último erro</strong>
                <span>{poeAssetsState.lastError}</span>
              </div>
            )}
          </div>
          <p className="subtle">
            Esse fluxo mantém os assets no cache local do usuário. Nada é commitado no repositório.
          </p>
          <div className="section-stack">
            <button className="ghost-button" onClick={choosePoeInstallPath} type="button">
              Escolher pasta do PoE
            </button>
            <button className="ghost-button" onClick={choosePoeExtractorPath} type="button">
              Escolher pasta da biblioteca
            </button>
            <button className="primary-button" disabled={isSyncingAssets} onClick={syncPoeAssets} type="button">
              {isSyncingAssets ? "Sincronizando assets..." : "Sincronizar assets locais"}
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <h2>Builds locais</h2>
            <span>{state.builds.length}</span>
          </div>
          <div className="build-list">
            {state.builds.length === 0 ? (
              <p className="subtle">Nenhum Path of Building importado ainda.</p>
            ) : (
              state.builds.map((entry) => (
                <button
                  className={`build-row ${entry.id === state.selectedBuildId ? "is-active" : ""}`}
                  key={entry.id}
                  onClick={() => actions.selectBuild(entry.id)}
                  type="button"
                >
                  <strong>{entry.name}</strong>
                  <span>
                    {entry.className} · {entry.ascendancy}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <h2>Overlay session</h2>
            <span>Always on top</span>
          </div>
          <p className="subtle">
            No PoE, use Janela sem borda ou Janela. Fullscreen exclusivo pode bloquear overlays
            desktop.
          </p>
          {build && progress && currentStage ? (
            <div className="section-stack">
              <div className="metric-stack">
                <div>
                  <span>{isTreeDrivenBuild ? "Tree ativa" : "Stage atual"}</span>
                  <strong>{displayStageTitle}</strong>
                </div>
                <div>
                  <span>Player level</span>
                  <strong>{progress.playerLevel}</strong>
                </div>
              </div>

              {isTreeDrivenBuild && (
                <p className="subtle">
                  {nextTreeSpec
                    ? `Próxima tree: ${nextTreeSpec.title}`
                    : "Última tree importada do PoB ativa."}
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

              <div className="inline-actions">
                <button className="ghost-button" onClick={toggleOverlay} type="button">
                  Toggle overlay
                </button>
                <button className="ghost-button" onClick={resetOverlayPosition} type="button">
                  Recentrar
                </button>
                <button
                  className="ghost-button"
                  onClick={actions.toggleOverlayMode}
                  type="button"
                >
                  {state.overlayMode === "compact" ? "Modo expandido" : "Modo compacto"}
                </button>
              </div>
            </div>
          ) : (
            <p className="subtle">Importe um PoB para ativar a sessão do overlay.</p>
          )}
        </section>
      </aside>

      <main className="workspace">
        <header className="header-bar">
          <div className="header-copy">
            <span className="eyebrow">Exile Build PoE</span>
            <h1>{build ? build.name : "Overlay operacional para Path of Building"}</h1>
            <p className="header-subcopy">
              {build
                ? `${build.className} · ${build.ascendancy} · ${displayStageTitle}`
                : "Importe um PoB e acompanhe a build com uma janela sempre visível e menos ruído."}
            </p>
          </div>
          <div className="inline-actions header-actions">
            {build && (
              <button
                className="ghost-button"
                onClick={() => actions.markNextObjective(build.id)}
                type="button"
              >
                Marcar próximo
              </button>
            )}
            <button className="primary-button" onClick={toggleOverlay} type="button">
              Abrir overlay
            </button>
          </div>
        </header>

        {!build || !progress || !currentStage ? (
          <section className="panel empty-state">
            <h2>Estrutura inicial do app desktop pronta</h2>
            <p>
              Importe um Path of Building para gerar stages, overlay shell, checklist e progresso local.
            </p>
          </section>
        ) : (
          <>
            <div className="hero-grid">
              <section className="hero-card">
                <div className="section-heading">
                  <h2>Agora</h2>
                  <span>{isTreeDrivenBuild ? "Tree ativa" : "Stage ativo"}</span>
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
                    <span>Próxima ação</span>
                    <strong>{nextObjectives[0]?.text ?? "Checklist atual completo"}</strong>
                  </div>
                  <div>
                    <span>Próximo upgrade</span>
                    <strong>{nextUpgradeLabel || "Revisar snapshot do PoB"}</strong>
                  </div>
                  <div>
                    <span>Nível atual</span>
                    <strong>{progress.playerLevel}</strong>
                  </div>
                </div>
                <div className="inline-actions">
                  <button
                    className="primary-button"
                    onClick={() => actions.markNextObjective(build.id)}
                    type="button"
                  >
                    Concluir próximo
                  </button>
                  <button className="ghost-button" onClick={toggleOverlay} type="button">
                    Mostrar overlay
                  </button>
                </div>
              </section>

              <section className="hero-card">
                <div className="section-heading">
                  <h2>Fila curta</h2>
                  <span>{nextObjectives.length} objetivos</span>
                </div>
                <div className="checklist">
                  {nextObjectives.map((item) => (
                    <div className="checklist-item" key={item.id}>
                      <button
                        className="checklist-main"
                        onClick={() => actions.toggleChecklist(build.id, item.id)}
                        type="button"
                      >
                        <span className="check-badge">Now</span>
                        <strong>{item.text}</strong>
                        <span>{item.stageTitle}</span>
                      </button>
                      <button
                        className="icon-button"
                        onClick={() => actions.togglePin(build.id, item.id)}
                        type="button"
                      >
                        Pin
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mini-help">
                  {pinnedItems.length > 0 ? (
                    <>
                      <span className="mini-help-title">Pinados</span>
                      {pinnedItems.slice(0, 2).map((item) => (
                        <div className="mini-help-row" key={item.id}>
                          <strong>{item.text}</strong>
                          <span>{item.stageTitle}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      <span className="mini-help-title">Hotkeys úteis</span>
                      {quickHotkeys.map((item) => (
                        <div className="mini-help-row" key={item}>
                          <span>{item}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </section>

              <section className="hero-card is-import-summary">
                <div className="section-heading">
                  <h2>{pob ? "Snapshot do PoB" : "Import legado"}</h2>
                  <span>{pob ? "Import exato" : "Reimporte"}</span>
                </div>
                {pob ? (
                  <>
                    <div className="metric-stack">
                      <div>
                        <span>Skill principal</span>
                        <strong>{pob.mainSkill ?? "Sem label principal"}</strong>
                      </div>
                      <div>
                        <span>Tree ativa</span>
                        <strong>{activeTreeSpec?.title ?? "Sem spec ativa"}</strong>
                      </div>
                      <div>
                        <span>Item set ativo</span>
                        <strong>{activeItemSet?.title ?? "Sem set ativo"}</strong>
                      </div>
                      <div>
                        <span>Itens no set</span>
                        <strong>{activePobItems.length}</strong>
                      </div>
                    </div>
                    {pob.treeSpecs.length > 1 && (
                      <div className="pob-spec-switcher">
                        <span className="mini-help-title">Trees do PoB</span>
                        <label className="field pob-spec-field">
                          <span className="field-label">Tree ativa no app</span>
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
                      <span className="mini-help-title">Conteúdo importado</span>
                      <div className="mini-help-row">
                        <strong>{pob.treeSpecs.length} tree spec{pob.treeSpecs.length === 1 ? "" : "s"}</strong>
                        <span>do Path of Building</span>
                      </div>
                      <div className="mini-help-row">
                        <strong>{pob.skillGroups.length} grupo{pob.skillGroups.length === 1 ? "" : "s"} de skill</strong>
                        <span>importados exatamente</span>
                      </div>
                      <div className="mini-help-row">
                        <strong>{pob.bandit ?? "Sem bandit no XML"}</strong>
                        <span>
                          {[pob.pantheonMajor, pob.pantheonMinor].filter(Boolean).join(" · ") ||
                            "Pantheon não informado"}
                        </span>
                      </div>
                      {pobNotePreview && (
                        <div className="mini-help-row">
                          <strong>Notas</strong>
                          <span>{pobNotePreview}</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="lead-copy">
                      Essa build veio do parser antigo e não tem snapshot exato do Path of Building.
                    </p>
                    <div className="mini-help">
                      <span className="mini-help-title">Próximo passo</span>
                      <div className="mini-help-row">
                        <strong>Reimporte esse PoB</strong>
                        <span>para carregar tree specs, skill groups e gear reais.</span>
                      </div>
                      <div className="mini-help-row">
                        <strong>Sem perda de uso</strong>
                        <span>o overlay continua funcionando, mas os dados não batem 1:1 com o PoB.</span>
                      </div>
                    </div>
                  </>
                )}
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

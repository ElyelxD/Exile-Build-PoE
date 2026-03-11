import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { OverlayPanel } from "@/components/OverlayPanel";
import { BuildTabContent } from "@/components/BuildTabContent";
import { BUILD_TABS, BuildSourceType } from "@/domain/models";
import { useAppStore } from "@/store/app-store";
import {
  getBuildProgress,
  getCurrentStage,
  getNextObjectives,
  getPinnedItems,
  getSelectedBuild,
} from "@/store/selectors";

const sourceOptions: Array<{ value: BuildSourceType; label: string }> = [
  { value: "link", label: "PoB link" },
  { value: "code", label: "PoB code" },
  { value: "file", label: "PoB file" },
];

export function MainShell() {
  const { state, actions } = useAppStore();
  const [sourceType, setSourceType] = useState<BuildSourceType>("link");
  const [sourceValue, setSourceValue] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [error, setError] = useState("");

  const build = getSelectedBuild(state);
  const progress = build ? getBuildProgress(state, build.id) : undefined;
  const currentStage = build && progress ? getCurrentStage(build, progress) : undefined;
  const nextObjectives =
    build && progress ? getNextObjectives(build, progress, 3) : [];
  const pinnedItems = build && progress ? getPinnedItems(build, progress) : [];

  useEffect(() => {
    document.body.dataset.view = "main";
  }, []);

  useEffect(() => {
    if (window.desktop) {
      void window.desktop.setOverlayClickThrough(state.overlayClickThrough);
    }
  }, [state.overlayClickThrough]);

  const sourceLabel =
    sourceType === "link"
      ? "Cole um link exportado do Path of Building"
      : sourceType === "code"
        ? "Cole o código exportado do Path of Building"
        : selectedFileName || "Selecione um arquivo exportado do Path of Building";

  const handleImport = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!sourceValue.trim()) {
      setError("Informe um link, código ou arquivo do Path of Building.");
      return;
    }

    actions.importBuild(sourceType, sourceValue);
    setSourceValue("");
    setSelectedFileName("");
    setError("");
  };

  const handleFileImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSourceValue(await file.text());
    setSourceType("file");
    setSelectedFileName(file.name);
    setError("");
  };

  const toggleOverlay = () => {
    if (window.desktop) {
      void window.desktop.toggleOverlay();
    }
  };

  const toggleClickThrough = () => {
    actions.setOverlayClickThrough(!state.overlayClickThrough);
  };

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
              {sourceOptions.map((option) => (
                <button
                  className={`toggle-chip ${sourceType === option.value ? "is-active" : ""}`}
                  key={option.value}
                  onClick={() => {
                    setSourceType(option.value);
                    setError("");
                  }}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>

            {sourceType === "file" ? (
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
                  placeholder={
                    sourceType === "link"
                      ? "https://pobb.in/... ou link exportado equivalente"
                      : "Cole aqui o código/string exportada do Path of Building"
                  }
                  rows={sourceType === "link" ? 4 : 8}
                  value={sourceValue}
                />
              </label>
            )}

            {error && <p className="error-copy">{error}</p>}

            <div className="inline-actions">
              <button className="primary-button" type="submit">
                Importar PoB
              </button>
              <button className="ghost-button" onClick={toggleOverlay} type="button">
                Abrir overlay
              </button>
            </div>
          </form>
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
          {build && progress && currentStage ? (
            <div className="section-stack">
              <div className="metric-stack">
                <div>
                  <span>Stage atual</span>
                  <strong>{currentStage.title}</strong>
                </div>
                <div>
                  <span>Player level</span>
                  <strong>{progress.playerLevel}</strong>
                </div>
              </div>

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
                <button
                  className="ghost-button"
                  onClick={actions.toggleOverlayMode}
                  type="button"
                >
                  {state.overlayMode === "compact" ? "Modo expandido" : "Modo compacto"}
                </button>
              </div>

              <button className="ghost-button" onClick={toggleClickThrough} type="button">
                {state.overlayClickThrough ? "Desativar click-through" : "Ativar click-through"}
              </button>
            </div>
          ) : (
            <p className="subtle">Importe um PoB para ativar a sessão do overlay.</p>
          )}
        </section>
      </aside>

      <main className="workspace">
        <header className="header-bar">
          <div className="header-copy">
            <span className="eyebrow">BuildPilot PoE</span>
            <h1>Desktop overlay para executar builds do Path of Building sem alt-tab constante.</h1>
          </div>
          <div className="inline-actions">
            <button className="primary-button" onClick={toggleOverlay} type="button">
              Ctrl + Shift + O
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
                  <h2>{build.name}</h2>
                  <span>
                    {build.className} · {build.ascendancy}
                  </span>
                </div>
                <p className="lead-copy">{currentStage.summary}</p>
                <div className="metric-stack">
                  <div>
                    <span>Próximos 10-20 min</span>
                    <strong>{nextObjectives[0]?.text ?? "Checklist atual completo"}</strong>
                  </div>
                  <div>
                    <span>Próximo upgrade</span>
                    <strong>{build.summary.nextUpgrade}</strong>
                  </div>
                </div>
              </section>

              <section className="hero-card">
                <div className="section-heading">
                  <h2>Next steps</h2>
                  <span>{nextObjectives.length} visíveis</span>
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
              </section>

              <div className="overlay-preview">
                <OverlayPanel
                  activeTab={state.activeTab}
                  build={build}
                  clickThrough={state.overlayClickThrough}
                  currentStage={currentStage}
                  nextObjectives={nextObjectives}
                  onMarkObjective={() => actions.markNextObjective(build.id)}
                  onSetTab={actions.setActiveTab}
                  onToggleChecklist={(itemId) => actions.toggleChecklist(build.id, itemId)}
                  onToggleClickThrough={toggleClickThrough}
                  onToggleMode={actions.toggleOverlayMode}
                  onTogglePin={(itemId) => actions.togglePin(build.id, itemId)}
                  overlayMode={state.overlayMode}
                  pinnedItems={pinnedItems}
                  progress={progress}
                  variant="preview"
                />
              </div>
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

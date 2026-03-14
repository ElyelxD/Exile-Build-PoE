import type { TranslationKey } from "./en";

const ptBR: Record<TranslationKey, string> = {
  // ── Import section ──
  "import.pasteUrlOrCode": "Colar URL ou code",
  "import.pobFile": "PoB file",
  "import.heading": "PoB Import",
  "import.desktopOnly": "Desktop only",
  "import.pasteLabel":
    "Cole um link do pobb.in/pastebin ou o código exportado do Path of Building",
  "import.fileLabel": "Selecione um arquivo exportado do Path of Building",
  "import.pastePlaceholder":
    "https://pobb.in/... ou cole aqui o código exportado do Path of Building",
  "import.importing": "Importando...",
  "import.importButton": "Importar PoB",
  "import.openOverlay": "Abrir overlay",
  "import.emptyError": "Informe um link, código ou arquivo do Path of Building.",
  "import.genericError": "Não foi possível importar esse Path of Building.",

  // ── Builds section ──
  "builds.heading": "Builds locais",
  "builds.empty": "Nenhum Path of Building importado ainda.",
  "builds.activeBuild": "Build ativa no app",
  "builds.delete": "Excluir build",
  "builds.reimport": "Reimportar build",
  "builds.unknownLeague": "Outras",

  // ── Snapshot / PoB summary ──
  "snapshot.heading": "Snapshot do PoB",
  "snapshot.legacyHeading": "Import legado",
  "snapshot.exactImport": "Import exato",
  "snapshot.reimport": "Reimporte",
  "snapshot.mainSkill": "Skill principal",
  "snapshot.noMainLabel": "Sem label principal",
  "snapshot.activeTree": "Tree ativa",
  "snapshot.noActiveSpec": "Sem spec ativa",
  "snapshot.activeItemSet": "Item set ativo",
  "snapshot.noActiveSet": "Sem set ativo",
  "snapshot.itemsInSet": "Itens no set",
  "snapshot.pobTrees": "Trees do PoB",
  "snapshot.activeTreeInApp": "Tree ativa no app",
  "snapshot.importedContent": "Conteúdo importado",
  "snapshot.treeSpecCount": "{{count}} tree spec(s)",
  "snapshot.skillGroupCount": "{{count}} grupo(s) de skill",
  "snapshot.fromPoB": "do Path of Building",
  "snapshot.importedExactly": "importados exatamente",
  "snapshot.noBandit": "Sem bandit no XML",
  "snapshot.pantheonNotSpecified": "Pantheon não informado",
  "snapshot.notes": "Notas",
  "snapshot.legacyDescription":
    "Essa build veio do parser antigo e não tem snapshot exato do Path of Building.",
  "snapshot.nextStep": "Próximo passo",
  "snapshot.reimportPoB": "Reimporte esse PoB",
  "snapshot.reimportDetail":
    "para carregar tree specs, skill groups e gear reais.",
  "snapshot.noDataLoss": "Sem perda de uso",
  "snapshot.noDataLossDetail":
    "o overlay continua funcionando, mas os dados não batem 1:1 com o PoB.",

  // ── Overlay session ──
  "session.heading": "Overlay session",
  "session.alwaysOnTop": "Always on top",
  "session.displayTip":
    "No PoE, use Janela sem borda ou Janela. Fullscreen exclusivo pode bloquear overlays desktop.",
  "session.activeTree": "Tree ativa",
  "session.currentStage": "Stage atual",
  "session.playerLevel": "Player level",
  "session.nextTree": "Próxima tree: {{title}}",
  "session.lastTreeActive": "Última tree importada do PoB ativa.",
  "session.showOverlay": "Mostrar overlay",
  "session.recenter": "Recentrar",
  "session.importToActivate": "Importe um PoB para ativar a sessão do overlay.",

  // ── Auto-update ──
  "update.available": "Atualização v{{version}} disponível",
  "update.download": "Baixar",
  "update.downloading": "Baixando… {{percent}}%",
  "update.ready": "v{{version}} pronto para instalar",
  "update.installNow": "Reiniciar e atualizar",

  // ── Header / workspace ──
  "header.appName": "Exile Build PoE",
  "header.tagline": "Overlay operacional para Path of Building",
  "header.importPrompt":
    "Importe um PoB e acompanhe a build com uma janela sempre visível e menos ruído.",
  "header.markNext": "Marcar próximo",
  "header.openOverlay": "Abrir overlay",

  // ── Empty state ──
  "empty.heading": "Estrutura inicial do app desktop pronta",
  "empty.description":
    "Importe um Path of Building para gerar stages, overlay shell, checklist e progresso local.",

  // ── Hero cards ──
  "hero.now": "Agora",
  "hero.activeTree": "Tree ativa",
  "hero.activeStage": "Stage ativo",
  "hero.nextAction": "Próxima ação",
  "hero.checklistComplete": "Checklist atual completo",
  "hero.nextUpgrade": "Próximo upgrade",
  "hero.reviewSnapshot": "Revisar snapshot do PoB",
  "hero.currentLevel": "Nível atual",
  "hero.completeNext": "Concluir próximo",
  "hero.showOverlay": "Mostrar overlay",
  "hero.shortQueue": "Fila curta",
  "hero.objectiveCount": "{{count}} objetivos",
  "hero.usefulHotkeys": "Hotkeys úteis",
  "hero.markAsCompleted": "Marcar {{text}} como concluído",

  // ── Hotkeys ──
  "hotkeys.openOverlay": "Ctrl + Shift + O abre o overlay",
  "hotkeys.markNext": "Ctrl + Shift + M marca o próximo objetivo",
  "hotkeys.adjustLevel": "Ctrl + Shift + L ajusta o nível rapidamente",

  // ── Checklist block ──
  "checklist.heading": "Checklist operacional",
  "checklist.itemCount": "{{count}} itens",

  // ── Notes ──
  "notes.empty": "Nenhuma nota importada do Path of Building.",
  "notes.buildNotes": "Notas da build",
  "notes.importMvp": "Import + MVP",
  "notes.currentSnapshot": "Snapshot atual",
  "notes.pinnedItems": "Itens pinados",
  "notes.pinnedActive": "{{count}} ativos",
  "notes.noPinnedItems": "Nenhum item pinado ainda.",

  // ── Overview tab ──
  "overview.pobNow": "PoB agora",
  "overview.mainSkill": "Skill principal",
  "overview.noMainSkill": "Sem label principal no PoB",
  "overview.activeTree": "Tree ativa",
  "overview.noActiveTree": "Sem tree spec ativa",
  "overview.activeItemSet": "Item set ativo",
  "overview.noActiveItemSet": "Sem item set ativo",
  "overview.nextUpgrade": "Próximo upgrade",
  "overview.reviewNotes": "Revisar notas importadas",
  "overview.exactImport": "Import exato",
  "overview.realPoB": "PoB real",
  "overview.treeSpecs": "Tree specs",
  "overview.skillGroups": "Grupos de skill",
  "overview.itemsInActiveSet": "Itens no set ativo",
  "overview.pobNotes": "Notas do PoB",
  "overview.formattedForReading": "Formatadas para leitura",
  "overview.buildNow": "Build agora",
  "overview.playstyle": "Playstyle",
  "overview.currentStage": "Stage atual",
  "overview.warnings": "Warnings",
  "overview.beforePlaying": "Antes de jogar",

  // ── Tree tab ──
  "tree.activeTree": "Tree ativa",
  "tree.treeTimeline": "Timeline de trees",
  "tree.noActiveTree": "Sem tree ativa",
  "tree.activeInApp": "Ativa no app",
  "tree.selectTree": "Selecionar tree",
  "tree.activeTreeInApp": "Tree ativa no app",
  "tree.passiveTree": "Passive tree {{version}}",
  "tree.treeSpecImported": "Tree spec importada exatamente do PoB.",
  "tree.viewTree": "Ver árvore",
  "tree.passiveMilestones": "Passive milestones",
  "tree.pointCount": "{{count}} pontos",
  "tree.fullRoadmap": "Roadmap completo",
  "tree.progressionOrder": "Ordem de progressão",

  // ── Gems tab ──
  "gems.linksAndGems": "Links e gemas",
  "gems.activeSkillSet": "Skill set ativa",
  "gems.linkCount": "{{count}}-link",
  "gems.gemCount": "{{count}} gema",
  "gems.primaryGem": "Gema principal",
  "gems.activeLink": "Link ativo",
  "gems.groupBench": "Banco do grupo",

  // ── Gear tab ──
  "gear.exactGear": "Gear exata do PoB",
  "gear.noItem": "Sem item",
  "gear.flasks": "Frascos",
  "gear.importedFlask": "Frasco importado",
  "gear.swapAndExtra": "Swap e sockets extras",
  "gear.imported": "Importado",
  "gear.uniqueHint": "Unique hint: {{suggestion}}",

  // ── Overlay panel ──
  "overlay.footerCopy": "Ctrl + Shift + M conclui o próximo objetivo",
  "overlay.phase": "Fase",
  "overlay.nextUpgrade": "Próximo upgrade",
  "overlay.reviewSnapshot": "Revisar snapshot do PoB",
  "overlay.currentLevel": "Nível atual",
  "overlay.levelHelpTree":
    "Ao subir o nível, a próxima tree será {{title}}.",
  "overlay.levelHelpStage":
    "Ajustar o nível aqui atualiza o stage ativo no overlay.",
  "overlay.now": "Agora",
  "overlay.next": "Em seguida",
  "overlay.checklistUpToDate": "Checklist em dia",
  "overlay.noPendingItems":
    "Sem pendencias imediatas. Abra os detalhes para revisar a build com calma.",
  "overlay.complete": "Concluir",
  "overlay.noActivePoB": "Nenhum PoB ativo",
  "overlay.importPrompt":
    "Importe um Path of Building na janela principal e use `Ctrl + Shift + O`.",

  // ── Importer service ──
  "importer.desktopRequired":
    "A importação exata de Path of Building precisa do app desktop.",
  "importer.invalidXml": "O XML do Path of Building está inválido.",
  "importer.unknownClass": "Classe desconhecida",
  "importer.unknownAscendancy": "Ascendancy desconhecida",
  "importer.importedGem": "Gem importada",
  "importer.group": "Grupo {{index}}",
  "importer.chooseBandit": "Escolher bandit: {{name}}",
  "importer.pantheonMajor": "Pantheon major: {{name}}",
  "importer.pantheonMinor": "Pantheon minor: {{name}}",
  "importer.doLab": "Fazer {{name}}",
  "importer.followSetup": "Seguir setup {{name}}",
  "importer.followTree": "Seguir a tree {{name}}",
  "importer.checkImportedTree": "Conferir a tree importada do PoB",
  "importer.setupMainSkill": "Montar setup principal de {{name}}",
  "importer.checkActiveSkillSet": "Conferir o skill set ativo do PoB",
  "importer.reviewGear": "Revisar gear do set {{name}}",
  "importer.checkImportedGear": "Conferir a gear importada do PoB",
  "importer.openPobNotes":
    "Abrir as notas exatas do PoB para revisar a fase",
  "importer.importedItem": "Item importado",
  "importer.tagline":
    "Import exato do PoB com {{treeSpecs}} tree spec(s), {{skillGroups}} grupo(s) de skill e {{items}} item(s) no snapshot.",
  "importer.mainSkillPlaystyle": "Skill principal: {{name}}",
  "importer.exactImport": "Import exato do Path of Building.",
  "importer.reviewGearSet": "Revisar gear do set {{name}}",
  "importer.reviewPobNotes": "Revisar as notas do PoB.",
  "importer.snapshotImported": "Snapshot importado",
  "importer.snapshotSummary":
    "Snapshot exato do Path of Building{{mainSkill}}{{itemSet}}.",
  "importer.treeUrl": "Tree URL: {{url}}",
  "importer.treeSpecImported": "Tree spec importada exatamente do PoB.",
  "importer.buildImported":
    "Build importada exatamente do Path of Building.",
  "importer.snapshotGenerated":
    "Snapshot gerado exatamente a partir do Path of Building importado.",
  "importer.ascendancyImported":
    "Classe e ascendancy importadas exatamente do PoB.",
  "importer.banditImported": "Escolha de bandit importada do PoB.",
  "importer.pantheonImported": "Pantheon major/minor importado do PoB.",
  "importer.activeSetImported": "Conjunto ativo importado do PoB.",

  // ── Electron main process ──
  "electron.setPoeFolder":
    "Defina a pasta do Path of Exile antes de sincronizar os assets.",
  "electron.miningScriptNotFound": "Script de mining local não encontrado.",
  "electron.miningFailed":
    "Falha ao executar o mining local dos assets.",
  "electron.invalidPobContent":
    "O conteúdo importado não parece ser um Path of Building válido.",
  "electron.emptyPobCode": "O código do Path of Building está vazio.",
  "electron.decodeFailed":
    "Não foi possível decodificar o código do Path of Building.",
  "electron.decompressFailed":
    "Não foi possível descompactar o código do Path of Building.",
  "electron.invalidPastebinLink": "Link do Pastebin inválido.",
  "electron.emptyImport":
    "Informe um link, código ou arquivo do Path of Building.",
  "electron.downloadFailed":
    "Falha ao baixar o Path of Building ({{status}}).",
  "electron.trayOpen": "Abrir Exile Build PoE",
  "electron.trayShowOverlay": "Mostrar overlay",
  "electron.trayQuit": "Sair",
  "electron.dialogTitle": "Sair do Exile Build PoE",
  "electron.dialogMessage": "O que voce quer fazer com o Exile Build PoE?",
  "electron.dialogDetail":
    "Fechar encerra o app e desativa os atalhos globais. Minimizar oculta a janela na bandeja do sistema e mantem o overlay ativo.",
  "electron.dialogClose": "Fechar app",
  "electron.dialogMinimize": "Minimizar",
  "electron.dialogCancel": "Cancelar",

  // ── Settings ──
  "settings.heading": "Configurações",
  "settings.hotkeys": "Atalhos",
  "settings.language": "Idioma",

  // ── Locale picker ──
  "locale.label": "Idioma",
};

export default ptBR;

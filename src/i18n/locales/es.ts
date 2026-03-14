import type { TranslationKey } from "./en";

const es: Record<TranslationKey, string> = {
  // ── Import section ──
  "import.pasteUrlOrCode": "Pegar URL o código",
  "import.pobFile": "Archivo PoB",
  "import.heading": "Importar PoB",
  "import.desktopOnly": "Solo en escritorio",
  "import.pasteLabel": "Pega un enlace de pobb.in/pastebin o el código exportado de Path of Building",
  "import.fileLabel": "Selecciona un archivo exportado de Path of Building",
  "import.pastePlaceholder": "https://pobb.in/... o pega el código exportado de Path of Building aquí",
  "import.importing": "Importando...",
  "import.importButton": "Importar PoB",
  "import.openOverlay": "Abrir overlay",
  "import.emptyError": "Introduce un enlace, código o archivo de Path of Building.",
  "import.genericError": "No se pudo importar este Path of Building.",

  // ── Builds section ──
  "builds.heading": "Builds locales",
  "builds.empty": "Aún no se ha importado ningún Path of Building.",
  "builds.activeBuild": "Build activa",
  "builds.delete": "Eliminar build",
  "builds.reimport": "Reimportar build",
  "builds.unknownLeague": "Otras",

  // ── Snapshot / PoB summary ──
  "snapshot.heading": "Snapshot de PoB",
  "snapshot.legacyHeading": "Importación legacy",
  "snapshot.exactImport": "Importación exacta",
  "snapshot.reimport": "Re-importar",
  "snapshot.mainSkill": "Skill principal",
  "snapshot.noMainLabel": "Sin etiqueta principal",
  "snapshot.activeTree": "Tree activo",
  "snapshot.noActiveSpec": "Sin spec activo",
  "snapshot.activeItemSet": "Item set activo",
  "snapshot.noActiveSet": "Sin set activo",
  "snapshot.itemsInSet": "Items en el set",
  "snapshot.pobTrees": "Trees de PoB",
  "snapshot.activeTreeInApp": "Tree activo en la app",
  "snapshot.importedContent": "Contenido importado",
  "snapshot.treeSpecCount": "{{count}} tree spec(s)",
  "snapshot.skillGroupCount": "{{count}} skill group(s)",
  "snapshot.fromPoB": "de Path of Building",
  "snapshot.importedExactly": "importado exactamente",
  "snapshot.noBandit": "Sin bandit en el XML",
  "snapshot.pantheonNotSpecified": "Pantheon no especificado",
  "snapshot.notes": "Notas",
  "snapshot.legacyDescription":
    "Esta build viene del parser antiguo y no tiene un snapshot exacto de Path of Building.",
  "snapshot.nextStep": "Siguiente paso",
  "snapshot.reimportPoB": "Re-importa este PoB",
  "snapshot.reimportDetail": "para cargar los tree specs, skill groups y gear reales.",
  "snapshot.noDataLoss": "Sin pérdida de datos",
  "snapshot.noDataLossDetail":
    "el overlay sigue funcionando, pero los datos no coincidirán 1:1 con el PoB.",

  // ── Overlay session ──
  "session.heading": "Sesión de overlay",
  "session.alwaysOnTop": "Siempre visible",
  "session.displayTip":
    "En PoE, usa el modo Ventana sin bordes o Ventana. El modo pantalla completa exclusiva puede bloquear overlays de escritorio.",
  "session.activeTree": "Tree activo",
  "session.currentStage": "Fase actual",
  "session.playerLevel": "Nivel del jugador",
  "session.nextTree": "Siguiente tree: {{title}}",
  "session.lastTreeActive": "Último tree importado de PoB activo.",
  "session.showOverlay": "Mostrar overlay",
  "session.recenter": "Recentrar",
  "session.importToActivate": "Importa un PoB para activar la sesión de overlay.",

  // ── Auto-update ──
  "update.available": "Actualización v{{version}} disponible",
  "update.download": "Descargar",
  "update.downloading": "Descargando… {{percent}}%",
  "update.ready": "v{{version}} listo para instalar",
  "update.installNow": "Reiniciar y actualizar",

  // ── Header / workspace ──
  "header.appName": "Exile Build PoE",
  "header.tagline": "Overlay operativo para Path of Building",
  "header.importPrompt":
    "Importa un PoB y sigue la build con una ventana siempre visible y menos ruido.",
  "header.markNext": "Marcar siguiente",
  "header.openOverlay": "Abrir overlay",

  // ── Empty state ──
  "empty.heading": "Estructura inicial de la app lista",
  "empty.description":
    "Importa un Path of Building para generar fases, overlay, checklist y progreso local.",

  // ── Hero cards ──
  "hero.now": "Ahora",
  "hero.activeTree": "Tree activo",
  "hero.activeStage": "Fase activa",
  "hero.nextAction": "Siguiente acción",
  "hero.checklistComplete": "Checklist actual completo",
  "hero.nextUpgrade": "Siguiente mejora",
  "hero.reviewSnapshot": "Revisar snapshot de PoB",
  "hero.currentLevel": "Nivel actual",
  "hero.completeNext": "Completar siguiente",
  "hero.showOverlay": "Mostrar overlay",
  "hero.shortQueue": "Cola corta",
  "hero.objectiveCount": "{{count}} objetivos",
  "hero.usefulHotkeys": "Atajos útiles",
  "hero.markAsCompleted": "Marcar {{text}} como completado",

  // ── Hotkeys ──
  "hotkeys.openOverlay": "Ctrl + Shift + O abre el overlay",
  "hotkeys.markNext": "Ctrl + Shift + M marca el siguiente objetivo",
  "hotkeys.adjustLevel": "Ctrl + Shift + L ajusta el nivel rápidamente",

  // ── Checklist block ──
  "checklist.heading": "Checklist operativo",
  "checklist.itemCount": "{{count}} items",

  // ── Notes ──
  "notes.empty": "No se importaron notas de Path of Building.",
  "notes.buildNotes": "Notas de la build",
  "notes.importMvp": "Import + MVP",
  "notes.currentSnapshot": "Snapshot actual",
  "notes.pinnedItems": "Items fijados",
  "notes.pinnedActive": "{{count}} activos",
  "notes.noPinnedItems": "Aún no hay items fijados.",

  // ── Overview tab ──
  "overview.pobNow": "PoB ahora",
  "overview.mainSkill": "Skill principal",
  "overview.noMainSkill": "Sin etiqueta principal en PoB",
  "overview.activeTree": "Tree activo",
  "overview.noActiveTree": "Sin tree spec activo",
  "overview.activeItemSet": "Item set activo",
  "overview.noActiveItemSet": "Sin item set activo",
  "overview.nextUpgrade": "Siguiente mejora",
  "overview.reviewNotes": "Revisar notas importadas",
  "overview.exactImport": "Importación exacta",
  "overview.realPoB": "PoB real",
  "overview.treeSpecs": "Tree specs",
  "overview.skillGroups": "Skill groups",
  "overview.itemsInActiveSet": "Items en el set activo",
  "overview.pobNotes": "Notas de PoB",
  "overview.formattedForReading": "Formateado para lectura",
  "overview.buildNow": "Build ahora",
  "overview.playstyle": "Estilo de juego",
  "overview.currentStage": "Fase actual",
  "overview.warnings": "Advertencias",
  "overview.beforePlaying": "Antes de jugar",

  // ── Tree tab ──
  "tree.activeTree": "Tree activo",
  "tree.treeTimeline": "Línea temporal del tree",
  "tree.noActiveTree": "Sin tree activo",
  "tree.activeInApp": "Activo en la app",
  "tree.selectTree": "Seleccionar tree",
  "tree.activeTreeInApp": "Tree activo en la app",
  "tree.passiveTree": "Passive tree {{version}}",
  "tree.treeSpecImported": "Tree spec importado exactamente desde PoB.",
  "tree.viewTree": "Ver árbol",
  "tree.passiveMilestones": "Hitos de pasivos",
  "tree.pointCount": "{{count}} puntos",
  "tree.fullRoadmap": "Hoja de ruta completa",
  "tree.progressionOrder": "Orden de progresión",

  // ── Gems tab ──
  "gems.linksAndGems": "Links y gems",
  "gems.activeSkillSet": "Skill set activo",
  "gems.linkCount": "{{count}}-link",
  "gems.gemCount": "{{count}} gem",
  "gems.primaryGem": "Gem principal",
  "gems.activeLink": "Link activo",
  "gems.groupBench": "Banco de grupo",

  // ── Gear tab ──
  "gear.exactGear": "Gear exacto de PoB",
  "gear.noItem": "Sin item",
  "gear.flasks": "Flasks",
  "gear.importedFlask": "Flask importado",
  "gear.swapAndExtra": "Swap y sockets extra",
  "gear.imported": "Importado",
  "gear.uniqueHint": "Pista de único: {{suggestion}}",

  // ── Overlay panel ──
  "overlay.footerCopy": "Ctrl + Shift + M completa el siguiente objetivo",
  "overlay.phase": "Fase",
  "overlay.nextUpgrade": "Siguiente mejora",
  "overlay.reviewSnapshot": "Revisar snapshot de PoB",
  "overlay.currentLevel": "Nivel actual",
  "overlay.levelHelpTree":
    "Al subir de nivel, el siguiente tree será {{title}}.",
  "overlay.levelHelpStage":
    "Ajustar el nivel aquí actualiza la fase activa en el overlay.",
  "overlay.now": "Ahora",
  "overlay.next": "Siguiente",
  "overlay.checklistUpToDate": "Checklist al día",
  "overlay.noPendingItems":
    "Sin items pendientes. Abre los detalles para revisar la build a tu ritmo.",
  "overlay.complete": "Completar",
  "overlay.noActivePoB": "Sin PoB activo",
  "overlay.importPrompt":
    "Importa un Path of Building en la ventana principal y usa `Ctrl + Shift + O`.",

  // ── Importer service ──
  "importer.desktopRequired":
    "La importación exacta de Path of Building requiere la app de escritorio.",
  "importer.invalidXml": "El XML de Path of Building no es válido.",
  "importer.unknownClass": "Clase desconocida",
  "importer.unknownAscendancy": "Ascendancy desconocida",
  "importer.importedGem": "Gem importada",
  "importer.group": "Grupo {{index}}",
  "importer.chooseBandit": "Elegir bandit: {{name}}",
  "importer.pantheonMajor": "Pantheon mayor: {{name}}",
  "importer.pantheonMinor": "Pantheon menor: {{name}}",
  "importer.doLab": "Hacer {{name}}",
  "importer.followSetup": "Seguir setup {{name}}",
  "importer.followTree": "Seguir tree {{name}}",
  "importer.checkImportedTree": "Revisa el tree importado de PoB",
  "importer.setupMainSkill": "Configura la skill principal {{name}}",
  "importer.checkActiveSkillSet": "Revisa el skill set activo de PoB",
  "importer.reviewGear": "Revisa el gear del set {{name}}",
  "importer.checkImportedGear": "Revisa el gear importado de PoB",
  "importer.openPobNotes": "Abre las notas exactas de PoB para revisar la fase",
  "importer.importedItem": "Item importado",
  "importer.tagline":
    "Importación exacta de PoB con {{treeSpecs}} tree spec(s), {{skillGroups}} skill group(s) y {{items}} item(s) en el snapshot.",
  "importer.mainSkillPlaystyle": "Skill principal: {{name}}",
  "importer.exactImport": "Importación exacta de Path of Building.",
  "importer.reviewGearSet": "Revisa el gear del set {{name}}",
  "importer.reviewPobNotes": "Revisa las notas de PoB.",
  "importer.snapshotImported": "Snapshot importado",
  "importer.snapshotSummary":
    "Snapshot exacto de Path of Building{{mainSkill}}{{itemSet}}.",
  "importer.treeUrl": "URL del tree: {{url}}",
  "importer.treeSpecImported": "Tree spec importado exactamente desde PoB.",
  "importer.buildImported":
    "Build importada exactamente desde Path of Building.",
  "importer.snapshotGenerated":
    "Snapshot generado exactamente desde el Path of Building importado.",
  "importer.ascendancyImported":
    "Clase y ascendancy importadas exactamente desde PoB.",
  "importer.banditImported": "Elección de bandit importada desde PoB.",
  "importer.pantheonImported": "Pantheon mayor/menor importado desde PoB.",
  "importer.activeSetImported": "Set activo importado desde PoB.",

  // ── Electron main process ──
  "electron.setPoeFolder":
    "Configura la carpeta de Path of Exile antes de sincronizar assets.",
  "electron.miningScriptNotFound": "Script de minería local no encontrado.",
  "electron.miningFailed": "Error al ejecutar la minería local de assets.",
  "electron.invalidPobContent":
    "El contenido importado no parece ser un Path of Building válido.",
  "electron.emptyPobCode": "El código de Path of Building está vacío.",
  "electron.decodeFailed":
    "No se pudo decodificar el código de Path of Building.",
  "electron.decompressFailed":
    "No se pudo descomprimir el código de Path of Building.",
  "electron.invalidPastebinLink": "Enlace de Pastebin no válido.",
  "electron.emptyImport":
    "Introduce un enlace, código o archivo de Path of Building.",
  "electron.downloadFailed":
    "Error al descargar Path of Building ({{status}}).",
  "electron.trayOpen": "Abrir Exile Build PoE",
  "electron.trayShowOverlay": "Mostrar overlay",
  "electron.trayQuit": "Salir",
  "electron.dialogTitle": "Salir de Exile Build PoE",
  "electron.dialogMessage":
    "¿Qué quieres hacer con Exile Build PoE?",
  "electron.dialogDetail":
    "Cerrar apaga la app y desactiva los atajos globales. Minimizar oculta la ventana en la bandeja del sistema y mantiene el overlay activo.",
  "electron.dialogClose": "Cerrar app",
  "electron.dialogMinimize": "Minimizar",
  "electron.dialogCancel": "Cancelar",

  // ── Settings ──
  "settings.heading": "Ajustes",
  "settings.hotkeys": "Atajos",
  "settings.language": "Idioma",

  // ── Locale picker ──
  "locale.label": "Idioma",
};

export default es;

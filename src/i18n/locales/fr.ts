import type { TranslationKey } from "./en";

const fr: Record<TranslationKey, string> = {
  // ── Import section ──
  "import.pasteUrlOrCode": "Coller une URL ou un code",
  "import.pobFile": "Fichier PoB",
  "import.heading": "Import PoB",
  "import.desktopOnly": "Application de bureau uniquement",
  "import.pasteLabel":
    "Colle un lien pobb.in/pastebin ou le code exporté depuis Path of Building",
  "import.fileLabel": "Sélectionne un fichier exporté depuis Path of Building",
  "import.pastePlaceholder":
    "https://pobb.in/... ou colle le code exporté depuis Path of Building ici",
  "import.importing": "Importation...",
  "import.importButton": "Importer le PoB",
  "import.openOverlay": "Ouvrir l'overlay",
  "import.emptyError":
    "Entre un lien, un code ou un fichier Path of Building.",
  "import.genericError":
    "Impossible d'importer ce Path of Building.",

  // ── Builds section ──
  "builds.heading": "Builds locaux",
  "builds.empty": "Aucun Path of Building importé pour l'instant.",
  "builds.activeBuild": "Build actif",

  // ── Snapshot / PoB summary ──
  "snapshot.heading": "Snapshot PoB",
  "snapshot.legacyHeading": "Import legacy",
  "snapshot.exactImport": "Import exact",
  "snapshot.reimport": "Ré-importer",
  "snapshot.mainSkill": "Skill principal",
  "snapshot.noMainLabel": "Aucun label principal",
  "snapshot.activeTree": "Tree actif",
  "snapshot.noActiveSpec": "Aucune spec active",
  "snapshot.activeItemSet": "Item set actif",
  "snapshot.noActiveSet": "Aucun set actif",
  "snapshot.itemsInSet": "Items dans le set",
  "snapshot.pobTrees": "Trees PoB",
  "snapshot.activeTreeInApp": "Tree actif dans l'app",
  "snapshot.importedContent": "Contenu importé",
  "snapshot.treeSpecCount": "{{count}} tree spec(s)",
  "snapshot.skillGroupCount": "{{count}} skill group(s)",
  "snapshot.fromPoB": "depuis Path of Building",
  "snapshot.importedExactly": "importé exactement",
  "snapshot.noBandit": "Aucun bandit dans le XML",
  "snapshot.pantheonNotSpecified": "Panthéon non spécifié",
  "snapshot.notes": "Notes",
  "snapshot.legacyDescription":
    "Ce build provient de l'ancien parser et n'a pas de snapshot Path of Building exact.",
  "snapshot.nextStep": "Prochaine étape",
  "snapshot.reimportPoB": "Ré-importe ce PoB",
  "snapshot.reimportDetail":
    "pour charger les vraies tree specs, skill groups et le gear.",
  "snapshot.noDataLoss": "Aucune perte de données",
  "snapshot.noDataLossDetail":
    "l'overlay continue de fonctionner, mais les données ne correspondront pas 1:1 avec le PoB.",

  // ── Overlay session ──
  "session.heading": "Session overlay",
  "session.alwaysOnTop": "Toujours au premier plan",
  "session.displayTip":
    "Dans PoE, utilise le mode Fenêtré sans bordure ou Fenêtré. Le plein écran exclusif peut bloquer les overlays.",
  "session.activeTree": "Tree actif",
  "session.currentStage": "Étape actuelle",
  "session.playerLevel": "Niveau du joueur",
  "session.nextTree": "Prochain tree : {{title}}",
  "session.lastTreeActive": "Dernier tree importé du PoB actif.",
  "session.showOverlay": "Afficher l'overlay",
  "session.recenter": "Recentrer",
  "session.importToActivate":
    "Importe un PoB pour activer la session overlay.",

  // ── Header / workspace ──
  "header.appName": "Exile Build PoE",
  "header.tagline": "Overlay opérationnel pour Path of Building",
  "header.importPrompt":
    "Importe un PoB et suis le build avec une fenêtre toujours visible et moins de bruit.",
  "header.markNext": "Marquer suivant",
  "header.openOverlay": "Ouvrir l'overlay",

  // ── Empty state ──
  "empty.heading": "Structure initiale de l'app prête",
  "empty.description":
    "Importe un Path of Building pour générer les étapes, le shell overlay, la checklist et la progression locale.",

  // ── Hero cards ──
  "hero.now": "Maintenant",
  "hero.activeTree": "Tree actif",
  "hero.activeStage": "Étape active",
  "hero.nextAction": "Prochaine action",
  "hero.checklistComplete": "Checklist actuelle terminée",
  "hero.nextUpgrade": "Prochain upgrade",
  "hero.reviewSnapshot": "Consulter le snapshot PoB",
  "hero.currentLevel": "Niveau actuel",
  "hero.completeNext": "Compléter suivant",
  "hero.showOverlay": "Afficher l'overlay",
  "hero.shortQueue": "File d'attente courte",
  "hero.objectiveCount": "{{count}} objectifs",
  "hero.usefulHotkeys": "Raccourcis utiles",
  "hero.markAsCompleted": "Marquer {{text}} comme terminé",

  // ── Hotkeys ──
  "hotkeys.openOverlay": "Ctrl + Shift + O ouvre l'overlay",
  "hotkeys.markNext": "Ctrl + Shift + M marque le prochain objectif",
  "hotkeys.adjustLevel": "Ctrl + Shift + L ajuste le niveau rapidement",

  // ── Checklist block ──
  "checklist.heading": "Checklist opérationnelle",
  "checklist.itemCount": "{{count}} éléments",

  // ── Notes ──
  "notes.empty": "Aucune note importée depuis Path of Building.",
  "notes.buildNotes": "Notes du build",
  "notes.importMvp": "Import + MVP",
  "notes.currentSnapshot": "Snapshot actuel",
  "notes.pinnedItems": "Éléments épinglés",
  "notes.pinnedActive": "{{count}} actif(s)",
  "notes.noPinnedItems": "Aucun élément épinglé pour l'instant.",

  // ── Overview tab ──
  "overview.pobNow": "PoB maintenant",
  "overview.mainSkill": "Skill principal",
  "overview.noMainSkill": "Aucun label principal dans le PoB",
  "overview.activeTree": "Tree actif",
  "overview.noActiveTree": "Aucune tree spec active",
  "overview.activeItemSet": "Item set actif",
  "overview.noActiveItemSet": "Aucun item set actif",
  "overview.nextUpgrade": "Prochain upgrade",
  "overview.reviewNotes": "Consulter les notes importées",
  "overview.exactImport": "Import exact",
  "overview.realPoB": "PoB réel",
  "overview.treeSpecs": "Tree specs",
  "overview.skillGroups": "Skill groups",
  "overview.itemsInActiveSet": "Items dans le set actif",
  "overview.pobNotes": "Notes PoB",
  "overview.formattedForReading": "Formaté pour la lecture",
  "overview.buildNow": "Build maintenant",
  "overview.playstyle": "Playstyle",
  "overview.currentStage": "Étape actuelle",
  "overview.warnings": "Avertissements",
  "overview.beforePlaying": "Avant de jouer",

  // ── Tree tab ──
  "tree.activeTree": "Tree actif",
  "tree.treeTimeline": "Timeline du tree",
  "tree.noActiveTree": "Aucun tree actif",
  "tree.activeInApp": "Actif dans l'app",
  "tree.selectTree": "Sélectionner le tree",
  "tree.activeTreeInApp": "Tree actif dans l'app",
  "tree.passiveTree": "Passive tree {{version}}",
  "tree.treeSpecImported":
    "Tree spec importée exactement depuis le PoB.",
  "tree.viewTree": "Voir l'arbre",
  "tree.passiveMilestones": "Milestones passifs",
  "tree.pointCount": "{{count}} points",
  "tree.fullRoadmap": "Roadmap complète",
  "tree.progressionOrder": "Ordre de progression",

  // ── Gems tab ──
  "gems.linksAndGems": "Links et gems",
  "gems.activeSkillSet": "Skill set actif",
  "gems.linkCount": "{{count}}-link",
  "gems.gemCount": "{{count}} gem",
  "gems.primaryGem": "Gem principal",
  "gems.activeLink": "Link actif",
  "gems.groupBench": "Bench du group",

  // ── Gear tab ──
  "gear.exactGear": "Gear exact depuis le PoB",
  "gear.noItem": "Aucun item",
  "gear.flasks": "Flasks",
  "gear.importedFlask": "Flask importée",
  "gear.swapAndExtra": "Swap et sockets supplémentaires",
  "gear.imported": "Importé",
  "gear.uniqueHint": "Indice unique : {{suggestion}}",

  // ── Overlay panel ──
  "overlay.footerCopy":
    "Ctrl + Shift + M complète le prochain objectif",
  "overlay.phase": "Phase",
  "overlay.nextUpgrade": "Prochain upgrade",
  "overlay.reviewSnapshot": "Consulter le snapshot PoB",
  "overlay.currentLevel": "Niveau actuel",
  "overlay.levelHelpTree":
    "En montant de niveau, le prochain tree sera {{title}}.",
  "overlay.levelHelpStage":
    "Ajuster le niveau ici met à jour l'étape active dans l'overlay.",
  "overlay.now": "Maintenant",
  "overlay.next": "Suivant",
  "overlay.checklistUpToDate": "Checklist à jour",
  "overlay.noPendingItems":
    "Aucun élément en attente. Ouvre les détails pour consulter le build à ton rythme.",
  "overlay.complete": "Terminé",
  "overlay.noActivePoB": "Aucun PoB actif",
  "overlay.importPrompt":
    "Importe un Path of Building dans la fenêtre principale et utilise `Ctrl + Shift + O`.",

  // ── Importer service ──
  "importer.desktopRequired":
    "L'import exact de Path of Building nécessite l'application de bureau.",
  "importer.invalidXml": "Le XML de Path of Building est invalide.",
  "importer.unknownClass": "Classe inconnue",
  "importer.unknownAscendancy": "Ascendancy inconnue",
  "importer.importedGem": "Gem importée",
  "importer.group": "Group {{index}}",
  "importer.chooseBandit": "Choisis le bandit : {{name}}",
  "importer.pantheonMajor": "Panthéon majeur : {{name}}",
  "importer.pantheonMinor": "Panthéon mineur : {{name}}",
  "importer.doLab": "Fais le {{name}}",
  "importer.followSetup": "Suis le setup {{name}}",
  "importer.followTree": "Suis le tree {{name}}",
  "importer.checkImportedTree": "Vérifie le tree PoB importé",
  "importer.setupMainSkill": "Configure le skill principal {{name}}",
  "importer.checkActiveSkillSet":
    "Vérifie le skill set PoB actif",
  "importer.reviewGear": "Consulte le gear du set {{name}}",
  "importer.checkImportedGear": "Vérifie le gear PoB importé",
  "importer.openPobNotes":
    "Ouvre les notes exactes du PoB pour consulter la phase",
  "importer.importedItem": "Item importé",
  "importer.tagline":
    "Import exact du PoB avec {{treeSpecs}} tree spec(s), {{skillGroups}} skill group(s), et {{items}} item(s) dans le snapshot.",
  "importer.mainSkillPlaystyle": "Skill principal : {{name}}",
  "importer.exactImport": "Import exact de Path of Building.",
  "importer.reviewGearSet": "Consulte le gear du set {{name}}",
  "importer.reviewPobNotes": "Consulte les notes du PoB.",
  "importer.snapshotImported": "Snapshot importé",
  "importer.snapshotSummary":
    "Snapshot exact de Path of Building{{mainSkill}}{{itemSet}}.",
  "importer.treeUrl": "URL du tree : {{url}}",
  "importer.treeSpecImported":
    "Tree spec importée exactement depuis le PoB.",
  "importer.buildImported":
    "Build importé exactement depuis Path of Building.",
  "importer.snapshotGenerated":
    "Snapshot généré exactement depuis le Path of Building importé.",
  "importer.ascendancyImported":
    "Classe et ascendancy importées exactement depuis le PoB.",
  "importer.banditImported":
    "Choix du bandit importé depuis le PoB.",
  "importer.pantheonImported":
    "Panthéon majeur/mineur importé depuis le PoB.",
  "importer.activeSetImported":
    "Set actif importé depuis le PoB.",

  // ── Electron main process ──
  "electron.setPoeFolder":
    "Définis le dossier Path of Exile avant de synchroniser les assets.",
  "electron.miningScriptNotFound":
    "Script de mining local introuvable.",
  "electron.miningFailed":
    "Échec de l'exécution du mining d'assets local.",
  "electron.invalidPobContent":
    "Le contenu importé ne semble pas être un Path of Building valide.",
  "electron.emptyPobCode":
    "Le code Path of Building est vide.",
  "electron.decodeFailed":
    "Impossible de décoder le code Path of Building.",
  "electron.decompressFailed":
    "Impossible de décompresser le code Path of Building.",
  "electron.invalidPastebinLink": "Lien Pastebin invalide.",
  "electron.emptyImport":
    "Entre un lien, un code ou un fichier Path of Building.",
  "electron.downloadFailed":
    "Échec du téléchargement de Path of Building ({{status}}).",
  "electron.trayOpen": "Ouvrir Exile Build PoE",
  "electron.trayShowOverlay": "Afficher l'overlay",
  "electron.trayQuit": "Quitter",
  "electron.dialogTitle": "Quitter Exile Build PoE",
  "electron.dialogMessage":
    "Que veux-tu faire avec Exile Build PoE ?",
  "electron.dialogDetail":
    "Fermer arrête l'application et désactive les raccourcis globaux. Minimiser masque la fenêtre dans la zone de notification et garde l'overlay actif.",
  "electron.dialogClose": "Fermer l'app",
  "electron.dialogMinimize": "Minimiser",
  "electron.dialogCancel": "Annuler",

  // ── Settings ──
  "settings.heading": "Paramètres",
  "settings.hotkeys": "Raccourcis",
  "settings.language": "Langue",

  // ── Locale picker ──
  "locale.label": "Langue",
};

export default fr;

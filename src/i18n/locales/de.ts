import type { TranslationKey } from "./en";

const de: Record<TranslationKey, string> = {
  // ── Import section ──
  "import.pasteUrlOrCode": "URL oder Code einf\u00fcgen",
  "import.pobFile": "PoB-Datei",
  "import.heading": "PoB Import",
  "import.desktopOnly": "Nur Desktop-App",
  "import.pasteLabel": "F\u00fcge einen pobb.in/pastebin-Link oder den exportierten Path of Building Code ein",
  "import.fileLabel": "W\u00e4hle eine exportierte Path of Building Datei aus",
  "import.pastePlaceholder": "https://pobb.in/... oder exportierten Path of Building Code hier einf\u00fcgen",
  "import.importing": "Importiere...",
  "import.importButton": "PoB importieren",
  "import.openOverlay": "Overlay \u00f6ffnen",
  "import.emptyError": "Gib einen Path of Building Link, Code oder eine Datei ein.",
  "import.genericError": "Dieser Path of Building konnte nicht importiert werden.",

  // ── Builds section ──
  "builds.heading": "Lokale Builds",
  "builds.empty": "Noch kein Path of Building importiert.",
  "builds.activeBuild": "Aktiver Build",
  "builds.delete": "Build löschen",
  "builds.reimport": "Build neu importieren",
  "builds.unknownLeague": "Andere",
  "builds.searchPlaceholder": "Builds suchen...",
  "builds.copySource": "PoB-Code/Link kopieren",

  // ── Snapshot / PoB summary ──
  "snapshot.heading": "PoB Snapshot",
  "snapshot.legacyHeading": "Legacy-Import",
  "snapshot.exactImport": "Exakter Import",
  "snapshot.reimport": "Erneut importieren",
  "snapshot.mainSkill": "Main Skill",
  "snapshot.noMainLabel": "Kein Main-Label",
  "snapshot.activeTree": "Aktiver Tree",
  "snapshot.noActiveSpec": "Keine aktive Spec",
  "snapshot.activeItemSet": "Aktives Item Set",
  "snapshot.noActiveSet": "Kein aktives Set",
  "snapshot.itemsInSet": "Items im Set",
  "snapshot.pobTrees": "PoB Trees",
  "snapshot.activeTreeInApp": "Aktiver Tree in der App",
  "snapshot.importedContent": "Importierte Inhalte",
  "snapshot.treeSpecCount": "{{count}} Tree Spec(s)",
  "snapshot.skillGroupCount": "{{count}} Skill Group(s)",
  "snapshot.fromPoB": "aus Path of Building",
  "snapshot.importedExactly": "exakt importiert",
  "snapshot.noBandit": "Kein Bandit im XML",
  "snapshot.pantheonNotSpecified": "Pantheon nicht angegeben",
  "snapshot.notes": "Notizen",
  "snapshot.legacyDescription":
    "Dieser Build stammt vom alten Parser und hat keinen exakten Path of Building Snapshot.",
  "snapshot.nextStep": "N\u00e4chster Schritt",
  "snapshot.reimportPoB": "Diesen PoB erneut importieren",
  "snapshot.reimportDetail": "um echte Tree Specs, Skill Groups und Gear zu laden.",
  "snapshot.noDataLoss": "Kein Datenverlust",
  "snapshot.noDataLossDetail":
    "Das Overlay funktioniert weiterhin, aber die Daten stimmen nicht 1:1 mit dem PoB \u00fcberein.",

  // ── Overlay session ──
  "session.heading": "Overlay-Sitzung",
  "session.alwaysOnTop": "Immer im Vordergrund",
  "session.displayTip":
    "Verwende in PoE den Randlosen Fenstermodus oder Fenstermodus. Exklusiver Vollbildmodus kann Desktop-Overlays blockieren.",
  "session.activeTree": "Aktiver Tree",
  "session.currentStage": "Aktuelle Stufe",
  "session.playerLevel": "Spielerlevel",
  "session.nextTree": "N\u00e4chster Tree: {{title}}",
  "session.lastTreeActive": "Letzter importierter PoB Tree ist aktiv.",
  "session.showOverlay": "Overlay anzeigen",
  "session.recenter": "Neu zentrieren",
  "session.importToActivate": "Importiere einen PoB, um die Overlay-Sitzung zu aktivieren.",

  // ── Auto-update ──
  "update.available": "Update v{{version}} verfügbar",
  "update.download": "Herunterladen",
  "update.downloading": "Download… {{percent}}%",
  "update.ready": "v{{version}} bereit zur Installation",
  "update.installNow": "Neu starten und aktualisieren",

  // ── Header / workspace ──
  "header.appName": "Exile Build PoE",
  "header.tagline": "Operatives Overlay f\u00fcr Path of Building",
  "header.importPrompt":
    "Importiere einen PoB und folge dem Build mit einem immer sichtbaren Fenster und weniger Ablenkung.",
  "header.markNext": "N\u00e4chstes markieren",
  "header.openOverlay": "Overlay \u00f6ffnen",

  // ── Empty state ──
  "empty.heading": "Grundstruktur der Desktop-App bereit",
  "empty.description":
    "Importiere einen Path of Building, um Stufen, Overlay-Shell, Checkliste und lokalen Fortschritt zu generieren.",

  // ── Hero cards ──
  "hero.now": "Jetzt",
  "hero.activeTree": "Aktiver Tree",
  "hero.activeStage": "Aktive Stufe",
  "hero.nextAction": "N\u00e4chste Aktion",
  "hero.checklistComplete": "Aktuelle Checkliste abgeschlossen",
  "hero.nextUpgrade": "N\u00e4chstes Upgrade",
  "hero.reviewSnapshot": "PoB Snapshot pr\u00fcfen",
  "hero.currentLevel": "Aktuelles Level",
  "hero.completeNext": "N\u00e4chstes abschlie\u00dfen",
  "hero.showOverlay": "Overlay anzeigen",
  "hero.shortQueue": "Kurze Warteschlange",
  "hero.objectiveCount": "{{count}} Ziele",
  "hero.usefulHotkeys": "N\u00fctzliche Hotkeys",
  "hero.markAsCompleted": "{{text}} als erledigt markieren",

  // ── Hotkeys ──
  "hotkeys.openOverlay": "Strg + Umschalt + O \u00f6ffnet das Overlay",
  "hotkeys.markNext": "Strg + Umschalt + M markiert das n\u00e4chste Ziel",
  "hotkeys.adjustLevel": "Strg + Umschalt + L passt das Level schnell an",

  // ── Checklist block ──
  "checklist.heading": "Operative Checkliste",
  "checklist.itemCount": "{{count}} Eintr\u00e4ge",

  // ── Notes ──
  "notes.empty": "Keine Notizen aus Path of Building importiert.",
  "notes.buildNotes": "Build-Notizen",
  "notes.importMvp": "Import + MVP",
  "notes.currentSnapshot": "Aktueller Snapshot",
  "notes.pinnedItems": "Angepinnte Eintr\u00e4ge",
  "notes.pinnedActive": "{{count}} aktiv",
  "notes.noPinnedItems": "Noch keine angepinnten Eintr\u00e4ge.",

  // ── Overview tab ──
  "overview.pobNow": "PoB jetzt",
  "overview.mainSkill": "Main Skill",
  "overview.noMainSkill": "Kein Main-Label im PoB",
  "overview.activeTree": "Aktiver Tree",
  "overview.noActiveTree": "Keine aktive Tree Spec",
  "overview.activeItemSet": "Aktives Item Set",
  "overview.noActiveItemSet": "Kein aktives Item Set",
  "overview.nextUpgrade": "N\u00e4chstes Upgrade",
  "overview.reviewNotes": "Importierte Notizen pr\u00fcfen",
  "overview.exactImport": "Exakter Import",
  "overview.realPoB": "Echter PoB",
  "overview.treeSpecs": "Tree Specs",
  "overview.skillGroups": "Skill Groups",
  "overview.itemsInActiveSet": "Items im aktiven Set",
  "overview.pobNotes": "PoB-Notizen",
  "overview.formattedForReading": "Zum Lesen formatiert",
  "overview.buildNow": "Build jetzt",
  "overview.playstyle": "Spielstil",
  "overview.currentStage": "Aktuelle Stufe",
  "overview.warnings": "Warnungen",
  "overview.beforePlaying": "Vor dem Spielen",

  // ── Tree tab ──
  "tree.activeTree": "Aktiver Tree",
  "tree.treeTimeline": "Tree-Verlauf",
  "tree.noActiveTree": "Kein aktiver Tree",
  "tree.activeInApp": "Aktiv in der App",
  "tree.selectTree": "Tree ausw\u00e4hlen",
  "tree.activeTreeInApp": "Aktiver Tree in der App",
  "tree.passiveTree": "Passive Tree {{version}}",
  "tree.treeSpecImported": "Tree Spec exakt aus PoB importiert.",
  "tree.viewTree": "Baum ansehen",
  "tree.passiveMilestones": "Passive Meilensteine",
  "tree.pointCount": "{{count}} Punkte",
  "tree.fullRoadmap": "Volle Roadmap",
  "tree.progressionOrder": "Progressionsreihenfolge",
  "tree.loading": "Lade Baum-Assets…",
  "tree.loadFailed": "Fehler beim Laden der Baum-Assets.",
  "tree.loadFailedHint": "Prüfe deine Internetverbindung — Sprites werden vom PoE-CDN geladen.",
  "tree.retry": "Erneut versuchen",

  // ── Gems tab ──
  "gems.linksAndGems": "Links und Gems",
  "gems.activeSkillSet": "Aktives Skill Set",
  "gems.linkCount": "{{count}}-Link",
  "gems.gemCount": "{{count}} Gem",
  "gems.primaryGem": "Prim\u00e4rer Gem",
  "gems.activeLink": "Aktiver Link",
  "gems.groupBench": "Group Bench",
  "gems.groupCount": "{{count}} Gruppen",

  // ── Gear tab ──
  "gear.exactGear": "Exaktes Gear aus PoB",
  "gear.noItem": "Kein Item",
  "gear.flasks": "Flasks",
  "gear.importedFlask": "Importierter Flask",
  "gear.swapAndExtra": "Swap und extra Sockets",
  "gear.imported": "Importiert",
  "gear.uniqueHint": "Unique-Hinweis: {{suggestion}}",

  // ── Overlay panel ──
  "overlay.footerCopy": "Strg + Umschalt + M schlie\u00dft das n\u00e4chste Ziel ab",
  "overlay.phase": "Phase",
  "overlay.nextUpgrade": "N\u00e4chstes Upgrade",
  "overlay.reviewSnapshot": "PoB Snapshot pr\u00fcfen",
  "overlay.currentLevel": "Aktuelles Level",
  "overlay.levelHelpTree":
    "Beim Levelaufstieg wird der n\u00e4chste Tree {{title}} sein.",
  "overlay.levelHelpStage":
    "Das Anpassen des Levels hier aktualisiert die aktive Stufe im Overlay.",
  "overlay.now": "Jetzt",
  "overlay.next": "N\u00e4chstes",
  "overlay.checklistUpToDate": "Checkliste aktuell",
  "overlay.noPendingItems":
    "Keine offenen Eintr\u00e4ge. \u00d6ffne die Details, um den Build in deinem Tempo zu pr\u00fcfen.",
  "overlay.complete": "Abgeschlossen",
  "overlay.noActivePoB": "Kein aktiver PoB",
  "overlay.importPrompt":
    "Importiere einen Path of Building im Hauptfenster und nutze `Strg + Umschalt + O`.",

  // ── Importer service ──
  "importer.desktopRequired":
    "Exakter Path of Building Import erfordert die Desktop-App.",
  "importer.invalidXml": "Das Path of Building XML ist ung\u00fcltig.",
  "importer.unknownClass": "Unbekannte Klasse",
  "importer.unknownAscendancy": "Unbekannte Ascendancy",
  "importer.importedGem": "Importierter Gem",
  "importer.group": "Gruppe {{index}}",
  "importer.chooseBandit": "Bandit w\u00e4hlen: {{name}}",
  "importer.pantheonMajor": "Pantheon Major: {{name}}",
  "importer.pantheonMinor": "Pantheon Minor: {{name}}",
  "importer.doLab": "{{name}} absolvieren",
  "importer.followSetup": "Setup {{name}} folgen",
  "importer.followTree": "Tree {{name}} folgen",
  "importer.checkImportedTree": "Importierten PoB Tree pr\u00fcfen",
  "importer.setupMainSkill": "Main Skill {{name}} einrichten",
  "importer.checkActiveSkillSet": "Aktives PoB Skill Set pr\u00fcfen",
  "importer.reviewGear": "Gear aus Set {{name}} pr\u00fcfen",
  "importer.checkImportedGear": "Importiertes PoB Gear pr\u00fcfen",
  "importer.openPobNotes": "Exakte PoB-Notizen \u00f6ffnen, um die Phase zu pr\u00fcfen",
  "importer.importedItem": "Importiertes Item",
  "importer.tagline":
    "Exakter PoB Import mit {{treeSpecs}} Tree Spec(s), {{skillGroups}} Skill Group(s) und {{items}} Item(s) im Snapshot.",
  "importer.mainSkillPlaystyle": "Main Skill: {{name}}",
  "importer.exactImport": "Exakter Path of Building Import.",
  "importer.reviewGearSet": "Gear aus Set {{name}} pr\u00fcfen",
  "importer.reviewPobNotes": "PoB-Notizen pr\u00fcfen.",
  "importer.snapshotImported": "Importierter Snapshot",
  "importer.snapshotSummary":
    "Exakter Path of Building Snapshot{{mainSkill}}{{itemSet}}.",
  "importer.treeUrl": "Tree URL: {{url}}",
  "importer.treeSpecImported": "Tree Spec exakt aus PoB importiert.",
  "importer.buildImported":
    "Build exakt aus Path of Building importiert.",
  "importer.snapshotGenerated":
    "Snapshot exakt aus dem importierten Path of Building generiert.",
  "importer.ascendancyImported":
    "Klasse und Ascendancy exakt aus PoB importiert.",
  "importer.banditImported": "Bandit-Wahl aus PoB importiert.",
  "importer.pantheonImported": "Pantheon Major/Minor aus PoB importiert.",
  "importer.activeSetImported": "Aktives Set aus PoB importiert.",

  // ── Electron main process ──
  "electron.setPoeFolder":
    "Setze den Path of Exile Ordner, bevor du Assets synchronisierst.",
  "electron.miningScriptNotFound": "Lokales Mining-Skript nicht gefunden.",
  "electron.miningFailed": "Lokales Asset-Mining fehlgeschlagen.",
  "electron.invalidPobContent":
    "Der importierte Inhalt scheint kein g\u00fcltiger Path of Building zu sein.",
  "electron.emptyPobCode": "Der Path of Building Code ist leer.",
  "electron.decodeFailed":
    "Der Path of Building Code konnte nicht dekodiert werden.",
  "electron.decompressFailed":
    "Der Path of Building Code konnte nicht dekomprimiert werden.",
  "electron.invalidPastebinLink": "Ung\u00fcltiger Pastebin-Link.",
  "electron.emptyImport":
    "Gib einen Path of Building Link, Code oder eine Datei ein.",
  "electron.downloadFailed":
    "Path of Building konnte nicht heruntergeladen werden ({{status}}).",
  "electron.networkTimeout": "Der Download ist abgelaufen. Prüfe deine Verbindung und versuche es erneut, oder füge den PoB-Code direkt ein.",
  "electron.networkError": "Verbindung zum Server fehlgeschlagen. Prüfe deine Verbindung, oder füge den exportierten PoB-Code direkt ein.",
  "electron.trayOpen": "Exile Build PoE \u00f6ffnen",
  "electron.trayShowOverlay": "Overlay anzeigen",
  "electron.trayQuit": "Beenden",
  "electron.dialogTitle": "Exile Build PoE beenden",
  "electron.dialogMessage":
    "Was m\u00f6chtest du mit Exile Build PoE tun?",
  "electron.dialogDetail":
    "Schlie\u00dfen beendet die App und deaktiviert globale Shortcuts. Minimieren versteckt das Fenster im System-Tray und h\u00e4lt das Overlay aktiv.",
  "electron.dialogClose": "App schlie\u00dfen",
  "electron.dialogMinimize": "Minimieren",
  "electron.dialogCancel": "Abbrechen",

  // ── Settings ──
  "settings.heading": "Einstellungen",
  "settings.hotkeys": "Tastenkürzel",
  "settings.hotkeyOverlay": "Overlay öffnen",
  "settings.hotkeyMark": "Nächstes markieren",
  "settings.hotkeyLevel": "Level anpassen",
  "settings.hotkeyNextTab": "Nächster Tab",
  "settings.hotkeyPrevTab": "Vorheriger Tab",
  "settings.hotkeyPin": "Anheften/Lösen",
  "settings.hotkeyHelp": "Klicken Sie auf eine Taste, um sie zu ändern. Escape zum Abbrechen.",
  "settings.hotkeyPress": "Tasten drücken...",
  "settings.hotkeyReset": "Zurücksetzen",
  "settings.overlayOpacity": "Overlay-Deckkraft",
  "settings.language": "Sprache",

  // ── Help / onboarding ──
  "help.title": "Erste Schritte",
  "help.step1Title": "Aus PoB exportieren",
  "help.step1Desc":
    "Gehe in Path of Building zu Import/Export und kopiere den Build-Code oder erstelle einen pobb.in-Link.",
  "help.step2Title": "Hier importieren",
  "help.step2Desc":
    "Füge den Code oder Link im Import-Bereich in der Seitenleiste ein oder ziehe eine .xml-Datei hinein.",
  "help.step3Title": "Overlay verwenden",
  "help.step3Desc":
    "Öffne das Overlay mit dem Hotkey und folge deinem Build im Spiel ohne Alt-Tab.",
  "help.tip": "Tipp",
  "help.tipDesc":
    "Verwende Borderless Window oder Windowed in PoE. Exklusiver Vollbild kann das Overlay blockieren.",

  // ── Locale picker ──
  "locale.label": "Sprache",
};

export default de;

import type { TranslationKey } from "./en";

const ru: Record<TranslationKey, string> = {
  // ── Import section ──
  "import.pasteUrlOrCode": "Вставь ссылку или код",
  "import.pobFile": "Файл PoB",
  "import.heading": "Импорт PoB",
  "import.desktopOnly": "Только десктоп",
  "import.pasteLabel": "Вставь ссылку pobb.in/pastebin или экспортированный код Path of Building",
  "import.fileLabel": "Выбери экспортированный файл Path of Building",
  "import.pastePlaceholder": "https://pobb.in/... или вставь экспортированный код Path of Building сюда",
  "import.importing": "Импортирую...",
  "import.importButton": "Импортировать PoB",
  "import.openOverlay": "Открыть оверлей",
  "import.emptyError": "Введи ссылку, код или файл Path of Building.",
  "import.genericError": "Не удалось импортировать этот Path of Building.",

  // ── Builds section ──
  "builds.heading": "Локальные билды",
  "builds.empty": "Ещё не импортировано ни одного Path of Building.",
  "builds.activeBuild": "Активный билд",
  "builds.delete": "Удалить билд",
  "builds.reimport": "Переимпортировать билд",
  "builds.unknownLeague": "Другие",
  "builds.searchPlaceholder": "Поиск билдов...",
  "builds.copySource": "Копировать код/ссылку PoB",

  // ── Snapshot / PoB summary ──
  "snapshot.heading": "Снапшот PoB",
  "snapshot.legacyHeading": "Устаревший импорт",
  "snapshot.exactImport": "Точный импорт",
  "snapshot.reimport": "Переимпортировать",
  "snapshot.mainSkill": "Основной скилл",
  "snapshot.noMainLabel": "Нет основного скилла",
  "snapshot.activeTree": "Активное дерево",
  "snapshot.noActiveSpec": "Нет активной спеки",
  "snapshot.activeItemSet": "Активный набор предметов",
  "snapshot.noActiveSet": "Нет активного набора",
  "snapshot.itemsInSet": "Предметы в наборе",
  "snapshot.pobTrees": "Деревья PoB",
  "snapshot.activeTreeInApp": "Активное дерево в приложении",
  "snapshot.importedContent": "Импортированный контент",
  "snapshot.treeSpecCount": "{{count}} спека(и) дерева",
  "snapshot.skillGroupCount": "{{count}} группа(ы) скиллов",
  "snapshot.fromPoB": "из Path of Building",
  "snapshot.importedExactly": "импортировано точно",
  "snapshot.noBandit": "Нет бандита в XML",
  "snapshot.pantheonNotSpecified": "Пантеон не указан",
  "snapshot.notes": "Заметки",
  "snapshot.legacyDescription":
    "Этот билд был создан старым парсером и не содержит точного снапшота Path of Building.",
  "snapshot.nextStep": "Следующий шаг",
  "snapshot.reimportPoB": "Переимпортируй этот PoB",
  "snapshot.reimportDetail": "чтобы загрузить настоящие спеки дерева, группы скиллов и экипировку.",
  "snapshot.noDataLoss": "Без потери данных",
  "snapshot.noDataLossDetail":
    "оверлей продолжит работать, но данные не будут совпадать 1:1 с PoB.",

  // ── Overlay session ──
  "session.heading": "Сессия оверлея",
  "session.alwaysOnTop": "Поверх всех окон",
  "session.displayTip":
    "В PoE используй режим окна без рамки или оконный режим. Эксклюзивный полноэкранный режим может блокировать оверлей.",
  "session.activeTree": "Активное дерево",
  "session.currentStage": "Текущий этап",
  "session.playerLevel": "Уровень персонажа",
  "session.nextTree": "Следующее дерево: {{title}}",
  "session.lastTreeActive": "Последнее импортированное дерево PoB активно.",
  "session.showOverlay": "Показать оверлей",
  "session.recenter": "Отцентрировать",
  "session.importToActivate": "Импортируй PoB, чтобы активировать сессию оверлея.",

  // ── Auto-update ──
  "update.available": "Доступно обновление v{{version}}",
  "update.download": "Скачать",
  "update.downloading": "Загрузка… {{percent}}%",
  "update.ready": "v{{version}} готов к установке",
  "update.installNow": "Перезапустить и обновить",
  "update.check": "Проверить обновления",
  "update.checking": "Проверка…",
  "update.upToDate": "У вас последняя версия!",

  // ── Header / workspace ──
  "header.appName": "Exile Build PoE",
  "header.tagline": "Оверлей для Path of Building",
  "header.importPrompt":
    "Импортируй PoB и следуй билду с помощью окна поверх игры — меньше шума, больше пользы.",
  "header.markNext": "Отметить след.",
  "header.openOverlay": "Открыть оверлей",

  // ── Empty state ──
  "empty.heading": "Начальная структура десктоп-приложения готова",
  "empty.description":
    "Импортируй Path of Building, чтобы создать этапы, оверлей, чеклист и локальный прогресс.",

  // ── Hero cards ──
  "hero.now": "Сейчас",
  "hero.activeTree": "Активное дерево",
  "hero.activeStage": "Активный этап",
  "hero.nextAction": "Следующее действие",
  "hero.checklistComplete": "Текущий чеклист выполнен",
  "hero.nextUpgrade": "Следующий апгрейд",
  "hero.reviewSnapshot": "Просмотреть снапшот PoB",
  "hero.currentLevel": "Текущий уровень",
  "hero.completeNext": "Выполнить следующее",
  "hero.showOverlay": "Показать оверлей",
  "hero.shortQueue": "Короткая очередь",
  "hero.objectiveCount": "{{count}} целей",
  "hero.usefulHotkeys": "Полезные хоткеи",
  "hero.markAsCompleted": "Отметить {{text}} как выполненное",

  // ── Hotkeys ──
  "hotkeys.openOverlay": "Ctrl + Shift + O открывает оверлей",
  "hotkeys.markNext": "Ctrl + Shift + M отмечает следующую цель",
  "hotkeys.adjustLevel": "Ctrl + Shift + L быстро меняет уровень",

  // ── Checklist block ──
  "checklist.heading": "Оперативный чеклист",
  "checklist.itemCount": "{{count}} пунктов",

  // ── Notes ──
  "notes.empty": "Нет заметок, импортированных из Path of Building.",
  "notes.buildNotes": "Заметки билда",
  "notes.importMvp": "Импорт + MVP",
  "notes.currentSnapshot": "Текущий снапшот",
  "notes.pinnedItems": "Закреплённые пункты",
  "notes.pinnedActive": "{{count}} активных",
  "notes.noPinnedItems": "Закреплённых пунктов пока нет.",

  // ── Overview tab ──
  "overview.pobNow": "PoB сейчас",
  "overview.mainSkill": "Основной скилл",
  "overview.noMainSkill": "Нет основного скилла в PoB",
  "overview.activeTree": "Активное дерево",
  "overview.noActiveTree": "Нет активной спеки дерева",
  "overview.activeItemSet": "Активный набор предметов",
  "overview.noActiveItemSet": "Нет активного набора предметов",
  "overview.nextUpgrade": "Следующий апгрейд",
  "overview.reviewNotes": "Просмотреть импортированные заметки",
  "overview.exactImport": "Точный импорт",
  "overview.realPoB": "Настоящий PoB",
  "overview.treeSpecs": "Спеки дерева",
  "overview.skillGroups": "Группы скиллов",
  "overview.itemsInActiveSet": "Предметы в активном наборе",
  "overview.pobNotes": "Заметки PoB",
  "overview.formattedForReading": "Отформатировано для чтения",
  "overview.buildNow": "Билд сейчас",
  "overview.playstyle": "Стиль игры",
  "overview.currentStage": "Текущий этап",
  "overview.warnings": "Предупреждения",
  "overview.beforePlaying": "Перед игрой",

  // ── Tree tab ──
  "tree.activeTree": "Активное дерево",
  "tree.treeTimeline": "Таймлайн дерева",
  "tree.noActiveTree": "Нет активного дерева",
  "tree.activeInApp": "Активно в приложении",
  "tree.selectTree": "Выбрать дерево",
  "tree.activeTreeInApp": "Активное дерево в приложении",
  "tree.passiveTree": "Дерево пассивок {{version}}",
  "tree.treeSpecImported": "Спека дерева импортирована точно из PoB.",
  "tree.viewTree": "Открыть дерево",
  "tree.passiveMilestones": "Вехи пассивок",
  "tree.pointCount": "{{count}} очков",
  "tree.fullRoadmap": "Полный роадмап",
  "tree.progressionOrder": "Порядок прокачки",
  "tree.loading": "Загрузка ресурсов дерева…",
  "tree.loadFailed": "Не удалось загрузить ресурсы дерева.",
  "tree.loadFailedHint": "Проверьте подключение к интернету — спрайты загружаются с CDN PoE.",
  "tree.retry": "Повторить",

  // ── Gems tab ──
  "gems.linksAndGems": "Линки и гемы",
  "gems.activeSkillSet": "Активный набор скиллов",
  "gems.linkCount": "{{count}}-линк",
  "gems.gemCount": "{{count}} гем",
  "gems.primaryGem": "Основной гем",
  "gems.activeLink": "Активный линк",
  "gems.groupBench": "Стол группы",
  "gems.groupCount": "{{count}} групп",

  // ── Gear tab ──
  "gear.exactGear": "Точная экипировка из PoB",
  "gear.noItem": "Нет предмета",
  "gear.flasks": "Фласки",
  "gear.importedFlask": "Импортированная фласка",
  "gear.swapAndExtra": "Свап и доп. сокеты",
  "gear.imported": "Импортировано",
  "gear.uniqueHint": "Подсказка по юнику: {{suggestion}}",

  // ── Overlay panel ──
  "overlay.footerCopy": "Ctrl + Shift + M выполняет следующую цель",
  "overlay.phase": "Фаза",
  "overlay.nextUpgrade": "Следующий апгрейд",
  "overlay.reviewSnapshot": "Просмотреть снапшот PoB",
  "overlay.currentLevel": "Текущий уровень",
  "overlay.levelHelpTree":
    "При повышении уровня следующим деревом будет {{title}}.",
  "overlay.levelHelpStage":
    "Изменение уровня здесь обновляет активный этап в оверлее.",
  "overlay.now": "Сейчас",
  "overlay.next": "Далее",
  "overlay.checklistUpToDate": "Чеклист актуален",
  "overlay.noPendingItems":
    "Нет ожидающих пунктов. Открой детали, чтобы изучить билд в своём темпе.",
  "overlay.complete": "Выполнено",
  "overlay.noActivePoB": "Нет активного PoB",
  "overlay.importPrompt":
    "Импортируй Path of Building в основном окне и нажми `Ctrl + Shift + O`.",
  "overlay.minimize": "Свернуть оверлей",
  "overlay.expand": "Развернуть оверлей",

  // ── Importer service ──
  "importer.desktopRequired":
    "Точный импорт Path of Building доступен только в десктоп-приложении.",
  "importer.invalidXml": "XML Path of Building невалиден.",
  "importer.unknownClass": "Неизвестный класс",
  "importer.unknownAscendancy": "Неизвестный подкласс",
  "importer.importedGem": "Импортированный гем",
  "importer.group": "Группа {{index}}",
  "importer.chooseBandit": "Выбери бандита: {{name}}",
  "importer.pantheonMajor": "Пантеон мажор: {{name}}",
  "importer.pantheonMinor": "Пантеон минор: {{name}}",
  "importer.doLab": "Пройди {{name}}",
  "importer.followSetup": "Следуй настройке {{name}}",
  "importer.followTree": "Следуй дереву {{name}}",
  "importer.checkImportedTree": "Проверь импортированное дерево PoB",
  "importer.setupMainSkill": "Настрой основной скилл {{name}}",
  "importer.checkActiveSkillSet": "Проверь активный набор скиллов PoB",
  "importer.reviewGear": "Просмотри экипировку из набора {{name}}",
  "importer.checkImportedGear": "Проверь импортированную экипировку PoB",
  "importer.openPobNotes": "Открой заметки PoB, чтобы изучить фазу",
  "importer.importedItem": "Импортированный предмет",
  "importer.tagline":
    "Точный импорт PoB: {{treeSpecs}} спека(и) дерева, {{skillGroups}} группа(ы) скиллов и {{items}} предмет(ов) в снапшоте.",
  "importer.mainSkillPlaystyle": "Основной скилл: {{name}}",
  "importer.exactImport": "Точный импорт Path of Building.",
  "importer.reviewGearSet": "Просмотри экипировку из набора {{name}}",
  "importer.reviewPobNotes": "Просмотри заметки PoB.",
  "importer.snapshotImported": "Снапшот импортирован",
  "importer.snapshotSummary":
    "Точный снапшот Path of Building{{mainSkill}}{{itemSet}}.",
  "importer.treeUrl": "URL дерева: {{url}}",
  "importer.treeSpecImported": "Спека дерева импортирована точно из PoB.",
  "importer.buildImported":
    "Билд импортирован точно из Path of Building.",
  "importer.snapshotGenerated":
    "Снапшот сгенерирован точно из импортированного Path of Building.",
  "importer.ascendancyImported":
    "Класс и подкласс импортированы точно из PoB.",
  "importer.banditImported": "Выбор бандита импортирован из PoB.",
  "importer.pantheonImported": "Пантеон мажор/минор импортирован из PoB.",
  "importer.activeSetImported": "Активный набор импортирован из PoB.",

  // ── Electron main process ──
  "electron.setPoeFolder":
    "Укажи папку Path of Exile перед синхронизацией ассетов.",
  "electron.miningScriptNotFound": "Локальный скрипт майнинга не найден.",
  "electron.miningFailed": "Не удалось выполнить локальный майнинг ассетов.",
  "electron.invalidPobContent":
    "Импортированный контент не похож на валидный Path of Building.",
  "electron.emptyPobCode": "Код Path of Building пуст.",
  "electron.decodeFailed":
    "Не удалось декодировать код Path of Building.",
  "electron.decompressFailed":
    "Не удалось распаковать код Path of Building.",
  "electron.invalidPastebinLink": "Невалидная ссылка Pastebin.",
  "electron.emptyImport":
    "Введи ссылку, код или файл Path of Building.",
  "electron.downloadFailed":
    "Не удалось скачать Path of Building ({{status}}).",
  "electron.networkTimeout": "Время загрузки истекло. Проверьте подключение и попробуйте снова, или вставьте код PoB напрямую.",
  "electron.networkError": "Не удалось подключиться к серверу. Проверьте подключение, или вставьте экспортированный код PoB напрямую.",
  "electron.trayOpen": "Открыть Exile Build PoE",
  "electron.trayShowOverlay": "Показать оверлей",
  "electron.trayQuit": "Выход",
  "electron.dialogTitle": "Выход из Exile Build PoE",
  "electron.dialogMessage":
    "Что ты хочешь сделать с Exile Build PoE?",
  "electron.dialogDetail":
    "Закрытие завершает приложение и отключает глобальные хоткеи. Сворачивание прячет окно в трей и оставляет оверлей активным.",
  "electron.dialogClose": "Закрыть приложение",
  "electron.dialogMinimize": "Свернуть",
  "electron.dialogCancel": "Отмена",

  // ── Settings ──
  "settings.heading": "Настройки",
  "settings.hotkeys": "Горячие клавиши",
  "settings.hotkeyOverlay": "Открыть оверлей",
  "settings.hotkeyMark": "Отметить следующее",
  "settings.hotkeyLevel": "Изменить уровень",
  "settings.hotkeyNextTab": "Следующая вкладка",
  "settings.hotkeyPrevTab": "Предыдущая вкладка",
  "settings.hotkeyPin": "Закрепить/Открепить",
  "settings.hotkeyHelp": "Нажмите на клавишу, чтобы изменить. Escape для отмены.",
  "settings.hotkeyPress": "Нажмите клавиши...",
  "settings.hotkeyReset": "Сбросить",
  "settings.overlayOpacity": "Прозрачность оверлея",
  "settings.language": "Язык",

  // ── Help / onboarding ──
  "help.title": "Начало работы",
  "help.step1Title": "Экспорт из PoB",
  "help.step1Desc":
    "В Path of Building перейдите в Import/Export и скопируйте код билда или создайте ссылку pobb.in.",
  "help.step2Title": "Импортируйте сюда",
  "help.step2Desc":
    "Вставьте код или ссылку в разделе Импорт на боковой панели или перетащите .xml файл.",
  "help.step3Title": "Используйте оверлей",
  "help.step3Desc":
    "Откройте оверлей горячей клавишей и следуйте билду в игре без Alt-Tab.",
  "help.tip": "Совет",
  "help.tipDesc":
    "Используйте Borderless Window или Windowed в PoE. Эксклюзивный полноэкранный режим может блокировать оверлей.",

  // ── Locale picker ──
  "locale.label": "Язык",
};

export default ru;

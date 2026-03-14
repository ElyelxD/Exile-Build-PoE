import type { TranslationKey } from "./en";

const zhCN: Record<TranslationKey, string> = {
  // ── 导入 ──
  "import.pasteUrlOrCode": "粘贴链接或代码",
  "import.pobFile": "PoB 文件",
  "import.heading": "导入 PoB",
  "import.desktopOnly": "仅桌面端",
  "import.pasteLabel": "粘贴 pobb.in/pastebin 链接或导出的 Path of Building 代码",
  "import.fileLabel": "选择导出的 Path of Building 文件",
  "import.pastePlaceholder": "https://pobb.in/... 或在此粘贴导出的 Path of Building 代码",
  "import.importing": "正在导入...",
  "import.importButton": "导入 PoB",
  "import.openOverlay": "打开悬浮窗",
  "import.emptyError": "请输入 Path of Building 链接、代码或文件。",
  "import.genericError": "无法导入该 Path of Building。",

  // ── 构建列表 ──
  "builds.heading": "本地构建",
  "builds.empty": "还没有导入 Path of Building。",
  "builds.activeBuild": "当前构建",
  "builds.delete": "删除构建",
  "builds.reimport": "重新导入构建",
  "builds.unknownLeague": "其他",
  "builds.searchPlaceholder": "搜索构建...",
  "builds.copySource": "复制PoB代码/链接",

  // ── 快照 / PoB 摘要 ──
  "snapshot.heading": "PoB 快照",
  "snapshot.legacyHeading": "旧版导入",
  "snapshot.exactImport": "精确导入",
  "snapshot.reimport": "重新导入",
  "snapshot.mainSkill": "主要技能",
  "snapshot.noMainLabel": "无主要技能标签",
  "snapshot.activeTree": "当前天赋树",
  "snapshot.noActiveSpec": "无当前天赋配置",
  "snapshot.activeItemSet": "当前装备方案",
  "snapshot.noActiveSet": "无当前装备方案",
  "snapshot.itemsInSet": "方案中的装备",
  "snapshot.pobTrees": "PoB 天赋树",
  "snapshot.activeTreeInApp": "应用中的当前天赋树",
  "snapshot.importedContent": "已导入内容",
  "snapshot.treeSpecCount": "{{count}} 个天赋树配置",
  "snapshot.skillGroupCount": "{{count}} 个技能组",
  "snapshot.fromPoB": "来自 Path of Building",
  "snapshot.importedExactly": "已精确导入",
  "snapshot.noBandit": "XML 中无强盗选择",
  "snapshot.pantheonNotSpecified": "未指定神殿",
  "snapshot.notes": "备注",
  "snapshot.legacyDescription":
    "该构建来自旧版解析器，没有精确的 Path of Building 快照。",
  "snapshot.nextStep": "下一步",
  "snapshot.reimportPoB": "重新导入该 PoB",
  "snapshot.reimportDetail": "以加载真实的天赋树配置、技能组和装备。",
  "snapshot.noDataLoss": "不会丢失数据",
  "snapshot.noDataLossDetail":
    "悬浮窗仍然可用，但数据不会与 PoB 完全一致。",

  // ── 悬浮窗会话 ──
  "session.heading": "悬浮窗会话",
  "session.alwaysOnTop": "始终置顶",
  "session.displayTip":
    "在流放之路中请使用无边框窗口或窗口模式。独占全屏可能会遮挡桌面悬浮窗。",
  "session.activeTree": "当前天赋树",
  "session.currentStage": "当前阶段",
  "session.playerLevel": "角色等级",
  "session.nextTree": "下一棵天赋树: {{title}}",
  "session.lastTreeActive": "已激活最后导入的 PoB 天赋树。",
  "session.showOverlay": "显示悬浮窗",
  "session.recenter": "重置位置",
  "session.importToActivate": "请先导入 PoB 以激活悬浮窗会话。",

  // ── Auto-update ──
  "update.available": "v{{version}} 更新可用",
  "update.download": "下载",
  "update.downloading": "下载中… {{percent}}%",
  "update.ready": "v{{version}} 已准备好安装",
  "update.installNow": "重启并更新",

  // ── 顶栏 / 工作区 ──
  "header.appName": "Exile Build PoE",
  "header.tagline": "Path of Building 实战悬浮窗",
  "header.importPrompt":
    "导入 PoB，用始终可见的窗口跟随构建，减少干扰。",
  "header.markNext": "标记下一个",
  "header.openOverlay": "打开悬浮窗",

  // ── 空状态 ──
  "empty.heading": "桌面应用初始结构已就绪",
  "empty.description":
    "导入 Path of Building 以生成阶段、悬浮窗界面、清单和本地进度。",

  // ── 概览卡片 ──
  "hero.now": "当前",
  "hero.activeTree": "当前天赋树",
  "hero.activeStage": "当前阶段",
  "hero.nextAction": "下一步操作",
  "hero.checklistComplete": "当前清单已完成",
  "hero.nextUpgrade": "下一个升级",
  "hero.reviewSnapshot": "查看 PoB 快照",
  "hero.currentLevel": "当前等级",
  "hero.completeNext": "完成下一个",
  "hero.showOverlay": "显示悬浮窗",
  "hero.shortQueue": "短队列",
  "hero.objectiveCount": "{{count}} 个目标",
  "hero.usefulHotkeys": "实用快捷键",
  "hero.markAsCompleted": "将 {{text}} 标记为已完成",

  // ── 快捷键 ──
  "hotkeys.openOverlay": "Ctrl + Shift + O 打开悬浮窗",
  "hotkeys.markNext": "Ctrl + Shift + M 标记下一个目标",
  "hotkeys.adjustLevel": "Ctrl + Shift + L 快速调整等级",

  // ── 清单 ──
  "checklist.heading": "操作清单",
  "checklist.itemCount": "{{count}} 个项目",

  // ── 备注 ──
  "notes.empty": "未从 Path of Building 导入备注。",
  "notes.buildNotes": "构建备注",
  "notes.importMvp": "导入 + MVP",
  "notes.currentSnapshot": "当前快照",
  "notes.pinnedItems": "置顶项目",
  "notes.pinnedActive": "{{count}} 个活跃",
  "notes.noPinnedItems": "暂无置顶项目。",

  // ── 总览标签页 ──
  "overview.pobNow": "PoB 概况",
  "overview.mainSkill": "主要技能",
  "overview.noMainSkill": "PoB 中无主要技能标签",
  "overview.activeTree": "当前天赋树",
  "overview.noActiveTree": "无当前天赋树配置",
  "overview.activeItemSet": "当前装备方案",
  "overview.noActiveItemSet": "无当前装备方案",
  "overview.nextUpgrade": "下一个升级",
  "overview.reviewNotes": "查看导入的备注",
  "overview.exactImport": "精确导入",
  "overview.realPoB": "真实 PoB",
  "overview.treeSpecs": "天赋树配置",
  "overview.skillGroups": "技能组",
  "overview.itemsInActiveSet": "当前方案中的装备",
  "overview.pobNotes": "PoB 备注",
  "overview.formattedForReading": "已格式化便于阅读",
  "overview.buildNow": "当前构建",
  "overview.playstyle": "玩法风格",
  "overview.currentStage": "当前阶段",
  "overview.warnings": "警告",
  "overview.beforePlaying": "开玩前",

  // ── 天赋树标签页 ──
  "tree.activeTree": "当前天赋树",
  "tree.treeTimeline": "天赋树时间线",
  "tree.noActiveTree": "无当前天赋树",
  "tree.activeInApp": "应用中激活",
  "tree.selectTree": "选择天赋树",
  "tree.activeTreeInApp": "应用中的当前天赋树",
  "tree.passiveTree": "天赋树 {{version}}",
  "tree.treeSpecImported": "天赋树配置已从 PoB 精确导入。",
  "tree.viewTree": "查看天赋树",
  "tree.passiveMilestones": "天赋里程碑",
  "tree.pointCount": "{{count}} 点",
  "tree.fullRoadmap": "完整路线图",
  "tree.progressionOrder": "升级顺序",

  // ── 宝石标签页 ──
  "gems.linksAndGems": "连接与宝石",
  "gems.activeSkillSet": "当前技能组",
  "gems.linkCount": "{{count}} 连",
  "gems.gemCount": "{{count}} 个宝石",
  "gems.primaryGem": "主宝石",
  "gems.activeLink": "当前连接",
  "gems.groupBench": "组合工作台",

  // ── 装备标签页 ──
  "gear.exactGear": "PoB 精确装备",
  "gear.noItem": "无装备",
  "gear.flasks": "药剂",
  "gear.importedFlask": "已导入药剂",
  "gear.swapAndExtra": "副手与额外插槽",
  "gear.imported": "已导入",
  "gear.uniqueHint": "暗金提示: {{suggestion}}",

  // ── 悬浮窗面板 ──
  "overlay.footerCopy": "Ctrl + Shift + M 完成下一个目标",
  "overlay.phase": "阶段",
  "overlay.nextUpgrade": "下一个升级",
  "overlay.reviewSnapshot": "查看 PoB 快照",
  "overlay.currentLevel": "当前等级",
  "overlay.levelHelpTree":
    "升级时，下一棵天赋树将是 {{title}}。",
  "overlay.levelHelpStage":
    "在此调整等级会更新悬浮窗中的当前阶段。",
  "overlay.now": "当前",
  "overlay.next": "下一个",
  "overlay.checklistUpToDate": "清单已是最新",
  "overlay.noPendingItems":
    "没有待办项目。打开详情按自己的节奏查看构建。",
  "overlay.complete": "完成",
  "overlay.noActivePoB": "无活跃 PoB",
  "overlay.importPrompt":
    "请在主窗口导入 Path of Building，然后使用 `Ctrl + Shift + O`。",

  // ── 导入服务 ──
  "importer.desktopRequired":
    "精确导入 Path of Building 需要桌面应用。",
  "importer.invalidXml": "Path of Building XML 无效。",
  "importer.unknownClass": "未知职业",
  "importer.unknownAscendancy": "未知升华",
  "importer.importedGem": "已导入宝石",
  "importer.group": "组 {{index}}",
  "importer.chooseBandit": "选择强盗: {{name}}",
  "importer.pantheonMajor": "主神殿: {{name}}",
  "importer.pantheonMinor": "副神殿: {{name}}",
  "importer.doLab": "完成 {{name}}",
  "importer.followSetup": "按照配置 {{name}} 操作",
  "importer.followTree": "按照天赋树 {{name}} 操作",
  "importer.checkImportedTree": "检查导入的 PoB 天赋树",
  "importer.setupMainSkill": "配置主要技能 {{name}}",
  "importer.checkActiveSkillSet": "检查当前 PoB 技能组",
  "importer.reviewGear": "查看装备方案 {{name}} 的装备",
  "importer.checkImportedGear": "检查导入的 PoB 装备",
  "importer.openPobNotes": "打开 PoB 备注查看该阶段",
  "importer.importedItem": "已导入装备",
  "importer.tagline":
    "精确导入 PoB，快照包含 {{treeSpecs}} 个天赋树配置、{{skillGroups}} 个技能组和 {{items}} 件装备。",
  "importer.mainSkillPlaystyle": "主要技能: {{name}}",
  "importer.exactImport": "精确导入 Path of Building。",
  "importer.reviewGearSet": "查看装备方案 {{name}} 的装备",
  "importer.reviewPobNotes": "查看 PoB 备注。",
  "importer.snapshotImported": "已导入快照",
  "importer.snapshotSummary":
    "精确 Path of Building 快照{{mainSkill}}{{itemSet}}。",
  "importer.treeUrl": "天赋树链接: {{url}}",
  "importer.treeSpecImported": "天赋树配置已从 PoB 精确导入。",
  "importer.buildImported":
    "构建已从 Path of Building 精确导入。",
  "importer.snapshotGenerated":
    "快照已从导入的 Path of Building 精确生成。",
  "importer.ascendancyImported":
    "职业和升华已从 PoB 精确导入。",
  "importer.banditImported": "强盗选择已从 PoB 导入。",
  "importer.pantheonImported": "主/副神殿已从 PoB 导入。",
  "importer.activeSetImported": "当前装备方案已从 PoB 导入。",

  // ── Electron 主进程 ──
  "electron.setPoeFolder":
    "同步资源前请先设置流放之路文件夹。",
  "electron.miningScriptNotFound": "未找到本地挖掘脚本。",
  "electron.miningFailed": "执行本地资源挖掘失败。",
  "electron.invalidPobContent":
    "导入的内容似乎不是有效的 Path of Building。",
  "electron.emptyPobCode": "Path of Building 代码为空。",
  "electron.decodeFailed":
    "无法解码 Path of Building 代码。",
  "electron.decompressFailed":
    "无法解压 Path of Building 代码。",
  "electron.invalidPastebinLink": "无效的 Pastebin 链接。",
  "electron.emptyImport":
    "请输入 Path of Building 链接、代码或文件。",
  "electron.downloadFailed":
    "下载 Path of Building 失败 ({{status}})。",
  "electron.trayOpen": "打开 Exile Build PoE",
  "electron.trayShowOverlay": "显示悬浮窗",
  "electron.trayQuit": "退出",
  "electron.dialogTitle": "退出 Exile Build PoE",
  "electron.dialogMessage":
    "你想对 Exile Build PoE 做什么？",
  "electron.dialogDetail":
    "关闭将退出应用并禁用全局快捷键。最小化将隐藏窗口到系统托盘并保持悬浮窗活跃。",
  "electron.dialogClose": "关闭应用",
  "electron.dialogMinimize": "最小化",
  "electron.dialogCancel": "取消",

  // ── 设置 ──
  "settings.heading": "设置",
  "settings.hotkeys": "快捷键",
  "settings.hotkeyOverlay": "打开覆盖层",
  "settings.hotkeyMark": "标记下一个",
  "settings.hotkeyLevel": "调整等级",
  "settings.hotkeyNextTab": "下一个标签",
  "settings.hotkeyPrevTab": "上一个标签",
  "settings.hotkeyPin": "固定/取消固定",
  "settings.hotkeyHelp": "点击快捷键进行更改。按 Escape 取消。",
  "settings.hotkeyPress": "按下按键...",
  "settings.hotkeyReset": "恢复默认",
  "settings.language": "语言",

  // ── 语言选择 ──
  "locale.label": "语言",
};

export default zhCN;

import type { TranslationKey } from "./en";

const th: Record<TranslationKey, string> = {
  // ── Import section ──
  "import.pasteUrlOrCode": "วาง URL หรือโค้ด",
  "import.pobFile": "ไฟล์ PoB",
  "import.heading": "นำเข้า PoB",
  "import.desktopOnly": "ใช้ได้บนเดสก์ท็อปเท่านั้น",
  "import.pasteLabel":
    "วางลิงก์ pobb.in/pastebin หรือโค้ดที่ส่งออกจาก Path of Building",
  "import.fileLabel": "เลือกไฟล์ที่ส่งออกจาก Path of Building",
  "import.pastePlaceholder":
    "https://pobb.in/... หรือวางโค้ดที่ส่งออกจาก Path of Building ที่นี่",
  "import.importing": "กำลังนำเข้า...",
  "import.importButton": "นำเข้า PoB",
  "import.openOverlay": "เปิดโอเวอร์เลย์",
  "import.emptyError": "กรุณาใส่ลิงก์ โค้ด หรือไฟล์ Path of Building",
  "import.genericError": "ไม่สามารถนำเข้า Path of Building นี้ได้",

  // ── Builds section ──
  "builds.heading": "บิลด์ในเครื่อง",
  "builds.empty": "ยังไม่มีการนำเข้า Path of Building",
  "builds.activeBuild": "บิลด์ที่ใช้งาน",
  "builds.delete": "ลบบิลด์",
  "builds.reimport": "นำเข้าบิลด์ใหม่",
  "builds.unknownLeague": "อื่นๆ",
  "builds.searchPlaceholder": "ค้นหาบิลด์...",
  "builds.copySource": "คัดลอกโค้ด/ลิงก์ PoB",

  // ── Snapshot / PoB summary ──
  "snapshot.heading": "PoB Snapshot",
  "snapshot.legacyHeading": "การนำเข้าเวอร์ชันเก่า",
  "snapshot.exactImport": "นำเข้าตรงต้นฉบับ",
  "snapshot.reimport": "นำเข้าใหม่",
  "snapshot.mainSkill": "สกิลหลัก",
  "snapshot.noMainLabel": "ไม่มีชื่อสกิลหลัก",
  "snapshot.activeTree": "ทรีที่ใช้งาน",
  "snapshot.noActiveSpec": "ไม่มีสเปคที่ใช้งาน",
  "snapshot.activeItemSet": "เซ็ตไอเทมที่ใช้งาน",
  "snapshot.noActiveSet": "ไม่มีเซ็ตที่ใช้งาน",
  "snapshot.itemsInSet": "ไอเทมในเซ็ต",
  "snapshot.pobTrees": "ทรี PoB",
  "snapshot.activeTreeInApp": "ทรีที่ใช้ในแอป",
  "snapshot.importedContent": "เนื้อหาที่นำเข้า",
  "snapshot.treeSpecCount": "{{count}} สเปคทรี",
  "snapshot.skillGroupCount": "{{count}} กลุ่มสกิล",
  "snapshot.fromPoB": "จาก Path of Building",
  "snapshot.importedExactly": "นำเข้าตรงต้นฉบับ",
  "snapshot.noBandit": "ไม่มีข้อมูลแบนดิทใน XML",
  "snapshot.pantheonNotSpecified": "ยังไม่ได้เลือก Pantheon",
  "snapshot.notes": "โน้ต",
  "snapshot.legacyDescription":
    "บิลด์นี้มาจากตัวแปลงเก่าและไม่มี snapshot ของ Path of Building แบบตรงต้นฉบับ",
  "snapshot.nextStep": "ขั้นตอนถัดไป",
  "snapshot.reimportPoB": "นำเข้า PoB นี้ใหม่",
  "snapshot.reimportDetail": "เพื่อโหลดสเปคทรี กลุ่มสกิล และอุปกรณ์จริง",
  "snapshot.noDataLoss": "ไม่สูญเสียข้อมูล",
  "snapshot.noDataLossDetail":
    "โอเวอร์เลย์ยังใช้งานได้ แต่ข้อมูลอาจไม่ตรง 1:1 กับ PoB",

  // ── Overlay session ──
  "session.heading": "เซสชันโอเวอร์เลย์",
  "session.alwaysOnTop": "แสดงอยู่ด้านบนเสมอ",
  "session.displayTip":
    "ใน PoE ให้ใช้โหมด Borderless Window หรือ Windowed โหมดเต็มจอแบบ Exclusive อาจบังโอเวอร์เลย์",
  "session.activeTree": "ทรีที่ใช้งาน",
  "session.currentStage": "สเตจปัจจุบัน",
  "session.playerLevel": "เลเวลผู้เล่น",
  "session.nextTree": "ทรีถัดไป: {{title}}",
  "session.lastTreeActive": "ทรี PoB สุดท้ายกำลังใช้งานอยู่",
  "session.showOverlay": "แสดงโอเวอร์เลย์",
  "session.recenter": "จัดกลาง",
  "session.importToActivate": "นำเข้า PoB เพื่อเปิดใช้เซสชันโอเวอร์เลย์",

  // ── Auto-update ──
  "update.available": "อัปเดต v{{version}} พร้อมใช้งาน",
  "update.download": "ดาวน์โหลด",
  "update.downloading": "กำลังดาวน์โหลด… {{percent}}%",
  "update.ready": "v{{version}} พร้อมติดตั้ง",
  "update.installNow": "รีสตาร์ทและอัปเดต",

  // ── Header / workspace ──
  "header.appName": "Exile Build PoE",
  "header.tagline": "โอเวอร์เลย์สำหรับ Path of Building",
  "header.importPrompt":
    "นำเข้า PoB แล้วติดตามบิลด์ด้วยหน้าต่างที่แสดงตลอดเวลาโดยไม่รกตา",
  "header.markNext": "ทำเครื่องหมายถัดไป",
  "header.openOverlay": "เปิดโอเวอร์เลย์",

  // ── Empty state ──
  "empty.heading": "โครงสร้างเริ่มต้นของแอปเดสก์ท็อปพร้อมแล้ว",
  "empty.description":
    "นำเข้า Path of Building เพื่อสร้างสเตจ โอเวอร์เลย์ เช็คลิสต์ และบันทึกความคืบหน้าในเครื่อง",

  // ── Hero cards ──
  "hero.now": "ตอนนี้",
  "hero.activeTree": "ทรีที่ใช้งาน",
  "hero.activeStage": "สเตจที่ใช้งาน",
  "hero.nextAction": "สิ่งที่ต้องทำถัดไป",
  "hero.checklistComplete": "เช็คลิสต์ปัจจุบันเสร็จแล้ว",
  "hero.nextUpgrade": "อัปเกรดถัดไป",
  "hero.reviewSnapshot": "ดู PoB snapshot",
  "hero.currentLevel": "เลเวลปัจจุบัน",
  "hero.completeNext": "ทำรายการถัดไป",
  "hero.showOverlay": "แสดงโอเวอร์เลย์",
  "hero.shortQueue": "คิวสั้น",
  "hero.objectiveCount": "{{count}} วัตถุประสงค์",
  "hero.usefulHotkeys": "ปุ่มลัดที่มีประโยชน์",
  "hero.markAsCompleted": "ทำเครื่องหมาย {{text}} ว่าเสร็จแล้ว",

  // ── Hotkeys ──
  "hotkeys.openOverlay": "Ctrl + Shift + O เปิดโอเวอร์เลย์",
  "hotkeys.markNext": "Ctrl + Shift + M ทำเครื่องหมายวัตถุประสงค์ถัดไป",
  "hotkeys.adjustLevel": "Ctrl + Shift + L ปรับเลเวลอย่างรวดเร็ว",

  // ── Checklist block ──
  "checklist.heading": "เช็คลิสต์การดำเนินการ",
  "checklist.itemCount": "{{count}} รายการ",

  // ── Notes ──
  "notes.empty": "ไม่มีโน้ตที่นำเข้าจาก Path of Building",
  "notes.buildNotes": "โน้ตบิลด์",
  "notes.importMvp": "นำเข้า + MVP",
  "notes.currentSnapshot": "Snapshot ปัจจุบัน",
  "notes.pinnedItems": "รายการที่ปักหมุด",
  "notes.pinnedActive": "{{count}} ใช้งานอยู่",
  "notes.noPinnedItems": "ยังไม่มีรายการที่ปักหมุด",

  // ── Overview tab ──
  "overview.pobNow": "PoB ตอนนี้",
  "overview.mainSkill": "สกิลหลัก",
  "overview.noMainSkill": "ไม่มีชื่อสกิลหลักใน PoB",
  "overview.activeTree": "ทรีที่ใช้งาน",
  "overview.noActiveTree": "ไม่มีสเปคทรีที่ใช้งาน",
  "overview.activeItemSet": "เซ็ตไอเทมที่ใช้งาน",
  "overview.noActiveItemSet": "ไม่มีเซ็ตไอเทมที่ใช้งาน",
  "overview.nextUpgrade": "อัปเกรดถัดไป",
  "overview.reviewNotes": "ดูโน้ตที่นำเข้า",
  "overview.exactImport": "นำเข้าตรงต้นฉบับ",
  "overview.realPoB": "PoB จริง",
  "overview.treeSpecs": "สเปคทรี",
  "overview.skillGroups": "กลุ่มสกิล",
  "overview.itemsInActiveSet": "ไอเทมในเซ็ตที่ใช้งาน",
  "overview.pobNotes": "โน้ต PoB",
  "overview.formattedForReading": "จัดรูปแบบสำหรับอ่าน",
  "overview.buildNow": "บิลด์ตอนนี้",
  "overview.playstyle": "สไตล์การเล่น",
  "overview.currentStage": "สเตจปัจจุบัน",
  "overview.warnings": "คำเตือน",
  "overview.beforePlaying": "ก่อนเล่น",

  // ── Tree tab ──
  "tree.activeTree": "ทรีที่ใช้งาน",
  "tree.treeTimeline": "ไทม์ไลน์ทรี",
  "tree.noActiveTree": "ไม่มีทรีที่ใช้งาน",
  "tree.activeInApp": "ใช้งานอยู่ในแอป",
  "tree.selectTree": "เลือกทรี",
  "tree.activeTreeInApp": "ทรีที่ใช้ในแอป",
  "tree.passiveTree": "Passive tree {{version}}",
  "tree.treeSpecImported": "สเปคทรีถูกนำเข้าตรงจาก PoB",
  "tree.viewTree": "ดูทรี",
  "tree.passiveMilestones": "เป้าหมาย passive",
  "tree.pointCount": "{{count}} พอยต์",
  "tree.fullRoadmap": "แผนทั้งหมด",
  "tree.progressionOrder": "ลำดับการเก็บ",
  "tree.loading": "กำลังโหลดแอสเซทต้นไม้…",
  "tree.loadFailed": "โหลดแอสเซทต้นไม้ล้มเหลว",
  "tree.loadFailedHint": "ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต — สไปรต์โหลดจาก PoE CDN",
  "tree.retry": "ลองใหม่",

  // ── Gems tab ──
  "gems.linksAndGems": "ลิงก์และเจม",
  "gems.activeSkillSet": "เซ็ตสกิลที่ใช้งาน",
  "gems.linkCount": "{{count}} ลิงก์",
  "gems.gemCount": "{{count}} เจม",
  "gems.primaryGem": "เจมหลัก",
  "gems.activeLink": "ลิงก์ที่ใช้งาน",
  "gems.groupBench": "กลุ่มเจม",
  "gems.groupCount": "{{count}} กลุ่ม",

  // ── Gear tab ──
  "gear.exactGear": "อุปกรณ์ตรงจาก PoB",
  "gear.noItem": "ไม่มีไอเทม",
  "gear.flasks": "ขวดยา",
  "gear.importedFlask": "ขวดยาที่นำเข้า",
  "gear.swapAndExtra": "สลับและซ็อกเก็ตเพิ่มเติม",
  "gear.imported": "นำเข้าแล้ว",
  "gear.uniqueHint": "ยูนีคที่แนะนำ: {{suggestion}}",

  // ── Overlay panel ──
  "overlay.footerCopy": "Ctrl + Shift + M ทำรายการถัดไปให้เสร็จ",
  "overlay.phase": "เฟส",
  "overlay.nextUpgrade": "อัปเกรดถัดไป",
  "overlay.reviewSnapshot": "ดู PoB snapshot",
  "overlay.currentLevel": "เลเวลปัจจุบัน",
  "overlay.levelHelpTree":
    "เมื่อเลเวลอัป ทรีถัดไปจะเป็น {{title}}",
  "overlay.levelHelpStage":
    "การปรับเลเวลที่นี่จะอัปเดตสเตจที่ใช้งานในโอเวอร์เลย์",
  "overlay.now": "ตอนนี้",
  "overlay.next": "ถัดไป",
  "overlay.checklistUpToDate": "เช็คลิสต์เป็นปัจจุบัน",
  "overlay.noPendingItems":
    "ไม่มีรายการค้าง เปิดรายละเอียดเพื่อดูบิลด์ตามสะดวก",
  "overlay.complete": "เสร็จ",
  "overlay.noActivePoB": "ไม่มี PoB ที่ใช้งาน",
  "overlay.importPrompt":
    "นำเข้า Path of Building ที่หน้าต่างหลักแล้วใช้ `Ctrl + Shift + O`",

  // ── Importer service ──
  "importer.desktopRequired":
    "การนำเข้า Path of Building แบบตรงต้นฉบับต้องใช้แอปเดสก์ท็อป",
  "importer.invalidXml": "XML ของ Path of Building ไม่ถูกต้อง",
  "importer.unknownClass": "คลาสที่ไม่รู้จัก",
  "importer.unknownAscendancy": "Ascendancy ที่ไม่รู้จัก",
  "importer.importedGem": "เจมที่นำเข้า",
  "importer.group": "กลุ่ม {{index}}",
  "importer.chooseBandit": "เลือกแบนดิท: {{name}}",
  "importer.pantheonMajor": "Pantheon หลัก: {{name}}",
  "importer.pantheonMinor": "Pantheon รอง: {{name}}",
  "importer.doLab": "ทำ {{name}}",
  "importer.followSetup": "ทำตามเซ็ตอัป {{name}}",
  "importer.followTree": "ทำตามทรี {{name}}",
  "importer.checkImportedTree": "ตรวจสอบทรี PoB ที่นำเข้า",
  "importer.setupMainSkill": "ตั้งค่าสกิลหลัก {{name}}",
  "importer.checkActiveSkillSet": "ตรวจสอบเซ็ตสกิล PoB ที่ใช้งาน",
  "importer.reviewGear": "ดูอุปกรณ์จากเซ็ต {{name}}",
  "importer.checkImportedGear": "ตรวจสอบอุปกรณ์ PoB ที่นำเข้า",
  "importer.openPobNotes": "เปิดโน้ต PoB เพื่อดูรายละเอียดเฟส",
  "importer.importedItem": "ไอเทมที่นำเข้า",
  "importer.tagline":
    "นำเข้า PoB ตรงต้นฉบับ มี {{treeSpecs}} สเปคทรี, {{skillGroups}} กลุ่มสกิล, และ {{items}} ไอเทมใน snapshot",
  "importer.mainSkillPlaystyle": "สกิลหลัก: {{name}}",
  "importer.exactImport": "นำเข้า Path of Building ตรงต้นฉบับ",
  "importer.reviewGearSet": "ดูอุปกรณ์จากเซ็ต {{name}}",
  "importer.reviewPobNotes": "ดูโน้ต PoB",
  "importer.snapshotImported": "Snapshot ที่นำเข้า",
  "importer.snapshotSummary":
    "Snapshot ตรงจาก Path of Building{{mainSkill}}{{itemSet}}",
  "importer.treeUrl": "URL ทรี: {{url}}",
  "importer.treeSpecImported": "สเปคทรีถูกนำเข้าตรงจาก PoB",
  "importer.buildImported":
    "บิลด์ถูกนำเข้าตรงจาก Path of Building",
  "importer.snapshotGenerated":
    "Snapshot ถูกสร้างตรงจาก Path of Building ที่นำเข้า",
  "importer.ascendancyImported":
    "คลาสและ Ascendancy ถูกนำเข้าตรงจาก PoB",
  "importer.banditImported": "ตัวเลือกแบนดิทถูกนำเข้าจาก PoB",
  "importer.pantheonImported": "Pantheon หลัก/รองถูกนำเข้าจาก PoB",
  "importer.activeSetImported": "เซ็ตที่ใช้งานถูกนำเข้าจาก PoB",

  // ── Electron main process ──
  "electron.setPoeFolder":
    "ตั้งค่าโฟลเดอร์ Path of Exile ก่อนซิงค์ไฟล์",
  "electron.miningScriptNotFound": "ไม่พบสคริปต์ขุดข้อมูลในเครื่อง",
  "electron.miningFailed": "ไม่สามารถรันสคริปต์ขุดข้อมูลได้",
  "electron.invalidPobContent":
    "เนื้อหาที่นำเข้าดูเหมือนไม่ใช่ Path of Building ที่ถูกต้อง",
  "electron.emptyPobCode": "โค้ด Path of Building ว่างเปล่า",
  "electron.decodeFailed":
    "ไม่สามารถถอดรหัสโค้ด Path of Building ได้",
  "electron.decompressFailed":
    "ไม่สามารถแตกไฟล์โค้ด Path of Building ได้",
  "electron.invalidPastebinLink": "ลิงก์ Pastebin ไม่ถูกต้อง",
  "electron.emptyImport":
    "กรุณาใส่ลิงก์ โค้ด หรือไฟล์ Path of Building",
  "electron.downloadFailed":
    "ดาวน์โหลด Path of Building ไม่สำเร็จ ({{status}})",
  "electron.networkTimeout": "การดาวน์โหลดหมดเวลา ตรวจสอบการเชื่อมต่อแล้วลองใหม่ หรือวางโค้ด PoB โดยตรง",
  "electron.networkError": "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ ตรวจสอบการเชื่อมต่อ หรือวางโค้ด PoB ที่ส่งออกมาโดยตรง",
  "electron.trayOpen": "เปิด Exile Build PoE",
  "electron.trayShowOverlay": "แสดงโอเวอร์เลย์",
  "electron.trayQuit": "ออก",
  "electron.dialogTitle": "ออกจาก Exile Build PoE",
  "electron.dialogMessage":
    "ต้องการทำอะไรกับ Exile Build PoE?",
  "electron.dialogDetail":
    "ปิดจะหยุดแอปและปิดปุ่มลัดทั้งหมด ย่อจะซ่อนหน้าต่างไปที่ถาดระบบและโอเวอร์เลย์ยังทำงานต่อ",
  "electron.dialogClose": "ปิดแอป",
  "electron.dialogMinimize": "ย่อ",
  "electron.dialogCancel": "ยกเลิก",

  // ── Settings ──
  "settings.heading": "ตั้งค่า",
  "settings.hotkeys": "ปุ่มลัด",
  "settings.hotkeyOverlay": "เปิดโอเวอร์เลย์",
  "settings.hotkeyMark": "ทำเครื่องหมายถัดไป",
  "settings.hotkeyLevel": "ปรับระดับ",
  "settings.hotkeyNextTab": "แท็บถัดไป",
  "settings.hotkeyPrevTab": "แท็บก่อนหน้า",
  "settings.hotkeyPin": "ปักหมุด/ถอนหมุด",
  "settings.hotkeyHelp": "คลิกที่ปุ่มลัดเพื่อเปลี่ยน กด Escape เพื่อยกเลิก",
  "settings.hotkeyPress": "กดปุ่ม...",
  "settings.hotkeyReset": "รีเซ็ต",
  "settings.overlayOpacity": "ความทึบของโอเวอร์เลย์",
  "settings.language": "ภาษา",

  // ── ช่วยเหลือ / เริ่มต้นใช้งาน ──
  "help.title": "เริ่มต้นใช้งาน",
  "help.step1Title": "ส่งออกจาก PoB",
  "help.step1Desc":
    "ใน Path of Building ไปที่ Import/Export และคัดลอกโค้ดบิลด์หรือสร้างลิงก์ pobb.in",
  "help.step2Title": "นำเข้าที่นี่",
  "help.step2Desc":
    "วางโค้ดหรือลิงก์ในส่วนนำเข้าที่แถบด้านข้าง หรือลากไฟล์ .xml",
  "help.step3Title": "ใช้โอเวอร์เลย์",
  "help.step3Desc":
    "เปิดโอเวอร์เลย์ด้วยปุ่มลัดและติดตามบิลด์ในเกมโดยไม่ต้อง Alt-Tab",
  "help.tip": "เคล็ดลับ",
  "help.tipDesc":
    "ใช้ Borderless Window หรือ Windowed ใน PoE โหมดเต็มจออาจบล็อกโอเวอร์เลย์",

  // ── Locale picker ──
  "locale.label": "ภาษา",
};

export default th;

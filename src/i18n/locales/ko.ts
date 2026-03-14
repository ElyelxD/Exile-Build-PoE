import type { TranslationKey } from "./en";

const ko: Record<TranslationKey, string> = {
  // ── Import section ──
  "import.pasteUrlOrCode": "URL 또는 코드 붙여넣기",
  "import.pobFile": "PoB 파일",
  "import.heading": "PoB 가져오기",
  "import.desktopOnly": "데스크톱 전용",
  "import.pasteLabel":
    "pobb.in/pastebin 링크 또는 Path of Building에서 내보낸 코드를 붙여넣으세요",
  "import.fileLabel": "Path of Building에서 내보낸 파일을 선택하세요",
  "import.pastePlaceholder":
    "https://pobb.in/... 또는 Path of Building에서 내보낸 코드를 여기에 붙여넣으세요",
  "import.importing": "가져오는 중...",
  "import.importButton": "PoB 가져오기",
  "import.openOverlay": "오버레이 열기",
  "import.emptyError": "Path of Building 링크, 코드 또는 파일을 입력해주세요.",
  "import.genericError": "이 Path of Building을 가져올 수 없었어요.",

  // ── Builds section ──
  "builds.heading": "로컬 빌드",
  "builds.empty": "아직 가져온 Path of Building이 없어요.",
  "builds.activeBuild": "활성 빌드",
  "builds.delete": "빌드 삭제",
  "builds.reimport": "빌드 재가져오기",
  "builds.unknownLeague": "기타",
  "builds.searchPlaceholder": "빌드 검색...",
  "builds.copySource": "PoB 코드/링크 복사",

  // ── Snapshot / PoB summary ──
  "snapshot.heading": "PoB 스냅샷",
  "snapshot.legacyHeading": "레거시 가져오기",
  "snapshot.exactImport": "정확한 가져오기",
  "snapshot.reimport": "다시 가져오기",
  "snapshot.mainSkill": "메인 스킬",
  "snapshot.noMainLabel": "메인 라벨 없음",
  "snapshot.activeTree": "활성 트리",
  "snapshot.noActiveSpec": "활성 스펙 없음",
  "snapshot.activeItemSet": "활성 아이템 세트",
  "snapshot.noActiveSet": "활성 세트 없음",
  "snapshot.itemsInSet": "세트 내 아이템",
  "snapshot.pobTrees": "PoB 트리",
  "snapshot.activeTreeInApp": "앱 내 활성 트리",
  "snapshot.importedContent": "가져온 콘텐츠",
  "snapshot.treeSpecCount": "트리 스펙 {{count}}개",
  "snapshot.skillGroupCount": "스킬 그룹 {{count}}개",
  "snapshot.fromPoB": "Path of Building에서",
  "snapshot.importedExactly": "정확하게 가져옴",
  "snapshot.noBandit": "XML에 밴딧 정보 없음",
  "snapshot.pantheonNotSpecified": "판테온 미지정",
  "snapshot.notes": "노트",
  "snapshot.legacyDescription":
    "이 빌드는 이전 파서에서 가져온 것으로, 정확한 Path of Building 스냅샷이 없어요.",
  "snapshot.nextStep": "다음 단계",
  "snapshot.reimportPoB": "이 PoB를 다시 가져오기",
  "snapshot.reimportDetail": "실제 트리 스펙, 스킬 그룹, 장비를 불러와요.",
  "snapshot.noDataLoss": "데이터 손실 없음",
  "snapshot.noDataLossDetail":
    "오버레이는 계속 작동하지만, 데이터가 PoB와 1:1로 일치하지 않아요.",

  // ── Overlay session ──
  "session.heading": "오버레이 세션",
  "session.alwaysOnTop": "항상 위에 표시",
  "session.displayTip":
    "PoE에서 창 모드 또는 전체 창 모드를 사용하세요. 전체 화면 모드는 데스크톱 오버레이를 가릴 수 있어요.",
  "session.activeTree": "활성 트리",
  "session.currentStage": "현재 단계",
  "session.playerLevel": "플레이어 레벨",
  "session.nextTree": "다음 트리: {{title}}",
  "session.lastTreeActive": "마지막으로 가져온 PoB 트리가 활성화되어 있어요.",
  "session.showOverlay": "오버레이 표시",
  "session.recenter": "중앙으로 이동",
  "session.importToActivate": "오버레이 세션을 활성화하려면 PoB를 가져오세요.",

  // ── Auto-update ──
  "update.available": "업데이트 v{{version}} 사용 가능",
  "update.download": "다운로드",
  "update.downloading": "다운로드 중… {{percent}}%",
  "update.ready": "v{{version}} 설치 준비 완료",
  "update.installNow": "재시작 후 업데이트",

  // ── Header / workspace ──
  "header.appName": "Exile Build PoE",
  "header.tagline": "Path of Building 운영 오버레이",
  "header.importPrompt":
    "PoB를 가져와서 항상 표시되는 창으로 빌드를 따라가세요. 더 깔끔하게.",
  "header.markNext": "다음 완료",
  "header.openOverlay": "오버레이 열기",

  // ── Empty state ──
  "empty.heading": "데스크톱 앱 초기 구조 준비 완료",
  "empty.description":
    "Path of Building을 가져와서 단계, 오버레이 셸, 체크리스트, 로컬 진행 상황을 생성하세요.",

  // ── Hero cards ──
  "hero.now": "현재",
  "hero.activeTree": "활성 트리",
  "hero.activeStage": "활성 단계",
  "hero.nextAction": "다음 행동",
  "hero.checklistComplete": "현재 체크리스트 완료",
  "hero.nextUpgrade": "다음 업그레이드",
  "hero.reviewSnapshot": "PoB 스냅샷 검토",
  "hero.currentLevel": "현재 레벨",
  "hero.completeNext": "다음 완료",
  "hero.showOverlay": "오버레이 표시",
  "hero.shortQueue": "짧은 대기열",
  "hero.objectiveCount": "목표 {{count}}개",
  "hero.usefulHotkeys": "유용한 단축키",
  "hero.markAsCompleted": "{{text}} 완료로 표시",

  // ── Hotkeys ──
  "hotkeys.openOverlay": "Ctrl + Shift + O로 오버레이를 열어요",
  "hotkeys.markNext": "Ctrl + Shift + M으로 다음 목표를 완료해요",
  "hotkeys.adjustLevel": "Ctrl + Shift + L로 레벨을 빠르게 조정해요",

  // ── Checklist block ──
  "checklist.heading": "운영 체크리스트",
  "checklist.itemCount": "{{count}}개 항목",

  // ── Notes ──
  "notes.empty": "Path of Building에서 가져온 노트가 없어요.",
  "notes.buildNotes": "빌드 노트",
  "notes.importMvp": "가져오기 + MVP",
  "notes.currentSnapshot": "현재 스냅샷",
  "notes.pinnedItems": "고정된 항목",
  "notes.pinnedActive": "{{count}}개 활성",
  "notes.noPinnedItems": "아직 고정된 항목이 없어요.",

  // ── Overview tab ──
  "overview.pobNow": "PoB 현재",
  "overview.mainSkill": "메인 스킬",
  "overview.noMainSkill": "PoB에 메인 라벨 없음",
  "overview.activeTree": "활성 트리",
  "overview.noActiveTree": "활성 트리 스펙 없음",
  "overview.activeItemSet": "활성 아이템 세트",
  "overview.noActiveItemSet": "활성 아이템 세트 없음",
  "overview.nextUpgrade": "다음 업그레이드",
  "overview.reviewNotes": "가져온 노트 검토",
  "overview.exactImport": "정확한 가져오기",
  "overview.realPoB": "실제 PoB",
  "overview.treeSpecs": "트리 스펙",
  "overview.skillGroups": "스킬 그룹",
  "overview.itemsInActiveSet": "활성 세트 내 아이템",
  "overview.pobNotes": "PoB 노트",
  "overview.formattedForReading": "읽기 편하게 정리됨",
  "overview.buildNow": "현재 빌드",
  "overview.playstyle": "플레이 스타일",
  "overview.currentStage": "현재 단계",
  "overview.warnings": "경고",
  "overview.beforePlaying": "플레이 전 확인",

  // ── Tree tab ──
  "tree.activeTree": "활성 트리",
  "tree.treeTimeline": "트리 타임라인",
  "tree.noActiveTree": "활성 트리 없음",
  "tree.activeInApp": "앱에서 활성",
  "tree.selectTree": "트리 선택",
  "tree.activeTreeInApp": "앱 내 활성 트리",
  "tree.passiveTree": "패시브 트리 {{version}}",
  "tree.treeSpecImported": "PoB에서 트리 스펙이 정확하게 가져와졌어요.",
  "tree.viewTree": "트리 보기",
  "tree.passiveMilestones": "패시브 마일스톤",
  "tree.pointCount": "{{count}} 포인트",
  "tree.fullRoadmap": "전체 로드맵",
  "tree.progressionOrder": "진행 순서",
  "tree.loading": "트리 에셋 로딩 중…",
  "tree.loadFailed": "트리 에셋 로드 실패.",
  "tree.loadFailedHint": "인터넷 연결을 확인하세요 — 스프라이트는 PoE CDN에서 로드됩니다.",
  "tree.retry": "재시도",

  // ── Gems tab ──
  "gems.linksAndGems": "링크와 젬",
  "gems.activeSkillSet": "활성 스킬 세트",
  "gems.linkCount": "{{count}}-링크",
  "gems.gemCount": "젬 {{count}}개",
  "gems.primaryGem": "주요 젬",
  "gems.activeLink": "활성 링크",
  "gems.groupBench": "그룹 벤치",
  "gems.groupCount": "{{count}}개 그룹",

  // ── Gear tab ──
  "gear.exactGear": "PoB에서 가져온 정확한 장비",
  "gear.noItem": "아이템 없음",
  "gear.flasks": "플라스크",
  "gear.importedFlask": "가져온 플라스크",
  "gear.swapAndExtra": "스왑 및 추가 소켓",
  "gear.imported": "가져옴",
  "gear.uniqueHint": "유니크 힌트: {{suggestion}}",

  // ── Overlay panel ──
  "overlay.footerCopy": "Ctrl + Shift + M으로 다음 목표를 완료해요",
  "overlay.phase": "페이즈",
  "overlay.nextUpgrade": "다음 업그레이드",
  "overlay.reviewSnapshot": "PoB 스냅샷 검토",
  "overlay.currentLevel": "현재 레벨",
  "overlay.levelHelpTree":
    "레벨업 시, 다음 트리는 {{title}}이에요.",
  "overlay.levelHelpStage":
    "여기서 레벨을 조정하면 오버레이의 활성 단계가 업데이트돼요.",
  "overlay.now": "현재",
  "overlay.next": "다음",
  "overlay.checklistUpToDate": "체크리스트 최신 상태",
  "overlay.noPendingItems":
    "대기 중인 항목이 없어요. 세부 정보를 열어서 빌드를 천천히 확인하세요.",
  "overlay.complete": "완료",
  "overlay.noActivePoB": "활성 PoB 없음",
  "overlay.importPrompt":
    "메인 창에서 Path of Building을 가져온 후 `Ctrl + Shift + O`를 사용하세요.",

  // ── Importer service ──
  "importer.desktopRequired":
    "정확한 Path of Building 가져오기는 데스크톱 앱이 필요해요.",
  "importer.invalidXml": "Path of Building XML이 유효하지 않아요.",
  "importer.unknownClass": "알 수 없는 클래스",
  "importer.unknownAscendancy": "알 수 없는 전직",
  "importer.importedGem": "가져온 젬",
  "importer.group": "그룹 {{index}}",
  "importer.chooseBandit": "밴딧 선택: {{name}}",
  "importer.pantheonMajor": "판테온 메이저: {{name}}",
  "importer.pantheonMinor": "판테온 마이너: {{name}}",
  "importer.doLab": "{{name}} 래비린스 완료",
  "importer.followSetup": "{{name}} 세팅 따라가기",
  "importer.followTree": "{{name}} 트리 따라가기",
  "importer.checkImportedTree": "가져온 PoB 트리 확인",
  "importer.setupMainSkill": "메인 스킬 {{name}} 세팅",
  "importer.checkActiveSkillSet": "활성 PoB 스킬 세트 확인",
  "importer.reviewGear": "{{name}} 세트의 장비 검토",
  "importer.checkImportedGear": "가져온 PoB 장비 확인",
  "importer.openPobNotes": "정확한 PoB 노트를 열어서 페이즈를 검토하세요",
  "importer.importedItem": "가져온 아이템",
  "importer.tagline":
    "스냅샷에 트리 스펙 {{treeSpecs}}개, 스킬 그룹 {{skillGroups}}개, 아이템 {{items}}개가 포함된 정확한 PoB 가져오기예요.",
  "importer.mainSkillPlaystyle": "메인 스킬: {{name}}",
  "importer.exactImport": "정확한 Path of Building 가져오기.",
  "importer.reviewGearSet": "{{name}} 세트의 장비 검토",
  "importer.reviewPobNotes": "PoB 노트를 검토하세요.",
  "importer.snapshotImported": "스냅샷 가져옴",
  "importer.snapshotSummary":
    "정확한 Path of Building 스냅샷{{mainSkill}}{{itemSet}}.",
  "importer.treeUrl": "트리 URL: {{url}}",
  "importer.treeSpecImported": "PoB에서 트리 스펙이 정확하게 가져와졌어요.",
  "importer.buildImported":
    "Path of Building에서 빌드를 정확하게 가져왔어요.",
  "importer.snapshotGenerated":
    "가져온 Path of Building에서 스냅샷이 정확하게 생성됐어요.",
  "importer.ascendancyImported":
    "PoB에서 클래스와 전직이 정확하게 가져와졌어요.",
  "importer.banditImported": "PoB에서 밴딧 선택이 가져와졌어요.",
  "importer.pantheonImported": "PoB에서 판테온 메이저/마이너가 가져와졌어요.",
  "importer.activeSetImported": "PoB에서 활성 세트가 가져와졌어요.",

  // ── Electron main process ──
  "electron.setPoeFolder":
    "에셋 동기화 전에 Path of Exile 폴더를 설정하세요.",
  "electron.miningScriptNotFound": "로컬 마이닝 스크립트를 찾을 수 없어요.",
  "electron.miningFailed": "로컬 에셋 마이닝 실행에 실패했어요.",
  "electron.invalidPobContent":
    "가져온 콘텐츠가 유효한 Path of Building이 아닌 것 같아요.",
  "electron.emptyPobCode": "Path of Building 코드가 비어 있어요.",
  "electron.decodeFailed":
    "Path of Building 코드를 디코딩할 수 없었어요.",
  "electron.decompressFailed":
    "Path of Building 코드를 압축 해제할 수 없었어요.",
  "electron.invalidPastebinLink": "유효하지 않은 Pastebin 링크예요.",
  "electron.emptyImport":
    "Path of Building 링크, 코드 또는 파일을 입력해주세요.",
  "electron.downloadFailed":
    "Path of Building 다운로드에 실패했어요 ({{status}}).",
  "electron.networkTimeout": "다운로드 시간이 초과되었습니다. 인터넷 연결을 확인하고 다시 시도하거나, PoB 코드를 직접 붙여넣으세요.",
  "electron.networkError": "서버에 연결할 수 없습니다. 인터넷 연결을 확인하거나, 내보낸 PoB 코드를 직접 붙여넣으세요.",
  "electron.trayOpen": "Exile Build PoE 열기",
  "electron.trayShowOverlay": "오버레이 표시",
  "electron.trayQuit": "종료",
  "electron.dialogTitle": "Exile Build PoE 종료",
  "electron.dialogMessage":
    "Exile Build PoE를 어떻게 할까요?",
  "electron.dialogDetail":
    "닫기는 앱을 종료하고 글로벌 단축키를 비활성화해요. 최소화는 시스템 트레이로 숨기고 오버레이를 활성 상태로 유지해요.",
  "electron.dialogClose": "앱 닫기",
  "electron.dialogMinimize": "최소화",
  "electron.dialogCancel": "취소",

  // ── Settings ──
  "settings.heading": "설정",
  "settings.hotkeys": "단축키",
  "settings.hotkeyOverlay": "오버레이 열기",
  "settings.hotkeyMark": "다음 표시",
  "settings.hotkeyLevel": "레벨 조정",
  "settings.hotkeyNextTab": "다음 탭",
  "settings.hotkeyPrevTab": "이전 탭",
  "settings.hotkeyPin": "고정/해제",
  "settings.hotkeyHelp": "단축키를 클릭하여 변경하세요. Escape로 취소합니다.",
  "settings.hotkeyPress": "키를 누르세요...",
  "settings.hotkeyReset": "기본값 복원",
  "settings.overlayOpacity": "오버레이 투명도",
  "settings.language": "언어",

  // ── Help / onboarding ──
  "help.title": "시작하기",
  "help.step1Title": "PoB에서 내보내기",
  "help.step1Desc":
    "Path of Building에서 Import/Export로 이동하여 빌드 코드를 복사하거나 pobb.in 링크를 생성하세요.",
  "help.step2Title": "여기서 가져오기",
  "help.step2Desc":
    "사이드바의 가져오기 섹션에 코드나 링크를 붙여넣거나 .xml 파일을 드래그하세요.",
  "help.step3Title": "오버레이 사용",
  "help.step3Desc":
    "단축키로 오버레이를 열고 Alt-Tab 없이 게임 내에서 빌드를 따라가세요.",
  "help.tip": "팁",
  "help.tipDesc":
    "PoE에서 Borderless Window 또는 Windowed 모드를 사용하세요. 전체 화면은 오버레이를 차단할 수 있습니다.",

  // ── Locale picker ──
  "locale.label": "언어",
};

export default ko;

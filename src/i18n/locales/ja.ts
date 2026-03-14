import type { TranslationKey } from "./en";

const ja: Record<TranslationKey, string> = {
  // ── Import section ──
  "import.pasteUrlOrCode": "URLまたはコードを貼り付け",
  "import.pobFile": "PoBファイル",
  "import.heading": "PoBインポート",
  "import.desktopOnly": "デスクトップ版のみ",
  "import.pasteLabel":
    "pobb.in/pastebinリンク、またはエクスポートしたPath of Buildingコードを貼り付けてください",
  "import.fileLabel": "エクスポートしたPath of Buildingファイルを選択してください",
  "import.pastePlaceholder":
    "https://pobb.in/... またはエクスポートしたPath of Buildingコードをここに貼り付け",
  "import.importing": "インポート中...",
  "import.importButton": "PoBをインポート",
  "import.openOverlay": "オーバーレイを開く",
  "import.emptyError":
    "Path of Buildingのリンク、コード、またはファイルを入力してください。",
  "import.genericError": "このPath of Buildingをインポートできませんでした。",

  // ── Builds section ──
  "builds.heading": "ローカルビルド",
  "builds.empty": "まだPath of Buildingがインポートされていません。",
  "builds.activeBuild": "アクティブビルド",
  "builds.delete": "ビルドを削除",
  "builds.reimport": "ビルドを再インポート",
  "builds.unknownLeague": "その他",

  // ── Snapshot / PoB summary ──
  "snapshot.heading": "PoBスナップショット",
  "snapshot.legacyHeading": "旧式インポート",
  "snapshot.exactImport": "完全インポート",
  "snapshot.reimport": "再インポート",
  "snapshot.mainSkill": "メインスキル",
  "snapshot.noMainLabel": "メインラベルなし",
  "snapshot.activeTree": "アクティブツリー",
  "snapshot.noActiveSpec": "アクティブスペックなし",
  "snapshot.activeItemSet": "アクティブアイテムセット",
  "snapshot.noActiveSet": "アクティブセットなし",
  "snapshot.itemsInSet": "セット内のアイテム",
  "snapshot.pobTrees": "PoBツリー",
  "snapshot.activeTreeInApp": "アプリ内のアクティブツリー",
  "snapshot.importedContent": "インポート済みコンテンツ",
  "snapshot.treeSpecCount": "ツリースペック {{count}}件",
  "snapshot.skillGroupCount": "スキルグループ {{count}}件",
  "snapshot.fromPoB": "Path of Buildingから",
  "snapshot.importedExactly": "完全にインポート済み",
  "snapshot.noBandit": "XMLにバンディットの指定なし",
  "snapshot.pantheonNotSpecified": "パンテオン未指定",
  "snapshot.notes": "ノート",
  "snapshot.legacyDescription":
    "このビルドは旧パーサーからのもので、正確なPath of Buildingスナップショットがありません。",
  "snapshot.nextStep": "次のステップ",
  "snapshot.reimportPoB": "このPoBを再インポートする",
  "snapshot.reimportDetail":
    "実際のツリースペック、スキルグループ、装備を読み込みます。",
  "snapshot.noDataLoss": "データ損失なし",
  "snapshot.noDataLossDetail":
    "オーバーレイは引き続き動作しますが、データがPoBと完全に一致しない場合があります。",

  // ── Overlay session ──
  "session.heading": "オーバーレイセッション",
  "session.alwaysOnTop": "常に最前面に表示",
  "session.displayTip":
    "PoEではボーダーレスウィンドウまたはウィンドウモードを使用してください。排他的フルスクリーンではデスクトップオーバーレイが表示されない場合があります。",
  "session.activeTree": "アクティブツリー",
  "session.currentStage": "現在のステージ",
  "session.playerLevel": "プレイヤーレベル",
  "session.nextTree": "次のツリー: {{title}}",
  "session.lastTreeActive": "最後にインポートしたPoBツリーがアクティブです。",
  "session.showOverlay": "オーバーレイを表示",
  "session.recenter": "中央に戻す",
  "session.importToActivate":
    "PoBをインポートしてオーバーレイセッションを有効にしてください。",

  // ── Auto-update ──
  "update.available": "アップデート v{{version}} が利用可能",
  "update.download": "ダウンロード",
  "update.downloading": "ダウンロード中… {{percent}}%",
  "update.ready": "v{{version}} インストール準備完了",
  "update.installNow": "再起動して更新",

  // ── Header / workspace ──
  "header.appName": "Exile Build PoE",
  "header.tagline": "Path of Building用オペレーショナルオーバーレイ",
  "header.importPrompt":
    "PoBをインポートして、常に表示されるウィンドウでビルドを追跡しましょう。",
  "header.markNext": "次を完了",
  "header.openOverlay": "オーバーレイを開く",

  // ── Empty state ──
  "empty.heading": "デスクトップアプリの初期構造が準備完了",
  "empty.description":
    "Path of Buildingをインポートして、ステージ、オーバーレイシェル、チェックリスト、ローカル進捗を生成します。",

  // ── Hero cards ──
  "hero.now": "現在",
  "hero.activeTree": "アクティブツリー",
  "hero.activeStage": "アクティブステージ",
  "hero.nextAction": "次のアクション",
  "hero.checklistComplete": "現在のチェックリスト完了",
  "hero.nextUpgrade": "次のアップグレード",
  "hero.reviewSnapshot": "PoBスナップショットを確認",
  "hero.currentLevel": "現在のレベル",
  "hero.completeNext": "次を完了",
  "hero.showOverlay": "オーバーレイを表示",
  "hero.shortQueue": "短いキュー",
  "hero.objectiveCount": "目標 {{count}}件",
  "hero.usefulHotkeys": "便利なホットキー",
  "hero.markAsCompleted": "{{text}} を完了にする",

  // ── Hotkeys ──
  "hotkeys.openOverlay": "Ctrl + Shift + O でオーバーレイを開く",
  "hotkeys.markNext": "Ctrl + Shift + M で次の目標を完了にする",
  "hotkeys.adjustLevel": "Ctrl + Shift + L でレベルを素早く調整",

  // ── Checklist block ──
  "checklist.heading": "オペレーショナルチェックリスト",
  "checklist.itemCount": "{{count}}件",

  // ── Notes ──
  "notes.empty": "Path of Buildingからインポートされたノートはありません。",
  "notes.buildNotes": "ビルドノート",
  "notes.importMvp": "インポート + MVP",
  "notes.currentSnapshot": "現在のスナップショット",
  "notes.pinnedItems": "ピン留めアイテム",
  "notes.pinnedActive": "{{count}}件アクティブ",
  "notes.noPinnedItems": "まだピン留めされたアイテムはありません。",

  // ── Overview tab ──
  "overview.pobNow": "PoB現在の状態",
  "overview.mainSkill": "メインスキル",
  "overview.noMainSkill": "PoBにメインラベルがありません",
  "overview.activeTree": "アクティブツリー",
  "overview.noActiveTree": "アクティブツリースペックなし",
  "overview.activeItemSet": "アクティブアイテムセット",
  "overview.noActiveItemSet": "アクティブアイテムセットなし",
  "overview.nextUpgrade": "次のアップグレード",
  "overview.reviewNotes": "インポートしたノートを確認",
  "overview.exactImport": "完全インポート",
  "overview.realPoB": "実際のPoB",
  "overview.treeSpecs": "ツリースペック",
  "overview.skillGroups": "スキルグループ",
  "overview.itemsInActiveSet": "アクティブセット内のアイテム",
  "overview.pobNotes": "PoBノート",
  "overview.formattedForReading": "読みやすい形式",
  "overview.buildNow": "現在のビルド",
  "overview.playstyle": "プレイスタイル",
  "overview.currentStage": "現在のステージ",
  "overview.warnings": "注意事項",
  "overview.beforePlaying": "プレイ前の確認",

  // ── Tree tab ──
  "tree.activeTree": "アクティブツリー",
  "tree.treeTimeline": "ツリータイムライン",
  "tree.noActiveTree": "アクティブツリーなし",
  "tree.activeInApp": "アプリ内でアクティブ",
  "tree.selectTree": "ツリーを選択",
  "tree.activeTreeInApp": "アプリ内のアクティブツリー",
  "tree.passiveTree": "パッシブツリー {{version}}",
  "tree.treeSpecImported": "ツリースペックはPoBから正確にインポートされました。",
  "tree.viewTree": "ツリーを見る",
  "tree.passiveMilestones": "パッシブマイルストーン",
  "tree.pointCount": "{{count}}ポイント",
  "tree.fullRoadmap": "全ロードマップ",
  "tree.progressionOrder": "進行順序",

  // ── Gems tab ──
  "gems.linksAndGems": "リンクとジェム",
  "gems.activeSkillSet": "アクティブスキルセット",
  "gems.linkCount": "{{count}}リンク",
  "gems.gemCount": "ジェム {{count}}個",
  "gems.primaryGem": "メインジェム",
  "gems.activeLink": "アクティブリンク",
  "gems.groupBench": "グループベンチ",

  // ── Gear tab ──
  "gear.exactGear": "PoBからの正確な装備",
  "gear.noItem": "アイテムなし",
  "gear.flasks": "フラスコ",
  "gear.importedFlask": "インポート済みフラスコ",
  "gear.swapAndExtra": "スワップと追加ソケット",
  "gear.imported": "インポート済み",
  "gear.uniqueHint": "ユニークヒント: {{suggestion}}",

  // ── Overlay panel ──
  "overlay.footerCopy": "Ctrl + Shift + M で次の目標を完了にする",
  "overlay.phase": "フェーズ",
  "overlay.nextUpgrade": "次のアップグレード",
  "overlay.reviewSnapshot": "PoBスナップショットを確認",
  "overlay.currentLevel": "現在のレベル",
  "overlay.levelHelpTree":
    "レベルアップ時、次のツリーは {{title}} になります。",
  "overlay.levelHelpStage":
    "ここでレベルを調整すると、オーバーレイのアクティブステージが更新されます。",
  "overlay.now": "現在",
  "overlay.next": "次",
  "overlay.checklistUpToDate": "チェックリストは最新です",
  "overlay.noPendingItems":
    "保留中の項目はありません。詳細を開いて、自分のペースでビルドを確認してください。",
  "overlay.complete": "完了",
  "overlay.noActivePoB": "アクティブなPoBがありません",
  "overlay.importPrompt":
    "メインウィンドウでPath of Buildingをインポートし、`Ctrl + Shift + O` を使用してください。",

  // ── Importer service ──
  "importer.desktopRequired":
    "正確なPath of Buildingインポートにはデスクトップアプリが必要です。",
  "importer.invalidXml": "Path of BuildingのXMLが無効です。",
  "importer.unknownClass": "不明なクラス",
  "importer.unknownAscendancy": "不明なアセンダンシー",
  "importer.importedGem": "インポート済みジェム",
  "importer.group": "グループ {{index}}",
  "importer.chooseBandit": "バンディットを選択: {{name}}",
  "importer.pantheonMajor": "パンテオン（メジャー）: {{name}}",
  "importer.pantheonMinor": "パンテオン（マイナー）: {{name}}",
  "importer.doLab": "{{name}} ラビリンスを攻略",
  "importer.followSetup": "セットアップ {{name}} に従う",
  "importer.followTree": "ツリー {{name}} に従う",
  "importer.checkImportedTree": "インポートしたPoBツリーを確認する",
  "importer.setupMainSkill": "メインスキル {{name}} をセットアップ",
  "importer.checkActiveSkillSet": "アクティブなPoBスキルセットを確認する",
  "importer.reviewGear": "セット {{name}} の装備を確認",
  "importer.checkImportedGear": "インポートしたPoB装備を確認する",
  "importer.openPobNotes":
    "正確なPoBノートを開いてフェーズを確認する",
  "importer.importedItem": "インポート済みアイテム",
  "importer.tagline":
    "PoBの完全インポート: ツリースペック {{treeSpecs}}件、スキルグループ {{skillGroups}}件、アイテム {{items}}件をスナップショットに保存。",
  "importer.mainSkillPlaystyle": "メインスキル: {{name}}",
  "importer.exactImport": "Path of Buildingの完全インポートです。",
  "importer.reviewGearSet": "セット {{name}} の装備を確認",
  "importer.reviewPobNotes": "PoBノートを確認してください。",
  "importer.snapshotImported": "スナップショットをインポートしました",
  "importer.snapshotSummary":
    "Path of Buildingの完全スナップショット{{mainSkill}}{{itemSet}}。",
  "importer.treeUrl": "ツリーURL: {{url}}",
  "importer.treeSpecImported":
    "ツリースペックはPoBから正確にインポートされました。",
  "importer.buildImported":
    "ビルドはPath of Buildingから正確にインポートされました。",
  "importer.snapshotGenerated":
    "インポートしたPath of Buildingから正確にスナップショットを生成しました。",
  "importer.ascendancyImported":
    "クラスとアセンダンシーはPoBから正確にインポートされました。",
  "importer.banditImported": "バンディットの選択はPoBからインポートされました。",
  "importer.pantheonImported":
    "パンテオン（メジャー/マイナー）はPoBからインポートされました。",
  "importer.activeSetImported":
    "アクティブセットはPoBからインポートされました。",

  // ── Electron main process ──
  "electron.setPoeFolder":
    "アセットを同期する前にPath of Exileフォルダを設定してください。",
  "electron.miningScriptNotFound":
    "ローカルマイニングスクリプトが見つかりません。",
  "electron.miningFailed": "ローカルアセットマイニングの実行に失敗しました。",
  "electron.invalidPobContent":
    "インポートされたコンテンツは有効なPath of Buildingではないようです。",
  "electron.emptyPobCode": "Path of Buildingコードが空です。",
  "electron.decodeFailed":
    "Path of Buildingコードをデコードできませんでした。",
  "electron.decompressFailed":
    "Path of Buildingコードを展開できませんでした。",
  "electron.invalidPastebinLink": "無効なPastebinリンクです。",
  "electron.emptyImport":
    "Path of Buildingのリンク、コード、またはファイルを入力してください。",
  "electron.downloadFailed":
    "Path of Buildingのダウンロードに失敗しました（{{status}}）。",
  "electron.trayOpen": "Exile Build PoEを開く",
  "electron.trayShowOverlay": "オーバーレイを表示",
  "electron.trayQuit": "終了",
  "electron.dialogTitle": "Exile Build PoEを終了",
  "electron.dialogMessage": "Exile Build PoEをどうしますか？",
  "electron.dialogDetail":
    "閉じるとアプリが終了し、グローバルショートカットが無効になります。最小化するとシステムトレイに格納され、オーバーレイは引き続きアクティブです。",
  "electron.dialogClose": "アプリを閉じる",
  "electron.dialogMinimize": "最小化",
  "electron.dialogCancel": "キャンセル",

  // ── Settings ──
  "settings.heading": "設定",
  "settings.hotkeys": "ホットキー",
  "settings.hotkeyOverlay": "オーバーレイを開く",
  "settings.hotkeyMark": "次をマーク",
  "settings.hotkeyLevel": "レベル調整",
  "settings.hotkeyNextTab": "次のタブ",
  "settings.hotkeyPrevTab": "前のタブ",
  "settings.hotkeyPin": "ピン留め切替",
  "settings.hotkeyPress": "キーを押してください...",
  "settings.hotkeyReset": "デフォルトに戻す",
  "settings.language": "言語",

  // ── Locale picker ──
  "locale.label": "言語",
};

export default ja;

/**
 * Lightweight i18n for the Electron main process.
 * Mirrors the renderer locale system but works without React.
 */

import fs from "node:fs";
import path from "node:path";
import { app } from "electron";

export type Locale =
  | "en"
  | "pt-BR"
  | "es"
  | "fr"
  | "de"
  | "ru"
  | "ko"
  | "zh-CN"
  | "ja"
  | "th";

const en: Record<string, string> = {
  "electron.setPoeFolder":
    "Set the Path of Exile folder before syncing assets.",
  "electron.miningScriptNotFound": "Local mining script not found.",
  "electron.miningFailed": "Failed to execute local asset mining.",
  "electron.invalidPobContent":
    "The imported content doesn't appear to be a valid Path of Building.",
  "electron.emptyPobCode": "The Path of Building code is empty.",
  "electron.decodeFailed":
    "Could not decode the Path of Building code.",
  "electron.decompressFailed":
    "Could not decompress the Path of Building code.",
  "electron.invalidPastebinLink": "Invalid Pastebin link.",
  "electron.emptyImport":
    "Enter a Path of Building link, code, or file.",
  "electron.downloadFailed":
    "Failed to download Path of Building ({{status}}).",
  "electron.networkTimeout":
    "The download timed out. Check your internet connection and try again, or paste the PoB code directly.",
  "electron.networkError":
    "Could not connect to the server. Check your internet connection, or paste the exported PoB code directly instead of a link.",
  "electron.trayOpen": "Open Exile Build PoE",
  "electron.trayShowOverlay": "Show overlay",
  "electron.trayQuit": "Quit",
  "electron.dialogTitle": "Exit Exile Build PoE",
  "electron.dialogMessage":
    "What do you want to do with Exile Build PoE?",
  "electron.dialogDetail":
    "Close shuts down the app and disables global shortcuts. Minimize hides the window to the system tray and keeps the overlay active.",
  "electron.dialogClose": "Close app",
  "electron.dialogMinimize": "Minimize",
  "electron.dialogCancel": "Cancel",
};

const ptBR: Record<string, string> = {
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
  "electron.networkTimeout":
    "O download expirou. Verifique sua conexão e tente novamente, ou cole o código do PoB diretamente.",
  "electron.networkError":
    "Não foi possível conectar ao servidor. Verifique sua conexão, ou cole o código exportado do PoB diretamente.",
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
};

const es: Record<string, string> = {
  "electron.setPoeFolder":
    "Configura la carpeta de Path of Exile antes de sincronizar assets.",
  "electron.miningScriptNotFound": "Script de minería local no encontrado.",
  "electron.miningFailed":
    "Error al ejecutar la minería local de assets.",
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
  "electron.networkTimeout":
    "La descarga expiró. Revisa tu conexión e intenta de nuevo, o pega el código de PoB directamente.",
  "electron.networkError":
    "No se pudo conectar al servidor. Revisa tu conexión, o pega el código exportado de PoB directamente.",
  "electron.trayOpen": "Abrir Exile Build PoE",
  "electron.trayShowOverlay": "Mostrar overlay",
  "electron.trayQuit": "Salir",
  "electron.dialogTitle": "Salir de Exile Build PoE",
  "electron.dialogMessage": "¿Qué quieres hacer con Exile Build PoE?",
  "electron.dialogDetail":
    "Cerrar apaga la app y desactiva los atajos globales. Minimizar oculta la ventana en la bandeja del sistema y mantiene el overlay activo.",
  "electron.dialogClose": "Cerrar app",
  "electron.dialogMinimize": "Minimizar",
  "electron.dialogCancel": "Cancelar",
};

const fr: Record<string, string> = {
  "electron.setPoeFolder":
    "Définis le dossier Path of Exile avant de synchroniser les assets.",
  "electron.miningScriptNotFound": "Script de mining local introuvable.",
  "electron.miningFailed":
    "Échec de l'exécution du mining d'assets local.",
  "electron.invalidPobContent":
    "Le contenu importé ne semble pas être un Path of Building valide.",
  "electron.emptyPobCode": "Le code Path of Building est vide.",
  "electron.decodeFailed":
    "Impossible de décoder le code Path of Building.",
  "electron.decompressFailed":
    "Impossible de décompresser le code Path of Building.",
  "electron.invalidPastebinLink": "Lien Pastebin invalide.",
  "electron.emptyImport":
    "Entre un lien, un code ou un fichier Path of Building.",
  "electron.downloadFailed":
    "Échec du téléchargement de Path of Building ({{status}}).",
  "electron.networkTimeout":
    "Le téléchargement a expiré. Vérifiez votre connexion et réessayez, ou collez le code PoB directement.",
  "electron.networkError":
    "Impossible de se connecter au serveur. Vérifiez votre connexion, ou collez le code PoB exporté directement.",
  "electron.trayOpen": "Ouvrir Exile Build PoE",
  "electron.trayShowOverlay": "Afficher l'overlay",
  "electron.trayQuit": "Quitter",
  "electron.dialogTitle": "Quitter Exile Build PoE",
  "electron.dialogMessage": "Que veux-tu faire avec Exile Build PoE ?",
  "electron.dialogDetail":
    "Fermer arrête l'application et désactive les raccourcis globaux. Minimiser masque la fenêtre dans la zone de notification et garde l'overlay actif.",
  "electron.dialogClose": "Fermer l'app",
  "electron.dialogMinimize": "Minimiser",
  "electron.dialogCancel": "Annuler",
};

const de: Record<string, string> = {
  "electron.setPoeFolder":
    "Setze den Path of Exile Ordner, bevor du Assets synchronisierst.",
  "electron.miningScriptNotFound": "Lokales Mining-Skript nicht gefunden.",
  "electron.miningFailed": "Lokales Asset-Mining fehlgeschlagen.",
  "electron.invalidPobContent":
    "Der importierte Inhalt scheint kein gültiger Path of Building zu sein.",
  "electron.emptyPobCode": "Der Path of Building Code ist leer.",
  "electron.decodeFailed":
    "Der Path of Building Code konnte nicht dekodiert werden.",
  "electron.decompressFailed":
    "Der Path of Building Code konnte nicht dekomprimiert werden.",
  "electron.invalidPastebinLink": "Ungültiger Pastebin-Link.",
  "electron.emptyImport":
    "Gib einen Path of Building Link, Code oder eine Datei ein.",
  "electron.downloadFailed":
    "Path of Building konnte nicht heruntergeladen werden ({{status}}).",
  "electron.networkTimeout":
    "Der Download ist abgelaufen. Prüfe deine Verbindung und versuche es erneut, oder füge den PoB-Code direkt ein.",
  "electron.networkError":
    "Verbindung zum Server fehlgeschlagen. Prüfe deine Verbindung, oder füge den exportierten PoB-Code direkt ein.",
  "electron.trayOpen": "Exile Build PoE öffnen",
  "electron.trayShowOverlay": "Overlay anzeigen",
  "electron.trayQuit": "Beenden",
  "electron.dialogTitle": "Exile Build PoE beenden",
  "electron.dialogMessage": "Was möchtest du mit Exile Build PoE tun?",
  "electron.dialogDetail":
    "Schließen beendet die App und deaktiviert globale Shortcuts. Minimieren versteckt das Fenster im System-Tray und hält das Overlay aktiv.",
  "electron.dialogClose": "App schließen",
  "electron.dialogMinimize": "Minimieren",
  "electron.dialogCancel": "Abbrechen",
};

const ru: Record<string, string> = {
  "electron.setPoeFolder":
    "Укажи папку Path of Exile перед синхронизацией ассетов.",
  "electron.miningScriptNotFound": "Локальный скрипт майнинга не найден.",
  "electron.miningFailed":
    "Не удалось выполнить локальный майнинг ассетов.",
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
  "electron.networkTimeout":
    "Время загрузки истекло. Проверьте подключение и попробуйте снова, или вставьте код PoB напрямую.",
  "electron.networkError":
    "Не удалось подключиться к серверу. Проверьте подключение, или вставьте экспортированный код PoB напрямую.",
  "electron.trayOpen": "Открыть Exile Build PoE",
  "electron.trayShowOverlay": "Показать оверлей",
  "electron.trayQuit": "Выход",
  "electron.dialogTitle": "Выход из Exile Build PoE",
  "electron.dialogMessage": "Что ты хочешь сделать с Exile Build PoE?",
  "electron.dialogDetail":
    "Закрытие завершает приложение и отключает глобальные хоткеи. Сворачивание прячет окно в трей и оставляет оверлей активным.",
  "electron.dialogClose": "Закрыть приложение",
  "electron.dialogMinimize": "Свернуть",
  "electron.dialogCancel": "Отмена",
};

const ko: Record<string, string> = {
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
  "electron.networkTimeout":
    "다운로드 시간이 초과되었습니다. 인터넷 연결을 확인하고 다시 시도하거나, PoB 코드를 직접 붙여넣으세요.",
  "electron.networkError":
    "서버에 연결할 수 없습니다. 인터넷 연결을 확인하거나, 내보낸 PoB 코드를 직접 붙여넣으세요.",
  "electron.trayOpen": "Exile Build PoE 열기",
  "electron.trayShowOverlay": "오버레이 표시",
  "electron.trayQuit": "종료",
  "electron.dialogTitle": "Exile Build PoE 종료",
  "electron.dialogMessage": "Exile Build PoE를 어떻게 할까요?",
  "electron.dialogDetail":
    "닫기는 앱을 종료하고 글로벌 단축키를 비활성화해요. 최소화는 시스템 트레이로 숨기고 오버레이를 활성 상태로 유지해요.",
  "electron.dialogClose": "앱 닫기",
  "electron.dialogMinimize": "최소화",
  "electron.dialogCancel": "취소",
};

const zhCN: Record<string, string> = {
  "electron.setPoeFolder": "同步资源前请先设置流放之路文件夹。",
  "electron.miningScriptNotFound": "未找到本地挖掘脚本。",
  "electron.miningFailed": "执行本地资源挖掘失败。",
  "electron.invalidPobContent":
    "导入的内容似乎不是有效的 Path of Building。",
  "electron.emptyPobCode": "Path of Building 代码为空。",
  "electron.decodeFailed": "无法解码 Path of Building 代码。",
  "electron.decompressFailed": "无法解压 Path of Building 代码。",
  "electron.invalidPastebinLink": "无效的 Pastebin 链接。",
  "electron.emptyImport":
    "请输入 Path of Building 链接、代码或文件。",
  "electron.downloadFailed":
    "下载 Path of Building 失败 ({{status}})。",
  "electron.networkTimeout":
    "下载超时。请检查网络连接后重试，或直接粘贴 PoB 代码。",
  "electron.networkError":
    "无法连接到服务器。请检查网络连接，或直接粘贴导出的 PoB 代码。",
  "electron.trayOpen": "打开 Exile Build PoE",
  "electron.trayShowOverlay": "显示悬浮窗",
  "electron.trayQuit": "退出",
  "electron.dialogTitle": "退出 Exile Build PoE",
  "electron.dialogMessage": "你想对 Exile Build PoE 做什么？",
  "electron.dialogDetail":
    "关闭将退出应用并禁用全局快捷键。最小化将隐藏窗口到系统托盘并保持悬浮窗活跃。",
  "electron.dialogClose": "关闭应用",
  "electron.dialogMinimize": "最小化",
  "electron.dialogCancel": "取消",
};

const ja: Record<string, string> = {
  "electron.setPoeFolder":
    "アセットを同期する前にPath of Exileフォルダを設定してください。",
  "electron.miningScriptNotFound":
    "ローカルマイニングスクリプトが見つかりません。",
  "electron.miningFailed":
    "ローカルアセットマイニングの実行に失敗しました。",
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
  "electron.networkTimeout":
    "ダウンロードがタイムアウトしました。接続を確認して再試行するか、PoBコードを直接貼り付けてください。",
  "electron.networkError":
    "サーバーに接続できません。接続を確認するか、エクスポートしたPoBコードを直接貼り付けてください。",
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
};

const th: Record<string, string> = {
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
  "electron.networkTimeout":
    "การดาวน์โหลดหมดเวลา ตรวจสอบการเชื่อมต่อแล้วลองใหม่ หรือวางโค้ด PoB โดยตรง",
  "electron.networkError":
    "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ ตรวจสอบการเชื่อมต่อ หรือวางโค้ด PoB ที่ส่งออกมาโดยตรง",
  "electron.trayOpen": "เปิด Exile Build PoE",
  "electron.trayShowOverlay": "แสดงโอเวอร์เลย์",
  "electron.trayQuit": "ออก",
  "electron.dialogTitle": "ออกจาก Exile Build PoE",
  "electron.dialogMessage": "ต้องการทำอะไรกับ Exile Build PoE?",
  "electron.dialogDetail":
    "ปิดจะหยุดแอปและปิดปุ่มลัดทั้งหมด ย่อจะซ่อนหน้าต่างไปที่ถาดระบบและโอเวอร์เลย์ยังทำงานต่อ",
  "electron.dialogClose": "ปิดแอป",
  "electron.dialogMinimize": "ย่อ",
  "electron.dialogCancel": "ยกเลิก",
};

const translations: Record<Locale, Record<string, string>> = {
  en,
  "pt-BR": ptBR,
  es,
  fr,
  de,
  ru,
  ko,
  "zh-CN": zhCN,
  ja,
  th,
};

let currentLocale: Locale = "en";

function localeFilePath() {
  return path.join(app.getPath("userData"), "locale.json");
}

export function loadLocale(): Locale {
  try {
    const data = JSON.parse(fs.readFileSync(localeFilePath(), "utf8")) as { locale?: string };
    if (data.locale && data.locale in translations) {
      currentLocale = data.locale as Locale;
    }
  } catch {
    // File doesn't exist yet — use default
  }
  return currentLocale;
}

export function saveLocale(locale: Locale) {
  currentLocale = locale;
  try {
    fs.mkdirSync(path.dirname(localeFilePath()), { recursive: true });
    fs.writeFileSync(localeFilePath(), JSON.stringify({ locale }), "utf8");
  } catch {
    // ignore
  }
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: string, params?: Record<string, string | number>): string {
  const template = translations[currentLocale]?.[key] ?? translations.en[key] ?? key;

  if (!params) {
    return template;
  }

  return template.replace(
    /\{\{(\w+)\}\}/g,
    (_, paramKey: string) => String(params[paramKey] ?? `{{${paramKey}}}`),
  );
}

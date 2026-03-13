import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { gunzipSync, inflateRawSync, inflateSync } from "node:zlib";
import { app, BrowserWindow, dialog, globalShortcut, ipcMain, Menu, nativeImage, screen, shell, Tray } from "electron";
import type { Rectangle } from "electron";
import { autoUpdater } from "electron-updater";
import { loadLocale, saveLocale, t } from "./i18n";
import type { Locale } from "./i18n";

type ShortcutName =
  | "next-tab"
  | "prev-tab"
  | "mark-objective"
  | "toggle-pin"
  | "adjust-level";

type ImportSourceType = "link" | "code" | "file";

interface PersistedWindowState {
  mainBounds?: Rectangle;
  overlayBounds?: Rectangle;
}

type PoeAssetStatus =
  | "idle"
  | "ready"
  | "missing-install"
  | "missing-extractor"
  | "syncing"
  | "error";

interface PoeAssetsState {
  installPath?: string;
  extractorPath?: string;
  cacheDir?: string;
  extractorName?: string;
  manifestPath?: string;
  status: PoeAssetStatus;
  lastSyncAt?: string;
  lastError?: string;
}

let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let appTray: Tray | null = null;
let isAdjustingOverlayBounds = false;
let isQuitting = false;
let poeAssetsSyncPromise: Promise<PoeAssetsState> | null = null;

const devServerUrl = process.env.VITE_DEV_SERVER_URL ?? "http://127.0.0.1:5173";

function stateFilePath() {
  return path.join(app.getPath("userData"), "window-state.json");
}

function poeAssetsStateFilePath() {
  return path.join(app.getPath("userData"), "poe-assets-state.json");
}

function poeAssetsCacheDirPath() {
  return path.join(app.getPath("userData"), "poe-assets-cache");
}

function poeAssetsManifestPath() {
  return path.join(poeAssetsCacheDirPath(), "manifest.json");
}

function readWindowState(): PersistedWindowState {
  try {
    return JSON.parse(fs.readFileSync(stateFilePath(), "utf8")) as PersistedWindowState;
  } catch {
    return {};
  }
}

function writeWindowState(partial: PersistedWindowState) {
  const nextState = {
    ...readWindowState(),
    ...partial,
  };

  fs.mkdirSync(path.dirname(stateFilePath()), { recursive: true });
  fs.writeFileSync(stateFilePath(), JSON.stringify(nextState, null, 2), "utf8");
}

function defaultPoeAssetsState(): PoeAssetsState {
  return {
    cacheDir: poeAssetsCacheDirPath(),
    manifestPath: poeAssetsManifestPath(),
    status: "idle",
  };
}

function readPoeAssetsState(): PoeAssetsState {
  try {
    return {
      ...defaultPoeAssetsState(),
      ...(JSON.parse(fs.readFileSync(poeAssetsStateFilePath(), "utf8")) as Partial<PoeAssetsState>),
    };
  } catch {
    return defaultPoeAssetsState();
  }
}

function writePoeAssetsState(partial: Partial<PoeAssetsState>) {
  const nextState = {
    ...readPoeAssetsState(),
    ...partial,
    cacheDir: poeAssetsCacheDirPath(),
    manifestPath: poeAssetsManifestPath(),
  };

  fs.mkdirSync(path.dirname(poeAssetsStateFilePath()), { recursive: true });
  fs.mkdirSync(poeAssetsCacheDirPath(), { recursive: true });
  fs.writeFileSync(poeAssetsStateFilePath(), JSON.stringify(nextState, null, 2), "utf8");
  return nextState;
}

function looksLikePoeInstallDirectory(candidatePath: string) {
  if (!candidatePath) {
    return false;
  }

  const expectedEntries = [
    "PathOfExile.exe",
    "PathOfExileSteam.exe",
    "Content.ggpk",
    path.join("Bundles2", "_.index.bin"),
    path.join("Bundles2", "Index.bin"),
  ];

  return expectedEntries.some((entry) => fs.existsSync(path.join(candidatePath, entry)));
}

function candidatePoeInstallPaths() {
  const programFiles = process.env["ProgramFiles"] ?? "C:\\Program Files";
  const programFilesX86 = process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)";
  const localAppData = process.env.LOCALAPPDATA ?? "";

  return [
    path.join(programFilesX86, "Grinding Gear Games", "Path of Exile"),
    path.join(programFiles, "Grinding Gear Games", "Path of Exile"),
    path.join(programFilesX86, "Steam", "steamapps", "common", "Path of Exile"),
    path.join(programFiles, "Steam", "steamapps", "common", "Path of Exile"),
    localAppData ? path.join(localAppData, "Programs", "Path of Exile") : "",
  ].filter(Boolean);
}

function detectPoeInstallPath() {
  if (process.platform !== "win32") {
    return undefined;
  }

  return candidatePoeInstallPaths().find((candidatePath) =>
    looksLikePoeInstallDirectory(candidatePath),
  );
}

function ensurePoeAssetsState() {
  const currentState = readPoeAssetsState();

  if (currentState.installPath && looksLikePoeInstallDirectory(currentState.installPath)) {
    return currentState;
  }

  const detectedInstallPath = detectPoeInstallPath();

  if (!detectedInstallPath) {
    return currentState;
  }

  return writePoeAssetsState({
    installPath: detectedInstallPath,
    status: currentState.status === "idle" ? "missing-extractor" : currentState.status,
  });
}

function hasReadyPoeAssetManifest(state: PoeAssetsState) {
  return Boolean(state.manifestPath && fs.existsSync(state.manifestPath));
}

function shouldAutoSyncPoeAssets(state: PoeAssetsState) {
  if (!state.installPath || !looksLikePoeInstallDirectory(state.installPath)) {
    return false;
  }

  if (state.status === "syncing") {
    return false;
  }

  if (state.status === "ready" && hasReadyPoeAssetManifest(state)) {
    return false;
  }

  return true;
}

function miningScriptPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "scripts", "mine_poe_assets.py");
  }

  return path.join(app.getAppPath(), "scripts", "mine_poe_assets.py");
}

function getPythonCommand() {
  if (process.platform === "win32") {
    return {
      command: "py",
      args: ["-3"],
    };
  }

  return {
    command: "python3",
    args: [],
  };
}

async function runPoeAssetMining(state: PoeAssetsState) {
  if (!state.installPath || !looksLikePoeInstallDirectory(state.installPath)) {
    return writePoeAssetsState({
      status: "missing-install",
      lastError: t("electron.setPoeFolder"),
    });
  }

  const scriptPath = miningScriptPath();

  if (!fs.existsSync(scriptPath)) {
    return writePoeAssetsState({
      status: "error",
      lastError: t("electron.miningScriptNotFound"),
    });
  }

  const syncingState = writePoeAssetsState({
    installPath: state.installPath,
    extractorPath: state.extractorPath,
    status: "syncing",
    lastError: undefined,
  });

  const python = getPythonCommand();
  const args = [
    ...python.args,
    scriptPath,
    "--poe-dir",
    syncingState.installPath!,
    "--out-dir",
    poeAssetsCacheDirPath(),
  ];

  if (syncingState.extractorPath) {
    args.push("--lib-path", syncingState.extractorPath);
  }

  return await new Promise<PoeAssetsState>((resolve) => {
    execFile(
      python.command,
      args,
      {
        cwd: app.getAppPath(),
        env: process.env,
        maxBuffer: 8 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        const output = `${stdout}`.trim() || `${stderr}`.trim();
        let result: Partial<PoeAssetsState> = {};

        try {
          result = output ? (JSON.parse(output) as Partial<PoeAssetsState>) : {};
        } catch {
          result = {
            status: "error",
            lastError: output || error?.message || t("electron.miningFailed"),
          };
        }

        if (error && !result.status) {
          result.status = "error";
          result.lastError = output || error.message;
        }

        const nextState = writePoeAssetsState({
          installPath: syncingState.installPath,
          extractorPath: syncingState.extractorPath,
          status: result.status ?? "error",
          extractorName: result.extractorName,
          lastSyncAt: result.status === "ready" ? new Date().toISOString() : syncingState.lastSyncAt,
          lastError: result.lastError,
        });

        resolve(nextState);
      },
    );
  });
}

function queueAutomaticPoeAssetSync(force = false) {
  const state = ensurePoeAssetsState();

  if (!force && !shouldAutoSyncPoeAssets(state)) {
    return poeAssetsSyncPromise ?? Promise.resolve(state);
  }

  if (poeAssetsSyncPromise) {
    return poeAssetsSyncPromise;
  }

  poeAssetsSyncPromise = runPoeAssetMining(state).finally(() => {
    poeAssetsSyncPromise = null;
  });

  return poeAssetsSyncPromise;
}

function loadRendererWindow(window: BrowserWindow, hash = "") {
  if (!app.isPackaged) {
    const url = hash ? `${devServerUrl}/#${hash}` : devServerUrl;
    void window.loadURL(url);
    return;
  }

  const indexPath = path.join(__dirname, "../dist/index.html");
  void window.loadFile(indexPath, { hash });
}

function trayIconPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "tray-icon.ico");
  }

  return path.join(app.getAppPath(), "build/icon.ico");
}

function isExternalHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function attachExternalLinkHandlers(window: BrowserWindow) {
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternalHttpUrl(url)) {
      void shell.openExternal(url);
    }

    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    if (!isExternalHttpUrl(url)) {
      return;
    }

    event.preventDefault();
    void shell.openExternal(url);
  });
}

function isPobXml(value: string) {
  return /<PathOfBuilding[\s>]/i.test(value) || /<Build[\s>]/i.test(value);
}

function assertPobXml(value: string) {
  const normalized = value.trim();

  if (!isPobXml(normalized)) {
    throw new Error(t("electron.invalidPobContent"));
  }

  return normalized;
}

function decodePobCodeToXml(code: string) {
  const cleaned = code.replace(/\s+/g, "").trim();

  if (!cleaned) {
    throw new Error(t("electron.emptyPobCode"));
  }

  const normalizedBase64 = cleaned.replace(/-/g, "+").replace(/_/g, "/");
  const paddedBase64 = normalizedBase64.padEnd(
    normalizedBase64.length + ((4 - (normalizedBase64.length % 4)) % 4),
    "=",
  );
  const compressed = Buffer.from(paddedBase64, "base64");

  if (compressed.length === 0) {
    throw new Error(t("electron.decodeFailed"));
  }

  const attempts = [inflateRawSync, inflateSync, gunzipSync];

  for (const inflate of attempts) {
    try {
      const xml = inflate(compressed).toString("utf8");

      if (isPobXml(xml)) {
        return xml;
      }
    } catch {
      continue;
    }
  }

  throw new Error(t("electron.decompressFailed"));
}

function normalizePobLink(rawLink: string) {
  const trimmed = rawLink.trim();
  const normalizedInput = /^[a-z]+:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(normalizedInput);
  const hostname = url.hostname.toLowerCase();

  if (hostname === "pobb.in" || hostname === "www.pobb.in") {
    const pathParts = url.pathname.split("/").filter(Boolean);

    if (pathParts.at(-1) !== "raw") {
      pathParts.push("raw");
    }

    url.pathname = `/${pathParts.join("/")}`;
    url.search = "";
    url.hash = "";
    return url.toString();
  }

  if (hostname === "pastebin.com" || hostname === "www.pastebin.com") {
    const pasteId = url.pathname.split("/").filter(Boolean).at(-1);

    if (!pasteId) {
      throw new Error(t("electron.invalidPastebinLink"));
    }

    return `https://pastebin.com/raw/${pasteId}`;
  }

  return url.toString();
}

async function resolvePobSource(sourceType: ImportSourceType, sourceValue: string) {
  const trimmed = sourceValue.trim();

  if (!trimmed) {
    throw new Error(t("electron.emptyImport"));
  }

  if (sourceType === "file") {
    return assertPobXml(trimmed);
  }

  if (sourceType === "code") {
    return isPobXml(trimmed) ? assertPobXml(trimmed) : decodePobCodeToXml(trimmed);
  }

  const response = await fetch(normalizePobLink(trimmed), { redirect: "follow" });

  if (!response.ok) {
    throw new Error(t("electron.downloadFailed", { status: response.status }));
  }

  const downloaded = (await response.text()).trim();

  return isPobXml(downloaded)
    ? assertPobXml(downloaded)
    : decodePobCodeToXml(downloaded);
}

function saveBounds(key: "mainBounds" | "overlayBounds", window: BrowserWindow) {
  if (window.isDestroyed()) {
    return;
  }

  const bounds =
    key === "overlayBounds"
      ? normalizeOverlayBounds(window.getBounds())
      : window.getBounds();

  if (key === "mainBounds") {
    writeWindowState({ mainBounds: bounds });
    return;
  }

  writeWindowState({ overlayBounds: bounds });
}

function getPrimaryWorkArea() {
  return screen.getPrimaryDisplay();
}

interface OverlaySizeHint {
  width?: number;
  height?: number;
}

function getPrimaryWorkAreaBounds() {
  return getPrimaryWorkArea().workArea;
}

function clampBoundsToPrimaryDisplay(bounds: Rectangle): Rectangle {
  const { x, y, width, height } = getPrimaryWorkAreaBounds();
  const minimumWidth = Math.min(430, width);
  const minimumHeight = Math.min(500, height);
  const clampedWidth = Math.min(Math.max(bounds.width, minimumWidth), width);
  const clampedHeight = Math.min(Math.max(bounds.height, minimumHeight), height);

  return {
    width: clampedWidth,
    height: clampedHeight,
    x: Math.min(Math.max(bounds.x, x), x + width - clampedWidth),
    y: Math.min(Math.max(bounds.y, y), y + height - clampedHeight),
  };
}

function areBoundsEqual(left: Rectangle, right: Rectangle) {
  return (
    left.x === right.x &&
    left.y === right.y &&
    left.width === right.width &&
    left.height === right.height
  );
}

function isBoundsInsideArea(bounds: Rectangle, area: Rectangle) {
  return (
    bounds.x >= area.x &&
    bounds.y >= area.y &&
    bounds.x + bounds.width <= area.x + area.width &&
    bounds.y + bounds.height <= area.y + area.height
  );
}

function getRectIntersectionArea(left: Rectangle, right: Rectangle) {
  const overlapWidth = Math.max(
    0,
    Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x),
  );
  const overlapHeight = Math.max(
    0,
    Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y),
  );

  return overlapWidth * overlapHeight;
}

function normalizeOverlayBounds(bounds: Rectangle) {
  const primaryDisplay = getPrimaryWorkArea();
  const primaryBounds = primaryDisplay.workArea;
  const clampedBounds = clampBoundsToPrimaryDisplay(bounds);

  if (isBoundsInsideArea(bounds, primaryBounds)) {
    return clampedBounds;
  }

  const matchingDisplay = screen.getDisplayMatching(bounds);
  const overlapWithPrimary = getRectIntersectionArea(bounds, primaryBounds);

  if (matchingDisplay.id === primaryDisplay.id && overlapWithPrimary > 0) {
    return clampedBounds;
  }

  return getCenteredOverlayBounds({
    width: clampedBounds.width,
    height: clampedBounds.height,
  });
}

function getCenteredOverlayBounds(size?: OverlaySizeHint): Rectangle {
  const { x, y, width, height } = getPrimaryWorkAreaBounds();
  const overlayWidth = size?.width ?? 450;
  const overlayHeight = size?.height ?? 540;

  return clampBoundsToPrimaryDisplay({
    width: overlayWidth,
    height: overlayHeight,
    x: Math.round(x + (width - overlayWidth) / 2),
    y: Math.round(y + (height - overlayHeight) / 2),
  });
}

function getInitialOverlayBounds(persisted: PersistedWindowState) {
  const persistedOverlayBounds = persisted.overlayBounds;
  const overlaySizeHint: OverlaySizeHint = {
    width: persistedOverlayBounds?.width,
    height: persistedOverlayBounds?.height,
  };

  if (persistedOverlayBounds) {
    return normalizeOverlayBounds(persistedOverlayBounds);
  }

  return getCenteredOverlayBounds(overlaySizeHint);
}

function setOverlayBounds(nextBounds: Rectangle) {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    return;
  }

  const normalizedBounds = normalizeOverlayBounds(nextBounds);
  const currentBounds = overlayWindow.getBounds();

  if (areBoundsEqual(currentBounds, normalizedBounds)) {
    return;
  }

  isAdjustingOverlayBounds = true;
  overlayWindow.setBounds(normalizedBounds);
  isAdjustingOverlayBounds = false;
}

function recenterOverlayWindow() {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    return;
  }

  const currentBounds = overlayWindow.getBounds();

  setOverlayBounds(
    getCenteredOverlayBounds({
      width: currentBounds.width,
      height: currentBounds.height,
    }),
  );
}

function ensureOverlayWindowPosition() {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    return;
  }

  setOverlayBounds(normalizeOverlayBounds(overlayWindow.getBounds()));
}

function promoteOverlayWindow() {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    return;
  }

  overlayWindow.setIgnoreMouseEvents(false);

  if (process.platform === "win32") {
    overlayWindow.setAlwaysOnTop(true, "screen-saver", 1);
    overlayWindow.setFullScreenable(false);
    overlayWindow.moveTop();
    return;
  }

  overlayWindow.setAlwaysOnTop(true, "floating");
}

function shutdownApplication() {
  if (isQuitting) {
    return;
  }

  isQuitting = true;
  globalShortcut.unregisterAll();

  if (appTray) {
    appTray.destroy();
    appTray = null;
  }

  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.destroy();
  }

  app.quit();
}

function restoreMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.setSkipTaskbar(false);
  mainWindow.show();

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  mainWindow.focus();
}

function minimizeMainWindowToTray() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.setSkipTaskbar(true);
  mainWindow.hide();
}

function createTray() {
  if (appTray) {
    return;
  }

  const icon = nativeImage.createFromPath(trayIconPath());

  appTray = new Tray(icon);
  appTray.setToolTip("Exile Build PoE");
  appTray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: t("electron.trayOpen"),
        click: () => {
          restoreMainWindow();
        },
      },
      {
        label: t("electron.trayShowOverlay"),
        click: () => {
          if (!overlayWindow || overlayWindow.isDestroyed()) {
            return;
          }

          ensureOverlayWindowPosition();
          promoteOverlayWindow();
          overlayWindow.showInactive();
        },
      },
      { type: "separator" },
      {
        label: t("electron.trayQuit"),
        click: () => {
          shutdownApplication();
        },
      },
    ]),
  );

  appTray.on("click", () => {
    restoreMainWindow();
  });
}

function rebuildTrayMenu() {
  if (!appTray) {
    return;
  }

  appTray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: t("electron.trayOpen"),
        click: () => {
          restoreMainWindow();
        },
      },
      {
        label: t("electron.trayShowOverlay"),
        click: () => {
          if (!overlayWindow || overlayWindow.isDestroyed()) {
            return;
          }

          ensureOverlayWindowPosition();
          promoteOverlayWindow();
          overlayWindow.showInactive();
        },
      },
      { type: "separator" },
      {
        label: t("electron.trayQuit"),
        click: () => {
          shutdownApplication();
        },
      },
    ]),
  );
}

function createMainWindow() {
  const persisted = readWindowState();

  mainWindow = new BrowserWindow({
    width: persisted.mainBounds?.width ?? 1460,
    height: persisted.mainBounds?.height ?? 920,
    x: persisted.mainBounds?.x,
    y: persisted.mainBounds?.y,
    minWidth: 1180,
    minHeight: 780,
    backgroundColor: "#14110f",
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  attachExternalLinkHandlers(mainWindow);
  loadRendererWindow(mainWindow);

  mainWindow.on("close", (event) => {
    if (mainWindow) {
      saveBounds("mainBounds", mainWindow);
    }

    if (isQuitting || process.platform === "darwin" || !mainWindow) {
      return;
    }

    event.preventDefault();

    const action = dialog.showMessageBoxSync(mainWindow, {
      type: "question",
      buttons: [t("electron.dialogClose"), t("electron.dialogMinimize"), t("electron.dialogCancel")],
      defaultId: 1,
      cancelId: 2,
      noLink: true,
      title: t("electron.dialogTitle"),
      message: t("electron.dialogMessage"),
      detail: t("electron.dialogDetail"),
    });

    if (action === 0) {
      shutdownApplication();
      return;
    }

    if (action === 1) {
      minimizeMainWindowToTray();
    }
  });

  mainWindow.on("minimize", (event: Electron.Event) => {
    if (process.platform !== "win32" || isQuitting) {
      return;
    }

    event.preventDefault();
    minimizeMainWindowToTray();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;

    if (process.platform !== "darwin") {
      shutdownApplication();
    }
  });

  mainWindow.on("move", () => {
    if (mainWindow) {
      saveBounds("mainBounds", mainWindow);
    }
  });

  mainWindow.on("resize", () => {
    if (mainWindow) {
      saveBounds("mainBounds", mainWindow);
    }
  });
}

function createOverlayWindow() {
  const persisted = readWindowState();
  const initialBounds = getInitialOverlayBounds(persisted);

  overlayWindow = new BrowserWindow({
    width: initialBounds.width,
    height: initialBounds.height,
    x: initialBounds.x,
    y: initialBounds.y,
    show: false,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    fullscreenable: false,
    backgroundColor: "#00000000",
    title: "Exile Build PoE Overlay",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  overlayWindow.setMinimumSize(430, 500);

  attachExternalLinkHandlers(overlayWindow);
  loadRendererWindow(overlayWindow, "/overlay");
  promoteOverlayWindow();

  overlayWindow.on("show", () => {
    promoteOverlayWindow();
    setTimeout(promoteOverlayWindow, 120);
  });

  overlayWindow.on("close", () => {
    if (overlayWindow) {
      saveBounds("overlayBounds", overlayWindow);
    }
  });

  overlayWindow.on("closed", () => {
    overlayWindow = null;
  });

  overlayWindow.on("move", () => {
    if (overlayWindow && !isAdjustingOverlayBounds) {
      ensureOverlayWindowPosition();
      saveBounds("overlayBounds", overlayWindow);
    }
  });

  overlayWindow.on("resize", () => {
    if (overlayWindow && !isAdjustingOverlayBounds) {
      ensureOverlayWindowPosition();
      saveBounds("overlayBounds", overlayWindow);
    }
  });
}

function emitShortcut(shortcut: ShortcutName) {
  for (const target of [mainWindow, overlayWindow]) {
    if (target && !target.isDestroyed()) {
      target.webContents.send("shortcut", shortcut);
    }
  }
}

function toggleOverlayVisibility() {
  if (!overlayWindow) {
    return;
  }

  if (overlayWindow.isVisible()) {
    overlayWindow.hide();
    return;
  }

  ensureOverlayWindowPosition();
  promoteOverlayWindow();
  overlayWindow.showInactive();
  promoteOverlayWindow();
}

/* ── Auto-updater ── */

function setupAutoUpdater() {
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("update-available", (info) => {
    const version = info.version;
    for (const win of [mainWindow, overlayWindow]) {
      if (win && !win.isDestroyed()) {
        win.webContents.send("updater:update-available", version);
      }
    }
  });

  autoUpdater.on("download-progress", (progress) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("updater:download-progress", Math.round(progress.percent));
    }
  });

  autoUpdater.on("update-downloaded", () => {
    for (const win of [mainWindow, overlayWindow]) {
      if (win && !win.isDestroyed()) {
        win.webContents.send("updater:update-downloaded");
      }
    }
  });

  autoUpdater.on("error", (err) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("updater:error", err.message);
    }
  });

  // Check for updates after a short delay so the window is ready
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {});
  }, 5_000);
}

function registerShortcuts() {
  const bindings: Array<[string, ShortcutName | "toggle-overlay"]> = [
    ["CommandOrControl+Shift+O", "toggle-overlay"],
    ["CommandOrControl+Shift+]", "next-tab"],
    ["CommandOrControl+Shift+[", "prev-tab"],
    ["CommandOrControl+Shift+M", "mark-objective"],
    ["CommandOrControl+Shift+P", "toggle-pin"],
    ["CommandOrControl+Shift+L", "adjust-level"],
  ];

  for (const [accelerator, action] of bindings) {
    globalShortcut.register(accelerator, () => {
      if (action === "toggle-overlay") {
        toggleOverlayVisibility();
        return;
      }

      emitShortcut(action);
    });
  }
}

app.whenReady().then(() => {
  loadLocale();
  createMainWindow();
  createOverlayWindow();
  createTray();
  registerShortcuts();
  ensurePoeAssetsState();
  void queueAutomaticPoeAssetSync();
  setupAutoUpdater();

  screen.on("display-added", ensureOverlayWindowPosition);
  screen.on("display-removed", ensureOverlayWindowPosition);
  screen.on("display-metrics-changed", ensureOverlayWindowPosition);

  ipcMain.handle("app:toggle-overlay", async () => {
    toggleOverlayVisibility();
  });

  ipcMain.handle("overlay:reset-position", async () => {
    recenterOverlayWindow();
  });

  ipcMain.handle("pob:resolve-source", async (_event, sourceType: ImportSourceType, sourceValue: string) => {
    return resolvePobSource(sourceType, sourceValue);
  });

  ipcMain.handle("app:set-locale", async (_event, locale: string) => {
    if (locale === "en" || locale === "pt-BR") {
      saveLocale(locale as Locale);
      rebuildTrayMenu();
    }
  });

  ipcMain.handle("updater:check", async () => {
    return autoUpdater.checkForUpdates().catch(() => null);
  });

  ipcMain.handle("updater:download", async () => {
    return autoUpdater.downloadUpdate().catch(() => null);
  });

  ipcMain.handle("updater:install", async () => {
    autoUpdater.quitAndInstall(false, true);
  });

  ipcMain.handle("updater:get-version", async () => {
    return app.getVersion();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
      createOverlayWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    shutdownApplication();
  }
});

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

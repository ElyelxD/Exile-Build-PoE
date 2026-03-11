import fs from "node:fs";
import path from "node:path";
import { app, BrowserWindow, globalShortcut, ipcMain, screen } from "electron";
import type { Rectangle } from "electron";

type ShortcutName =
  | "next-tab"
  | "prev-tab"
  | "mark-objective"
  | "toggle-pin"
  | "adjust-level";

interface PersistedWindowState {
  mainBounds?: Rectangle;
  overlayBounds?: Rectangle;
}

let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let isAdjustingOverlayBounds = false;

const devServerUrl = process.env.VITE_DEV_SERVER_URL ?? "http://127.0.0.1:5173";

function stateFilePath() {
  return path.join(app.getPath("userData"), "window-state.json");
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

function loadRendererWindow(window: BrowserWindow, hash = "") {
  if (!app.isPackaged) {
    const url = hash ? `${devServerUrl}/#${hash}` : devServerUrl;
    void window.loadURL(url);
    return;
  }

  const indexPath = path.join(__dirname, "../dist/index.html");
  void window.loadFile(indexPath, { hash });
}

function saveBounds(key: "mainBounds" | "overlayBounds", window: BrowserWindow) {
  if (window.isDestroyed()) {
    return;
  }

  const bounds = window.getBounds();

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

function clampBoundsToPrimaryDisplay(bounds: Rectangle): Rectangle {
  const { x, y, width, height } = getPrimaryWorkArea().workArea;
  const clampedWidth = Math.min(bounds.width, width);
  const clampedHeight = Math.min(bounds.height, height);

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

function getCenteredOverlayBounds(size?: OverlaySizeHint): Rectangle {
  const { x, y, width, height } = getPrimaryWorkArea().workArea;
  const overlayWidth = size?.width ?? 450;
  const overlayHeight = size?.height ?? 360;

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
    return clampBoundsToPrimaryDisplay(persistedOverlayBounds);
  }

  return getCenteredOverlayBounds(overlaySizeHint);
}

function setOverlayBounds(nextBounds: Rectangle) {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    return;
  }

  const currentBounds = overlayWindow.getBounds();

  if (areBoundsEqual(currentBounds, nextBounds)) {
    return;
  }

  isAdjustingOverlayBounds = true;
  overlayWindow.setBounds(nextBounds);
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

  setOverlayBounds(clampBoundsToPrimaryDisplay(overlayWindow.getBounds()));
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

  loadRendererWindow(mainWindow);

  mainWindow.on("close", () => {
    if (mainWindow) {
      saveBounds("mainBounds", mainWindow);
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
    backgroundColor: "#00000000",
    title: "Overlay PoE Build Overlay",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  loadRendererWindow(overlayWindow, "/overlay");

  overlayWindow.on("close", () => {
    if (overlayWindow) {
      saveBounds("overlayBounds", overlayWindow);
    }
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
  overlayWindow.showInactive();
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
  createMainWindow();
  createOverlayWindow();
  registerShortcuts();

  screen.on("display-added", ensureOverlayWindowPosition);
  screen.on("display-removed", ensureOverlayWindowPosition);
  screen.on("display-metrics-changed", ensureOverlayWindowPosition);

  ipcMain.handle("app:toggle-overlay", async () => {
    toggleOverlayVisibility();
  });

  ipcMain.handle("overlay:set-click-through", async (_event, enabled: boolean) => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.setIgnoreMouseEvents(enabled, { forward: true });
    }

    return enabled;
  });

  ipcMain.handle("overlay:reset-position", async () => {
    recenterOverlayWindow();
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
    app.quit();
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

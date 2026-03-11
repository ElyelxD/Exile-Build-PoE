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

function isBoundsVisible(bounds: Rectangle) {
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  return screen.getAllDisplays().some((display) => {
    const { x, y, width, height } = display.workArea;

    return (
      centerX >= x &&
      centerX <= x + width &&
      centerY >= y &&
      centerY <= y + height
    );
  });
}

function getOverlayAnchorDisplay() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return screen.getDisplayMatching(mainWindow.getBounds());
  }

  return screen.getPrimaryDisplay();
}

interface OverlaySizeHint {
  width?: number;
  height?: number;
}

function getCenteredOverlayBounds(size?: OverlaySizeHint): Rectangle {
  const anchorDisplay = getOverlayAnchorDisplay();
  const { x, y, width, height } = anchorDisplay.workArea;
  const overlayWidth = size?.width ?? 450;
  const overlayHeight = size?.height ?? 360;

  return {
    width: overlayWidth,
    height: overlayHeight,
    x: Math.round(x + (width - overlayWidth) / 2),
    y: Math.round(y + (height - overlayHeight) / 2),
  };
}

function getInitialOverlayBounds(persisted: PersistedWindowState) {
  if (persisted.overlayBounds && isBoundsVisible(persisted.overlayBounds)) {
    return persisted.overlayBounds;
  }

  return getCenteredOverlayBounds({
    width: persisted.overlayBounds?.width,
    height: persisted.overlayBounds?.height,
  });
}

function recenterOverlayWindow() {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    return;
  }

  overlayWindow.setBounds(
    getCenteredOverlayBounds({
      width: overlayWindow.getBounds().width,
      height: overlayWindow.getBounds().height,
    }),
  );
}

function ensureOverlayWindowPosition() {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    return;
  }

  if (!isBoundsVisible(overlayWindow.getBounds())) {
    recenterOverlayWindow();
  }
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
    if (overlayWindow) {
      saveBounds("overlayBounds", overlayWindow);
    }
  });

  overlayWindow.on("resize", () => {
    if (overlayWindow) {
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

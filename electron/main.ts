import fs from "node:fs";
import path from "node:path";
import { app, BrowserWindow, globalShortcut, ipcMain } from "electron";
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
  overlayClickThrough?: boolean;
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

  overlayWindow = new BrowserWindow({
    width: persisted.overlayBounds?.width ?? 450,
    height: persisted.overlayBounds?.height ?? 360,
    x: persisted.overlayBounds?.x,
    y: persisted.overlayBounds?.y,
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

  if (persisted.overlayClickThrough) {
    overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  }

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
      writeWindowState({ overlayClickThrough: enabled });
    }

    return enabled;
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

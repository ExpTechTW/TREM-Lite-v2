const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  Tray,
  nativeImage,
  Menu,
} = require("electron");
const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");

/**
 * @type {BrowserWindow}
 */
let win;
let tray = null;
const hide = process.argv.includes("--start") ? true : false;

const test = process.argv.includes("--raw") ? 0 : 1;

const configFilePath = path.join(app.getPath("userData"), "config.yaml");

const defaultConfig = {
  setting: {
    "user-checkbox": {
      "other-auto-launch": 1,
    },
  },
};

function readConfig() {
  try {
    if (!fs.existsSync(configFilePath)) {
      fs.writeFileSync(configFilePath, yaml.dump(defaultConfig), "utf8");
    }
    const config = yaml.load(fs.readFileSync(configFilePath, "utf8"));
    return config.setting["user-checkbox"]["other-auto-launch"];
  } catch (e) {
    console.error("Error reading config file:", e);
    return false;
  }
}

function updateAutoLaunchSetting(value) {
  app.setLoginItemSettings({
    openAtLogin: value ? true : false,
    name: "TREM Lite",
    args: ["--start"],
  });
}

function createWindow(value) {
  win = new BrowserWindow({
    title: `TREM Lite v${app.getVersion()}`,
    minWidth: 985,
    minHeight: 895,
    width: 1405,
    height: 895,
    fullscreenable: false,
    maximizable: true,
    icon: "TREM.ico",
    frame: true,
    webPreferences: {
      nodeIntegration: true,
      backgroundThrottling: false,
      contextIsolation: false,
    },
  });

  process.env.window = win.id;

  require("@electron/remote/main").initialize();
  require("@electron/remote/main").enable(win.webContents);

  updateAutoLaunchSetting(value);

  win.setMenu(null);

  win.webContents.on("did-finish-load", () => {
    if (!hide) win.show();
  });

  win.on("close", (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      win.hide();
      event.returnValue = false;
    } else app.quit();
  });

  win.on("blur", () => {
    win.webContents.send("blur");
  });

  win.on("focus", () => {
    win.webContents.send("focus");
  });

  win.loadFile("./view/index.html");
}

const shouldQuit = app.requestSingleInstanceLock();

if (!shouldQuit) app.quit();
else {
  app.on("second-instance", (event, argv, cwd) => {
    if (win != null) win.show();
  });
  app.whenReady().then(() => {
    trayIcon();
    const autoLaunchEnabled = readConfig();
    createWindow(autoLaunchEnabled);
  });
}

app.on("window-all-closed", (event) => {
  if (process.platform !== "darwin") event.preventDefault();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("browser-window-created", (e, window) => {
  window.removeMenu();
});

ipcMain.on("israw", () => {
  win.webContents.send("israwok", test);
});

ipcMain.on("openUrl", (_, url) => {
  shell.openExternal(url);
});

ipcMain.on("openDevtool", () => {
  const currentWindow = BrowserWindow.getFocusedWindow();
  if (currentWindow) currentWindow.webContents.openDevTools({ mode: "detach" });
});

ipcMain.on("reload", () => {
  const currentWindow = BrowserWindow.getFocusedWindow();
  if (currentWindow) currentWindow.webContents.reload();
});

ipcMain.on("minimize", () => {
  if (win) win.minimize();
});

ipcMain.on("hide", () => {
  if (win) win.hide();
});

ipcMain.on("toggleFullscreen", () => {
  if (win) win.setFullScreen(!win.isFullScreen());
});

ipcMain.on("updateAutoLaunch", (_, value) => {
  updateAutoLaunchSetting(value);
  const config = yaml.load(fs.readFileSync(configFilePath, "utf8"));
  config.setting["user-checkbox"]["other-auto-launch"] = value;
  fs.writeFileSync(configFilePath, yaml.dump(config), "utf8");
});

function trayIcon() {
  if (tray) {
    tray.destroy();
    tray = null;
  }

  const iconPath = path.join(__dirname, "TREM.ico");
  tray = new Tray(nativeImage.createFromPath(iconPath));
  tray.setIgnoreDoubleClickEvents(true);
  tray.on("click", (e) => {
    if (win != null)
      if (win.isVisible()) win.hide();
      else win.show();
  });
  const contextMenu = Menu.buildFromTemplate([
    {
      label: `TREM Lite v${app.getVersion()}`,
      type: "normal",
      click: () => void 0,
    },
    {
      type: "separator",
    },
    {
      label: "重新啟動",
      type: "normal",
      click: () => restart(),
    },
    {
      label: "強制關閉",
      type: "normal",
      click: () => {
        app.isQuiting = true;
        app.exit(0);
      },
    },
  ]);
  tray.setToolTip(`TREM Lite v${app.getVersion()}`);
  tray.setContextMenu(contextMenu);
}

function restart() {
  app.relaunch();
  app.isQuiting = true;
  app.quit();
}

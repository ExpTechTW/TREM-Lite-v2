const { app, BrowserWindow, ipcMain, shell } = require("electron");

let win;

function createWindow() {
  win = new BrowserWindow({
    title          : `TREM Lite v${app.getVersion()}`,
    minHeight      : 540,
    minWidth       : 750,
    width          : 1280,
    height         : 720,
    icon           : "TREM.ico",
    webPreferences : {
      nodeIntegration      : true,
      backgroundThrottling : false,
      contextIsolation     : false,
    },
  });

  require("@electron/remote/main").initialize();
  require("@electron/remote/main").enable(win.webContents);

  win.setMenu(null);

  win.on("close", (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      win.hide();
    }
    return false;
  });

  win.loadFile("./view/index.html");
}

app.whenReady().then(() => createWindow());

app.on("window-all-closed", (event) => {
  if (process.platform !== "darwin") event.preventDefault();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("browser-window-created", (e, window) => {
  window.removeMenu();
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

ipcMain.on("hide", () => {
  if (win) win.hide();
});

ipcMain.on("toggleFullscreen", () => {
  if (win) win.setFullScreen(!win.isFullScreen());
});
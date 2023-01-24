const { BrowserWindow, Menu, app:TREM, Tray, ipcMain, nativeImage, shell } = require("electron");
const path = require("path");
const pushReceiver = require("electron-fcm-push-receiver");

let MainWindow;
let SettingWindow;
let tray = null;

let _devMode = false;

if (process.argv.includes("--dev"))
	_devMode = true;

function createWindow() {
	MainWindow = new BrowserWindow({
		title          : "TREM-Lite",
		width          : 1280,
		height         : 720,
		icon           : "TREM.ico",
		resizable      : false,
		show           : false,
		webPreferences : {
			preload          : path.join(__dirname, "preload.js"),
			nodeIntegration  : true,
			contextIsolation : false,
		},
	});
	process.env.window = MainWindow.id;
	require("@electron/remote/main").initialize();
	require("@electron/remote/main").enable(MainWindow.webContents);
	MainWindow.loadFile("./view/index.html");
	MainWindow.setMenu(null);
	MainWindow.webContents.on("did-finish-load", () => {
		MainWindow.show();
	});
	pushReceiver.setup(MainWindow.webContents);
	MainWindow.on("close", (event) => {
		if (!TREM.isQuiting) {
			event.preventDefault();
			MainWindow.hide();
			if (SettingWindow)
				SettingWindow.close();
			event.returnValue = false;
		} else
			TREM.quit();
	});
}

function createSettingWindow() {
	if (SettingWindow instanceof BrowserWindow) return SettingWindow.focus();
	SettingWindow = new BrowserWindow({
		title          : "TREM-Lite Setting",
		height         : 600,
		width          : 1000,
		resizable      : false,
		show           : false,
		icon           : "TREM.ico",
		webPreferences : {
			nodeIntegration      : true,
			contextIsolation     : false,
			enableRemoteModule   : true,
			backgroundThrottling : false,
			nativeWindowOpen     : true,
		},
	});
	require("@electron/remote/main").enable(SettingWindow.webContents);
	SettingWindow.loadFile("./view/setting.html");
	SettingWindow.setMenu(null);
	SettingWindow.webContents.on("did-finish-load", () => {
		SettingWindow.show();
	});
	SettingWindow.on("close", () => {
		SettingWindow = null;
	});
}

function trayIcon() {
	if (tray) {
		tray.destroy();
		tray = null;
	}

	const iconPath = path.join(__dirname, "TREM.ico");
	tray = new Tray(nativeImage.createFromPath(iconPath));
	tray.setIgnoreDoubleClickEvents(true);
	tray.on("click", (e) => {
		if (MainWindow != null)
			if (MainWindow.isVisible())
				MainWindow.hide();
			else
				MainWindow.show();
	});
	const contextMenu = Menu.buildFromTemplate([
		{
			label : `TREM v${TREM.getVersion()} 官方網站`,
			type  : "normal",
			click : () => {
				shell.openExternal("https://github.com/ExpTechTW/TREM");
			},
		},
		{
			type: "separator",
		},
		{
			label : "顯示app",
			type  : "normal",
			click : () => {
				MainWindow.show();
			}
		},
		{
			label : "重新啟動",
			type  : "normal",
			click : () => {
				restart();
			},
		},
		{
			label : "強制關閉",
			type  : "normal",
			click : () => {
				TREM.isQuiting = true;
				TREM.exit(0);
			},
		},
	]);
	tray.setToolTip(`TREM Lite v${TREM.getVersion()}`);
	tray.setContextMenu(contextMenu);
}

function restart() {
	TREM.relaunch();
	TREM.isQuiting = true;
	TREM.quit();
}

const shouldQuit = TREM.requestSingleInstanceLock();

if (!shouldQuit)
	TREM.quit();
else {
	TREM.on("second-instance", (event, argv, cwd) => {
		if (MainWindow != null) MainWindow.show();
	});
	TREM.whenReady().then(() => {
		trayIcon();
		createWindow();
	});
}

ipcMain.on("toggleFullscreen", () => {
	if (MainWindow)
		MainWindow.setFullScreen(!MainWindow.isFullScreen());
});
ipcMain.on("openDevtool", () => {
	if (_devMode) {
		const currentWindow = BrowserWindow.getFocusedWindow();
		if (currentWindow)
			currentWindow.webContents.openDevTools({ mode: "detach" });
	}
});
ipcMain.on("reloadpage", () => {
	const currentWindow = BrowserWindow.getFocusedWindow();
	if (currentWindow)
		currentWindow.webContents.reload();
});
ipcMain.on("openChildWindow", (event, arg) => {
	createSettingWindow();
});
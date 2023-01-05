const { BrowserWindow, app:TREM } = require("electron");
const path = require("path");

let MainWindow;

function createWindow() {
	MainWindow = new BrowserWindow({
		title          : "TREM-Plus",
		width          : 1280,
		minWidth       : 1280,
		height         : 720,
		minHeight      : 720,
		resizable      : true,
		icon           : "TREM.ico",
		webPreferences : {
			preload          : path.join(__dirname, "preload.js"),
			nodeIntegration  : true,
			contextIsolation : false,
		},
	});
	MainWindow.loadFile("./web/index.html");
	MainWindow.setAspectRatio(16 / 9);
	// MainWindow.setMenu(null);
	MainWindow.on("close", (event) => {
		if (!TREM.isQuiting) {
			event.preventDefault();
			MainWindow.hide();
			event.returnValue = false;
		} else
			TREM.quit();
	});
}

const shouldQuit = TREM.requestSingleInstanceLock();

if (!shouldQuit)
	TREM.quit();
else {
	TREM.on("second-instance", (event, argv, cwd) => {
		if (MainWindow != null) MainWindow.show();
	});
	TREM.whenReady().then(() => {
		// trayIcon();
		createWindow();
	});
}
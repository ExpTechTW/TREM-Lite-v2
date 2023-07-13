/* eslint-disable no-undef */
const {
	NOTIFICATION_RECEIVED,
	NOTIFICATION_SERVICE_STARTED,
	START_NOTIFICATION_SERVICE,
} = require("electron-fcm-push-receiver/src/constants");

let WS = false;
let FCM = false;
let disconnect_info = 0;
let init_ = false;
let sleep_state = false;

function _server_init() {
	if (init_) return;
	init_ = true;
	ipcRenderer.send(START_NOTIFICATION_SERVICE, "583094702393");
}

function sleep(_state = null) {
	if (!WS) return;
	if (_state != null) {
		if (_state == sleep_state) return;
		sleep_state = _state;
		if (sleep_state) setTimeout(() => document.getElementById("status").innerHTML = "💤 睡眠模式", 1000);
	}
	_sleep({ "trem-rts-v2": { sleep: (_state == null) ? sleep_state : _state } });
}

setInterval(() => {
	if (!service_status.websocket.status) {
		if (WS) {
			WS = false;
			plugin.emit("websocketDisconnected");
			time.style.color = "red";
		}
		if (now_time() - disconnect_info > 60_000) {
			disconnect_info = now_time();
			add_info("fa-solid fa-satellite-dish fa-2x info_icon", "#FF0000", "網路異常", "#00BB00", "客戶端無法與伺服器建立連線<br>請檢查網路狀態或稍後重試", 30000);
		}
	} else if (!WS) {
		time.style.color = "white";
		WS = true;
		plugin.emit("websocketConnected");
	}
}, 3000);

function _speed(depth, distance) {
	const Za = 1 * depth;
	let G0, G;
	const Xb = distance;
	if (depth <= 40) {
		G0 = 5.10298;
		G = 0.06659;
	} else {
		G0 = 7.804799;
		G = 0.004573;
	}
	const Zc = -1 * (G0 / G);
	const Xc = (Math.pow(Xb, 2) - 2 * (G0 / G) * Za - Math.pow(Za, 2)) / (2 * Xb);
	let Theta_A = Math.atan((Za - Zc) / Xc);
	if (Theta_A < 0) Theta_A = Theta_A + Math.PI;
	Theta_A = Math.PI - Theta_A;
	const Theta_B = Math.atan(-1 * Zc / (Xb - Xc));
	let Ptime = (1 / G) * Math.log(Math.tan((Theta_A / 2)) / Math.tan((Theta_B / 2)));
	const G0_ = G0 / 1.732;
	const G_ = G / 1.732;
	const Zc_ = -1 * (G0_ / G_);
	const Xc_ = (Math.pow(Xb, 2) - 2 * (G0_ / G_) * Za - Math.pow(Za, 2)) / (2 * Xb);
	let Theta_A_ = Math.atan((Za - Zc_) / Xc_);
	if (Theta_A_ < 0) Theta_A_ = Theta_A_ + Math.PI;
	Theta_A_ = Math.PI - Theta_A_;
	const Theta_B_ = Math.atan(-1 * Zc_ / (Xb - Xc_));
	let Stime = (1 / G_) * Math.log(Math.tan(Theta_A_ / 2) / Math.tan(Theta_B_ / 2));
	if (distance / Ptime > 7) Ptime = distance / 7;
	if (distance / Stime > 4) Stime = distance / 4;
	return { Ptime: Ptime, Stime: Stime };
}

ipcRenderer.on(NOTIFICATION_SERVICE_STARTED, (_, token) => {
	FCM = true;
	localStorage.UUID = token;
});

ipcRenderer.on(NOTIFICATION_RECEIVED, (_, Notification) => {
	FCM = true;
	if (Notification.data.Data != undefined) get_data(JSON.parse(Notification.data.Data), "fcm");
});
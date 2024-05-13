/* eslint-disable no-undef */


setInterval(() => {
	const _now = now();
	// if (new Date(_now).getSeconds() == 0)
	// if (!variable.subscripted_list.includes("websocket.report")) updateReports();
	if (variable.replay) {
		doc_time.style.color = "yellow";
		doc_time.textContent = formatTime(variable.replay);
	} else {
		if (_now - variable.last_get_data_time > 5000) {
			doc_time.style.color = "red";
			//document.getElementById("connect").style.color = "red";
		} else {
			doc_time.style.color = "white";
			doc_time.textContent = formatTime(_now);
		}
	}
}, 1000);
/* eslint-disable no-undef */
let replay_timer;
let marker;
if (variable.replay_list.length)
  replay_timer = setInterval(() => read_replay_file(), 1000);

ntp();

setInterval(() => {
  // if (variable.replay_list.length) return;
  realtime_rts();
  realtime_eew();
}, 1000);

setInterval(() => {
  ntp();
}, 60000);

/**調用重播資料**/
function read_replay_file() {
  if (!variable.replay_list.length) {
    variable.replay = 0;
    if (replay_timer) clearInterval(replay_timer);
    return;
  }

  const name = variable.replay_list.shift();

  // eslint-disable-next-line no-constant-condition
  if (1 == 2) {
    const data = JSON.parse(fs.readFileSync(path.join(app.getPath("userData"), `replay/${name}`)).toString());

    const alert = Object.keys(data.rts.box).length;
    show_rts_dot(data.rts, alert);
    if (alert) show_rts_box(data.rts.box);

    for (const eew of data.eew) {
      eew.time = data.rts.time;
      eew.timestamp = now();
      // eew.eq.mag = 1;
      show_eew(eew);
    }

    variable.replay = data.rts.time;

    console.log(name);
  }
}

/**即時RTS**/
async function realtime_rts() {
  const res = await fetchData(`${LB_url()}v1/trem/rts`);
  const data = await res.json();
  const alert = Object.keys(data.box).length;
  show_rts_dot(data, alert);
  if (alert) show_rts_box(data.box);

  //更新最後取得數據時間
  variable.last_get_data_time = now();
  //document.getElementById("connect").style.color = "goldenrod";
}

/**即時EEW**/
async function realtime_eew() {
  const res = await fetchData(`${LB_url()}v1/eq/eew`);
  const data = await res.json();
  for (const eew of data) {
    eew.timestamp = now();
    show_eew(eew);
  }
}

/**取最新時間戳**/
async function ntp() {
  const res = await fetchData(`https://lb-${Math.ceil(Math.random() * 4)}.exptech.com.tw/ntp`);
  const data = await res.text();
  //設定時間偏移
  variable.time_offset = Number(data) - Date.now();
}

/**返回報告列表**/
$(document).on('click', '#report-back-btn', function() {
    console.log($(this));
    $('.report-box-wrapper').fadeOut(300);
    $('.nav-bar, #info-box, .intensity-container').fadeIn(300);
    
    if (marker) {
        variable.map.removeLayer(marker);
		variable.map.setView([23.6, 120.4], 7.8);
        marker = null;
    }
});

const Maps = { main: null, mini: null, report: null, intensity: null };

/**取得報告詳細資訊**/
$(document).on('click','#nav-report-panel',function(){
	console.log($(this));
	$('.report-box-wrapper').fadeIn(300);
	$('.nav-bar,#info-box,.intensity-container').fadeOut(300);
	fetch(`https://api-2.exptech.com.tw/api/v2/eq/report/113390-2024-0513-155727`)
		.then((res) => {
			if (res.ok) {
				res.json().then(res1 => {
					marker = L.marker([res1.lat, res1.lon], {
						icon: L.icon({
							iconUrl: "../resource/image/cross.png",
							iconSize: [40, 40],
							className: "flash",
						}), zIndexOffset: 2000,
					}).addTo(variable.map);
					variable.map.setView([res1.lat, res1.lon], 10);
				});
			}
		}).catch(err => {
			console.log(err.message);
		});
})
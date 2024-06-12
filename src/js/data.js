/* eslint-disable no-undef */
let replay_timer;
if (variable.replay_list.length)
  replay_timer = setInterval(() => read_replay_file(), 1000);

ntp();

setInterval(() => {
  // if (variable.replay_list.length) return;
  realtime_rts();
  realtime_eew();
}, 1000);

setInterval(() => {
  if (variable.replay_list.length || Object.keys(variable.eew_list).length !== 0) return;
  report();
}, 10000);

setInterval(() => {
  ntp();
}, 60000);


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

    for (const intensity of data.intensity)
      show_intensity(intensity);

    variable.replay = data.rts.time;
    console.log(data);
  }
}

async function realtime_rts() {
  const res = await fetchData(`${LB_url()}v1/trem/rts`);
  const data = await res.json();
  // console.log(data);

  const alert = Object.keys(data.box).length;
  show_rts_dot(data, alert);
  if (alert) show_rts_box(data.box);

  variable.last_get_data_time = now();
  getElementById("connect").style.color = "goldenrod";
}

async function realtime_eew() {
  const res = await fetchData(`${LB_url()}v1/eq/eew`);
  const data = await res.json();
  for (const eew of data) {
    eew.timestamp = now();
    show_eew(eew);
  }
}

async function ntp() {
  const res = await fetchData(`https://lb-${Math.ceil(Math.random() * 4)}.exptech.com.tw/ntp`);
  const data = await res.text();
  variable.time_offset = Number(data) - Date.now();
}
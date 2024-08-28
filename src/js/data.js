/* eslint-disable no-undef */
let replay_timer;
let rts_replay_time = 0;

if (variable.replay_list.length)
  replay_timer = setInterval(() => read_replay_file(), 1000);

setInterval(() => {
  show_rts_list();
  // if (variable.replay_list.length) return;
  realtime_rts();
  realtime_eew();
}, 1_000);

setInterval(() => {
  report();
}, 10_000);

setInterval(() => {
  ntp();
}, 60_000);

setInterval(() => {
  checkForNewRelease();
}, 3_600_000);

function read_replay_file() {
  const name = variable.replay_list.shift();

  if (!variable.replay_list.length) {
    variable.replay = 0;
    if (replay_timer) clearInterval(replay_timer);
    return;
  }

  if (1 == 1) return;

  const data = JSON.parse(
    fs
      .readFileSync(path.join(app.getPath("userData"), `replay/${name}`))
      .toString()
  );

  const alert = Object.keys(data.rts.box).length;
  data.rts.eew = data.eew;
  show_rts_dot(data.rts, alert);
  if (alert) show_rts_box(data.rts.box);

  for (const eew of data.eew) {
    eew.time = data.rts.time;
    eew.timestamp = now();
    show_eew(eew);
  }

  for (const intensity of data.intensity) show_intensity(intensity);
  variable.replay = data.rts.time;
  variable.report.replay_status = data.rts.time;
  variable.last_get_data_time = now();
}

async function realtime_rts() {
  if (variable.report.replay_status) return;
  const res = await fetchData(`${LB_url()}v1/trem/rts`);
  const data = await res.json();

  const alert = Object.keys(data.box).length;
  show_rts_dot(data, alert);
  if (alert) show_rts_box(data.box);

  variable.last_get_data_time = now();
  $("#connect").style.color = "goldenrod";
}

async function realtime_eew() {
  if (variable.report.replay_status) return;
  const res = await fetchData(`${LB_url()}v1/eq/eew`);
  const data = await res.json();
  for (const eew of data) {
    eew.timestamp = now();
    show_eew(eew);
  }
}

async function ntp() {
  const res = await fetchData(
    `https://lb-${Math.ceil(Math.random() * 4)}.exptech.com.tw/ntp`
  );
  if (res.status === 200) {
    const data = await res.text();
    variable.time_offset = Number(data) - Date.now();
  } else {
    setTimeout(ntp, 5000);
  }
}
ntp();

setInterval(async () => {
  if (!rts_replay_time) return;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  const _replay_time = Math.round(rts_replay_time / 1000);
  rts_replay_time += 1000;
  const ts = _replay_time * 1000;

  try {
    replay_rts(ts, controller);
    replay_eew(ts, _replay_time, controller);
  } catch (error) {
    console.error("Error during replay:", error);
  } finally {
    clearTimeout(timeoutId);
  }
}, 1000);

async function fetchReplay(url, controller, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      return await res.json();
    } catch (error) {
      if (i < retries - 1) {
        console.warn(`Retrying... (${i + 1}/${retries})`);
        continue;
      } else {
        throw error;
      }
    }
  }
}

async function replay_rts(ts, controller) {
  const ans_rts = await fetchReplay(
    `https://api-2.exptech.com.tw/api/v1/trem/rts/${ts}`,
    controller
  );
  if (!rts_replay_time) return;

  const alert = Object.keys(ans_rts.box).length;
  show_rts_dot(ans_rts, alert);
  if (alert) show_rts_box(ans_rts.box);

  variable.last_get_data_time = now();
  variable.report.replay_data = ans_rts;
  $("#connect").style.color = "goldenrod";
}

async function replay_eew(ts, rt, controller) {
  const ans_eew = await fetchReplay(
    `https://api-2.exptech.com.tw/api/v1/eq/eew/${ts}`,
    controller
  );
  if (!rts_replay_time) return;

  const _now = now();
  for (const eew of ans_eew) {
    if (distance(eew.eq.lat, eew.eq.lon)(23.6, 120.4) <= 800) {
      eew.time = eew.eq.time;
      eew.timestamp = _now - (rt * 1000 - eew.time);
      show_eew(eew);
    }
  }
}

function early(data) {
  if (data && data.author) {
    const authorKey = `early-warning-${data.author.toUpperCase()}`;
    return checkbox(authorKey) !== 1;
  }
  return false;
}

import { ref, onMounted, onUnmounted } from "vue";
import utils from "../ts/utils";
import { useMapStore } from "../ts/store";
import path from "path";
import fs from "fs";
import { app } from "electron";

const MapStore = useMapStore();

let replay_timer: any | undefined;

function startReplay() {
  if (MapStore.replay_list.length) {
    replay_timer = setInterval(() => readReplayFile(), 1000);
  }
}

async function ntp() {
  const res = await fetch(
    `https://lb-${Math.ceil(Math.random() * 4)}.exptech.com.tw/ntp`,
  );
  const data = await res.text();
  MapStore.time_offset = Number(data) - Date.now();
}

async function realtimeRts() {
  const res = await fetch(`${utils.url("lb")}v1/trem/rts`);
  const data = await res.json();
  const alert = Object.keys(data.box).length;
  showRtsDot(data, alert);
  if (alert) showRtsBox(data.box);
  MapStore.last_get_data_time = utils.now();
  document.getElementById("connect").style.color = "goldenrod";
}

async function realtimeEew() {
  const res = await fetch(`${utils.url("lb")}v1/eq/eew`);
  const data = await res.json();
  for (const eew of data) {
    eew.timestamp = utils.now();
    showEew(eew);
  }
}

function readReplayFile() {
  if (!MapStore.replay_list.length) {
    MapStore.replay = 0;
    if (replay_timer) clearInterval(replay_timer);
    return;
  }

  const name = MapStore.replay_list.shift();
  const data = JSON.parse(
    fs
      .readFileSync(path.join(app.getPath("userData"), `replay/${name}`))
      .toString(),
  );
  const alert = Object.keys(data.rts.box).length;
  showRtsDot(data.rts, alert);
  if (alert) showRtsBox(data.rts.box);

  for (const eew of data.eew) {
    eew.time = data.rts.time;
    eew.timestamp = utils.now();
    showEew(eew);
  }

  for (const intensity of data.intensity) {
    showIntensity(intensity);
  }

  MapStore.replay = data.rts.time;
}

function startIntervals() {
  const rtsInterval = setInterval(() => {
    showRtsList();
    if (!MapStore.replay_list.length) {
      realtimeRts();
      realtimeEew();
    }
  }, 1000);

  const reportInterval = setInterval(() => {
    if (Object.keys(MapStore.eew_list).length !== 0) return;
    report();
  }, 10000);

  const ntpInterval = setInterval(() => {
    ntp();
  }, 60000);

  return { rtsInterval, reportInterval, ntpInterval };
}

function clearIntervals(intervals: Array<string>) {
  //   clearInterval(intervals.rtsInterval);
  //   clearInterval(intervals.reportInterval);
  //   clearInterval(intervals.ntpInterval);
}

export function useData() {
  const intervals = ref(null);

  onMounted(() => {
    startReplay();
    ntp();
    intervals.value = startIntervals();
  });

  onUnmounted(() => {
    if (intervals.value) {
      clearIntervals(intervals.value);
    }
  });
}

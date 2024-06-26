import { ref, onMounted, onUnmounted } from "vue";
import utils from "../ts/utils";

const MAX_RETRY_ATTEMPTS = 3;

export async function getStationInfo(): Promise<unknown> {
  console.log("[Fetch] Fetching station data...");
  let retryCount = 0;

  return new Promise((resolve, reject) => {
    const retryClock = setInterval(async () => {
      retryCount++;

      try {
        const res = await fetch(`${utils.url("api")}v1/trem/station`);
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        const data = await res.json();

        if (data) {
          console.log("[Fetch] Got station data");
          clearInterval(retryClock);
          resolve(data);
        }
      } catch (err) {
        console.log(`[Fetch] ${err} (Try #${retryCount})`);
        if (retryCount >= MAX_RETRY_ATTEMPTS) {
          clearInterval(retryClock);
          reject(err);
        }
      }
    }, 5_000);
  });
}

const variable = {
  last_map_update: 0,
  map_layer: {
    eew: {},
  },
  station_icon: {},
  time_offset: 0,
  config: {},
  _config: "",
  replay: 0,
  replay_timestamp: 0,
  ws_connected: false,
  ws_reconnect: true,
  last_get_data_time: 0,
  eew_list: {},
  icon_size: 0,
  intensity_list: {},
  intensity_time: 0,
  audio: {
    shindo: -1,
    pga: -1,
    status: {
      shindo: 0,
      pga: 0,
    },
    count: {
      pga_1: 0,
      pga_2: 0,
      shindo_1: 0,
      shindo_2: 0,
    },
  },
  focus: {
    status: {
      report: 0,
      intensity: 0,
      tsunami: 0,
      eew: 0,
      rts: 0,
    },
  },
  speech_status: 0,
  last_map_hash: "",
  report: {
    last: {},
    more: {},
    check_: 1,
    list_retry: 3,
    withoutNo: "",
  },
};

export const useTimeUpdate = () => {
  const docTime = ref<string>("");
  const docColor = ref<string>("white");

  const updateTime = () => {
    const _now = utils.now();

    if (variable.replay) {
      docTime.value = utils.formatTime(variable.replay);
      docColor.value = "text-yellow-300";
    } else if (_now - variable.last_get_data_time > 5000) {
      docTime.value = utils.formatTime(_now);
      docColor.value = "text-red-600";
    } else {
      docTime.value = utils.formatTime(_now);
      docColor.value = "text-white";
    }
  };

  onMounted(() => {
    updateTime();
    const timer = setInterval(updateTime, 1000);

    onUnmounted(() => {
      clearInterval(timer);
    });
  });
  return {
    docTime,
    docColor,
  };
};

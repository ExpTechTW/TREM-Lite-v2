import utils from "../ts/utils";
import { useMapStore } from "../ts/store";
import L from "leaflet";

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

export default function showRtsDot(data: any, alert: boolean) {
  const MapStore = useMapStore();
  if (!MapStore.station_info) return;

  if (!alert) {
    MapStore.audio = {
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
    };
  } else {
    for (const area of data.int) {
      const box = document.createElement("div");
      box.className = "realtime-item";

      const int = document.createElement("div");
      int.className = `realtime-intensity intensity-${area.i}`;
      int.textContent = utils.int_to_intensity(area.i);

      const loc = document.createElement("div");
      loc.className = "realtime-location";
      const locStr = utils.region_code_to_string(MapStore.REGION, area.code);
      loc.textContent = `${locStr.city}${locStr.town}`;

      box.appendChild(int);
      box.appendChild(loc);
      // realtime_list.value.appendChild(box);
    }
  }

  for (const id of Object.keys(MapStore.station_icon)) {
    MapStore.station_icon[id].remove();
    delete MapStore.station_icon[id];
  }

  let maxPga = -1;
  let maxShindo = -1;
  let trigger = 0;
  let level = 0;

  for (const id of Object.keys(data.station)) {
    if (!MapStore.station_info[id]) continue;
    const i = utils.intensity_float_to_int(data.station[id].i);
    const intensityClass = `pga_dot pga_${data.station[id].i.toString().replace(".", "_")}`;
    const I = utils.intensity_float_to_int(data.station[id].I);
    const icon = !data.station[id].alert
      ? L.divIcon({
          className: intensityClass,
          html: "<span></span>",
          iconSize: [10 + MapStore.icon_size, 10 + MapStore.icon_size],
        })
      : L.divIcon({
          className: I == 0 ? "pga_dot pga-intensity-0" : `dot intensity-${I}`,
          html: `<span>${I == 0 ? "" : utils.int_to_intensity(I)}</span>`,
          iconSize: [20 + MapStore.icon_size, 20 + MapStore.icon_size],
        });

    const pga = data.station[id].pga;
    const info = MapStore.station_info[id].info.at(-1);
    if (data.station[id].alert) {
      trigger++;
      level += pga;
    }

    let loc = utils.region_code_to_string(MapStore.REGION, info.code);
    if (!loc) loc = "未知區域";
    else loc = `${loc.city}${loc.town}`;

    if (maxPga < pga) maxPga = pga;
    if (maxShindo < i) maxShindo = i;

    const stationText = `<div class='report_station_box'><div><span class="tooltip-location">${loc}</span><span class="tooltip-uuid">${id} | ${MapStore.station_info[id].net}</span></div><div class="tooltip-fields"><div><span class="tooltip-field-name">加速度(cm/s²)</span><span class="tooltip-field-value">${pga.toFixed(1)}</span></div><div><span class="tooltip-field-name">速度(cm/s)</span><span class="tooltip-field-value">${data.station[id].pgv.toFixed(1)}</span></div><div><span class="tooltip-field-name">震度</span><span class="tooltip-field-value">${data.station[id].i.toFixed(1)}</span></div></div></div>`;

    if (alert) {
      if (pga > MapStore.audio.pga) {
        if (pga > 200 && MapStore.audio.status.pga != 2) {
          if (checkbox("sound-effects-PGA2") == 1) MapStore.AUDIO.PGA2.play();
          MapStore.audio.status.pga = 2;
        } else if (pga > 8 && !MapStore.audio.status.pga) {
          if (checkbox("sound-effects-PGA1") == 1) MapStore.AUDIO.PGA1.play();
          MapStore.audio.status.pga = 1;
        }
        MapStore.audio.pga = pga;
        if (pga > 8) MapStore.audio.count.pga_1 = 0;
        if (pga > 200) MapStore.audio.count.pga_2 = 0;
      }
      if (i > MapStore.audio.shindo) {
        if (i > 3 && MapStore.audio.status.shindo != 3) {
          if (checkbox("sound-effects-Shindo2") == 1)
            MapStore.AUDIO.SHINDO2.play();
          MapStore.audio.status.shindo = 3;
        } else if (i > 1 && MapStore.audio.status.shindo < 2) {
          if (checkbox("sound-effects-Shindo1") == 1)
            MapStore.AUDIO.SHINDO1.play();
          MapStore.audio.status.shindo = 2;
        } else if (!MapStore.audio.status.shindo) {
          if (checkbox("sound-effects-Shindo0") == 1)
            MapStore.AUDIO.SHINDO0.play();
          MapStore.audio.status.shindo = 1;
        }
        if (i > 3) MapStore.audio.count.shindo_2 = 0;
        if (i > 1) MapStore.audio.count.shindo_1 = 0;
        MapStore.audio.shindo = i;
      }
    }
    if (MapStore.audio.pga && maxPga < MapStore.audio.pga) {
      if (MapStore.audio.status.pga == 2) {
        if (maxPga < 200) {
          MapStore.audio.count.pga_2++;
          if (MapStore.audio.count.pga_2 >= 30) {
            MapStore.audio.count.pga_2 = 0;
            MapStore.audio.status.pga = 1;
          }
        } else MapStore.audio.count.pga_2 = 0;
      } else if (MapStore.audio.status.pga == 1) {
        if (maxPga < 8) {
          MapStore.audio.count.pga_1++;
          if (MapStore.audio.count.pga_1 >= 30) {
            MapStore.audio.count.pga_1 = 0;
            MapStore.audio.status.pga = 0;
          }
        } else MapStore.audio.count.pga_1 = 0;
      }
      MapStore.audio.pga = maxPga;
    }
    if (MapStore.audio.shindo && maxShindo < MapStore.audio.shindo) {
      if (MapStore.audio.status.shindo == 3) {
        if (maxShindo < 4) {
          MapStore.audio.count.shindo_2++;
          if (MapStore.audio.count.shindo_2 >= 15) {
            MapStore.audio.count.shindo_2 = 0;
            MapStore.audio.status.shindo = 2;
          }
        } else MapStore.audio.count.shindo_2 = 0;
      } else if (MapStore.audio.status.shindo == 2) {
        if (maxShindo < 2) {
          MapStore.audio.count.shindo_1++;
          if (MapStore.audio.count.shindo_1 >= 15) {
            MapStore.audio.count.shindo_1 = 0;
            MapStore.audio.status.shindo = 1;
          }
        } else MapStore.audio.count.shindo_1 = 0;
      }
      MapStore.audio.shindo = maxShindo;
    }

    if (
      (!Object.keys(data.box).length &&
        !Object.keys(MapStore.eew_list).length) ||
      data.station[id].alert
    ) {
      if (!MapStore.focus.status.intensity) {
        MapStore.station_icon[id] = L.marker([info.lat, info.lon], {
          icon: icon,
          zIndexOffset: I * 1000,
        })
          .bindTooltip(stationText, { opacity: 1 })
          .addTo(MapStore.map);
      }
    }
  }

  // max_pga_text.value.textContent = `${maxPga > 999 ? "999+" : maxPga.toFixed(2)} gal`;
  // max_pga_text.value.className = `intensity-${alert ? maxShindo : 0}`;
  // document.getElementById("trigger").textContent = trigger.toString();
  // document.getElementById("level").textContent = Math.round(level).toString();
}

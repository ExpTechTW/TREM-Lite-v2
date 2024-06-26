import L from "leaflet";
import utils from "../ts/utils";
import { useMapStore } from "../ts/store";
const MapStore = useMapStore();

let draw_lock = false;
let last_show_epicenter_time = 0;
const last_map_count = 0;
setInterval(() => {
  const _eew_list = Object.keys(MapStore.eew_list);

  if (!_eew_list.length) return;

  if (draw_lock) return;
  draw_lock = true;
  MapStore.focus.bounds.eew = L.latLngBounds(null, null);
  MapStore.focus.status.eew = 1;
  for (const id of _eew_list) {
    const data = MapStore.eew_list[id].data;
    const now_time = data.time + (utils.now() - data.timestamp);
    if (now_time - data.eq.time > 240_000) {
      if (MapStore.eew_list[data.id].layer.s)
        MapStore.eew_list[data.id].layer.s.remove();
      if (MapStore.eew_list[data.id].layer.s_fill)
        MapStore.eew_list[data.id].layer.s_fill.remove();
      if (MapStore.eew_list[data.id].layer.p)
        MapStore.eew_list[data.id].layer.p.remove();
      MapStore.eew_list[data.id].layer.epicenterIcon.remove();
      delete MapStore.eew_list[data.id];
      MapStore.lastMapUpdate = 0;
      continue;
    }
    const dist = ps_wave_dist(data.eq.depth, data.eq.time, now_time);
    const p_dist = dist.p_dist < 0 ? 0 : dist.p_dist;
    const s_dist = dist.s_dist < 0 ? 0 : dist.s_dist;
    MapStore.eew_list[data.id].dist = s_dist;
    const s_t = dist.s_t;
    if (MapStore.eew_list[data.id].layer.p)
      MapStore.eew_list[data.id].layer.p.setRadius(p_dist);
    if (MapStore.eew_list[data.id].layer.s)
      MapStore.eew_list[data.id].layer.s.setRadius(s_dist);
    if (MapStore.eew_list[data.id].layer.s_fill)
      MapStore.eew_list[data.id].layer.s_fill.setRadius(s_dist);
    if (_eew_list[last_map_count] == id) {
      MapStore.focus.bounds.eew.extend([data.eq.lat, data.eq.lon]);
      if (data.detail == 0) {
        console.log(true);
      } else if (!data.eq.max)
        MapStore.focus.bounds.eew.extend(
          MapStore.eew_list[data.id].layer.s.getBounds(),
        );
      else {
        const intensity_list =
          MapStore.eew_list[_eew_list[last_map_count]].eew_intensity_list;
        for (const name of Object.keys(intensity_list)) {
          const intensity = utils.intensity_float_to_int(
            intensity_list[name].i,
          );
          if (intensity > 1 && s_dist / 1000 > intensity_list[name].dist)
            MapStore.focus.bounds.eew.extend([
              intensity_list[name].lat,
              intensity_list[name].lon,
            ]);
        }
        MapStore.focus.bounds.eew.extend(MapStore.focus.bounds.rts);
      }
    }
    if (s_t) {
      const progress = Math.floor(
        ((now_time - data.eq.time) / 1000 / s_t) * 100,
      );
      const progress_bar = `<div style="border-radius: 5px;background-color: aqua;height: ${progress}%;"></div>`;
      MapStore.eew_list[data.id].layer.epicenterTooltip = true;
      MapStore.eew_list[data.id].layer.epicenterIcon.bindTooltip(progress_bar, {
        opacity: 1,
        permanent: true,
        direction: "right",
        offset: [10, 0],
        className: "progress-tooltip",
      });
    } else if (MapStore.eew_list[data.id].layer.epicenterTooltip) {
      MapStore.eew_list[data.id].layer.epicenterIcon.unbindTooltip();
      delete MapStore.eew_list[data.id].layer.epicenterTooltip;
    }
  }
  const time_now = utils.now();
  if (time_now - last_show_epicenter_time > 1000) {
    last_show_epicenter_time = time_now;
    const flashElements = document.getElementsByClassName("flash");
    for (const item of flashElements) item.style.visibility = "visible";
    setTimeout(() => {
      for (const item of flashElements) item.style.visibility = "hidden";
    }, 500);
  }
  draw_lock = false;
}, 0);

function ps_wave_dist(depth: number, time: number, now: number) {
  let p_dist = 0;
  let s_dist = 0;
  let s_t = 0;

  const t = (now - time) / 1000;

  const _time_table =
    MapStore.TIME_TABLE[utils.findClosest(MapStore.TIME_TABLE_OBJECT, depth)];
  let prev_table = null;
  for (const table of _time_table) {
    if (!p_dist && table.P > t)
      if (prev_table) {
        const t_diff = table.P - prev_table.P;
        const r_diff = table.R - prev_table.R;
        const t_offset = t - prev_table.P;
        const r_offset = (t_offset / t_diff) * r_diff;
        p_dist = prev_table.R + r_offset;
      } else p_dist = table.R;

    if (!s_dist && table.S > t)
      if (prev_table) {
        const t_diff = table.S - prev_table.S;
        const r_diff = table.R - prev_table.R;
        const t_offset = t - prev_table.S;
        const r_offset = (t_offset / t_diff) * r_diff;
        s_dist = prev_table.R + r_offset;
      } else {
        s_dist = table.R;
        s_t = table.S;
      }
    if (p_dist && s_dist) break;
    prev_table = table;
  }

  p_dist *= 1000;
  s_dist *= 1000;
  return { p_dist, s_dist, s_t };
}

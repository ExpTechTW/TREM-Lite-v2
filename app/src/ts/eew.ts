import { ref } from "vue";
import L from "leaflet";
import utils from "../ts/utils";
import { useMapStore } from "../ts/store";
import crypto from "crypto";
import townJson from "../../resource/map/town.json";

export function startEewInterval() {
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
        MapStore.eew_list[data.id].layer.epicenterIcon.bindTooltip(
          progress_bar,
          {
            opacity: 1,
            permanent: true,
            direction: "right",
            offset: [10, 0],
            className: "progress-tooltip",
          },
        );
      } else if (MapStore.eew_list[data.id].layer.epicenterTooltip) {
        MapStore.eew_list[data.id].layer.epicenterIcon.unbindTooltip();
        delete MapStore.eew_list[data.id].layer.epicenterTooltip;
      }
    }

    const time_now = utils.now();
    if (time_now - last_show_epicenter_time > 1000) {
      last_show_epicenter_time = time_now;
      const flashElements = document.getElementsByClassName("flash");
      for (const item of flashElements) item.classList.remove("hidden");
      setTimeout(() => {
        for (const item of flashElements) item.classList.add("hidden");
      }, 500);
    }

    draw_lock = false;
  }, 0);

  const lastMapUpdate = ref(0);

  setInterval(() => {
    const _eew_list = Object.keys(MapStore.eew_list);

    if (!_eew_list.length) return;

    const nowLocalTime = Date.now();
    if (nowLocalTime - lastMapUpdate.value < 10000) return;
    lastMapUpdate.value = nowLocalTime;

    let lastMapCount = 0;
    lastMapCount++;
    if (lastMapCount >= _eew_list.length) lastMapCount = 0;

    const data = MapStore.eew_list[_eew_list[lastMapCount]].data;

    if (
      !MapStore.focus.status.intensity &&
      MapStore.eew_list[_eew_list[lastMapCount]].eew_intensity_list
    ) {
      const hash = crypto
        .createHash("sha256")
        .update(
          JSON.stringify(
            MapStore.eew_list[_eew_list[lastMapCount]].eew_intensity_list,
          ),
        );
      const digest = hash.digest("hex");
      if (MapStore.lastMapHash !== digest) {
        MapStore.lastMapHash = digest;
        if (MapStore.intensity_geojson) MapStore.intensity_geojson.remove();
        if (data.status !== 3) {
          MapStore.intensity_geojson = L.geoJson(
            townJson as GeoJSON.FeatureCollection,
            {
              style: (args) => {
                const name =
                  args.properties.COUNTYNAME + " " + args.properties.TOWNNAME;
                const intensity = utils.intensity_float_to_int(
                  MapStore.eew_list[_eew_list[lastMapCount]].eew_intensity_list[
                    name
                  ].i,
                );
                let color = !intensity
                  ? "#3F4045"
                  : utils.int_to_color(intensity);
                let nsspe = 0;

                if (data.eq.area) {
                  for (const i of Object.keys(data.eq.area)) {
                    if (
                      data.eq.area[i].includes(
                        utils
                          .region_string_to_code(
                            MapStore.REGION,
                            args.properties.COUNTYNAME,
                            args.properties.TOWNNAME,
                          )
                          .toString(),
                      )
                    ) {
                      nsspe = Number(i);
                      break;
                    }
                  }
                }

                if (nsspe) color = utils.int_to_color(nsspe);

                return {
                  color:
                    intensity == 4 || intensity == 5 || intensity == 6
                      ? "grey"
                      : "white",
                  weight: nsspe ? 1.5 : 0.4,
                  fillColor: color,
                  fillOpacity: 1,
                };
              },
            },
          ).addTo(MapStore.map as L.Map);
        }
      }
    }

    console.log(data);
    // $("#info-depth").text(data.eq.depth);
    // $("#info-no").text(`第${data.serial}報${data.final ? "(最終)" : ""}`);
    // $("#info-loc").text(data.eq.loc);
    // $("#info-mag").text(data.eq.mag.toFixed(1));
    // $("#info-time").text(utils.formatTime(data.eq.time));
    // $("#info-title-box-type").text(
    //   _eew_list.length > 1 ? `${lastMapCount + 1}/${_eew_list.length} ` : "",
    // ) +
    //   (!data.status
    //     ? `地震速報｜${data.author.toUpperCase()}`
    //     : data.status == 1
    //       ? `緊急地震速報｜${data.author.toUpperCase()}`
    //       : `地震速報(取消)｜${data.author.toUpperCase()}`);
    // $("#info-box").css(
    //   "backgroundColor",
    //   !data.status ? "#FF9900" : data.status == 1 ? "#C00000" : "#505050",
    // );
    // const infoIntensity = $("#info-intensity");
    // infoIntensity.text(utils.intensity_list[data.eq.max]);
    // infoIntensity.attr(
    //   "class",
    //   `info-body-title-title-box intensity-${data.eq.max}`,
    // );
  }, 1000);

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
}

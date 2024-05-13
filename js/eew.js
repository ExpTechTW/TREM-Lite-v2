/* eslint-disable no-undef */
let draw_lock = false;
let last_show_epicenter_time = 0;
let last_map_update = 0;
let last_map_count = 0;
setInterval(() => {
  const _eew_list = Object.keys(variable.eew_list);
  if (!_eew_list.length) return;
  if (draw_lock) return;
  draw_lock = true;
  for (const id of _eew_list) {
    const data = variable.eew_list[id].data;
    const now_time = data.time + (now() - data.timestamp);
    if (now_time - data.eq.time > 240_000) {
      variable.eew_list[data.id].layer.s.remove();
      variable.eew_list[data.id].layer.s_fill.remove();
      variable.eew_list[data.id].layer.p.remove();
      variable.eew_list[data.id].layer.epicenterIcon.remove();
      delete variable.eew_list[data.id];
      last_map_update = 0;
      continue;
    }
    const dist = ps_wave_dist(data.eq.depth, data.eq.time, now_time);
    const p_dist = dist.p_dist;
    const s_dist = dist.s_dist;
    variable.eew_list[data.id].layer.p.setRadius(p_dist);
    variable.eew_list[data.id].layer.s.setRadius(s_dist);
    variable.eew_list[data.id].layer.s_fill.setRadius(s_dist);

    if (!s_dist) {
      const progress = Math.round(((now_time - data.eq.time) / 1000 / findClosestDepth(data.eq.depth)) * 100);
      const progress_bar = `<div style="border-radius: 5px;background-color: aqua;height: ${progress}%;"></div>`;
      variable.eew_list[data.id].layer.epicenterTooltip = true;
      variable.eew_list[data.id].layer.epicenterIcon.bindTooltip(progress_bar, { opacity: 1, permanent: true, direction: "right", offset: [10, 0], className: "progress-tooltip" });
    } else
      if (variable.eew_list[data.id].layer.epicenterTooltip) {
        variable.eew_list[data.id].layer.epicenterIcon.unbindTooltip();
        delete variable.eew_list[data.id].layer.epicenterTooltip;
      }
  }
  const time_now = now();
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

setInterval(() => {
  const _eew_list = Object.keys(variable.eew_list);
  if (!_eew_list.length) return;
  const now_local_time = Date.now();
  if (now_local_time - last_map_update < 10000) return;
  last_map_update = now_local_time;
  last_map_count++;
  if (last_map_count >= _eew_list.length) last_map_count = 0;

  const data = variable.eew_list[_eew_list[last_map_count]].data;
  if (variable.intensity_geojson) variable.intensity_geojson.remove();
  variable.intensity_geojson = L.geoJson.vt(require(path.join(__dirname, "../resource/map", "town.json")), {
    minZoom : 4,
    maxZoom : 12,
    buffer  : 256,
    zIndex  : 5,
    style   : (args) => {
      const name = args.COUNTYNAME + " " + args.TOWNNAME;
      const intensity = intensity_float_to_int(variable.eew_list[_eew_list[last_map_count]].eew_intensity_list[name].i);
      let color = (!intensity) ? "#3F4045" : int_to_color(intensity);
      let nsspe = 0;
      for (const i of Object.keys(data.eq.area))
        if (data.eq.area[i].includes(region_string_to_code(constant.REGION, args.COUNTYNAME, args.TOWNNAME).toString())) {
          nsspe = i;
          break;
        }
      if (nsspe) color = int_to_color(nsspe);
      return {
        color       : (intensity == 4 || intensity == 5 || intensity == 6) ? "grey" : "white",
        weight      : (nsspe) ? 1.5 : 0.4,
        fillColor   : color,
        fillOpacity : 1,
      };
    },
  }).addTo(variable.map);
  document.getElementById("info-depth").textContent = data.eq.depth;
  document.getElementById("info-no").textContent = `第${data.serial}報${(data.final) ? "(最終)" : ""}`;
  document.getElementById("info-loc").textContent = data.eq.loc;
  document.getElementById("info-mag").textContent = data.eq.mag.toFixed(1);
  document.getElementById("info-time").textContent = formatTime(data.eq.time);
  document.getElementById("info-title-box-type").textContent = ((_eew_list.length > 1) ? `${last_map_count + 1}/${_eew_list.length} ` : "") + ((!data.status) ? "地震速報(注意)｜CWA" : (data.status == 1) ? "地震速報(警報)｜CWA" : "地震速報(取消)｜CWA");
  document.getElementById("info-box").style.backgroundColor = (!data.status) ? "#FF9900" : (data.status == 1) ? "#C00000" : "#505050";
  const info_intensity = document.getElementById("info-intensity");
  info_intensity.textContent = intensity_list[data.eq.max];
  info_intensity.className = `info-body-title-title-box intensity-${data.eq.max}`;
}, 1000);

function findClosestDepth(depth) {
  const keys = Object.keys(constant.TIME_TABLE);
  let closestKey = keys[0];
  let minDiff = Math.abs(depth - parseInt(closestKey));

  keys.forEach(key => {
    const diff = Math.abs(depth - parseInt(key));
    if (diff < minDiff) {
      minDiff = diff;
      closestKey = key;
    }
  });

  return constant.TIME_TABLE[closestKey].S;
}

// setTimeout(() => {
//   show_eew({
//     type   : "eew",
//     author : "cwa",
//     id     : "1",
//     serial : 1,
//     status : 0,
//     final  : 1,
//     eq     : {
//       time  : new Date().getTime() - 10000,
//       lon   : 121,
//       lat   : 23,
//       depth : 10,
//       mag   : 7,
//       loc   : "未知區域",
//       area  : {},
//       max   : 0,
//     },
//     time      : new Date().getTime(),
//     timestamp : new Date().getTime(),
//   });
// }, 5000);

function show_eew(data) {
  // console.log(data);
  const now_time = data.time + (now() - data.timestamp);
  const dist = ps_wave_dist(data.eq.depth, data.eq.time, now_time);
  const p_dist = dist.p_dist;
  const s_dist = dist.s_dist || 0;

  if (data.status == 3) {
    if (!variable.eew_list[data.id].cancel) {
      variable.eew_list[data.id].cancel = true;
      constant.AUDIO.UPDATE.play();
      variable.eew_list[data.id].layer.s.remove();
      variable.eew_list[data.id].layer.s_fill.remove();
      variable.eew_list[data.id].layer.p.remove();
      const iconElement = variable.eew_list[data.id].layer.epicenterIcon.getElement();
      if (iconElement) {
        iconElement.style.opacity = "0.5";
        iconElement.className = "cancel";
        iconElement.style.visibility = "visible";
      }
      setTimeout(() => {
        variable.eew_list[data.id].layer.epicenterIcon.remove();
        delete variable.eew_list[data.id];
      }, 30000);
    }
    return;
  }

  if (!variable.eew_list[data.id]) {
    constant.AUDIO.EEW.play();
    variable.eew_list[data.id] = {
      data  : data,
      layer : {
        epicenterIcon: L.marker([data.eq.lat, data.eq.lon], { icon: L.icon({
          iconUrl   : "../resource/image/cross.png",
          iconSize  : [40 + variable.icon_size * 3, 40 + variable.icon_size * 3],
          className : "flash",
        }), zIndexOffset: 2000 })
          .addTo(variable.map),
        p: L.circle([data.eq.lat, data.eq.lon], {
          color     : "#00FFFF",
          fillColor : "transparent",
          radius    : p_dist,
          weight    : 2,
        }).addTo(variable.map),
        s: L.circle([data.eq.lat, data.eq.lon], {
          color     : "red",
          fillColor : "transparent",
          radius    : s_dist,
          weight    : 2,
        }).addTo(variable.map),
        s_fill: L.gradientCircle([data.eq.lat, data.eq.lon], {
          radius         : s_dist,
          gradientColors : ["rgba(255, 0, 0, 0)", "rgba(255, 0, 0, 0.6)"],
          pane           : "circlePane",
        }).addTo(variable.map),
      },
    };

    if (!s_dist) {
      const progress = Math.round(((now_time - data.eq.time) / 1000 / constant.TIME_TABLE[data.eq.depth][0].S) * 100);
      const progress_bar = `<div style="border-radius: 5px;background-color: aqua;height: ${progress}%;"></div>`;
      variable.eew_list[data.id].layer.epicenterTooltip = true;
      variable.eew_list[data.id].layer.epicenterIcon.bindTooltip(progress_bar, { opacity: 1, permanent: true, direction: "right", offset: [10, 0], className: "progress-tooltip" });
    } else
      if (variable.eew_list[data.id].layer.epicenterTooltip) {
        variable.eew_list[data.id].layer.epicenterIcon.unbindTooltip();
        delete variable.eew_list[data.id].layer.epicenterTooltip;
      }
  } else
    if (data.serial != variable.eew_list[data.id].data.serial) {
      constant.AUDIO.UPDATE.play();
      variable.eew_list[data.id].data = data;
      variable.eew_list[data.id].layer.epicenterIcon.setLatLng([data.eq.lat, data.eq.lon]);
      variable.eew_list[data.id].layer.s.setLatLng([data.eq.lat, data.eq.lon]);
      variable.eew_list[data.id].layer.s_fill.setLatLng([data.eq.lat, data.eq.lon]);
      variable.eew_list[data.id].layer.p.setLatLng([data.eq.lat, data.eq.lon]);
    } else return;

  if (data.eq.max > 4 && !variable.eew_list[data.id].alert) {
    variable.eew_list[data.id].alert = true;
    constant.AUDIO.ALERT.play();
  }

  variable.eew_list[data.id].eew_intensity_list = eew_area_pga(data.eq.lat, data.eq.lon, data.eq.depth, data.eq.mag);
  // console.log(intensity_list);
  last_map_update = 0;
}

function ps_wave_dist(depth, time, now) {
  let p_dist = 0;
  let s_dist = 0;

  const _time_table = constant.TIME_TABLE_OBJECT[findClosest(constant.TIME_TABLE_OBJECT, depth)];
  let prev_table = null;
  if (_time_table)
    for (const table of _time_table) {
      if (!p_dist && table.P > (now - time) / 1000)
        if (prev_table) {
          const t_diff = table.P - prev_table.P;
          const r_diff = table.R - prev_table.R;
          const t_offset = (now - time) / 1000 - prev_table.P;
          const r_offset = (t_offset / t_diff) * r_diff;
          p_dist = prev_table.R + r_offset;
        } else p_dist = table.R;

      if (!s_dist && table.S > (now - time) / 1000)
        if (prev_table) {
          const t_diff = table.S - prev_table.S;
          const r_diff = table.R - prev_table.R;
          const t_offset = (now - time) / 1000 - prev_table.S;
          const r_offset = (t_offset / t_diff) * r_diff;
          s_dist = prev_table.R + r_offset;
        } else s_dist = table.R;
      if (p_dist && s_dist) break;
      prev_table = table;
    }
  if (!p_dist) {
    const p_time = pow((now - time) / 1000 * 7);
    const p_depth = pow(depth);
    if (p_time > p_depth) p_dist = Math.sqrt(p_time - p_depth);
  }
  if (!s_dist) {
    const s_time = pow((now - time) / 1000 * 4);
    const s_depth = pow(depth);
    if (s_time > s_depth) s_dist = Math.sqrt(s_time - s_depth);
  }

  p_dist *= 1000;
  s_dist *= 1000;
  return { p_dist, s_dist };
}

L.GradientCircle = L.Circle.extend({
  options: {
    gradientColors: ["rgba(255, 0, 0, 1)", "rgba(255, 0, 0, 0)"],
  },

  _updatePath() {
    if (this._renderer && this._renderer._updateGradientCircle)
      this._renderer._updateGradientCircle(this);
  },
});

L.gradientCircle = function(latlng, options) {
  return new L.GradientCircle(latlng, options);
};

L.Canvas.include({
  _updateGradientCircle(layer) {
    if (!this._drawing || layer._empty()) return;

    const p = layer._point,
      ctx = this._ctx,
      r = Math.max(Math.round(layer._radius), 1),
      s = (Math.max(Math.round(layer._radiusY), 1) || r) / r;

    if (s != 1) {
      ctx.save();
      ctx.scale(1, s);
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y / s, r, 0, Math.PI * 2, false);

    const gradient = ctx.createRadialGradient(p.x, p.y / s, r * 0.3, p.x, p.y / s, r);
    gradient.addColorStop(0, layer.options.gradientColors[0]);
    gradient.addColorStop(1, layer.options.gradientColors[1]);

    ctx.fillStyle = gradient;
    ctx.fill();
    if (s != 1) ctx.restore();
  },
});
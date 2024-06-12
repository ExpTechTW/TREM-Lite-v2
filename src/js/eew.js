/* eslint-disable no-undef */
const current_location_int = querySelector(".local-intensity");
let draw_lock = false;
let last_show_epicenter_time = 0;
let last_map_update = 0;
let last_map_count = 0;
setInterval(() => {
  const _eew_list = Object.keys(variable.eew_list);

  if (!_eew_list.length)
    return;


  if (_eew_list.length)
    show_rts_list(1);

  if (draw_lock) return;
  draw_lock = true;
  variable.focus.bounds.eew = L.latLngBounds();
  variable.focus.status.eew = 1;
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
    const p_dist = (dist.p_dist < 0) ? 0 : dist.p_dist;
    const s_dist = (dist.s_dist < 0) ? 0 : dist.s_dist;
    variable.eew_list[data.id].dist = s_dist;
    const s_t = dist.s_t;
    variable.eew_list[data.id].layer.p.setRadius(p_dist);
    variable.eew_list[data.id].layer.s.setRadius(s_dist);
    variable.eew_list[data.id].layer.s_fill.setRadius(s_dist);
    if (_eew_list[last_map_count] == id) {
      variable.focus.bounds.eew.extend([data.eq.lat, data.eq.lon]);
      if (!data.eq.max) variable.focus.bounds.eew.extend(variable.eew_list[data.id].layer.s.getBounds());
      else {
        const intensity_list = variable.eew_list[_eew_list[last_map_count]].eew_intensity_list;
        for (const name of Object.keys(intensity_list)) {
          const intensity = intensity_float_to_int(intensity_list[name].i);
          if (intensity > 1 && s_dist / 1000 > intensity_list[name].dist)
            variable.focus.bounds.eew.extend([intensity_list[name].lat, intensity_list[name].lon]);
        }
        variable.focus.bounds.eew.extend(variable.focus.bounds.rts);
      }
    }
    if (s_t) {
      const progress = Math.floor(((now_time - data.eq.time) / 1000 / s_t) * 100);
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
    const flashElements = getElementsByClassName("flash");
    for (const item of flashElements) item.style.visibility = "visible";
    setTimeout(() => {
      for (const item of flashElements) item.style.visibility = "hidden";
    }, 500);
  }
  draw_lock = false;
}, 0);

setInterval(() => {
  const _eew_list = Object.keys(variable.eew_list);

  if (!_eew_list.length) {
    show_rts_list(false);
    return;
  }

  const now_local_time = Date.now();
  if (now_local_time - last_map_update < 10000) return;
  last_map_update = now_local_time;
  last_map_count++;
  if (last_map_count >= _eew_list.length) last_map_count = 0;

  const data = variable.eew_list[_eew_list[last_map_count]].data;
  if (!variable.focus.status.intensity) {
    const hash = crypto.createHash("sha256").update(JSON.stringify(variable.eew_list[_eew_list[last_map_count]].eew_intensity_list));
    const digest = hash.digest("hex");
    if (variable.last_map_hash != digest) {
      variable.last_map_hash = digest;
      if (variable.intensity_geojson) variable.intensity_geojson.remove();
      if (data.status != 3) variable.intensity_geojson = L.geoJson.vt(require(path.join(__dirname, "../resource/map", "town.json")), {
        minZoom : 4,
        maxZoom : 12,
        buffer  : 256,
        zIndex  : 5,
        style   : (args) => {
          const name = args.COUNTYNAME + " " + args.TOWNNAME;
          const intensity = intensity_float_to_int(variable.eew_list[_eew_list[last_map_count]] ? variable.eew_list[_eew_list[last_map_count]].eew_intensity_list[name].i : "");
          curr_loc_int(name, intensity);
          let color = (!intensity) ? "#3F4045" : int_to_color(intensity);
          let nsspe = 0;
          if (data.eq.area)
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
    }
  }
  (data.status == 1) ? "" : curr_loc_int("", 0);
  getElementById("info-depth").textContent = data.eq.depth;
  getElementById("info-no").textContent = `第${data.serial}報${(data.final) ? "(最終)" : ""}`;
  getElementById("info-loc").textContent = data.eq.loc;
  getElementById("info-mag").textContent = data.eq.mag.toFixed(1);
  getElementById("info-time").textContent = formatTime(data.eq.time);
  getElementById("info-title-box-type").textContent = ((_eew_list.length > 1) ? `${last_map_count + 1}/${_eew_list.length} ` : "") + ((!data.status) ? "地震速報｜CWA" : (data.status == 1) ? "緊急地震速報｜CWA" : "地震速報(取消)｜CWA");
  getElementById("info-box").style.backgroundColor = (!data.status) ? "#FF9900" : (data.status == 1) ? "#C00000" : "#505050";
  const info_intensity = getElementById("info-intensity");
  info_intensity.textContent = intensity_list[data.eq.max];
  info_intensity.className = `info-body-title-title-box intensity-${data.eq.max}`;
}, 1000);

function curr_loc_int(name, intensity) {
  const curr_loc = JSON.parse(localStorage.getItem("current-location"));
  if (name.includes(`${curr_loc.city} ${curr_loc.town}`) || !name) {
    current_location_int.textContent = intensity ? intensity : "0";
    const classes = current_location_int.className.split(" ");
    for (const cls of classes)
      if (cls.startsWith("intensity-"))
        current_location_int.classList.remove(cls);
    current_location_int.classList.add(`intensity-${intensity ? intensity : "0"}`);
  }
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

  if (data.serial == 10 || data.serial == 11 || data.serial == 12 || data.serial == 13)
    data.status = 3;

  if (data.status == 3) {
    if (data.final && variable.eew_list[data.id]) variable.eew_list[data.id].cancel_timer = setTimeout(() => {
      if (variable.eew_list[data.id]) variable.eew_list[data.id].layer.epicenterIcon.remove();
      delete variable.eew_list[data.id];
    }, 30000);
    else {
      if (variable.eew_list[data.id]) variable.eew_list[data.id].data = data;
      last_map_update = 0;
      if (variable.eew_list[data.id] && !variable.eew_list[data.id].cancel) {
        if (variable.eew_list[data.id]) variable.eew_list[data.id].cancel = true ;
        if (checkbox("sound-effects-Update") == true) constant.AUDIO.UPDATE.play();
        variable.eew_list[data.id].layer.s.remove();
        variable.eew_list[data.id].layer.s_fill.remove();
        variable.eew_list[data.id].layer.p.remove();
        const iconElement = variable.eew_list[data.id].layer.epicenterIcon.getElement();
        if (iconElement) {
          iconElement.style.opacity = "0.5";
          iconElement.className = "cancel";
          iconElement.style.visibility = "visible";
        }
      }
    }
    return;
  }

  if (!variable.eew_list[data.id] || variable.eew_list[data.id].cancel) {
    if (variable.eew_list[data.id] && variable.eew_list[data.id].cancel) {
      if (variable.eew_list[data.id]) variable.eew_list[data.id].layer.epicenterIcon.remove() ;
      show_rts_list(false);
    } else
      if (checkbox("sound-effects-EEW") == 1) constant.AUDIO.EEW.play();

    if (!variable.eew_list[data.id])
      if (variable.speech_status) {
        if (speech.speaking()) speech.cancel();
        speech.speak({ text: `${data.eq.loc}地震` });
        setTimeout(() => {
          const max = variable.eew_list[data.id].data.eq.max;
          speech.speak({ text: `預估最大震度${intensity_list[max].replace("⁺", "強").replace("⁻", "弱")}` });
          variable.eew_list[data.id].speech.max = max;
        }, 3000);
      }

    variable.eew_list[data.id] = {
      data   : data,
      speech : {
        loc : "",
        max : -1,
      },
      layer: {
        epicenterIcon: L.marker([data.eq.lat, data.eq.lon], { icon: L.icon({
          iconUrl   : "../resource/image/cross.png",
          iconSize  : [40 + variable.icon_size * 3, 40 + variable.icon_size * 3],
          className : "flash",
        }), zIndexOffset: 20000 })
          .addTo(variable.map),
        p: L.circle([data.eq.lat, data.eq.lon], {
          color     : "#00FFFF",
          fillColor : "transparent",
          radius    : p_dist,
          weight    : 2,
        }).addTo(variable.map),
        s: L.circle([data.eq.lat, data.eq.lon], {
          color     : (data.status) ? "red" : "#FF9224",
          fillColor : "transparent",
          radius    : s_dist,
          weight    : 2,
        }).addTo(variable.map),
        s_fill: L.gradientCircle([data.eq.lat, data.eq.lon], {
          radius         : s_dist,
          gradientColors : (data.status) ? ["rgba(255, 0, 0, 0)", "rgba(255, 0, 0, 0.6)"] : ["rgba(255, 146, 36, 0)", "rgba(255, 146, 36, 0.6)"],
          pane           : "circlePane",
        }).addTo(variable.map),
      },
      dist: 0,
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
    if (data.serial > variable.eew_list[data.id].data.serial) {
      if (checkbox("sound-effects-Update") == 1) constant.AUDIO.UPDATE.play();
      if (!variable.eew_list[data.id].data.status && data.status) {
        variable.eew_list[data.id].layer.s.remove();
        variable.eew_list[data.id].layer.s_fill.remove();
        variable.eew_list[data.id].layer.s = L.circle([data.eq.lat, data.eq.lon], {
          color     : (data.status) ? "red" : "#FF9224",
          fillColor : "transparent",
          radius    : s_dist,
          weight    : 2,
        }).addTo(variable.map);
        variable.eew_list[data.id].layer.s_fill = L.gradientCircle([data.eq.lat, data.eq.lon], {
          radius         : s_dist,
          gradientColors : (data.status) ? ["rgba(255, 0, 0, 0)", "rgba(255, 0, 0, 0.6)"] : ["rgba(255, 146, 36, 0)", "rgba(255, 146, 36, 0.6)"],
          pane           : "circlePane",
        }).addTo(variable.map);
      } else {
        variable.eew_list[data.id].layer.s.setLatLng([data.eq.lat, data.eq.lon]);
        variable.eew_list[data.id].layer.s_fill.setLatLng([data.eq.lat, data.eq.lon]);
      }
      variable.eew_list[data.id].data = data;
      variable.eew_list[data.id].layer.epicenterIcon.setLatLng([data.eq.lat, data.eq.lon]);
      variable.eew_list[data.id].layer.p.setLatLng([data.eq.lat, data.eq.lon]);
    } else return;

  if (data.eq.max > 4 && !variable.eew_list[data.id].alert) {
    variable.eew_list[data.id].alert = true;
    if (checkbox("sound-effects-ALERT") == 1) constant.AUDIO.ALERT.play();
  }

  variable.eew_list[data.id].eew_intensity_list = eew_area_pga(data.eq.lat, data.eq.lon, data.eq.depth, data.eq.mag);
  // console.log(intensity_list);
  last_map_update = 0;
  toHome();
}

function ps_wave_dist(depth, time, now) {
  let p_dist = 0;
  let s_dist = 0;
  let s_t = 0;

  const t = (now - time) / 1000;

  const _time_table = constant.TIME_TABLE[findClosest(constant.TIME_TABLE_OBJECT, depth)];
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
/* eslint-disable no-undef */
get_station_info();
setInterval(get_station_info, constant.STATION_INFO_FETCH_TIME);

const max_pga_text = getElementById("max-pga");
const realtime_list = getElementById("realtime-list");

function get_station_info() {
  logger.info("[Fetch] Fetching station data...");
  let retryCount = 0;
  const retryClock = setInterval(async () => {
    retryCount++;

    try {
      const res = await fetchData(`${API_url()}v1/trem/station`);
      const data = await res.json();

      if (data) {
        logger.info("[Fetch] Got station data");
        variable.station_info = data;
        clearInterval(retryClock);
      }
    } catch (err) {
      logger.error(`[Fetch] ${err} (Try #${retryCount})`);
    }
  }, constant.API_HTTP_RETRY);
}

function show_rts_box(_colors) {
  const _colors_ = {};
  const _eew_list = Object.keys(variable.eew_list);
  variable.focus.bounds.rts = L.latLngBounds();
  Object.keys(_colors).forEach(key => {
    let passed = false;
    if (_eew_list.length) {
      const box = constant.BOX_GEOJSON.features.find(item => item.id == key).geometry.coordinates[0];
      if (!variable.focus.bounds.eew) variable.focus.status.rts = 1;
      for (let _i = 0; _i < 4; _i++)
        variable.focus.bounds.rts.extend([box[_i][1], box[_i][0]]);
      for (const id of _eew_list) {
        const data = variable.eew_list[id].data;
        let SKIP = 0;
        for (let _i = 0; _i < 4; _i++) {
          const dist = distance(data.eq.lat, data.eq.lon)(box[_i][1], box[_i][0]);
          if (variable.eew_list[id].dist / 1000 > dist) SKIP++;
        }
        if (SKIP >= 4) {
          passed = true;
          break;
        }
      }
    }
    if (!passed)
      if (_colors[key] > 3) _colors_[key] = "#FF0000";
      else if (_colors[key] > 1) _colors_[key] = "#F9F900";
      else _colors_[key] = "#28FF28";
  });
  constant.BOX_GEOJSON.features.sort((a, b) => {
    const colorA = _colors_[a.properties.id] || "other";
    const colorB = _colors_[b.properties.id] || "other";
    const priorityA = constant.COLOR_PRIORITY[colorA] != undefined ? constant.COLOR_PRIORITY[colorA] : 3;
    const priorityB = constant.COLOR_PRIORITY[colorB] != undefined ? constant.COLOR_PRIORITY[colorB] : 3;
    return priorityB - priorityA;
  });
  const geojsonLayer = L.geoJson.vt(constant.BOX_GEOJSON, {
    style : (properties) => ({ weight: 3, fillColor: "transparent", color: _colors_[properties.id] || "transparent" }),
    pane  : "detection",
  }).addTo(variable.map);
  setTimeout(() => geojsonLayer.remove(), 500);
}

function show_rts_dot(data, alert) {
  if (!variable.station_info) return;

  if (!alert)
    variable.audio = {
      shindo : -1,
      pga    : -1,
      status : {
        shindo : 0,
        pga    : 0,
      },
      count: {
        pga_1    : 0,
        pga_2    : 0,
        shindo_1 : 0,
        shindo_2 : 0,
      },
    };
  else {
    realtime_list.innerHTML = "";

    for (const area of data.int) {
      const box = createElement("div");
      box.className = "realtime-item";

      const int = createElement("div");
      int.className = `realtime-intensity intensity-${area.i}`;
      int.textContent = int_to_intensity(area.i);

      const loc = createElement("div");
      loc.className = "realtime-location";
      const loc_str = region_code_to_string(constant.REGION, area.code);
      loc.textContent = `${loc_str.city}${loc_str.town}`;

      box.appendChild(int);
      box.appendChild(loc);
      realtime_list.appendChild(box);
    }
  }

  for (const _id of Object.keys(variable.station_icon)) {
    variable.station_icon[_id].remove();
    delete variable.station_icon[_id];
  }

  let max_pga = -1;
  let max_shindo = -1;
  let trigger = 0;
  let level = 0;

  for (const id of Object.keys(data.station)) {
    if (!variable.station_info[id]) continue;
    const i = intensity_float_to_int(data.station[id].i);
    const intensityClass = `pga_dot pga_${data.station[id].i.toString().replace(".", "_")}`;
    const I = intensity_float_to_int(data.station[id].I);
    const icon = (!data.station[id].alert) ? L.divIcon({
      className : intensityClass,
      html      : "<span></span>",
      iconSize  : [10 + variable.icon_size, 10 + variable.icon_size],
    }) : L.divIcon({
      className : (I == 0) ? "pga_dot pga-intensity-0" : `dot intensity-${I}`,
      html      : `<span>${(I == 0) ? "" : int_to_intensity(I)}</span>`,
      iconSize  : [20 + variable.icon_size, 20 + variable.icon_size],
    });

    const pga = data.station[id].pga;

    const info = variable.station_info[id].info.at(-1);
    if (data.station[id].alert) {
      trigger++;
      level += pga;
    }

    let loc = region_code_to_string(constant.REGION, info.code);

    if (!loc) loc = "未知區域";
    else loc = `${loc.city}${loc.town}`;

    if (max_pga < pga) max_pga = pga;
    if (max_shindo < i) max_shindo = i;

    const station_text = `<div class='report_station_box'><div><span class="tooltip-location">${loc}</span><span class="tooltip-uuid">${id} | ${variable.station_info[id].net}</span></div><div class="tooltip-fields"><div><span class="tooltip-field-name">加速度(cm/s²)</span><span class="tooltip-field-value">${pga.toFixed(1)}</span></div><div><span class="tooltip-field-name">速度(cm/s)</span><span class="tooltip-field-value">${data.station[id].pgv.toFixed(1)}</span></div><div><span class="tooltip-field-name">震度</span><span class="tooltip-field-value">${data.station[id].i.toFixed(1)}</span></div></div></div>`;

    if (alert) {
      if (pga > variable.audio.pga) {
        if (pga > 200 && variable.audio.status.pga != 2) {
          if (checkbox("sound-effects-PGA2") == 1) constant.AUDIO.PGA2.play();
          variable.audio.status.pga = 2;
        } else if (pga > 8 && !variable.audio.status.pga) {
          if (checkbox("sound-effects-PGA1") == 1) constant.AUDIO.PGA1.play();
          variable.audio.status.pga = 1;
        }
        variable.audio.pga = pga;
        if (pga > 8) variable.audio.count.pga_1 = 0;
        if (pga > 200) variable.audio.count.pga_2 = 0;
      }
      if (i > variable.audio.shindo) {
        if (i > 3 && variable.audio.status.shindo != 3) {
          if (checkbox("sound-effects-Shindo2") == 1) constant.AUDIO.SHINDO2.play();
          variable.audio.status.shindo = 3;
        } else if (i > 1 && variable.audio.status.shindo < 2) {
          if (checkbox("sound-effects-Shindo1") == 1) constant.AUDIO.SHINDO1.play();
          variable.audio.status.shindo = 2;
        } else if (!variable.audio.status.shindo) {
          if (checkbox("sound-effects-Shindo0") == 1) constant.AUDIO.SHINDO0.play();
          variable.audio.status.shindo = 1;
        }
        if (i > 3) variable.audio.count.shindo_2 = 0;
        if (i > 1) variable.audio.count.shindo_1 = 0;
        variable.audio.shindo = i;
      }
    }
    if (variable.audio.pga && max_pga < variable.audio.pga) {
      if (variable.audio.status.pga == 2)
        if (max_pga < 200) {
          variable.audio.count.pga_2++;
          if (variable.audio.count.pga_2 >= 30) {
            variable.audio.count.pga_2 = 0;
            variable.audio.status.pga = 1;
          }
        } else variable.audio.count.pga_2 = 0;
      else if (variable.audio.status.pga == 1)
        if (max_pga < 8) {
          variable.audio.count.pga_1++;
          if (variable.audio.count.pga_1 >= 30) {
            variable.audio.count.pga_1 = 0;
            variable.audio.status.pga = 0;
          }
        } else variable.audio.count.pga_1 = 0;
      variable.audio.pga = max_pga;
    }
    if (variable.audio.shindo && max_shindo < variable.audio.shindo) {
      if (variable.audio.status.shindo == 3)
        if (max_shindo < 4) {
          variable.audio.count.shindo_2++;
          if (variable.audio.count.shindo_2 >= 15) {
            variable.audio.count.shindo_2 = 0;
            variable.audio.status.shindo = 2;
          }
        } else variable.audio.count.shindo_2 = 0;
      else if (variable.audio.status.shindo == 2)
        if (max_shindo < 2) {
          variable.audio.count.shindo_1++;
          if (variable.audio.count.shindo_1 >= 15) {
            variable.audio.count.shindo_1 = 0;
            variable.audio.status.shindo = 1;
          }
        } else variable.audio.count.shindo_1 = 0;
      variable.audio.shindo = max_shindo;
    }

    if ((!Object.keys(data.box).length && !Object.keys(variable.eew_list).length) || data.station[id].alert)
      if (!variable.focus.status.intensity) variable.station_icon[id] = L.marker([info.lat, info.lon], { icon: icon, zIndexOffset: I * 1000 })
        .bindTooltip(station_text, { opacity: 1 })
        .addTo(variable.map);
  }

  max_pga_text.textContent = `${(max_pga > 999) ? "999+" : max_pga.toFixed(2)} gal`;
  max_pga_text.className = `intensity-${max_shindo}`;
  getElementById("trigger").textContent = trigger;
  getElementById("level").textContent = Math.round(level);
}
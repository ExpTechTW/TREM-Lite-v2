/* eslint-disable no-undef */

// show_intensity({
//   "type"   : "intensity",
//   "author" : "trem",
//   "id"     : 1712102295000,
//   "alert"  : 0,
//   "serial" : 1,
//   "final"  : 0,
//   "area"   : {
//     "2": [
//       962,
//       981,
//       978,
//     ],
//     "4": [
//       974,
//       976,
//       977,
//       979,
//     ],
//     "5": [
//       975,
//     ],
//     "6": [
//       970,
//       971,
//       973,
//     ],
//   },
//   "max": 6,
// });

function show_intensity(data) {
  if (!variable.intensity_list[data.id] || variable.intensity_list[data.id].data.serial < data.serial) {
    if (checkbox("sound-effects-EEW2") == true) constant.AUDIO.INTENSITY.play();
    if (!variable.intensity_list[data.id])
      variable.intensity_list[data.id] = {
        data,
        speech: {
          max : -1,
          loc : "",
        },
      };
    else variable.intensity_list[data.id].data = data;
    variable.focus.bounds.intensity = L.latLngBounds();
    const area_intensity_list = {};
    const max_city_list = [];
    for (const int of Object.keys(data.area))
      for (const code of data.area[int]) {
        const loc = region_code_to_string(constant.REGION, code);
        if (loc) {
          area_intensity_list[`${loc.city} ${loc.town}`] = int;
          variable.focus.bounds.intensity.extend([loc.lat, loc.lon]);
          if (int == data.max && !max_city_list.includes(loc.city)) max_city_list.push(loc.city);
        }
      }
    variable.focus.status.intensity = Date.now();
    variable.intensity_time = Date.now();

    if (variable.speech_status) {
      const loc_str = max_city_list.join("、");
      if (variable.intensity_list[data.id].speech.max < data.max || variable.intensity_list[data.id].speech.loc != loc_str) {
        variable.intensity_list[data.id].speech.max = data.max;
        variable.intensity_list[data.id].speech.loc = loc_str;
        if (speech.speaking()) speech.cancel();
        speech.speak({ text: `震度速報，最大震度${intensity_list[data.max].replace("⁺", "強").replace("⁻", "弱")}，${loc_str}` });
      }
    }

    if (variable.intensity_geojson) variable.intensity_geojson.remove();
    variable.intensity_geojson = L.geoJson.vt(require(path.join(__dirname, "../resource/map", "town.json")), {
      minZoom : 4,
      maxZoom : 12,
      buffer  : 256,
      zIndex  : 5,
      style   : (args) => {
        const name = args.COUNTYNAME + " " + args.TOWNNAME;
        const intensity = area_intensity_list[name];
        const color = (!intensity) ? "#3F4045" : int_to_color(intensity);
        return {
          color       : "transparent",
          weight      : 0,
          fillColor   : color,
          fillOpacity : 1,
        };
      },
    }).addTo(variable.map);
    variable.last_map_hash = "";
  }
}
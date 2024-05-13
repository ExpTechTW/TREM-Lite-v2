/* eslint-disable no-undef */
variable.map = L.map("map", {
  maxBounds          : [[60, 50], [10, 180]],
  preferCanvas       : true,
  attributionControl : false,
  zoomSnap           : 0.25,
  zoomDelta          : 0.25,
  doubleClickZoom    : false,
  zoomControl        : false,
  minZoom            : 5.5,
  maxZoom            : 10,
});

variable.map.createPane("circlePane");
variable.map.getPane("circlePane").style.zIndex = 10;

variable.map.createPane("detection");
variable.map.getPane("detection").style.zIndex = 2000;

for (const map_name of constant.MAP_LIST)
  L.geoJson.vt(require(path.join(__dirname, "../resource/map", `${map_name}.json`)), {
    edgeBufferTiles : 2,
    minZoom         : 5.5,
    maxZoom         : 10,
    style           : {
      weight      : 0.6,
      color       : (map_name == "TW") ? "white" : "gray",
      fillColor   : "#3F4045",
      fillOpacity : 0.5,
    },
  }).addTo(variable.map);

variable.map.setView([23.6, 120.4], 7.8);

// L.marker([24.38, 121.93], {
//   icon: L.icon({
//     iconUrl   : "../resource/image/cross.png",
//     iconSize  : [40, 40 ],
//     className : "flash",
//   }), zIndexOffset: 2000,
// })
//   .addTo(variable.map);

// L.marker([24.39, 121.93], {
//   icon: L.divIcon({
//     className : "dot pga_-3",
//     html      : "<span></span>",
//     iconSize  : [40, 40],
//   }), zIndexOffset: 2000,
// })
//   .addTo(variable.map);

variable.icon_size = (Number(variable.map.getZoom().toFixed(1)) - 7.8) * 2;

function updateIconSize() {
  variable.icon_size = (Number(variable.map.getZoom().toFixed(1)) - 7.8) * 2;

  for (const key in variable.eew_list) {
    const oldMarker = variable.eew_list[key].layer.epicenterIcon;
    const newIconSize = [40 + variable.icon_size * 3, 40 + variable.icon_size * 3];

    const icon = variable.eew_list[key].layer.epicenterIcon.options.icon;
    icon.options.iconSize = [40 + variable.icon_size * 3, 40 + variable.icon_size * 3];
    oldMarker.setIcon(icon);

    if (oldMarker.getTooltip())
      oldMarker.bindTooltip(oldMarker.getTooltip()._content, {
        opacity   : 1,
        permanent : true,
        direction : "right",
        offset    : [newIconSize[0] / 2, 0],
        className : "progress-tooltip",
      });

    if (variable.eew_list[key].cancel) {
      const iconElement = oldMarker.getElement();
      if (iconElement) {
        iconElement.style.opacity = "0.5";
        iconElement.className = "cancel";
        iconElement.style.visibility = "visible";
      }
    }
  }
}

variable.map.on("zoomend", updateIconSize);
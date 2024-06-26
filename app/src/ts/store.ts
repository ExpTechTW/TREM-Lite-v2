import { defineStore } from "pinia";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MAP_LIST = ["TW", "JP", "CN", "KR", "KP"];

export const useMapStore = defineStore("map", {
  actions: {
    init_map(mapElement: HTMLElement) {
      const map = L.map(mapElement, {
        maxBounds: [
          [60, 50],
          [10, 180],
        ],
        preferCanvas: true,
        attributionControl: false,
        zoomSnap: 0.25,
        zoomDelta: 0.25,
        doubleClickZoom: false,
        zoomControl: false,
        minZoom: 5.5,
        maxZoom: 10,
      });

      map.createPane("circlePane");
      map.getPane("circlePane").style.zIndex = "10";

      map.createPane("detection");
      map.getPane("detection").style.zIndex = "2000";

      for (const map_name of MAP_LIST) {
        fetch(`../resource/map/${map_name}.json`)
          .then((response) => response.json())
          .then((data) => {
            const options = {
              edgeBufferTiles: 2,
              minZoom: 5.5,
              maxZoom: 10,
              style: {
                weight: 0.6,
                color: map_name === "TW" ? "white" : "gray",
                fillColor: "#3F4045",
                fillOpacity: 0.5,
              },
            };

            L.geoJSON(data, options).addTo(map);
          })
          .catch((error) => {
            console.error("Error loading GeoJSON:", error);
          });
      }

      map.setView([23.6, 120.4], 7.8);

      map.on("zoomend", updateIconSize);

      interface EewItem {
        data: {
          eq: {
            lat: number;
            lon: number;
          };
          dist: number;
        };
        layer: any;
        cancel: any;
      }

      const variable: { eew_list: EewItem[] } = { eew_list: [] };
      function updateIconSize(): void {
        const icon_size = (Number(map.getZoom().toFixed(1)) - 7.8) * 2;

        for (const key in variable.eew_list) {
          const oldMarker = variable.eew_list[key].layer.epicenterIcon;
          const newIconSize = [40 + icon_size * 3, 40 + icon_size * 3];

          const icon = variable.eew_list[key].layer.epicenterIcon.options.icon;
          icon.options.iconSize = newIconSize;
          oldMarker.setIcon(icon);

          if (oldMarker.getTooltip()) {
            oldMarker.bindTooltip(oldMarker.getTooltip()._content, {
              opacity: 1,
              permanent: true,
              direction: "right",
              offset: [newIconSize[0] / 2, 0],
              className: "progress-tooltip",
            });
          }

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
      this.map = map;
    },
  },
  state: (): MapState => {
    return {
      lastMapUpdate: 0,
      lastMapHash: "",
      map: null,
      eew_list: {},
      layer: "",
      focus: {
        bounds: {
          eew: null,
          rts: null,
        },
        status: {
          eew: 0,
        },
      },
      TIME_TABLE: {},
      TIME_TABLE_OBJECT: [],
    };
  },
});

interface MapState {
  lastMapUpdate: number;
  lastMapHash: string;
  map: L.Map;
  eew_list?: Record<string, any>;
  layer: string;
  focus: {
    bounds: {
      eew: L.LatLngBounds;
      rts: L.LatLngBounds;
    };
    status: {
      eew: number;
    };
  };
  TIME_TABLE: Record<string, any>;
  TIME_TABLE_OBJECT: Array<number>;
}

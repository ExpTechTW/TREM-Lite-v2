// import { onMounted, onUnmounted } from "vue";
// import { variable } from "../ts/constant";
// import L from "leaflet";

// export const useTsunamiUpdate = () => {
//   let tsunamiLayer: L.Layer | null = null;

//   const showTsunami = () => {
//     fetch("../resource/map/tsunami.json")
//       .then((response) => response.json())
//       .then((data) => {
//         if (tsunamiLayer) {
//           (variable.map as any).removeLayer(tsunamiLayer);
//         }

//         tsunamiLayer = L.vectorGrid
//           .slicer(data, {
//             rendererFactory: L.svg.tile,
//             vectorTileLayerStyles: {
//               sliced: (properties) => ({
//                 fillColor: "red",
//                 fillOpacity: 1,
//                 stroke: true,
//                 color: "red",
//                 weight: 5,
//               }),
//             },
//           })
//           .addTo(variable.map);

//         setTimeout(() => {
//           if (tsunamiLayer) {
//             (variable.map as any).removeLayer(tsunamiLayer);
//           }
//         }, 2000);
//       })
//       .catch((error) => {
//         console.error("Error loading GeoJSON:", error);
//       });
//   };

//   onMounted(() => {
//     setInterval(showTsunami, 3000);

//     // 清理定時器
//     onUnmounted(() => {
//       clearInterval(showTsunami);
//     });
//   });
// };

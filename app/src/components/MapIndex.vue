<template>
  <div id="map" ref="mapElement" class="h-dvh w-full"></div>
</template>

<script setup lang="ts">
import { getStationInfo } from "../ts/rts";
import { useMapStore } from "../ts/store";
import { ref, onMounted } from "vue";

const mapElement = ref<HTMLElement>();
const MapStore = useMapStore();
const fetchStationData = async () => {
  try {
    const data = await getStationInfo();
  } catch (error) {
    console.error("Failed to fetch station data:", error);
  }
};

onMounted(() => {
  if (mapElement.value) {
    console.log(MapStore);
    MapStore.init_map(mapElement.value);
  }
  fetchStationData();
  setInterval(fetchStationData, 300_000);
});
</script>

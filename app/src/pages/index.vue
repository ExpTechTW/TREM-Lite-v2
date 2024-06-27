<template>
  <div
    class="backdrop-blur-18 absolute inset-0 z-[1002] hidden flex-col items-center justify-center bg-black bg-opacity-100 text-white opacity-100 transition-opacity duration-300"
  >
    <div
      class="tos_wrapper border-opacity-14 opacity-1 flex w-auto flex-col items-center rounded-lg border border-white p-4 transition-opacity duration-300"
    >
      <div class="tos_title text-2xl font-bold">TOS 服務條款</div>
      <div
        class="tos_exptech h-25 text-opacity-36 mb-2 flex items-center justify-around text-center"
      >
        © ExpTech Studio
      </div>
      <div class="tos_body">
        <li>透過服務使用，使用者被視為已同意遵守服務條款。</li>
        <li>嚴禁未經授權的再分發行為。</li>
        <li>嚴禁轉售TREM提供的資訊。</li>
        <li>禁止違反法律法規，以及違反公共秩序和道德準則的行為。</li>
        <li>除上述條款外，任何開發團隊認為不適當的行為均不被允許。</li>
        <li>TREM使用P2P技術傳遞資訊。</li>
        <li>所有資訊以中央氣象署(CWA)發布的內容為準。</li>
      </div>

      <div
        class="tos_sure border-opacity-14 mt-4 flex h-9 w-56 cursor-pointer items-center justify-around rounded-md border bg-black bg-opacity-85 text-center"
      >
        我已詳細閱讀 並同意上述條款
      </div>
    </div>
  </div>

  <!--最大加速度&Level&Trigger-->
  <div class="int-info relative z-[1001]">
    <div
      class="max-pga pointer-events-none absolute left-1 top-1 z-10 w-20 rounded-md border-2 border-black border-opacity-10 bg-black bg-opacity-75 p-1 text-center text-xs font-medium text-white"
    >
      <div>最大加速度</div>
      <div id="max-pga" class="intensity-0 mt-1 rounded p-0.5">
        {{ maxPga ? maxPga : "0.00" }} gal
      </div>
    </div>
    <div
      class="rts-info-box pointer-events-none absolute left-24 top-1 z-10 w-20 rounded-md border-2 border-black border-opacity-10 bg-black bg-opacity-75 p-1 text-center text-xs font-medium text-white"
    >
      <div class="rts-info-body flex justify-between">
        <div>level</div>
        <div id="level">0</div>
      </div>
      <div class="rts-info-body flex justify-between">
        <div>trigger</div>
        <div id="trigger">0</div>
      </div>
    </div>
  </div>

  <!--時間-->
  <div
    :class="
      timeUpdate.docColor.value +
      ' connect-wrapper pointer-events-none absolute bottom-0 left-0 z-[1001] m-1 ml-1 flex items-center rounded-lg border-2 border-black border-opacity-10 bg-black bg-opacity-75 p-px'
    "
  >
    <div class="time text-red z-10 text-sm font-bold">
      {{ timeUpdate.docTime.value }}
    </div>
    <div class="icon text-red z-10">
      <svg
        id="connect"
        width="25"
        height="25"
        fill="currentColor"
        class="bi bi-diagram-2-fill"
        viewBox="0 0 16 16"
      >
        <path
          fill-rule="evenodd"
          d="M6 3.5A1.5 1.5 0 0 1 7.5 2h1A1.5 1.5 0 0 1 10 3.5v1A1.5 1.5 0 0 1 8.5 6v1H11a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 5 7h2.5V6A1.5 1.5 0 0 1 6 4.5zm-3 8A1.5 1.5 0 0 1 4.5 10h1A1.5 1.5 0 0 1 7 11.5v1A1.5 1.5 0 0 1 5.5 14h-1A1.5 1.5 0 0 1 3 12.5zm6 0a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 9 12.5z"
        />
      </svg>
    </div>
  </div>

  <!--報數-->
  <div
    id="info-box"
    class="info-box pointer-events-none absolute right-0 top-0 z-[1001] m-2 flex w-[20vw] min-w-[300px] max-w-[320px] flex-col gap-1 whitespace-nowrap rounded-lg bg-[rgba(56,56,56,0.73)] bg-opacity-75 p-2 text-white"
    style="
      transition-property: opacity, transform;
      transition-duration: 0.2s;
      transition-timing-function: cubic-bezier(0.3, 0, 0.8, 0.15);
    "
  >
    <div class="flex justify-between px-2 text-sm font-bold">
      <div>暫無生效中的地震預警</div>
      <div>第4報</div>
    </div>
    <div
      class="info-body-box relative flex flex-col gap-1 rounded-lg bg-[rgba(0,0,0,0.4)] p-2"
    >
      <div class="h-18 opacity-1 flex gap-2">
        <!--預估最大震度-->
        <div class="flex flex-col items-center gap-1">
          <div
            class="info-body-title-title-box line-height-[56px] font-open-sans intensity-1 flex h-[4.3rem] w-[4.3rem] flex-row flex-wrap items-center justify-center rounded-xl p-2 text-center text-4xl font-extrabold"
            id="info-intensity"
          >
            <span>3</span>
          </div>
          <div class="text-xs">預估最大震度</div>
        </div>
        <!--速報資訊-->
        <div class="flex w-full flex-col">
          <div
            class="flex flex-1 flex-col justify-center rounded-xl bg-[rgba(0,0,0,0.4)] p-2 pb-0 pt-0"
          >
            <div
              class="info-body-location-text font-noto-sans-tc text-xl font-bold"
              :class="{ 'info-body-location-text': true }"
            >
              花蓮縣壽豐鄉
            </div>
            <div class="flex justify-between p-1 pb-0 pt-0">
              <!--規模-->
              <div
                class="info-body-magnitude isolation-isolate magnitude-6 relative flex h-8 items-center gap-1"
                :class="{ 'info-body-magnitude': true }"
              >
                <div class="h-full w-1 rounded-sm bg-fuchsia-600"></div>
                <div class="relative flex items-center gap-1">
                  <span class="absolute text-2xl font-bold opacity-20"
                    >規模</span
                  >
                  <span class="mt-2 text-xs font-bold text-gray-400">M</span>
                  <span class="text-2xl font-bold">7.3</span>
                </div>
              </div>
              <!--深度-->
              <div
                class="info-body-magnitude isolation-isolate magnitude-6 relative flex h-8 items-center gap-1"
                :class="{ 'info-body-magnitude': true }"
              >
                <div class="relative flex items-end gap-1">
                  <span class="absolute text-2xl font-bold opacity-20"
                    >深度</span
                  >
                  <span class="text-lg font-bold">7.3</span>
                  <span class="mb-0.5 text-xs font-bold text-gray-400">km</span>
                </div>
                <div class="h-6 w-1 rounded-sm bg-red-600"></div>
              </div>
            </div>
            <div class="mt-0.5 text-lg font-bold" v-if="false">
              <span>NSSPE</span><span>無震源參數推算</span>
            </div>
          </div>
          <div class="mt-1 flex justify-end gap-2 text-xs">
            <span class="font-bold">2024/06/26 00:00:00</span>
            <span>發震</span>
          </div>
        </div>
      </div>

      <div
        class="cancel-box absolute left-0 top-0 hidden h-full w-full flex-col items-center justify-center rounded-lg bg-[rgba(0,0,0,0.4)] bg-opacity-60 text-white backdrop-blur-sm"
      >
        <div class="flex w-20 justify-between text-3xl font-extrabold">
          <span>取</span><span>消</span>
        </div>
        <div class="text-sm font-medium">此地震速報已取消</div>
      </div>
    </div>
  </div>

  <div
    class="absolute bottom-0 right-0 z-[1001] m-2 flex h-[calc(100vh-145px)] w-[calc(20vw+16px)] min-w-[300px] max-w-[320px] flex-col gap-8"
  >
    <!--即時震度-->
    <div class="relative top-6 z-10 flex min-h-0 flex-1 flex-col text-white">
      <div
        class="flex min-h-0 flex-col gap-1 rounded-lg bg-[rgba(56,56,56,0.73)] bg-opacity-75 p-2"
      >
        <div class="text-lg font-bold">即時震度</div>
        <div
          class="realtime-list flex min-h-0 flex-col gap-1 overflow-y-scroll rounded-xl"
        >
          <div class="rt-item">
            <div class="rt-int intensity-6">5⁺</div>
            <div class="rt-loc">花蓮縣花蓮市</div>
          </div>
          <div class="rt-item">
            <div class="rt-int intensity-5">5⁻</div>
            <div class="rt-loc">花蓮縣花蓮市</div>
          </div>
          <div class="rt-item">
            <div class="rt-int intensity-5">5⁻</div>
            <div class="rt-loc">花蓮縣花蓮市</div>
          </div>
          <div class="rt-item">
            <div class="rt-int intensity-5">5⁻</div>
            <div class="rt-loc">花蓮縣花蓮市</div>
          </div>
          <div class="rt-item">
            <div class="rt-int intensity-5">5⁻</div>
            <div class="rt-loc">花蓮縣花蓮市</div>
          </div>
          <div class="rt-item">
            <div class="rt-int intensity-5">5⁻</div>
            <div class="rt-loc">花蓮縣花蓮市</div>
          </div>
          <div class="rt-item">
            <div class="rt-int intensity-5">5⁻</div>
            <div class="rt-loc">花蓮縣花蓮市</div>
          </div>
          <div class="rt-item">
            <div class="rt-int intensity-5">5⁻</div>
            <div class="rt-loc">花蓮縣花蓮市</div>
          </div>
          <div class="rt-item">
            <div class="rt-int intensity-5">5⁻</div>
            <div class="rt-loc">花蓮縣花蓮市</div>
          </div>
          <div class="rt-item">
            <div class="rt-int intensity-5">5⁻</div>
            <div class="rt-loc">花蓮縣花蓮市</div>
          </div>
          <div class="rt-item">
            <div class="rt-int intensity-5">5⁻</div>
            <div class="rt-loc">花蓮縣花蓮市</div>
          </div>
          <div class="rt-item">
            <div class="rt-int intensity-5">5⁻</div>
            <div class="rt-loc">花蓮縣花蓮市</div>
          </div>
          <div class="rt-item">
            <div class="rt-int intensity-5">5⁻</div>
            <div class="rt-loc">花蓮縣花蓮市</div>
          </div>
          <div class="rt-item">
            <div class="rt-int intensity-5">5⁻</div>
            <div class="rt-loc">花蓮縣花蓮市</div>
          </div>
        </div>
      </div>
    </div>

    <!--所在地預估-->
    <div
      class="z-10 flex h-20 gap-0.5 rounded-lg bg-[rgba(56,56,56,0.73)] bg-opacity-75 p-2 pl-3 text-white"
    >
      <div
        class="text-center text-xs opacity-60"
        style="writing-mode: vertical-rl"
      >
        所在地預估
      </div>
      <div
        class="relative flex flex-1 gap-2 rounded-xl bg-[rgba(80,80,80,0.78)]"
      >
        <div
          class="leading-11 intensity-8 flex h-16 w-16 items-center justify-center rounded-xl p-2 text-center text-4xl font-extrabold shadow-md"
        >
          6⁺
        </div>
        <div class="grid flex-1 grid-cols-2">
          <div class="flex flex-col gap-1 p-1">
            <div class="text-sm opacity-60">P波</div>
            <div class="text-center text-2xl font-bold">10</div>
          </div>
          <div class="flex flex-col gap-1 p-1">
            <div class="text-sm opacity-60">S波</div>
            <div class="text-center text-2xl font-bold">抵達</div>
          </div>
        </div>
        <div
          class="absolute right-0 h-5 w-5 -translate-y-1/4 translate-x-1/4 transform rounded-full bg-slate-500 text-center text-xs font-semibold leading-5 text-black"
        >
          1
        </div>
      </div>
    </div>
  </div>

  <MapIndex />
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import MapIndex from "../components/MapIndex.vue";
import utils from "../ts/utils";
import { startEewInterval } from "../ts/eew";

const maxPga = ref("");
const realtimeData = ref([]);
const timeUpdate = utils.useTimeUpdate();

onMounted(() => {
  startEewInterval();
});
</script>

<style lang="css">
@import "../css/intensity.css";
</style>

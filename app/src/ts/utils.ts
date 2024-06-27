import { ref, onMounted, onUnmounted } from "vue";
import crypto from "crypto";
import { useMapStore } from "../ts/store";

const utils = {
  url: (t: string) => {
    return `https://${t}-${Math.ceil(Math.random() * 2)}.exptech.dev/api/`;
  },
  ntp: async () => {
    const res = await fetch(
      `https://lb-${Math.ceil(Math.random() * 4)}.exptech.com.tw/ntp`,
    );
    const data = await res.text();
    useMapStore().time_offset = Number(data) - Date.now();
  },
  int_to_intensity: (int: string | number) => {
    return typeof int === "number" ? useMapStore().intensity_list[int] : "0";
  },
  parseJSON: (jsonString: string) => {
    try {
      return JSON.parse(jsonString);
    } catch (err) {
      return null;
    }
  },
  now: () => Date.now() + 0,
  formatTwoDigits: (n: number) => (n < 10 ? "0" + n : n),
  generateMD5: (input: string) => {
    return crypto.createHash("md5").update(input).digest("hex");
  },
  region_code_to_string: (region: any, code: string) => {
    for (const city of Object.keys(region))
      for (const town of Object.keys(region[city]))
        if (region[city][town].code == code)
          return {
            city,
            town,
            lat: region[city][town].lat,
            lon: region[city][town].lon,
          };
    return null;
  },
  region_string_to_code: (region: any, city: string, town: string) => {
    if (region[city][town]) return region[city][town].code;
    return null;
  },
  formatTime: (timestamp: string | number | Date) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  },
  findClosest: (arr: number[], target: number) => {
    return arr.reduce((prev, curr) =>
      Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev,
    );
  },
  pow: (num: number) => {
    return Math.pow(num, 2);
  },
  eew_area_pga: (lat: number, lon: number, depth: number, mag: number) => {
    const json: any = {};
    let eew_max_i = 0;

    for (const city of Object.keys(useMapStore().REGION)) {
      for (const town of Object.keys(useMapStore().REGION[city])) {
        const info = useMapStore().REGION[city][town];
        const dist_surface = utils.distance(lat, lon)(info.lat, info.lon);
        const dist = Math.sqrt(utils.pow(dist_surface) + utils.pow(depth));
        const pga =
          1.657 * Math.pow(Math.E, 1.533 * mag) * Math.pow(dist, -1.607);
        let i = utils.pga_to_float(pga);

        if (i >= 4.5) {
          i = utils.eew_area_pgv([lat, lon], [info.lat, info.lon], depth, mag);
        }

        if (i > eew_max_i) {
          eew_max_i = i;
        }

        json[`${city} ${town}`] = { dist, i, lat: info.lat, lon: info.lon };
      }
    }

    json.max_i = eew_max_i;
    return json;
  },
  // eew_location_info: (data: any) => {
  //   const dist_surface = distance(data.lat, data.lon)(
  //     TREM.user.lat,
  //     TREM.user.lon,
  //   );
  //   const dist = Math.sqrt(pow(dist_surface) + pow(data.depth));
  //   const pga =
  //     1.657 *
  //     Math.pow(Math.E, 1.533 * data.scale) *
  //     Math.pow(dist, -1.607) *
  //     (storage.getItem("site") ?? 1.751);
  //   let i = pga_to_float(pga);
  //   if (i > 3)
  //     i = eew_i(
  //       [data.lat, data.lon],
  //       [TREM.user.lat, TREM.user.lon],
  //       data.depth,
  //       data.scale,
  //     );
  //   return { dist, i };
  // },
  eew_area_pgv: (
    epicenterLocaltion: any,
    pointLocaltion: any,
    depth: number,
    magW: number,
  ) => {
    const long = 10 ** (0.5 * magW - 1.85) / 2;
    const epicenterDistance = utils.distance(
      epicenterLocaltion[0],
      epicenterLocaltion[1],
    )(pointLocaltion[0], pointLocaltion[1]);
    const hypocenterDistance =
      (depth ** 2 + epicenterDistance ** 2) ** 0.5 - long;
    const x = Math.max(hypocenterDistance, 3);
    const gpv600 =
      10 **
      (0.58 * magW +
        0.0038 * depth -
        1.29 -
        Math.log10(x + 0.0028 * 10 ** (0.5 * magW)) -
        0.002 * x);
    const pgv400 = gpv600 * 1.31;
    const pgv = pgv400 * 1.0;
    return 2.68 + 1.72 * Math.log10(pgv);
  },
  distance: (latA: number, lngA: number) => {
    return (latB: number, lngB: number) => {
      latA = (latA * Math.PI) / 180;
      lngA = (lngA * Math.PI) / 180;
      latB = (latB * Math.PI) / 180;
      lngB = (lngB * Math.PI) / 180;
      const sin_latA = Math.sin(Math.atan(Math.tan(latA)));
      const sin_latB = Math.sin(Math.atan(Math.tan(latB)));
      const cos_latA = Math.cos(Math.atan(Math.tan(latA)));
      const cos_latB = Math.cos(Math.atan(Math.tan(latB)));
      return (
        Math.acos(
          sin_latA * sin_latB + cos_latA * cos_latB * Math.cos(lngA - lngB),
        ) * 6371.008
      );
    };
  },
  pga_to_float: (pga: number) => {
    return 2 * Math.log10(pga) + 0.7;
  },
  pga_to_intensity: (pga: number) => {
    return utils.intensity_float_to_int(utils.pga_to_float(pga));
  },
  intensity_float_to_int: (float: number) => {
    return float < 0
      ? 0
      : float < 4.5
        ? Math.round(float)
        : float < 5
          ? 5
          : float < 5.5
            ? 6
            : float < 6
              ? 7
              : float < 6.5
                ? 8
                : 9;
  },
  int_to_color: (int: number) => {
    const list = [
      "#202020",
      "#003264",
      "#0064C8",
      "#1E9632",
      "#FFC800",
      "#FF9600",
      "#FF6400",
      "#FF0000",
      "#C00000",
      "#9600C8",
    ];
    return list[int];
  },
  useTimeUpdate: () => {
    const docTime = ref<string>("");
    const docColor = ref<string>("");
    const updateTime = () => {
      const _now = utils.now();
      let colorClass = "text-white";
      if (useMapStore().replay) {
        docTime.value = utils.formatTime(useMapStore().replay);
        colorClass = "text-yellow-300";
      } else if (_now - useMapStore().last_get_data_time > 5000) {
        docTime.value = utils.formatTime(_now);
        colorClass = "text-red-600";
      } else {
        docTime.value = utils.formatTime(_now);
      }
      docColor.value = colorClass;
    };
    onMounted(() => {
      updateTime();
      const timer = setInterval(updateTime, 1000);
      onUnmounted(() => {
        clearInterval(timer);
      });
    });
    return {
      docTime,
      docColor,
    };
  },
};

export default utils;

/* eslint-disable no-undef */
const version = $("#version");
const system_os = $("#system_os");
const system_cpu = $("#system_cpu");
const SettingWrapper = $(".setting-wrapper");
const SettingBtn = $("#nav-settings-panel");
const Back = $(".back_to_home");
const ResetBtn = $(".setting-reset-btn");
const ResetConfirmWrapper = $(".reset-confirm-wrapper");
const ResetCancel = $(".reset-cancel");
const ResetSure = $(".reset-sure");
const LoginBtn = $(".login-btn");
const Forget = $("#forget");
const BuyVip = $(".buy-vip");

const LocationWrapper = $(".usr-location");
const Location = LocationWrapper.querySelector(".location");
const LocationSelWrapper = LocationWrapper.querySelector(".select-wrapper");
const localItems = LocationSelWrapper.querySelector(".local");
const CitySel = LocationSelWrapper.querySelector(".current-city");
const CityItems = LocationSelWrapper.querySelector(".city");
const TownSel = LocationSelWrapper.querySelector(".current-town");
const TownItems = LocationSelWrapper.querySelector(".town");

const AppVersion = $(".app-version");
const CurrentVersion = $("#current-version");
const NewVersion = $("#new-version");

// 版本號、UUID
version.textContent = app.getVersion();
system_os.textContent = `${os.version()} (${os.release()})`;
system_cpu.textContent = `${os.cpus()[0].model}`;

function ls_init() {
  return new Promise(async (resolve) => {
    await config_init();
    await realtimeStation();
    if (config && config.setting["user-checkbox"])
      variable.speech_status = config.setting["user-checkbox"]["other-voice"];
    Object.entries(constant.SETTING.LOCALSTORAGE_DEF).forEach(
      ([key, value]) => {
        if (!config.setting[key]) {
          config.setting[key] = value;
          WriteConfig(config);
        }
      }
    );

    const def_loc = constant.SETTING.LOCALSTORAGE_DEF["location"];
    const def_loc_info = constant.REGION[def_loc.city][def_loc.town];

    if (!config.setting["station"]) {
      config.setting["station"] = NearStation(
        def_loc_info.lat,
        def_loc_info.lon
      );
      WriteConfig(config);
    }

    const userCheckbox = config.setting["user-checkbox"] || {};
    Object.keys(constant.SETTING.CHECKBOX_DEF).forEach((key, value) => {
      if (!(key in userCheckbox)) {
        console.log(constant.SETTING.CHECKBOX_DEF[key]);
        userCheckbox[key] = constant.SETTING.CHECKBOX_DEF[key];
      }
    });

    config.setting["user-checkbox"] = userCheckbox;
    WriteConfig(config);

    if (config.setting["login"]) {
      LoginBtn.click();
      LoginSuccess(await getUserInfo(config.setting["login"]));
    }

    if (document.readyState !== "loading") {
      RenderSelectedFromConfig();
      resolve();
    }

    fault();
    usr_location();
    report(0);
  });
}
ls_init().then(() => {
  console.log("Initialization complete");
});

// 左側選單按鈕點擊
querySelectorAll(".setting-buttons .button").forEach((button) => {
  button.addEventListener("click", () => {
    const targetPage = querySelector(`.${button.getAttribute("for")}`);

    document
      .querySelectorAll(".setting-options-page")
      .forEach((page) => page.classList.remove("active"));
    targetPage.classList.add("active");

    document
      .querySelectorAll(".setting-buttons .button")
      .forEach((btn) => btn.classList.remove("on"));
    button.classList.add("on");
  });
});

// 重置按鈕點擊事件
ResetBtn.onclick = () => {
  ResetConfirmWrapper.style.bottom = "0";
};

document.onclick = (event) => {
  const target = event.target;
  if (!ResetConfirmWrapper.contains(target) && !ResetBtn.contains(target))
    ResetConfirmWrapper.style.bottom = "-100%";
};

// 確定重置按鈕點擊事件
ResetSure.onclick = async () => {
  const { LOCALSTORAGE_DEF, CHECKBOX_DEF } = constant.SETTING;
  const {
    location: { lat, lon },
  } = LOCALSTORAGE_DEF;

  config.setting = {
    ...config.setting,
    ...LOCALSTORAGE_DEF,
    "user-checkbox": { ...CHECKBOX_DEF },
    station: await NearStation(lat, lon),
  };

  querySelectorAll(".switch input[type='checkbox']").forEach((checkbox) => {
    checkbox.checked = config.setting["user-checkbox"][checkbox.id] == 1;
  });

  WriteConfig(config);
  fault();
  usr_location();
  RenderSelectedFromConfig();
  ResetConfirmWrapper.style.bottom = "-100%";
};

// 取消重置按鈕點擊事件
ResetCancel.onclick = () => {
  ResetConfirmWrapper.style.bottom = "-100%";
};

// 設定按鈕點擊事件
SettingBtn.onclick = () => {
  const _eew_list = Object.keys(variable.eew_list);
  if (_eew_list.length) return;

  display([SettingWrapper], "block");
  requestAnimationFrame(() => {
    opacity([SettingWrapper], 1);
  });
};

// 返回按鈕點擊事件
Back.onclick = () => {
  display([SettingWrapper]);
  requestAnimationFrame(() => {
    opacity([SettingWrapper], 0);
  });
};

// 所在地-下拉選單點擊事件
Location.onclick = function () {
  const ArrowSpan = this.querySelector(".selected-btn");
  ArrowSpan.textContent =
    ArrowSpan.textContent.trim() == "keyboard_arrow_up"
      ? "keyboard_arrow_down"
      : "keyboard_arrow_up";
  LocationSelWrapper.classList.toggle("select-show-big");
};

// 所在地-點擊選項事件
const addLocationSelectEvent = (
  localItemsContainer,
  cityItemsContainer,
  selectElement
) => {
  [localItemsContainer, cityItemsContainer].forEach((container) => {
    container.addEventListener("click", (event) => {
      const selectedDiv = event.target.closest(
        ".usr-location .select-items > div"
      );
      if (selectedDiv) {
        selectElement.textContent = selectedDiv.textContent;
        container
          .querySelectorAll("div")
          .forEach((div) => div.classList.remove("select-option-selected"));
        selectedDiv.classList.add("select-option-selected");
      }
    });
  });
};

// 所在地-更新目前選項的city、town
const updateLocationSelectItems = (itemsContainer, items) => {
  itemsContainer.innerHTML = items.map((item) => `<div>${item}</div>`).join("");
};

// 所在地-將town推入city數組
Object.keys(constant.REGION).forEach((city) => {
  constant.SETTING.SPECIAL_LOCAL[city] = Object.keys(constant.REGION[city]);
});

// 所在地-local選單點擊事件
localItems.onclick = (event) => {
  const closestDiv = event.target.closest(".usr-location .select-items > div");
  if (closestDiv) {
    updateLocationSelectItems(
      CityItems,
      constant.SETTING.LOCAL_ARRAY[closestDiv.textContent]
    );
    updateLocationSelectItems(TownItems, []);
  }
};

// 所在地-city選單點擊事件
CityItems.onclick = (event) => {
  const closestDiv = event.target.closest(".usr-location .select-items > div");
  if (closestDiv) {
    CitySel.textContent = closestDiv.textContent;
    updateLocationSelectItems(
      TownItems,
      constant.SETTING.SPECIAL_LOCAL[closestDiv.textContent] || []
    );
  }
};

// 所在地-town選單點擊事件
TownItems.onclick = (event) => {
  const closestDiv = event.target.closest(".usr-location .select-items > div");
  if (closestDiv) {
    const city = CitySel.textContent;
    const town = closestDiv.textContent;
    const location =
      city !== "南陽州市" && city !== "重慶市"
        ? constant.REGION[city][town]
        : null;

    const usrLocalStation = location
      ? NearStation(location.lat, location.lon)
      : findStationByLocation(city, town);

    querySelector(".current-city").textContent = city;
    querySelector(".current-town").textContent = town;
    querySelector(
      ".current-station"
    ).textContent = `${usrLocalStation.net} ${usrLocalStation.code}-${usrLocalStation.name} ${usrLocalStation.loc}`;

    SaveSelectedLocationToConfig(city, town, JSON.stringify(usrLocalStation));
    usr_location();
  }
};

function findStationByLocation(city, town) {
  const location = `${city}${town}`;
  return (
    variable.setting.station.find((station) => station.loc == location) || null
  );
}

function NearStation(la, lo) {
  let min = Infinity;
  let closestStation = null;

  for (const station of variable.setting.station) {
    const dist_surface = Math.sqrt(
      (la - station.lat) ** 2 * 111 ** 2 + (lo - station.lon) ** 2 * 101 ** 2
    );
    if (dist_surface < min) {
      min = dist_surface;
      closestStation = station;
    }
  }

  return closestStation ? { ...closestStation } : null;
}

addLocationSelectEvent(localItems, CityItems, CitySel);
addLocationSelectEvent(localItems, TownItems, TownSel);

// 所在地-儲存user選擇的city和town到Config
const SaveSelectedLocationToConfig = (city, town, station) => {
  if (!["重慶市", "南陽州市"].includes(city)) {
    const { lat, lon } = constant.REGION[city][town];
    config.setting["location"] = { city, town, lat, lon };
    config.setting["station"] = JSON.parse(station);
    WriteConfig(config);
  }
};

const StationWrapper = $(".realtime-station");
const StationLocation = StationWrapper.querySelector(".location");
const StationSelWrapper = StationWrapper.querySelector(".select-wrapper");
const StationLocalItems = StationSelWrapper.querySelector(".local");
const StationSel = StationSelWrapper.querySelector(".current-station");
const StationItems = StationSelWrapper.querySelector(".station");

// 即時測站-取得即時測站
async function realtimeStation() {
  try {
    const res = await fetchData(`${API_url()}v1/trem/station`);
    const data = await res.json();

    if (data) {
      processStationData(data);
      RenderStationReg();
    }
  } catch (err) {
    logger.error(`[Fetch] ${err}`);
  }
}

// 即時測站-處理測站數據
function processStationData(data) {
  Object.entries(data).forEach(([station, { info }]) => {
    const latestInfo = info.at(-1);
    const loc =
      region_code_to_string(constant.REGION, latestInfo.code) ||
      getFallbackLocation(station);

    if (loc.city && !constant.SETTING.STATION_REGION.includes(loc.city)) {
      constant.SETTING.STATION_REGION.push(loc.city);
    }

    variable.setting.station.push({
      name: station,
      net: data[station].net,
      loc: loc.city ? `${loc.city}${loc.town}` : loc,
      code: latestInfo.code,
      lat: latestInfo.lat,
      lon: latestInfo.lon,
    });
  });
}

// 即時測站-取得未知站點名稱
function getFallbackLocation(station) {
  return constant.SETTING.LOCALFALLBACK[station] || "未知區域";
}

// 即時測站-渲染測站站點
function RenderStationReg() {
  StationLocalItems.innerHTML = "";

  const uniqueRegions = Array.from(
    new Set(constant.SETTING.STATION_REGION.map((city) => city.slice(0, -1)))
  ).sort();

  uniqueRegions.forEach((city) => {
    StationLocalItems.appendChild(CreatEle(city));
  });
}

// 即時測站-點擊縣市選項事件
StationLocalItems.onclick = handleCityItemClick;

function handleCityItemClick(event) {
  const target = event.target.closest(".realtime-station .select-items > div");
  if (target) {
    StationLocalItems.querySelectorAll("div").forEach((div) =>
      div.classList.remove("select-option-selected")
    );
    target.classList.add("select-option-selected");

    const selectedCity = target.textContent;
    const filteredStations = variable.setting.station.filter((station) =>
      station.loc.includes(selectedCity)
    );
    renderFilteredStations(filteredStations);
  }
}

// 即時測站-篩選對應縣市測站並排序後渲染
function renderFilteredStations(stations) {
  stations.sort((a, b) => a.loc.localeCompare(b.loc));

  StationItems.innerHTML = "";

  stations.forEach((station) => {
    const stationAttr = {
      "data-net": station.net,
      "data-code": station.code,
      "data-name": station.name,
      "data-loc": station.loc,
      "data-lat": station.lat,
      "data-lon": station.lon,
    };
    const stationDiv = CreatEle("", "", "", "", stationAttr);

    const netSpan = createElement("span");
    netSpan.textContent = station.net;
    netSpan.classList = station.net;

    const infoSpan = createElement("span");
    infoSpan.textContent = `${station.code}-${station.name} ${station.loc}`;

    stationDiv.appendChild(netSpan);
    stationDiv.appendChild(infoSpan);
    StationItems.appendChild(stationDiv);
  });
}

// 即時測站-下拉選單點擊事件
StationLocation.onclick = () => {
  const ArrowSpan = StationLocation.querySelector(".selected-btn");
  ArrowSpan.textContent =
    ArrowSpan.textContent.trim() == "keyboard_arrow_up"
      ? "keyboard_arrow_down"
      : "keyboard_arrow_up";
  StationSelWrapper.classList.toggle("select-show-big");
};

// 即時測站-點擊測站選項事件
function StationSelEvent(itemsContainer) {
  itemsContainer.onclick = (event) => {
    const closestDiv = event.target.closest(
      ".realtime-station .select-items > div"
    );
    if (closestDiv) {
      itemsContainer
        .querySelectorAll("div")
        .forEach((div) => div.classList.remove("select-option-selected"));
      closestDiv.classList.add("select-option-selected");

      const [match, net, details] =
        closestDiv.textContent.match(/^(MS-Net|SE-Net)(\d+-\d+.*)$/) || [];
      if (match) {
        const formattedText = `${net} ${details}`;
        StationSel.textContent = formattedText;
        console.log(formattedText);
        querySelector(".current-station").textContent = formattedText;
        const stationData = ["net", "code", "name", "loc", "lat", "lon"].reduce(
          (acc, attr) => {
            acc[attr] = closestDiv.getAttribute(`data-${attr}`);
            return acc;
          },
          {}
        );
        config.setting["station"] = stationData;
        WriteConfig(config);
      }
    }
  };
}
StationSelEvent(StationItems);

const elements = {
  LoginFormContent: $(".login-forms-content"),
  AccountInfoContent: $(".usr-account-info-content"),
  act: $(".account"),
  vip_time: $(".vip_time"),
  LoginBtn: $(".login-btn"),
  LogoutBtn: $(".logout-btn"),
  LoginBack: $(".login-back"),
  FormLogin: $("#form-login"),
  FormEmail: $("#email"),
  FormPassword: $("#password"),
  LoginMsg: $(".login_msg"),
  url: "https://api-1.exptech.dev/api/v3/et/",
};

function toggleForms(isLogin) {
  display([elements.LoginFormContent], isLogin ? "grid" : "none");
  display([elements.AccountInfoContent], isLogin ? "none" : "flex");
  requestAnimationFrame(() => {
    elements.LoginFormContent.classList.toggle("show-login-form", isLogin);
    elements.AccountInfoContent.classList.toggle("show-account-info", !isLogin);
  });
}

elements.LoginBtn.onclick = () => toggleForms(true);
elements.LoginBack.onclick = () => toggleForms(false);

async function handleUserAction(endpoint, options) {
  try {
    const response = await fetch(`${elements.url}${endpoint}`, options);
    const responseData = await response.text();
    const isSuccess = response.ok;
    const action = options.method == "POST" ? "登入" : "登出";

    elements.LoginMsg.className = isSuccess ? "success" : "error";
    elements.LoginMsg.textContent = isSuccess
      ? `${action}成功！`
      : response.status == 400 || response.status == 401
      ? "帳號或密碼錯誤！"
      : `伺服器異常(error ${response.status})`;

    if (isSuccess) {
      config.setting.login = responseData == "OK" ? "" : responseData || "";
      WriteConfig(config);
      endpoint == "login"
        ? LoginSuccess(await getUserInfo(responseData))
        : LogoutSuccess();
      $("#email").value = "";
      $("#password").value = "";
    } else {
      elements.LoginMsg.classList.add("shake");
    }

    elements.LoginMsg.addEventListener(
      "animationend",
      () => elements.LoginMsg.classList.remove("shake"),
      { once: true }
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

async function login(email, password) {
  await handleUserAction("login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      pass: password,
      name: `/TREM-Lite/${app.getVersion().split("-")[1]}/${os.release()}`,
    }),
  });
}

async function logout(token) {
  await handleUserAction("logout", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${token}`,
    },
  });
}

elements.LogoutBtn.onclick = () => logout(config.setting["user-key"]);
elements.FormLogin.onclick = async () =>
  login(elements.FormEmail.value, elements.FormPassword.value);
Forget.onclick = () =>
  ipcRenderer.send("openUrl", "https://exptech.dev/forgot");

BuyVip.onclick = () =>
  ipcRenderer.send("openUrl", "https://exptech.dev/pricing");

async function getUserInfo(token, retryCount = 0) {
  try {
    const response = await fetch(`${elements.url}info`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${token}`,
      },
    });
    if (response.ok) return await response.json();
    throw new Error(`伺服器異常(error ${response.status})`);
  } catch (error) {
    if (retryCount < variable.report.list_retry) {
      logger.error(`[Fetch] ${error} (Try #${retryCount})`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return getUserInfo(token, retryCount + 1);
    }
  }
}

function LoginSuccess(msg) {
  display([elements.LoginBtn]);
  display([elements.LogoutBtn], "flex");
  elements.act.textContent = msg.email;
  const data = msg.permission;
  elements.vip_time.textContent = msg.vip > 0 ? formatTime(msg.vip) : "";
  elements.LoginBack.dispatchEvent(clickEvent);
  display([BuyVip], "none");
}

function LogoutSuccess() {
  display([elements.LogoutBtn]);
  display([elements.LoginBtn], "flex");
  elements.act.textContent = "尚未登入";
  elements.vip_time.textContent = "";
  elements.LoginBtn.dispatchEvent(clickEvent);
  display([BuyVip], "block");
}

const clickEvent = new MouseEvent("click", {
  bubbles: 1,
  cancelable: 1,
  view: window,
});

// 預警條件
function initializeSel(type, location, showInt, selectWrapper, items) {
  location.onclick = () => {
    const ArrowSpan = location.querySelector(".selected-btn");
    ArrowSpan.textContent =
      ArrowSpan.textContent.trim() == "keyboard_arrow_up"
        ? "keyboard_arrow_down"
        : "keyboard_arrow_up";
    selectWrapper.classList.toggle("select-show-big");
  };

  items.onclick = (event) => {
    const target = event.target.closest(".select-items > div");
    if (target) {
      items
        .querySelectorAll("div")
        .forEach((div) => div.classList.remove("select-option-selected"));
      target.classList.add("select-option-selected");
      showInt.textContent = target.textContent;
      updateConfig(type.className, target.textContent);
    }
  };
}

function updateConfig(typeClassName, selectedValue) {
  const key = typeClassName.includes("warning-realtime-station")
    ? "realtime-station"
    : "estimate-int";

  config.setting.warning = config.setting.warning || {};
  config.setting.warning[key] = selectedValue;

  WriteConfig(config);
}

// 預警條件-即時測站
const initializeWarning = (selector) => {
  const warningElement = $(selector);
  const location = warningElement.querySelector(".location");
  const showInt = warningElement.querySelector(".realtime-int, .estimate-int");
  const selWrapper = warningElement.querySelector(".select-wrapper");
  const items = selWrapper.querySelector(".int");

  initializeSel(warningElement, location, showInt, selWrapper, items);
};

// 預警條件-預估震度
initializeWarning(".warning-realtime-station");
initializeWarning(".warning-estimate-int");

// 渲染震度選項列表
const Ints = querySelectorAll(".select-wrapper .int");
constant.SETTING.INTENSITY.forEach((text) => {
  const intItem = CreatEle(text);
  Ints.forEach((Int) => Int.appendChild(intItem.cloneNode(true)));
});

// 其他功能-設定頁面背景透明度滑塊
const sliderContainer = $(".slider-container");
const sliderTrack = $(".slider-track");
const sliderThumb = $(".slider-thumb");

let isDragging = false;

const updateSlider = (event) => {
  if (!isDragging) return;

  const { left, width } = sliderContainer.getBoundingClientRect();
  let newLeft = Math.max(0, Math.min(event.clientX - left, width));
  const percentage = (newLeft / width) * 100;
  const blurValue = (newLeft / width) * 20;

  sliderThumb.style.left = `${percentage}%`;
  sliderTrack.style.width = `${percentage}%`;
  SettingWrapper.style.backdropFilter = `blur(${blurValue}px)`;

  config.setting["bg-percentage"] = percentage;
  config.setting["bg-filter"] = blurValue;
  WriteConfig(config);
};

sliderThumb.addEventListener("mousedown", () => (isDragging = true));
addEventListener("mouseup", () => (isDragging = false));
addEventListener("mousemove", updateSlider);

// 從config取得user之前保存的選項
const GetSelectedFromConfig = () => {
  const {
    location = {},
    warning = {},
    "bg-percentage": bgPercentage = 100,
    "bg-filter": bgFilter = 20,
    station: station = "未知區域",
    "map-display-effect": effect = "1",
    "user-checkbox": selectedcheckbox,
  } = config.setting;

  sliderThumb.style.left = `${bgPercentage}%`;
  sliderTrack.style.width = `${bgPercentage}%`;
  SettingWrapper.style.backdropFilter = `blur(${bgFilter}px)`;

  return {
    city: location.city || "臺南市",
    town: location.town || "歸仁區",
    station: station,
    wrts: warning["realtime-station"] || "0級",
    wei: warning["estimate-int"] || "0級",
    effect,
    selectedcheckbox,
  };
};

// 渲染user之前保存的選項
function RenderSelectedFromConfig() {
  const { city, town, station, wrts, wei, effect, selectedcheckbox } =
    GetSelectedFromConfig();

  const updateText = (selector, text) => {
    querySelector(selector).textContent = text;
  };

  updateText(".current-city", city);
  updateText(".current-town", town);
  updateText(".realtime-int", wrts);
  updateText(".estimate-int", wei);

  const stationData = config.setting["station"];
  const stationText =
    station && station !== "null" && stationData
      ? `${stationData.net} ${stationData.code}-${stationData.name} ${stationData.loc}`
      : "未知區域";
  updateText(".current-station", stationText);

  const effect_text =
    Object.keys(constant.SETTING.MAP_DISPLAY)[effect - 1] || "unknown";
  updateText(".current-effect", effect_text);

  const SelectedCheckBoxes = selectedcheckbox || {};
  document
    .querySelectorAll(".switch input[type='checkbox']")
    .forEach((checkbox) => {
      checkbox.checked = SelectedCheckBoxes[checkbox.id] || false;
    });
}

const MapDisplayEff = $(".map-display-effect");
const MapDisplayEffSel = MapDisplayEff.querySelector(".current-effect");
const MapDisplayEffLocation = MapDisplayEff.querySelector(".location");
const MapDisplayEffSelWrapper = MapDisplayEff.querySelector(".select-wrapper");
const MapDisplayEffItems = MapDisplayEffSelWrapper.querySelector(".effect");

if (MapDisplayEffItems) {
  Object.entries(constant.SETTING.MAP_DISPLAY).forEach(([text, value]) => {
    const intItem = CreatEle(text, "", "", "", { "data-value": value });
    MapDisplayEffItems.appendChild(intItem);
  });
}

const addMapDisplayEffSelEvent = (container, selectElement) => {
  container.onclick = (event) => {
    const closestDiv = event.target.closest(".select-items > div");
    if (closestDiv) {
      selectElement.textContent = closestDiv.textContent;
      container
        .querySelectorAll("div")
        .forEach((div) => div.classList.remove("select-option-selected"));
      closestDiv.classList.add("select-option-selected");
    }
  };
};

// 地圖下拉選單箭頭
MapDisplayEffLocation.onclick = function () {
  const ArrowSpan = this.querySelector(".selected-btn");
  ArrowSpan.textContent =
    ArrowSpan.textContent.trim() == "keyboard_arrow_up"
      ? "keyboard_arrow_down"
      : "keyboard_arrow_up";
  MapDisplayEffSelWrapper.classList.toggle("select-show-big");
};

// 更新地圖顯示效果
const updateMapDisplayEffect = (selectedElement) => {
  MapDisplayEffSel.textContent = selectedElement.textContent;
  MapDisplayEffSelWrapper.querySelectorAll("div").forEach((div) =>
    div.classList.remove("select-option-selected")
  );
  selectedElement.classList.add("select-option-selected");

  config.setting["map-display-effect"] = selectedElement.dataset.value;
  WriteConfig(config);
};

// 地圖顯示效果下拉選單
MapDisplayEffItems.addEventListener("click", (event) => {
  const closestDiv = event.target.closest(
    ".map-display-effect .select-items > div"
  );
  if (closestDiv) {
    updateMapDisplayEffect(closestDiv);
  }
});

addMapDisplayEffSelEvent(MapDisplayEffItems, MapDisplayEffSel);

const Tos = $(".tos");
const tosWrapper = $(".tos_wrapper");
if (!ReadConfig().setting["tos"]) {
  display([Tos], "flex");
  setTimeout(() => {
    tosWrapper.style.height = "19em";
    opacity([tosWrapper], 1);
  }, 2500);

  $(".tos_sure").onclick = () => {
    opacity([Tos], 0);
    setTimeout(() => {
      display([Tos]);
      config.setting["tos"] = 1;
      WriteConfig(config);
    }, 2000);
  };
}

/** 滑條選中 **/
const checkboxes = querySelectorAll(".switch input[type='checkbox']");
const updateCheckboxesConfig = () => {
  const selectedCheckbox = Array.from(checkboxes).reduce((acc, cb) => {
    acc[cb.id] = cb.checked ? 1 : 0;
    return acc;
  }, {});
  config.setting["user-checkbox"] = selectedCheckbox;
  WriteConfig(config);
  fault();
};
checkboxes.forEach((checkbox) =>
  checkbox.addEventListener("change", updateCheckboxesConfig)
);

/** 檢查新版本**/
const app_version = app.getVersion();
async function checkForNewRelease() {
  try {
    const response = await fetch(
      "https://api.github.com/repos/ExpTechTW/TREM-Lite/releases"
    );
    if (!response.ok) throw new Error("Network response was not ok");

    const releases = await response.json();
    if (releases.length == 0) return;

    const latestVersion = releases[0].tag_name.replace("v", "");
    const isNewVersion = compareVersions(latestVersion, app_version) > 0;

    NewVersion.textContent = latestVersion;
    CurrentVersion.textContent = app_version;
    NewVersion.style.color = isNewVersion ? "#fff900" : "";
    AppVersion.classList.toggle("new", isNewVersion);
    AppVersion.style.display = isNewVersion ? "flex" : "none";
  } catch (error) {
    console.error("Failed to fetch release information:", error);
  }
}
checkForNewRelease();

function compareVersions(latest, current) {
  const toNumberArray = (version) => version.split(".").map(Number);
  const [latestParts, currentParts] = [
    toNumberArray(latest),
    toNumberArray(current),
  ];
  const length = Math.max(latestParts.length, currentParts.length);

  for (let i = 0; i < length; i++) {
    const [latestPart, currentPart] = [
      latestParts[i] || 0,
      currentParts[i] || 0,
    ];
    if (latestPart !== currentPart) return latestPart - currentPart;
  }

  return 0;
}

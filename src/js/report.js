/* eslint-disable no-useless-escape */
/* eslint-disable no-shadow */
/* eslint-disable no-undef */
const EEWInfoTitle = querySelector("#info-title-box-type");
const ReportListWrapper = querySelector(".report-list-wrapper");
const ReportListBtn = querySelector(".report-list-btn");
const ReportItem = querySelector(".report-list-items");
const ReportBoxWrapper = querySelector(".report-box-wrapper");
const ReportTitle = querySelector("#report-title");
const ReportSubTitle = querySelector("#report-subtitle");
const ReportMaxIntensity = querySelector("#report-max-intensity");
const ReportActionOpen = querySelector("#report-action-open");
const ReportLocation = querySelector("#report-location");
const ReportLongitude = querySelector("#report-longitude");
const ReportLatitude = querySelector("#report-latitude");
const ReportMagitude = querySelector("#report-magnitude");
const ReportDepth = querySelector("#report-depth");
const ReportTime = querySelector("#report-time");
const ReportBackBtn = querySelector("#report-back-btn");
const InfoBox = querySelector(".info-box");
const InfoBodyTitleBox = querySelector(".info-body-title-box");
const InfoBodyFooter = querySelector(".info-body-footer");
const ReportIntensityGrouped = querySelector("#report-intensity-grouped");

let Report_DATA = {};
let last_report = {};
const List_maxRetries = 3;
async function report(retryCount = 0) {
  let survey = null;
  let check_ = 1;
  for (const int in variable.intensity_list)
    survey = variable.intensity_list[int].data;


  try {
    logger.info("[Fetch] Fetching report data...");
    const ReportList = document.querySelector(".report-list-items");
    const res = await fetchData(`${API_url()}v2/eq/report?limit=20`);
    if (!res.ok) return;
    logger.info("[Fetch] Got report data");
    const data = await res.json();
    Report_DATA = data;
    ReportList.innerHTML = "";
    let WithoutNo = "";
    if (survey) check_ = 0;

    const FirstItem = survey ? survey : data[0];
    const First = document.createElement("div");
    First.classList.add("report-list-item-index", "first");
    First.setAttribute("data-report-id", survey ? "" : FirstItem.id);
    if ((!last_report || JSON.stringify(last_report) !== JSON.stringify({ id: FirstItem.id })) && UserCheckBox()["sound-effects-Report"] == true) {
      last_report = { id: FirstItem.id };
      constant.AUDIO.REPORT.play();
    }

    const No = survey ? "" : FirstItem.id.split("-");
    const check_No = survey ? "" : No[0].split(3)[1];

    if (check_No == "000")
      WithoutNo = "Normal";


    const IntWrapper = document.createElement("div");
    IntWrapper.classList.add("report-list-item-int-wrapper");

    const Int = document.createElement("div");
    Int.classList.add("report-list-item-int", `intensity-${survey ? survey.max : FirstItem.int}`);
    Int.textContent = survey ? survey.max : FirstItem.int;

    const IntTitle = document.createElement("div");
    IntTitle.classList.add("report-list-item-int-title");
    IntTitle.textContent = "觀測最大震度";

    IntWrapper.appendChild(Int);
    IntWrapper.appendChild(IntTitle);
    First.appendChild(IntWrapper);

    let InfoWrapper = document.createElement("div");
    InfoWrapper.classList.add("report-list-item-info-wrapper");

    const Info = document.createElement("div");
    Info.classList.add("report-list-item-info");

    const Location = document.createElement("div");
    Location.classList.add("report-list-item-location");
    Location.textContent = survey ? "震源 調查中" : LocalReplace(FirstItem.loc);

    const Time = document.createElement("div");
    Time.classList.add("report-list-item-time");
    Time.textContent = ReportTimeFormat(survey ? survey.id : FirstItem.time);

    Info.appendChild(Location);
    Info.appendChild(Time);
    InfoWrapper.appendChild(Info);

    if (!survey) {
      const MagDepthWrapper = document.createElement("div");
      MagDepthWrapper.classList.add("report-list-item-mag-depth");

      const Mag = document.createElement("div");
      Mag.classList.add("report-list-item-mag");
      Mag.dataset.backgroundText = "規模";
      Mag.innerHTML = `<div class="report-list-item-magnitude ${WithoutNo}">${FirstItem.mag < 10 ? FirstItem.mag.toFixed(1) : FirstItem.mag}</div>`;

      const KM = document.createElement("div");
      KM.classList.add("report-list-item-km");
      KM.dataset.backgroundText = "深度";
      KM.innerHTML = `<div class="km">${FirstItem.depth}</div>`;

      MagDepthWrapper.appendChild(Mag);
      MagDepthWrapper.appendChild(KM);

      InfoWrapper.appendChild(MagDepthWrapper);
    }

    First.appendChild(InfoWrapper);

    ReportList.appendChild(First);

    // 非First
    for (let i = check_; i < data.length; i++) {
      WithoutNo = "";
      const item = data[i];

      const No = item.id.split("-");
      const check_No = No[0].split(3)[1];

      if (check_No == "000")
        WithoutNo = "Normal";

      const Element = document.createElement("div");
      Element.classList.add("report-list-item-index");
      Element.setAttribute("data-report-id", item.id);

      const IntItem = document.createElement("div");
      IntItem.classList.add("report-list-item-int", `intensity-${item.int}`);
      IntItem.textContent = item.int;

      InfoWrapper = document.createElement("div");
      InfoWrapper.classList.add("report-list-item-info-wrapper");

      const InfoItem = document.createElement("div");
      InfoItem.classList.add("report-list-item-info");

      const LocationItem = document.createElement("div");
      LocationItem.classList.add("report-list-item-location");
      LocationItem.textContent = LocalReplace(item.loc);

      const TimeItem = document.createElement("div");
      TimeItem.classList.add("report-list-item-time");
      TimeItem.textContent = ReportTimeFormat(item.time);

      const MagItem = document.createElement("div");
      MagItem.classList.add("report-list-item-mag");
      MagItem.textContent = `M ${item.mag < 10 ? item.mag.toFixed(1) : item.mag}`;

      InfoItem.appendChild(LocationItem);
      InfoItem.appendChild(TimeItem);

      MagDepthWrapper = document.createElement("div");
      MagDepthWrapper.classList.add("report-list-item-mag-depth");

      const MagDepth = document.createElement("div");
      MagDepth.classList.add("report-list-item-mag", "report-list-item-mag-depth");
      MagDepth.dataset.backgroundText = "規模";
      MagDepth.innerHTML = `<div class="report-list-item-magnitude ${WithoutNo}">M ${item.mag < 10 ? item.mag.toFixed(1) : item.mag}</div>`;

      MagDepthWrapper.appendChild(MagDepth);
      InfoWrapper.appendChild(InfoItem);
      InfoWrapper.appendChild(MagDepthWrapper);

      Element.appendChild(IntItem);
      Element.appendChild(InfoWrapper);

      ReportList.appendChild(Element);
    }
  } catch (error) {
    if (retryCount < List_maxRetries) {
      logger.error(`[Fetch] ${error} (Try #${retryCount})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await report(retryCount + 1);
    }
  }
}
report();

let open_DATA = {};
const Info_maxRetries = 3;

async function ReportInfo(id, int, retryCount = 0) {
  try {
    logger.info("[Fetch] Fetching report info data");
    const res = await fetchData(`${API_url()}v2/eq/report/${id}`);
    if (!res.ok) return;

    logger.info("[Fetch] Got report info data");

    const data = await res.json();
    const No = data.id.split("-")[0];
    const check_No = No.split(3)[1];
    open_DATA = data;

    display_element([ReportBoxWrapper], "flex");
    setTimeout(() => {
      opacity([ReportBoxWrapper], 1);
    }, 100);
    const { loc, lon, lat, mag, depth, time } = data;
    ReportLocation.textContent = loc.match(/^[^\(]+/)?.[0]?.trim() || "";
    ReportLongitude.textContent = lon;
    ReportLatitude.textContent = lat;
    ReportMagitude.textContent = mag < 10 ? mag.toFixed(1) : mag;
    ReportDepth.textContent = depth;
    ReportTime.textContent = formatTime(time).replace(/\//g, "-");
    ReportTitle.textContent = LocalReplace(loc);
    ReportSubTitle.textContent = `${check_No !== "000" ? `編號 ${No}` : "小區域有感地震"}`;
    ReportMaxIntensity.className = `report-max-intensity intensity-${int}`;
    report_grouped(data);
    report_all(data);
  } catch (error) {
    if (retryCount < Info_maxRetries) {
      logger.error(`[Fetch] ${error} (Try #${retryCount})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await ReportInfo(id, int, retryCount + 1);
    }
  }
}

function report_grouped(data) {
  opacity([ReportListWrapper, InfoBox], 0);
  const RepoListWrapper = document.querySelector("#report-intensity-grouped");
  RepoListWrapper.innerHTML = "";

  const cities = Object.keys(data.list);
  const userLocation = JSON.parse(localStorage.getItem("current-location"));

  cities.forEach(city => {
    const CityData = data.list[city];

    const ReportListWrapper = document.createElement("div");
    ReportListWrapper.classList.add("report-list-item-wrapper", "active");

    const ReportList = document.createElement("div");
    ReportList.classList.add("report-list-item");

    const ReportListInt = document.createElement("div");
    ReportListInt.classList.add("report-list-int");

    const ReportIntensity = document.createElement("div");
    ReportIntensity.classList.add("report-intensity", `intensity-${CityData.int}`);
    ReportIntensity.textContent = CityData.int;

    const ReportLoc = document.createElement("div");
    ReportLoc.classList.add("report-location");
    ReportLoc.textContent = city;

    ReportListInt.appendChild(ReportIntensity);
    ReportListInt.appendChild(ReportLoc);
    ReportList.appendChild(ReportListInt);

    const ReportArrowDown = document.createElement("span");
    ReportArrowDown.classList.add("report-arrow-down", "button-leading-icon", "material-symbols-rounded");
    ReportArrowDown.textContent = "keyboard_arrow_down";

    ReportList.appendChild(ReportArrowDown);

    ReportListWrapper.appendChild(ReportList);

    const ReportInts = document.createElement("div");
    ReportInts.classList.add("report-int-items");

    const Towns = Object.keys(CityData.town);

    Towns.forEach(town => {
      const townData = CityData.town[town];
      const ReportInt = document.createElement("div");
      ReportInt.classList.add("report-int-item");

      const ReportIntInfo = document.createElement("div");
      ReportIntInfo.classList.add("report-int-item-info");

      const Int = document.createElement("div");
      Int.classList.add("int", `intensity-${townData.int}`);
      Int.textContent = townData.int;

      const Town = document.createElement("div");
      Town.classList.add("town");
      Town.textContent = town;

      ReportIntInfo.appendChild(Int);
      ReportIntInfo.appendChild(Town);
      ReportInt.appendChild(ReportIntInfo);
      ReportInts.appendChild(ReportInt);
    });

    ReportListWrapper.appendChild(ReportInts);
    RepoListWrapper.appendChild(ReportListWrapper);
  });
}

function report_all(data) {
  const reportContainer = document.getElementById("report-intensity-all");
  reportContainer.innerHTML = "";

  Object.entries(data.list).forEach(([city, { int: cityIntensity }]) => {
    const reportItem = document.createElement("div");
    reportItem.classList.add("report-list-item");

    const intensityDiv = document.createElement("div");
    intensityDiv.classList.add("report-intensity", `intensity-${cityIntensity}`);
    intensityDiv.textContent = cityIntensity;

    const locationDiv = document.createElement("div");
    locationDiv.classList.add("report-location");
    locationDiv.textContent = city;

    reportItem.appendChild(intensityDiv);
    reportItem.appendChild(locationDiv);

    reportContainer.appendChild(reportItem);
  });
}

function show_rts_list(status) {
  const RTS_List = querySelector(".intensity-container");

  if (status == true) {
    RTS_List.classList.remove("hidden");
    ReportListWrapper.classList.add("hidden");
    display_element([ReportBoxWrapper]);
    opacity([ReportListBtn], 0);
    opacity([InfoBox, InfoBodyTitleBox, InfoBodyFooter], 1);
    toHome(Home_btn);
  } else {
    RTS_List.classList.add("hidden");
    if (window.getComputedStyle(ReportBoxWrapper).display !== "flex")
      opacity([InfoBox], 1);
    else
      opacity([InfoBox], 0);

    opacity([InfoBodyTitleBox], 0);
    opacity([ReportListBtn], 1);
    InfoBox.style.backgroundColor = "#505050c7";
    EEWInfoTitle.textContent = "暫無生效中的地震預警";
  }

}
show_rts_list(false);

function LocalReplace(loc) {
  const matches = loc.match(/\(([^)]+)\)/);
  if (matches) {
    let text = matches[1];
    text = text.replace("位於", "");
    return text.trim();
  }
  return "";
}

function ReportTimeFormat(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}


/** Report Click事件**/
// eslint-disable-next-line space-before-function-paren
// 地震報告收展
ReportListBtn.addEventListener("click", function() {
  const ArrowSpan = this.querySelector(".nav-item-icon");
  ArrowSpan.textContent = ArrowSpan.textContent.trim() == "chevron_right" ? "chevron_left" : "chevron_right";
  ReportListWrapper.classList.toggle("hidden");
});

// 地震報告項目
ReportItem.addEventListener("click", (event) => {
  const { dataset: { reportId: ReportID } } = event.target.closest(".report-list-item-index");
  const ThisReport = Report_DATA.find(ReportInt => ReportInt.id == ReportID);
  if (ThisReport) ReportInfo(ReportID, ThisReport.int);
});

// 地震報告詳細資訊各地震度下拉
document.addEventListener("click", (event) => {
  const ReportListItem = event.target.closest(".report-list-item");
  if (ReportListItem) {
    const wrapper = ReportListItem.closest(".report-list-item-wrapper");
    const ArrowSpan = ReportListItem.querySelector(".report-arrow-down");
    ArrowSpan.textContent = ArrowSpan.textContent.trim() == "keyboard_arrow_up" ? "keyboard_arrow_down" : "keyboard_arrow_up";
    wrapper.classList.toggle("active");
  }
});

// 報告頁面
ReportActionOpen.addEventListener("click", () => {
  const id = open_DATA.id.split("-");
  const filtered = id.filter((part, index) => index !== 1).join("-");
  window.open(`https://www.cwa.gov.tw/V8/C/E/EQ/EQ${filtered}.html`, "_blank");
});

// 地震報告詳細資訊返回
ReportBackBtn.addEventListener("click", () => {
  opacity([ReportBoxWrapper], 0);
  setTimeout(() => {
    display_element([ReportBoxWrapper], "");
  }, 100);
  opacity([ReportListWrapper, InfoBox], 1);
});
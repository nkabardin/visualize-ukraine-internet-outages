var map = L.map("map").setView([49.53, 31.11], 5);
const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

function meduzaTitleToDateRange(title) {
  const titleRe = /([\d\/\-]+)\/([\d]{4})/;

  result = titleRe.exec(title);

  if (!result) {
    return null;
  }

  console.log(result.length);

  const dayMonth = result[1];
  const year = result[2];

  const dayMonthElements = dayMonth.split("-");

  if (dayMonthElements.length === 1) {
    const [day, month] = dayMonthElements[0].split("/");
    const date1 = new Date(year, parseInt(month) - 1, day);
    const date2 = new Date(year, parseInt(month) - 1, parseInt(day) + 1);

    return [date1, date2];
  }

  let day1;
  let month1;
  let day2;
  let month2;

  [day1, month1] = dayMonthElements[0].split("/");
  [day2, month2] = dayMonthElements[1].split("/");

  if (!month1) {
    month1 = month2;
  }

  return [
    new Date(year, parseInt(month1) - 1, day1),
    new Date(year, parseInt(month2) - 1, parseInt(day2) + 1),
  ];

  return result;
}

function filterMeduzaData(groupId) {
  return {
    ...meduzaData,
    features: meduzaData.features.filter((f) => {
      return f.properties.group === groupId;
    }),
  };
}

let currentGroupId = 0;
let layerGroup;
let currentLayer;
let titleToDateRange = {};
let timestamp1;
let timestamp2;

function renderCurrentGroup(change) {
  if (currentLayer) {
    layerGroup.removeLayer(currentLayer);
  }

  const group = meduzaData.groups[currentGroupId];

  currentLayer = L.geoJSON(filterMeduzaData(group.id));

  document.getElementById("currentDatesTitle").value = group.title;

  const dateRange = meduzaTitleToDateRange(group.title);

  document.getElementById("currentDates").value = dateRange;

  document.getElementById("currentTimestamps").value =
    dateRange[0].getTime() + "," + dateRange[1].getTime();

  layerGroup.addLayer(currentLayer);

  fetchOutagesData(dateRange[0], dateRange[1]);

  currentGroupId += change;
}

async function fetchOutagesData(date1, date2) {
  document.getElementById("outages").value = "loading...";
  timestamp1 = date1.getTime() / 1000;
  timestamp2 = date2.getTime() / 1000;
  const req = await fetch(
    "https://api.ioda.inetintel.cc.gatech.edu/v2/outages/summary?entityType=country&entityCode=UA&from=" +
      timestamp1 +
      "&until=" +
      timestamp2 +
      "&limit=2000"
  );
  json = await req.json();
  const outages = json.data;

  console.log(outages);
  document.getElementById("outages").value = JSON.stringify(outages, " ", 2);
}

async function main() {
  const data = await fetch("./meduza-map-a-temp-1.geojson");
  const body = await data.json();

  window.meduzaData = body;

  layerGroup = new L.LayerGroup();
  layerGroup.addTo(map);

  document.getElementById("btnNext").addEventListener("click", () => {
    renderCurrentGroup(1);
  });

  document.getElementById("btnPrev").addEventListener("click", () => {
    renderCurrentGroup(-1);
  });

  document.getElementById("btnIoda").addEventListener("click", () => {
    window
      .open(
        "https://ioda.inetintel.cc.gatech.edu/country/UA?from=" +
          timestamp1 +
          "&until=" +
          timestamp2,
        "_blank"
      )
      .focus();
  });
}

main();

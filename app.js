function getTodayName(){
  return ["Söndag","Måndag","Tisdag","Onsdag","Torsdag","Fredag","Lördag"][new Date().getDay()];
}
const workouts = {
  A: [
    "Knäböj – 10 reps",
    "Armhävningar – 8 reps",
    "Hantelrodd – 10/arm",
    "Plankan – 30 sek"
  ],
  B: [
    "Utfall – 8/ben",
    "Axelpress – 10 reps",
    "Glute bridge – 12 reps",
    "Dead bug – 10/side"
  ]
};
const targetPlugin = {
  id: 'targetBand',
  beforeDraw: (chart) => {
    const { ctx, chartArea, scales } = chart;

    if (!chartArea) return;

    const yTop = scales.y.getPixelForValue(65.5);
    const yBottom = scales.y.getPixelForValue(64.5);

    ctx.save();
    ctx.fillStyle = 'rgba(76, 175, 80, 0.1)'; // ljusgrön

    ctx.fillRect(
      chartArea.left,
      yTop,
      chartArea.right - chartArea.left,
      yBottom - yTop
    );

    ctx.restore();
  }
};

let tab = "home";
let settings = JSON.parse(localStorage.getItem("settings")) || {};

function showTab(t){
  tab = t;
  render();
}

function getTodayPlan(planText){

  const today = getTodayName();

  const lines = planText.split("\n");

  let found = false;
  let result = [];

  for(let line of lines){

    if(line.includes(today)){
      found = true;
      continue;
    }

    if(found){
      if(line.includes(":")) break;
      if(line.trim()) result.push(line);
    }
  }
}
async function getPlan(){

  const res = await fetch("https://health-bay-alpha.vercel.app/api/coach", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      settings
    })
  });

  const data = await res.json();
  return data.plan;
}

function calculateTrend(data){

  const n = data.length;
  if(n < 2) return data.map(() => null);

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

  data.forEach((w, i) => {
    sumX += i;
    sumY += w.weight;
    sumXY += i * w.weight;
    sumXX += i * i;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return data.map((_, i) => intercept + slope * i);
}


async function render(){

  const app = document.getElementById("app");

if(tab === "home"){

  app.innerHTML = `
    <div class="card">
      <h3>Idag</h3>
      <div id="today" class="ai-box">Laddar...</div>
    </div>

    <div class="card">
      <h3>Veckoplan</h3>
      <div id="plan">Laddar...</div>
    </div>
  `;

  const plan = await getPlan();

  document.getElementById("plan").innerText = plan;

  const todayText = getTodayPlan(plan);

  document.getElementById("today").innerText = todayText || "Vila";
}

  if(tab === "training"){
    app.innerHTML = `
      <div class="card">
        <h3>Inställningar</h3>1

        <label>Cykeldag</label>
        <select id="cycleDay">
          <option>Måndag</option>
          <option>Tisdag</option>
          <option>Onsdag</option>
          <option>Torsdag</option>
          <option>Fredag</option>
        </select>

        <label>Fastedag</label>
        <select id="fastDay">
          <option>Måndag</option>
          <option>Tisdag</option>
          <option>Onsdag</option>
          <option>Torsdag</option>
          <option>Fredag</option>
        </select>
        <h3>Träningspass</h3>1
   <div class="card">
      <h3>Pass A (20 min)</h3>
      <ul>
        ${workouts.A.map(x => `<li>${x}</li>`).join("")}
      </ul>
    </div>

    <div class="card">
      <h3>Pass B (20 min)</h3>
      <ul>
        ${workouts.B.map(x => `<li>${x}</li>`).join("")}
      </ul>
    </div>
        <button onclick="saveSettings()">Spara</button>
      </div>
    `;
  }
  if(tab === "weight"){
  app.innerHTML = `
    <div class="card">
      <h3>Vikt</h3>

      <canvas id="chart" height="120"></canvas>
      <div id="weightTable"></div>
    </div>
<div style="
  display:flex;
  flex-wrap:wrap;
  gap:10px;
">

  <input 
    id="weightInput"
    placeholder="kg"
    style="flex:1 1 120px;"
  >

  <input 
    type="date"
    id="dateInput"
    style="flex:1 1 160px;"
  >

  <button 
    onclick="saveWeight()"
    style="flex:1 1 100%;"
  >
    Spara vikt
  </button>

</div>

  `;

  loadWeights();
}
  if(tab === "food"){
  app.innerHTML = `
    <div class="card">
      <h3>Dagens kostråd</h3>
      <div id="foodTip" class="ai-box">Laddar...</div>
    </div>
  `;

  loadFoodTip();
}
  
}
let chart;

async function loadWeights(){

  const res = await fetch("https://health-bay-alpha.vercel.app/api/weights");
  const data = await res.json();

  console.log("ALL DATA:", data);

  // 🔥 1. filtrera först
  const today = new Date();

  const recent = data.filter(w => {
    const d = new Date(w.date);
    return (today - d) <= 14 * 24 * 60 * 60 * 1000;
  });

  const trend = calculateTrend(recent);

  // 🔥 2. sortera (valfritt men bra)
  recent.sort((a,b) => new Date(a.date) - new Date(b.date));

  // 🔥 3. använd recent
  const labels = recent.map(w => w.date);
  const values = recent.map(w => w.weight);

  const ctx = document.getElementById("chart");

  if(chart) chart.destroy();

chart = new Chart(ctx, {
  type: "line",
  data: {
    labels: labels,
    datasets: [
      {
        data: values,
        tension: 0.3
      },
      {
        data: trend,
        borderDash: [5,5],
        pointRadius: 0
      }
    ]
  },
  options: {
    plugins: { legend: { display: false } }
  },
  plugins: [targetPlugin]
});

  // 🔥 4. tabellen använder ALL data
  renderTable(data);
}

async function saveWeight(){

  const weight = parseFloat(document.getElementById("weightInput").value);
  const date = document.getElementById("dateInput").value;

  if(!weight || !date){
    alert("Ange vikt och datum");
    return;
  }

  await fetch("https://health-bay-alpha.vercel.app/api/weights", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ weight, date })
  });

  alert("Sparat");

  loadWeights();
}
function renderTable(data){

  // sortera: senaste först
  const sorted = [...data].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

let html = `
  <table style="
    width:100%;
    border-collapse:collapse;
    margin-top:12px;
    font-size:14px;
  ">
    <tr style="
      text-align:left;
      color:#666;
      font-size:12px;
    ">
      <th>Datum</th>
      <th>Vikt</th>
      <th>Δ</th>
    </tr>
`;

sorted.forEach((row, i) => {

  const prev = sorted[i+1];
  const diff = prev ? (row.weight - prev.weight).toFixed(1) : "";

  html += `
    <tr style="border-top:1px solid #eee;">
      <td style="padding:8px 0;">${row.date}</td>
      <td>${row.weight}</td>
      <td style="color:${diff > 0 ? 'red' : 'green'};">
        ${diff ? diff : ""}
      </td>
    </tr>
  `;
});

  html += `</table>`;

  document.getElementById("weightTable").innerHTML = html;
}
async function loadFoodTip(){

  const res = await fetch("https://health-bay-alpha.vercel.app/api/food");
  const data = await res.json();

  document.getElementById("foodTip").innerText = data.tip;
}

async function saveSettings(){

  settings.cycleDay = document.getElementById("cycleDay").value;
  settings.fastDay = document.getElementById("fastDay").value;

  localStorage.setItem("settings", JSON.stringify(settings));

  alert("Sparat – ny plan skapas");

  // 🔥 hämta ny plan direkt
  const plan = await getPlan();
  document.getElementById("app").innerHTML = `
    <div class="card">
      <h3>Veckoplan</h3>
      <div class="ai-box">${plan}</div>
    </div>
  `;
}
render();

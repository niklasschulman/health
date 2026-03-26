let tab = "home";
let settings = JSON.parse(localStorage.getItem("settings")) || {};

function showTab(t){
  tab = t;
  render();
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

async function render(){

  const app = document.getElementById("app");

  if(tab === "home"){
    app.innerHTML = `
      <div class="card">
        <h3>Veckoplan</h3>
        <div id="plan">Laddar...</div>
      </div>
    `;

    const plan = await getPlan();
    document.getElementById("plan").innerText = plan;
  }

  if(tab === "training"){
    app.innerHTML = `
      <div class="card">
        <h3>Inställningar</h3>

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

    <div class="card">
      <h3>Lägg till vikt</h3>

      <input id="weightInput" placeholder="kg" style="flex:1; min-width:0;">
      <input type="date" id="dateInput" style="flex:1; min-width:0;">

      <button onclick="saveWeight()">Spara</button>
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

  const labels = data.map(w => w.date);
  const values = data.map(w => w.weight);

  const ctx = document.getElementById("chart");

  if(chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        data: values,
        tension: 0.3
      }]
    },
    options: {
      plugins: { legend: { display: false } }
    }
  });
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

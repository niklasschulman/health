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

      <input id="weightInput" placeholder="kg">
      <input type="date" id="dateInput">

      <button onclick="saveWeight()">Spara</button>
    </div>
  `;

  loadWeights();
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

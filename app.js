let tab = "home";

let weights = JSON.parse(localStorage.getItem("weights")) || [];
let logs = JSON.parse(localStorage.getItem("logs")) || {};
let history = JSON.parse(localStorage.getItem("history")) || [];
async function getAIAdvice() {

  let res = await fetch("https://health-bay-alpha.vercel.app/api/coach", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      weight: weights.at(-1) || 65,
      weights: weights,
      history: history
    })
  });

  let data = await res.json();

  return data.text;
}

function save() {
  localStorage.setItem("weights", JSON.stringify(weights));
  localStorage.setItem("logs", JSON.stringify(logs));
  localStorage.setItem("history", JSON.stringify(history));
}

function showTab(t) {
  tab = t;
  document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
  event.target.classList.add("active");
  render();
}

function getTrend() {
  if (weights.length < 5) return "neutral";
  let diff = weights.at(-1) - weights.at(-5);
  if (diff < -0.5) return "down";
  if (diff > 0.5) return "up";
  return "stable";
}

function render() {
  let app = document.getElementById("app");

  if (tab === "home") {

  app.innerHTML = `
    <div class="card">
      <h3>AI Coach</h3>
      <p id="aiText">Laddar...</p>
    </div>
  `;

  getAIAdvice().then(text => {
    document.getElementById("aiText").innerText = text;
  });
}

  if (tab === "weight") {
    app.innerHTML = `
      <div class="card">
        <h3>Vikt</h3>
        <input id="w" placeholder="kg">
        <button onclick="addWeight()">Spara</button>
        <canvas id="chart"></canvas>
      </div>
    `;
    renderChart();
  }

  if (tab === "train") {
    app.innerHTML = `
      <div class="card">
        <h3>Träning</h3>
        ${renderWorkout()}
      </div>
    `;
  }

  if (tab === "food") {
    let protein = Math.round((weights.at(-1) || 65) * 1.4);

    app.innerHTML = `
      <div class="card">
        <h3>Kost</h3>
        <p><b>Protein:</b> ${protein} g</p>
        <p>Kyckling / fisk + potatis + olivolja</p>
        <p>Ägg, kött, nötter</p>
      </div>
    `;
  }

  if (tab === "plan") {
    app.innerHTML = `
      <div class="card">
        <h3>Vecka</h3>
        <p>Styrka 2–3 ggr</p>
        <p>Fasta 1 gång</p>
        <p>Cykel 1 gång</p>
      </div>
    `;
  }

  save();
}

function generateInsights() {
  let insights = [];

  if (weights.length > 5) {
    let diff = weights.at(-1) - weights.at(-5);

    if (diff < -0.7) insights.push("⚠️ Vikten sjunker – öka protein");
    if (Math.abs(diff) < 0.3) insights.push("✔️ Stabil vikt");
  }

  if (history.slice(-5).filter(x => x === "strength").length < 2) {
    insights.push("🏋️ Prioritera styrketräning");
  }

  return insights;
}

function renderWorkout() {
  let exercises = ["Squat", "Armhävningar", "Rodd", "Bridge", "Planka"];

  return exercises.map(e => `
    <b>${e}</b>
    <input value="${logs[e] || ''}" 
    onchange="logs['${e}']=this.value; save()">
  `).join("<br>");
}

function addWeight() {
  let v = parseFloat(document.getElementById("w").value);
  if (!v) return;
  weights.push(v);
  render();
}

let chart;

function renderChart() {
  let ctx = document.getElementById("chart");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: weights.map((_, i) => i + 1),
      datasets: [{ data: weights, tension: 0.3 }]
    },
    options: { plugins: { legend: { display: false } } }
  });
}

render();

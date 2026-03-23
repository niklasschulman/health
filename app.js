let tab = "home";

let weights = JSON.parse(localStorage.getItem("weights")) || [];
let aiHistory = JSON.parse(localStorage.getItem("aiHistory")) || [];

function save() {
  localStorage.setItem("weights", JSON.stringify(weights));
  localStorage.setItem("aiHistory", JSON.stringify(aiHistory));
}

// 📅 datum + tid
function getNow() {
  return new Date();
}

function getTodayKey() {
  let d = new Date();
  return d.toISOString().split("T")[0];
}

function shouldFetchNewAdvice() {

  if (aiHistory.length === 0) return true;

  const last = aiHistory[0];
  const now = new Date();

  const today = now.toISOString().split("T")[0];
  const lastDay = last.day;

  // skapa dagens 05:00
  const todayAt5 = new Date();
  todayAt5.setHours(5, 0, 0, 0);

  // 🔥 Regler:
  // 1. Om vi redan hämtat idag → NEJ
  if (lastDay === today) return false;

  // 2. Om klockan är före 05 → använd gårdagens
  if (now < todayAt5) return false;

  // 3. annars → hämta nytt
  return true;
}

// 🤖 hämta AI
async function getAIAdvice() {

  let res = await fetch("https://health-bay-alpha.vercel.app/api/coach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      weight: weights.at(-1) || 65,
      weights: weights
    })
  });

  let data = await res.json();
  return data.text;
}

// 🧠 daglig coach
async function getDailyAdvice() {

  if (!shouldFetchNewAdvice()) {
    return aiHistory[0]?.text;
  }

  const text = await getAIAdvice();

  aiHistory.unshift({
    date: new Date().toISOString(),
    day: new Date().toISOString().split("T")[0],
    text
  });

  save();

  return text;
}

// 📊 render
function render() {

  let app = document.getElementById("app");

  // HOME
  if (tab === "home") {

    app.innerHTML = `
      <div class="card">
        <h3>Din coach idag</h3>
        <div id="aiText" class="ai-box">Laddar...</div>
      </div>
    `;

    getDailyAdvice().then(text => {
      document.getElementById("aiText").innerHTML =
        text.replace(/\n/g, "<br>");
    });
  }

  // VIKT
  if (tab === "weight") {

    app.innerHTML = `
      <div class="card">
        <h3>Logga vikt</h3>
        <input id="w" placeholder="kg">
        <button onclick="addWeight()">Spara</button>
      </div>

      <div class="card">
        <h3>Historik</h3>
        ${weights.map((w,i)=>`
          <div>${w} kg <button onclick="deleteWeight(${i})">❌</button></div>
        `).join("")}
      </div>

      <div class="card">
        <canvas id="chart"></canvas>
      </div>
    `;

    renderChart();
  }

  // AI HISTORIK
  if (tab === "history") {

    app.innerHTML = `
      <div class="card">
        <h3>Tidigare coach-råd</h3>
        ${aiHistory.map(h=>`
          <div style="margin-bottom:10px;">
            <b>${new Date(h.date).toLocaleDateString()}</b><br>
            ${h.text}
          </div>
        `).join("")}
      </div>
    `;
  }

  save();
}

// vikt
function addWeight() {
  let v = parseFloat(document.getElementById("w").value);
  if (!v) return;
  weights.push(v);
  render();
}

function deleteWeight(i) {
  weights.splice(i,1);
  render();
}

// graf
let chart;

function renderChart() {
  let ctx = document.getElementById("chart");
  if (!ctx) return;

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: weights.map((_,i)=>i+1),
      datasets: [{ data: weights, tension: 0.3 }]
    },
    options: {
      plugins: { legend: { display: false } }
    }
  });
}

// tabs
function showTab(t) {
  tab = t;
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
  event.target.classList.add("active");
  render();
}

render();

let history = JSON.parse(localStorage.getItem("history")) || [];

function importWeights() {

  const text = document.getElementById("importData").value;

  const lines = text.split("\n");

  let imported = [];

  lines.forEach(line => {

    const [date, weight] = line.split(",");

    if (!date || !weight) return;

    imported.push({
      date: date.trim(),
      weight: parseFloat(weight.trim())
    });

  });

  // slå ihop med befintlig data
  weights = [...weights, ...imported];

  // ta bort dubletter (senaste vinner)
  const map = {};

  weights.forEach(w => {
    map[w.date] = w;
  });

  weights = Object.values(map);

  // sortera
  weights.sort((a, b) => new Date(a.date) - new Date(b.date));

  localStorage.setItem("weights", JSON.stringify(weights));

  alert("Import klar!");

  renderChart();
  syncToServer();
}
async function syncToServer() {

  await fetch("https://health-bay-alpha.vercel.app/api/store", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(weights)
  });

}
function formatWeek(text) {
  const days = text.split("\n");
  let html = "";
  days.forEach(line => {
    if (line.includes(":")) {
      html += `<h4>${line}</h4>`;
    } else {
      html += `<p>${line}</p>`;
    }
  });
  return html;
}

function logWorkout() {
  history.push("strength");
  localStorage.setItem("history", JSON.stringify(history));
  alert("Träning loggad");
}
let settings = JSON.parse(localStorage.getItem("settings")) || {};

function saveSettings() {
  settings.cycleDay = document.getElementById("cycleDay").value;
  settings.fastDay = document.getElementById("fastDay").value;

  localStorage.setItem("settings", JSON.stringify(settings));

  alert("Sparat!");
}
function formatAI(text) {

  const parts = {
    aktivitet: "",
    optimering: ""
  };

  const lines = text.split("\n");

  let current = "";

  lines.forEach(line => {

    if (line.includes("AKTIVITET")) current = "aktivitet";
    else if (line.includes("OPTIMERING")) current = "optimering";
    else if (current) parts[current] += line + " ";
  });

  return `
    <div>
      <h4>🏃‍♂️ Idag</h4>
      <p>${parts.aktivitet}</p>

      <h4>⚙️ Förbättring</h4>
      <p>${parts.optimering}</p>
    </div>
  `;
}

let weights = JSON.parse(localStorage.getItem("weights")) || [];

function saveWeight() {

  const weight = parseFloat(document.getElementById("weightInput").value);
  const date = document.getElementById("dateInput").value;

  if (!weight || !date) {
    alert("Ange både vikt och datum");
    return;
  }

  // kolla om datum redan finns → ersätt
  const existingIndex = weights.findIndex(w => w.date === date);

  if (existingIndex >= 0) {
    weights[existingIndex].weight = weight;
  } else {
    weights.push({ date, weight });
  }

  // sortera efter datum
  weights.sort((a, b) => new Date(a.date) - new Date(b.date));

  localStorage.setItem("weights", JSON.stringify(weights));

  alert("Sparat!");

  renderChart();
  syncToServer();
}
body: JSON.stringify({
  weight: weights.at(-1) || 65,
  weights: weights
})
let chart;

function renderChart() {

  const ctx = document.getElementById("chart");
  if (!ctx) return;

  if (chart) chart.destroy();

  const labels = weights.map(w => w.date);
  const data = weights.map(w => w.weight);

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        data: data,
        tension: 0.3
      }]
    },
    options: {
      plugins: { legend: { display: false } }
    }
  });
}
async function getAI() {

  try {
    const res = await fetch("https://health-bay-alpha.vercel.app/api/coach", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
body: JSON.stringify({
  weight: weights.at(-1)?.weight || 65,
  weights: weights,
  history: history,
  settings: settings
})
    });

    const data = await res.json();

    console.log("API svar:", data);

document.getElementById("ai").innerHTML = formatWeek(data.text) || "Inget svar";

  } catch (err) {
    console.error(err);
    document.getElementById("ai").innerText =
      "Fel vid hämtning";
  }
}

getAI();
loadFromServer().then(() => {
  renderChart();
});
async function loadFromServer() {

  const res = await fetch("https://health-bay-alpha.vercel.app/api/store");
  const data = await res.json();

  if (data.length > 0) {
    weights = data;
    localStorage.setItem("weights", JSON.stringify(weights));
    renderChart();
  }
}

// 👇 HÄR startar appen
loadFromServer();

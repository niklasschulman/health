let history = JSON.parse(localStorage.getItem("history")) || [];

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
  history: history
})
    });

    const data = await res.json();

    console.log("API svar:", data);

document.getElementById("ai").innerHTML = formatAI(data.text) || "Inget svar";

  } catch (err) {
    console.error(err);
    document.getElementById("ai").innerText =
      "Fel vid hämtning";
  }
}

getAI();
renderChart();

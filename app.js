let history = JSON.parse(localStorage.getItem("history")) || [];

function logWorkout() {
  history.push("strength");
  localStorage.setItem("history", JSON.stringify(history));
  alert("Träning loggad");
}

function formatAI(text) {

  const parts = {
    aktivitet: "",
    mat: "",
    optimering: ""
  };

  const lines = text.split("\n");

  let current = "";

  lines.forEach(line => {

    if (line.includes("AKTIVITET")) current = "aktivitet";
    else if (line.includes("MAT")) current = "mat";
    else if (line.includes("OPTIMERING")) current = "optimering";
    else if (current) parts[current] += line + " ";
  });

  return `
    <div>
      <h4>🏃‍♂️ Idag</h4>
      <p>${parts.aktivitet}</p>

      <h4>🍽️ Mat</h4>
      <p>${parts.mat}</p>

      <h4>⚙️ Förbättring</h4>
      <p>${parts.optimering}</p>
    </div>
  `;
}
let weights = JSON.parse(localStorage.getItem("weights")) || [];

function saveWeight() {
  const val = parseFloat(document.getElementById("weightInput").value);
  if (!val) return;

  weights.push(val);
  localStorage.setItem("weights", JSON.stringify(weights));

  alert("Sparat!");
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

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: weights.map((_, i) => i + 1),
      datasets: [{
        data: weights,
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
  weight: weights.at(-1) || 65,
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

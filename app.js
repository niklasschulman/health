let tab = "plan";

let plan = JSON.parse(localStorage.getItem("plan")) || null;

function save() {
  localStorage.setItem("plan", JSON.stringify(plan));
}

// tabs
function showTab(t) {
  tab = t;
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
  event.target.classList.add("active");
  render();
}

// render
function render() {

  let app = document.getElementById("app");

  // PLAN VIEW
  if (tab === "plan") {

    if (!plan) {
      app.innerHTML = `
        <div class="card">
          <h3>Ingen plan ännu</h3>
          <p>Gå till inställningar och skapa en</p>
        </div>
      `;
      return;
    }

    app.innerHTML = `
      <div class="card">
        <h3>Din vecka</h3>
        ${plan.map(day => `
          <div class="plan-day">
            <b>${day.day}</b><br>
            ${day.activity}
          </div>
        `).join("")}
      </div>
    `;
  }

  // SETTINGS
  if (tab === "settings") {

    app.innerHTML = `
      <div class="card">
        <h3>Skapa veckoplan</h3>

        <label>Cykeldag</label>
        <select id="cycle">
          <option>Måndag</option>
          <option>Tisdag</option>
          <option>Onsdag</option>
          <option>Torsdag</option>
          <option>Fredag</option>
        </select>

        <label>Fastedag</label>
        <select id="fast">
          <option>Måndag</option>
          <option>Tisdag</option>
          <option>Onsdag</option>
          <option>Torsdag</option>
          <option>Fredag</option>
        </select>

        <button onclick="generatePlan()">Skapa plan</button>
      </div>
    `;
  }

  save();
}

// AI-anrop
async function generatePlan() {

  let cycle = document.getElementById("cycle").value;
  let fast = document.getElementById("fast").value;

  let res = await fetch("https://health-bay-alpha.vercel.app/api/coach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cycleDay: cycle,
      fastDay: fast
    })
  });

  let data = await res.json();

  try {
    plan = JSON.parse(data.text);
  } catch {
    alert("AI svar fel format");
  }

  render();
}

render();

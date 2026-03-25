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
}

function saveSettings(){
  settings.cycleDay = document.getElementById("cycleDay").value;
  settings.fastDay = document.getElementById("fastDay").value;
  localStorage.setItem("settings", JSON.stringify(settings));
  alert("Sparat");
}

render();

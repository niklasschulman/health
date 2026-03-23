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

async function getAI() {

  try {
    const res = await fetch("https://health-bay-alpha.vercel.app/api/coach", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        weight: 65
      })
    });

    const data = await res.json();

    console.log("API svar:", data);

    document.getElementById("ai").innerText =
      data.text || "Inget svar";

  } catch (err) {
    console.error(err);
    document.getElementById("ai").innerText =
      "Fel vid hämtning";
  }
}

getAI();

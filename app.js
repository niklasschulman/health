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

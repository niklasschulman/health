export default async function handler(req, res) {

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: "Ge ett kort hälsoråd för en 51-åring som vill träna minimalt"
      })
    });

    const data = await response.json();

    console.log("OPENAI RAW:", data);

    // 🔥 enklaste möjliga parsing
    let text = "";

    if (data.output && data.output.length > 0) {
      const content = data.output[0].content;

      if (content && content.length > 0) {
        text = content[0].text || "";
      }
    }

    if (!text) {
      text = JSON.stringify(data);
    }

    return res.status(200).json({ text });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

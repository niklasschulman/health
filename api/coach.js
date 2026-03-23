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
        input: 
          "Du är en personlig hälsocoach.
Person:
- 51 år
- tidigare hjärtinfarkt
- vill träna så lite som möjligt
- mål: maximal effekt med minimal insats
- accepterar ca 2 korta pass/vecka (20–30 min)

Ge:
1. Vad han ska göra idag (kort)
2. Exakt vad han ska äta
3. En liten optimering

Aldrig långa pass. Aldrig överdriven träning."

        
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

export default async function handler(req, res) {

  // 🔥 CORS (viktigt för GitHub Pages)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {

    const { weight = 65, weights = [], history = [] } = req.body || {};

    // 🧠 Prompt (kan förbättras senare)
const prompt = `
Skapa en veckoplan (Måndag–Söndag).

Regler:
- 2–3 styrkepass
- 1 cykeldag: ${cycleDay}
- 1 fastedag: ${fastDay}
- ingen styrka på fastedag
- vila efter fasta

Returnera ENDAST JSON i detta format:

[
  {"day":"Måndag","activity":"..."},
  ...
]
`;

    // 🤖 OpenAI-anrop
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();

    // 🔍 Fel från OpenAI
    if (!response.ok) {
      console.error("OpenAI error:", data);
      return res.status(500).json({ error: data });
    }

    // 🧠 Robust parsing
    let text = "Inget svar från AI";

    if (data.output_text) {
      text = data.output_text;
    } else if (data.output?.[0]?.content?.[0]?.text) {
      text = data.output[0].content[0].text;
    } else {
      console.log("Okänt svarformat:", data);
    }

    return res.status(200).json({ text });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

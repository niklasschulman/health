export default async function handler(req, res) {

  // 🔥 CORS
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

    const { weight, weights, history } = req.body || {};

    const prompt = `
Du är en personlig hälsocoach.

Person:
- 51 år
- tidigare hjärtinfarkt
- vikt: ${weight || "okänd"}
- vill minimera styrketräning
- tränar helst 2 korta pass/vecka (20–30 min)
- använder fasta

Mål:
- behålla vikt
- bygga lite muskler
- minimera risk

Regler:
- föreslå ALDRIG långa pass
- håll träning kort och effektiv
- prioritera realism

Ge:
1. Vad personen ska göra idag
2. En konkret måltid (exakt mat)
3. En liten förbättring

Kort, konkret, utan fluff.
`;

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

    // 🔍 Om OpenAI returnerar fel
    if (!response.ok) {
      console.error("OpenAI error:", data);
      return res.status(500).json({ error: data });
    }

    // 🔥 ROBUST parsing (fixar ditt problem)
    let text = "";

    if (data.output && data.output.length > 0) {
      const content = data.output[0].content;

      for (let item of content) {
        if (item.type === "output_text") {
          text += item.text;
        }
      }
    }

    if (!text) {
      text = "AI svar kunde inte tolkas";
    }

    return res.status(200).json({ text });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

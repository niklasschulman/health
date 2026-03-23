export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { weight, weights, history } = req.body;

  const prompt = `
Du är en personlig hälsocoach.

Person:
- 51 år
- Vikt: ${weight} kg
- Vikttrend: ${weights}
- Träning: ${history}

Mål:
- Behålla vikt
- Bygga muskler
- Minimera hjärtrisk

Ge:
1. Vad personen ska göra idag
2. Exakt vad han ska äta (konkret måltid)
3. En förbättring

Kort och konkret.
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-5.3",
      input: prompt
    })
  });

  const data = await response.json();

  res.status(200).json({
    text: data.output[0].content[0].text
  });
}

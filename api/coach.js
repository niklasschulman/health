export default async function handler(req, res) {

  // 🔥 CORS (måste vara kvar)
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

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5",
        input: "Ge ett kort hälsoråd"
      })
    });

    const data = await response.json();

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

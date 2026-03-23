const response = await fetch("https://api.openai.com/v1/responses", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "gpt-5.3",
    input: "Ge ett kort hälsoråd"
  })
});

const data = await response.json();

if (!response.ok) {
  console.error(data);
  return res.status(500).json({ error: "OpenAI error" });
}

const text =
  data.output?.[0]?.content?.[0]?.text ||
  "Inget svar";

return res.status(200).json({ text });

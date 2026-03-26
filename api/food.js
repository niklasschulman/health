export const config = { runtime: "edge" };

export default async function handler(req) {

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  try {

    // 📅 dagens datum
    const today = new Date().toISOString().slice(0,10);

    // 🔍 kolla om tips redan finns idag
    const res = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/logs?type=eq.food&created_at=gte.${today}`,
      {
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        },
      }
    );

    const existing = await res.json();

    let tip;

    if (existing.length > 0) {
      tip = existing[0].content;
    } else {

      const prompt = `
Du är en evidensbaserad kostrådgivare.

Person:
- 51 år
- haft hjärtinfarkt
- vill hålla vikt stabil
- vill sänka LDL-kolesterol

Ge ETT kort råd (max 3 meningar) om kost.

Fokus:
- hjärthälsa
- kolesterol
- långsiktighet

Ingen dietplan. Inget fluff. Konkret.
`;

      const aiRes = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          input: prompt,
        }),
      });

      const aiData = await aiRes.json();

      let text = "";

      if (aiData.output) {
        for (const item of aiData.output[0].content) {
          if (item.type === "output_text") {
            text += item.text;
          }
        }
      }

      tip = text;

      // 💾 spara dagens tips
      await fetch(`${process.env.SUPABASE_URL}/rest/v1/logs`, {
        method: "POST",
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "food",
          content: tip,
        }),
      });
    }

    return new Response(JSON.stringify({ tip }), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers,
    });
  }
}

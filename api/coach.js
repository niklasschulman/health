export const config = {
  runtime: "edge",
};

export default async function handler(req) {

  // 🔥 CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // hantera preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {

    const body = await req.json();

    const prompt = `
Du är en personlig hälsocoach.

Person:
- 51 år
- tidigare hjärtinfarkt
- vill minimera träning
- mål: maximal effekt, minimal insats

Ge:
1. Vad han ska göra idag
2. Vad han ska äta
3. En liten förbättring

Kort, konkret.
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
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

    const data = await response.json();

    const text = data.output_text || "Inget AI-svar";

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

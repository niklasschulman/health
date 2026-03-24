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

onst prompt = `
Du är en personlig hälsocoach.

Person:
- 51 år
- tidigare hjärtinfarkt
- vill minimera träning
- max 2 korta styrkepass/vecka (20–30 min)

Regler:
- ingen styrketräning på fastedag
- cykeldag är redan kondition
- träning ska vara kort och lätt

Inställningar:
- Cykeldag: ${body.settings?.cycleDay}
- Fastedag: ${body.settings?.fastDay}

Skapa ett VECKOSCHEMA:

Måndag:
...

Tisdag:
...

...

Söndag:
...

Varje dag ska ha:
- aktivitet (kort)
- ev. kostråd

Kort, tydligt, realistiskt.
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

let text = "";

// Försök läsa standardstruktur
if (data.output && data.output.length > 0) {
  const content = data.output[0].content;

  if (Array.isArray(content)) {
    for (const item of content) {
      if (item.type === "output_text" && item.text) {
        text += item.text;
      }
    }
  }
}

// fallback – visa hela svaret om parsing misslyckas
if (!text) {
  text = JSON.stringify(data);
}
    
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

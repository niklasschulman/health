export const config = { runtime: "edge" };

export default async function handler(req) {

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  const body = await req.json();

  const { weights, settings } = body;

  // 🔒 Kolla om plan redan finns för veckan
  const today = new Date();
  const monday = new Date(today.setDate(today.getDate() - today.getDay() + 1))
    .toISOString().slice(0,10);

  const planRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/plans?week_start=eq.${monday}`, {
    headers: {
      "apikey": process.env.SUPABASE_KEY,
      "Authorization": `Bearer ${process.env.SUPABASE_KEY}`
    }
  });

  const existingPlans = await planRes.json();

  let planText;

if (existingPlans.length > 0) {

  const existing = existingPlans[0];

  const sameSettings =
    existing.cycle_day === settings.cycleDay &&
    existing.fast_day === settings.fastDay;

  if (sameSettings) {
    planText = existing.plan_text;
  } else {
    // 🔥 inställningar ändrade → skapa ny plan
    planText = null;
  }
}
   else {

    const prompt = `
Du är en personlig hälsocoach.

Person:
- 51 år
- tidigare hjärtinfarkt
- vill minimera träning
- max 2 korta styrkepass/vecka
- cykeldag: ${settings.cycleDay}
- fastedag: ${settings.fastDay}

Regler:
- ingen styrka på fastedag
- cykeldag = kondition
- låg belastning

Skapa:

1. VECKOSAMMANFATTNING
2. DAG FÖR DAG (Måndag–Söndag)

Fokus:
- aktivitet
- återhämtning
- viktuppföljning
- enkel kost (inga matsedlar)

Kort och konkret.
`;

    const aiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt
      })
    });

    const aiData = await aiRes.json();

    let text = "";
    if (aiData.output) {
      for (let item of aiData.output[0].content) {
        if (item.type === "output_text") text += item.text;
      }
    }

    planText = text;
await fetch(`${process.env.SUPABASE_URL}/rest/v1/plans?week_start=eq.${monday}`, {
  method: "DELETE",
  headers: {
    "apikey": process.env.SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`
  }
});
     
    // 💾 spara plan
    await fetch(`${process.env.SUPABASE_URL}/rest/v1/plans`, {
      method: "POST",
      headers: {
        "apikey": process.env.SUPABASE_KEY,
        "Authorization": `Bearer ${process.env.SUPABASE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        week_start: monday,
        cycle_day: settings.cycleDay,
        fast_day: settings.fastDay,
        plan_text: planText
      })
    });
  }

  return new Response(JSON.stringify({ plan: planText }), {
    status: 200,
    headers: { ...headers, "Content-Type": "application/json" }
  });
}

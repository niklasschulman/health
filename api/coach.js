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

  try {

    const body = await req.json();
    const settings = body.settings || {};

    const cycleDay = settings.cycleDay || "Tisdag";
    const fastDay = settings.fastDay || "Fredag";

    // 📅 räkna ut måndag denna vecka
    const today = new Date();
    const day = today.getDay(); // 0 = söndag
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);

    const monday = new Date(today.setDate(diff))
      .toISOString()
      .slice(0, 10);

    // 🔍 hämta befintlig plan
    const res = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/plans?week_start=eq.${monday}`,
      {
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        },
      }
    );

    const existingPlans = await res.json();

    let planText = null;

    // 🧠 kolla om vi kan återanvända plan
    if (existingPlans.length > 0) {

      const existing = existingPlans[0];

      const sameSettings =
        existing.cycle_day === cycleDay &&
        existing.fast_day === fastDay;

      if (sameSettings) {
        planText = existing.plan_text;
      }
    }

    // 🔥 skapa ny plan om ingen finns eller settings ändrats
    if (!planText) {
const weightRes = await fetch(
  `${process.env.SUPABASE_URL}/rest/v1/weights?order=date.asc`,
  {
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
    },
  }
);

const weights = await weightRes.json();
      let trendText = "ingen data";

if(weights.length >= 2){

const recent = weights.slice(-5);
const first = recent[0].weight;
const last = recent[recent.length - 1].weight;
const diff = (last - first).toFixed(1);
  
  if(diff > 0.3){
    trendText = `ökning ca ${diff} kg senaste veckan`;
  } else if(diff < -0.3){
    trendText = `minskning ca ${diff} kg senaste veckan`;
  } else {
    trendText = "stabil vikt";
  }
}
      const prompt = `
Du är en personlig hälsocoach.

Person:
- 51 år
- tidigare hjärtinfarkt
- vill minimera träning
- max 2 korta styrkepass per vecka (20–30 min)

Inställningar:
- Cykeldag: ${cycleDay}
- Fastedag: ${fastDay}

Vikttrend:
${trendText}

Regler:
- ingen styrketräning på fastedag
- cykeldag räknas som kondition

Träningsregler:
- max 2 styrkepass per vecka
- använd endast "Pass A" eller "Pass B"
- inga egna övningar
- ingen styrka på fastedag
- cykeldag = kondition
- träning ska vara kort och lätt

Regler för vikt:
- målet är stabil vikt (ca 64.5–65.5 kg)
- vid viktminskning: minska belastning/fasta något
- vid viktökning: öka aktivitet lätt
- gör små justeringar, inte drastiska

Skapa:

1. VECKOSAMMANFATTNING (kort)
2. DAG FÖR DAG (Måndag–Söndag)

Fokus:
- aktivitet
- återhämtning
- viktuppföljning

Ingen detaljerad matsedel.
Kort och tydligt.

Exempel på träningstips:
Onsdag:
Pass A (20 min)

Fredag:
Pass B (20 min)
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

      if (aiData.output && aiData.output.length > 0) {
        const content = aiData.output[0].content;

        for (const item of content) {
          if (item.type === "output_text") {
            text += item.text;
          }
        }
      }

      planText = text || "Ingen plan kunde genereras";

      // 🧹 radera gamla planer för veckan
      await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/plans?week_start=eq.${monday}`,
        {
          method: "DELETE",
          headers: {
            apikey: process.env.SUPABASE_ANON_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          },
        }
      );

      // 💾 spara ny plan
      await fetch(`${process.env.SUPABASE_URL}/rest/v1/plans`, {
        method: "POST",
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          week_start: monday,
          cycle_day: cycleDay,
          fast_day: fastDay,
          plan_text: planText,
        }),
      });
    }

    return new Response(JSON.stringify({ plan: planText }), {
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

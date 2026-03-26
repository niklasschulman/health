export const config = { runtime: "edge" };

export default async function handler(req) {

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  try {

    // 🔍 GET – hämta senaste 14 dagar
    if (req.method === "GET") {

      const today = new Date();
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(today.getDate() - 14);

      const from = twoWeeksAgo.toISOString().slice(0,10);
const res = await fetch(
  `${process.env.SUPABASE_URL}/rest/v1/weights?order=date.asc`,
  {
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
    },
  }
);

      const data = await res.json();

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // 💾 POST – spara vikt
    if (req.method === "POST") {

      const body = await req.json();

      await fetch(`${process.env.SUPABASE_URL}/rest/v1/weights`, {
        method: "POST",
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: body.date,
          weight: body.weight,
        }),
      });

      return new Response(JSON.stringify({ status: "saved" }), {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers,
    });
  }
}

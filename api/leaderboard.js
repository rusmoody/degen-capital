// GET /api/leaderboard -> top players by final AUM (reads Supabase REST).
const SUPABASE_URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });
  if (!SUPABASE_URL || !KEY) return res.status(500).json({ error: "server not configured" });

  try {
    const url =
      `${SUPABASE_URL}/rest/v1/leaderboard` +
      `?select=address,nick,avatar_id,final_aum,weeks&order=final_aum.desc&limit=50`;
    const r = await fetch(url, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    if (!r.ok) return res.status(500).json({ error: "db read failed" });
    const rows = await r.json();
    return res.status(200).json({ rows });
  } catch (e) {
    return res.status(500).json({ error: "unexpected" });
  }
}

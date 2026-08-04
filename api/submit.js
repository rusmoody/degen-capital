// POST /api/submit -> validate + record a leaderboard result.
// Security: wallet signature (proves address ownership) + nick/avatar read
// from the on-chain profile (can't fake someone else's identity) + sanity caps.
import { verifyMessage, createPublicClient, http } from "viem";
import { base } from "viem/chains";

const SUPABASE_URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;
const CONTRACT = "0xCCBeC786086afa44fD2d14E125c2F2cd71654ee3";

const ABI = [
  { type: "function", name: "hasProfile", stateMutability: "view",
    inputs: [{ name: "", type: "address" }], outputs: [{ name: "", type: "bool" }] },
  { type: "function", name: "getProfile", stateMutability: "view",
    inputs: [{ name: "player", type: "address" }],
    outputs: [{ type: "tuple", components: [
      { name: "tokenId", type: "uint256" }, { name: "nick", type: "string" },
      { name: "avatarId", type: "uint8" }, { name: "gamesPlayed", type: "uint32" },
      { name: "bestAUM", type: "uint256" }, { name: "bestWeeks", type: "uint32" },
      { name: "createdAt", type: "uint64" },
    ] }] },
];

const MAX_AUM = 200e9;   // sanity cap (market ~ $80B)
const MAX_WEEKS = 10000;

// Same message the client signs.
function resultMessage({ address, aum, weeks, seed }) {
  return `DEGEN CAPITAL leaderboard\naddress: ${address.toLowerCase()}\naum: ${aum}\nweeks: ${weeks}\nseed: ${seed}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!SUPABASE_URL || !KEY) return res.status(500).json({ error: "server not configured" });

  try {
    const { address, aum, weeks, seed, signature } = req.body || {};
    if (!address || signature == null || aum == null || weeks == null || seed == null)
      return res.status(400).json({ error: "missing fields" });

    const aumN = Math.round(Number(aum));
    const weeksN = Math.round(Number(weeks));
    const seedN = Math.round(Number(seed));
    if (!Number.isFinite(aumN) || aumN < 0 || aumN > MAX_AUM) return res.status(400).json({ error: "bad aum" });
    if (!Number.isFinite(weeksN) || weeksN < 0 || weeksN > MAX_WEEKS) return res.status(400).json({ error: "bad weeks" });

    // 1) signature proves the wallet owner submitted these exact numbers
    const message = resultMessage({ address, aum: aumN, weeks: weeksN, seed: seedN });
    const ok = await verifyMessage({ address, message, signature });
    if (!ok) return res.status(401).json({ error: "bad signature" });

    // 2) read identity from the contract (trustworthy nick/avatar)
    const client = createPublicClient({ chain: base, transport: http() });
    const has = await client.readContract({ address: CONTRACT, abi: ABI, functionName: "hasProfile", args: [address] });
    if (!has) return res.status(403).json({ error: "no profile" });
    const p = await client.readContract({ address: CONTRACT, abi: ABI, functionName: "getProfile", args: [address] });
    const nick = p.nick;
    const avatarId = Number(p.avatarId);

    const addrLc = address.toLowerCase();
    const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

    // 3) keep the best result only
    const cur = await fetch(
      `${SUPABASE_URL}/rest/v1/leaderboard?address=eq.${addrLc}&select=final_aum`, { headers: H }
    ).then((r) => r.json()).catch(() => []);
    if (Array.isArray(cur) && cur[0] && Number(cur[0].final_aum) >= aumN) {
      return res.status(200).json({ ok: true, updated: false });
    }

    // 4) upsert (address is unique)
    const up = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard?on_conflict=address`, {
      method: "POST",
      headers: { ...H, Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ address: addrLc, nick, avatar_id: avatarId, final_aum: aumN, weeks: weeksN, seed: seedN }),
    });
    if (!up.ok) return res.status(500).json({ error: "db write failed" });

    return res.status(200).json({ ok: true, updated: true });
  } catch (e) {
    return res.status(500).json({ error: "unexpected" });
  }
}

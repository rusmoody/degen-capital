# DEGEN CAPITAL

Browser-based **crypto VC fund simulator** with an on-chain player profile and a
shared leaderboard. You're the general partner: startups pitch you, you run due
diligence, watch token vesting, time your exits, acquire other funds, and grow
your market share. Companies are fictional but modeled on real crypto cases.

Interface in English and Russian (one toggle drives the whole app).

**Live:** https://capital-club-two.vercel.app
**Profile contract (Base):** [`0xCCBeC786086afa44fD2d14E125c2F2cd71654ee3`](https://basescan.org/address/0xCCBeC786086afa44fD2d14E125c2F2cd71654ee3) — verified

## Gameplay

- Timeline **2019 → 2100**: sectors unlock by era; 2019–2025 historical, 2026–2027 prediction markets, 2028+ procedural sci-fi future
- Dated real events (disguised) — the brightest ones pause time as "special events"
- ~30 sector archetypes; deal flow with fictional companies and real-fund co-investor signals
- **Vesting / lockups** — tokens unlock over time, so you can't dump the paper pump
- Exits: hold · partial sell · loan against collateral (with liquidation)
- Due diligence as a resource, reputation, allocation scarcity, follow-on
- LPs: inflows/redemptions, management fee, carry · portfolio ops
- Macro cycles (bull/bear), sector rotation, black swans, fund M&A
- **Seeded deterministic engine** — the same seed reproduces the exact same world (share your seed; basis for future duels)
- Mass portfolio actions (sell losers/winners), sort/filter, compact view
- Speeds 1x / 4x

## Web3 (on Base)

- **Profile NFT** — soulbound (one per wallet, non-transferable): pick 1 of 8 avatars + a unique nickname, minted on Base
- **On-chain name service** — nicknames are unique and validated in the contract
- Avatars and metadata are pinned on **IPFS**
- Minting is free (gas only); the game is fully playable without a wallet

## Leaderboard

- Serverless API on Vercel (`/api`) backed by **Supabase**
- Results are submitted with a **wallet signature** (proves ownership); the nickname/avatar are read from the on-chain profile, so identities can't be faked

## Stack

React + Vite + Tailwind · **wagmi + viem** (Base) · Vercel serverless functions · Supabase (Postgres) · Solidity (OpenZeppelin ERC-721)

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).
The wallet/profile flow works locally; the leaderboard API needs the env vars below (set on Vercel).

## Environment (backend)

Set these on the hosting provider (never commit them):

```
SUPABASE_URL          = https://<your-project>.supabase.co
SUPABASE_SERVICE_KEY  = <supabase secret key>
```

The WalletConnect project id lives in `src/web3/config.js` (public, safe to commit).

## Deploy

Deployed on **Vercel** (auto-deploy on push to `main`). Vite for the frontend, `/api/*` as serverless functions.

## Roadmap

- [x] Wallet connect + soulbound profile NFT (Base)
- [x] On-chain name service + IPFS avatars
- [x] Shared online leaderboard (signed submissions)
- [ ] Save / continue a run via IPFS (write the CID into the profile NFT)
- [ ] 1v1 duels (shared seed = identical world)
- [ ] Custom domain
- [ ] Split `App.jsx` into modules + TypeScript

## License

MIT

# DEGEN CAPITAL

Browser-based **crypto VC fund simulator**. You're the general partner: startups
pitch you, you decide what to back, run due diligence, watch vesting schedules and
time your exits — hold, sell partially, or borrow against your position. You manage
LP capital, reputation and allocation, acquire other funds, and grow your market
share. Companies are fictional but modeled on real crypto cases.

Interface in English and Russian (toggle in the header).

## Mechanics

- Time engine: one week = 10s, fast-forward 1x / 4x / 16x
- Deal flow + **special deals** that pause time when they land
- TGE, **vesting / lockups** — you can't dump the paper pump right away
- Exits: hold · partial sell · loan against collateral (with liquidation)
- Due diligence as a resource, reputation, allocation scarcity, follow-on
- LPs: inflows/redemptions, management fee, carry · portfolio help (ops)
- Macro cycles (bull/bear), sector rotation, black swans
- **Fund M&A** and a goal — capture market share (~$80B)

## Stack

React + Vite + Tailwind. All game logic lives in `src/App.jsx`
(the tick engine is a pure function `advance(state) -> state`).

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Build

```bash
npm run build     # outputs to dist/
npm run preview
```

## Deploy

Auto-deploy to **GitHub Pages** via GitHub Actions (`.github/workflows/deploy.yml`):
every push to `main` builds and publishes. Enable it in
repo → Settings → Pages → Source → **GitHub Actions**.

Live: `https://<username>.github.io/degen-capital/` (after the first deploy).

## Roadmap

- [ ] Split `App.jsx` into modules + TypeScript
- [ ] Crypto wallet connect (Base)
- [ ] Shared online leaderboard

## License

MIT

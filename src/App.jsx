import React, { useState, useEffect, useContext, createContext, useRef } from "react";
import {
  Play, Pause, Inbox, Wallet, TrendingDown, TrendingUp, X, Landmark, Clock,
  AlertTriangle, Search, Sparkles, Globe, Users, Activity, Building2, Target,
  Filter, ArrowUpDown, List, Dices, Copy,
} from "lucide-react";

/* =========================================================================
   DEGEN CAPITAL — симулятор крипто-VC-фонда (v4)
   Таймлайн 2019→2100 (эпохи), реальные события намёками + исторические
   «Особые» с паузой, ~30 секторов по эрам, seeded-движок (общий расклад
   по seed), массовые действия над портфелем, вестинг, M&A, доля рынка.
   ========================================================================= */

const TOTAL_MARKET = 80e9;

// ---------- фонды-сигнал ----------
const FUNDS = {
  S: ["a16z crypto", "Paradigm", "Sequoia", "Polychain", "Pantera", "Dragonfly", "Founders Fund", "Haun Ventures"],
  INST: ["BlackRock", "Fidelity", "Franklin Templeton", "Tiger Global", "Coatue", "VanEck", "Grayscale", "ARK Invest"],
  STRAT: ["Coinbase Ventures", "Binance Labs", "OKX Ventures", "Jump Crypto", "Galaxy", "Kraken Ventures", "Circle Ventures"],
  MID: ["Multicoin", "Framework", "Electric Capital", "Variant", "1kx", "Delphi", "Hack VC", "Robot Ventures", "Blockchain Capital", "USV", "Standard Crypto", "Spartan", "HashKey", "Animoca", "CoinFund", "ParaFi", "Nascent", "Maven 11", "Arca"],
  NOISE: ["Velocity Capital", "MoonDoor Ventures", "AnonEdge", "Meridian6", "Pulsar Group", "Apex Momentum", "Nova6", "GreenCandle"],
};
const TIER_COLOR = {
  S: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  INST: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  STRAT: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  MID: "bg-slate-500/10 text-slate-300 border-slate-600/40",
  NOISE: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};
const tierOf = (n) => Object.keys(FUNDS).find((k) => FUNDS[k].includes(n)) || "MID";
const TARGET_FUNDS = ["Northwind Capital", "Redstone Ventures", "Kappa Fund", "Bytehaven", "Terra Nova Capital", "Oakline", "Zenith Digital", "Halcyon Ventures", "Ironwood Capital", "Signal Peak", "Blackfern", "Cobalt Ventures"];

// ---------- архетипы (since = год появления сектора) ----------
const ARCH = {
  ICO:     { label: "ICO Launchpad",     real: "2017-era ICO",     since: 2019, drift: -0.045, vol: .20, tail: .012, tailMult: .12, unlockProb: .04, unlockHit: .14, tge: [2, 10], preTge: [1, 4],  vk: "fast" },
  CEX:     { label: "Exchange Token",    real: "FTX-type CEX",     since: 2019, drift: .005,   vol: .06, tail: .002, tailMult: .03, unlockProb: .03, unlockHit: .05, tge: [1.8, 3],preTge: [4, 10], vk: "mid" },
  LST:     { label: "Staking",           real: "Lido-type",        since: 2019, drift: .004,   vol: .05, tail: .002, tailMult: .6,  unlockProb: .05, unlockHit: .05, tge: [1.6, 2.4],preTge:[4, 10], vk: "mid" },
  LENDING: { label: "Lending",           real: "Aave / Compound",  since: 2019, drift: .005,   vol: .07, tail: .003, tailMult: .5,  unlockProb: .06, unlockHit: .06, tge: [1.8, 3],preTge: [5, 12], vk: "mid" },
  ORACLE:  { label: "Oracle / Infra",    real: "Chainlink",        since: 2019, drift: .005,   vol: .06, tail: .002, tailMult: .6,  unlockProb: .06, unlockHit: .06, tge: [1.8, 3],preTge: [6, 12], vk: "mid" },
  PRIVACY: { label: "Privacy",           real: "Zcash-type",       since: 2019, drift: -0.012, vol: .10, tail: .004, tailMult: .3,  unlockProb: .07, unlockHit: .08, tge: [2, 4],  preTge: [5, 12], vk: "mid" },
  BRIDGE:  { label: "Bridge / Interop",  real: "cross-chain",      since: 2020, drift: -0.006, vol: .08, tail: .005, tailMult: .06, unlockProb: .06, unlockHit: .06, tge: [1.8, 3],preTge: [5, 12], vk: "mid" },
  DEX:     { label: "Spot DEX",          real: "Uniswap-type",     since: 2020, drift: .008,   vol: .10, tail: .003, tailMult: .5,  unlockProb: .06, unlockHit: .06, tge: [2, 4],  preTge: [4, 10], vk: "mid" },
  YIELD:   { label: "Yield Farm",        real: "DeFi Summer farm", since: 2020, drift: -0.030, vol: .18, tail: .010, tailMult: .15, unlockProb: .05, unlockHit: .13, tge: [2, 8],  preTge: [1, 5],  vk: "fast" },
  PERP:    { label: "Perp DEX",          real: "dYdX / HL",        since: 2020, drift: .010,   vol: .11, tail: .003, tailMult: .55, unlockProb: .07, unlockHit: .07, tge: [2, 4],  preTge: [5, 12], vk: "mid" },
  STABLE:  { label: "Stablecoin",        real: "Terra/Ethena",     since: 2020, drift: .006,   vol: .04, tail: .003, tailMult: .3,  unlockProb: .04, unlockHit: .05, tge: [1.4, 2.2],preTge:[5, 12], vk: "mid" },
  DEPIN:   { label: "DePIN",             real: "Helium",           since: 2020, drift: -0.020, vol: .13, tail: .005, tailMult: .4,  unlockProb: .09, unlockHit: .09, tge: [1.8, 3.5],preTge:[6,14], vk: "mid" },
  L1:      { label: "New L1",            real: "Sol / Sui / Apt",  since: 2021, drift: -0.028, vol: .12, tail: .004, tailMult: .5,  unlockProb: .13, unlockHit: .11, tge: [3, 7],  preTge: [8, 16], vk: "slow" },
  NFT:     { label: "NFT Market",        real: "Blur / OpenSea",   since: 2021, drift: -0.030, vol: .17, tail: .007, tailMult: .3,  unlockProb: .07, unlockHit: .10, tge: [2, 5],  preTge: [3, 9],  vk: "mid" },
  GAMEFI:  { label: "GameFi",            real: "Axie / STEPN",     since: 2021, drift: -0.048, vol: .20, tail: .008, tailMult: .25, unlockProb: .11, unlockHit: .12, tge: [2.5, 8],preTge: [4, 12], vk: "mid" },
  MEME:    { label: "Memecoin",          real: "pump.fun-type",    since: 2021, drift: -0.055, vol: .30, tail: .022, tailMult: .1,  unlockProb: .02, unlockHit: .15, tge: [2, 20], preTge: [1, 3],  vk: "fast" },
  SOCIALFI:{ label: "SocialFi",          real: "friend.tech",      since: 2021, drift: -0.065, vol: .28, tail: .016, tailMult: .15, unlockProb: .04, unlockHit: .12, tge: [2, 10], preTge: [1, 3],  vk: "fast" },
  ROLLUP:  { label: "L2 Rollup",         real: "Starknet/zkSync",  since: 2023, drift: -0.032, vol: .10, tail: .004, tailMult: .55, unlockProb: .14, unlockHit: .10, tge: [3, 6],  preTge: [8, 18], vk: "slow" },
  MODULAR: { label: "Modular DA",        real: "Celestia",         since: 2023, drift: -0.020, vol: .11, tail: .004, tailMult: .6,  unlockProb: .11, unlockHit: .09, tge: [2.5, 5],preTge: [6, 14], vk: "slow" },
  RESTAKE: { label: "Restaking",         real: "EigenLayer",       since: 2023, drift: -0.028, vol: .09, tail: .003, tailMult: .6,  unlockProb: .13, unlockHit: .09, tge: [3, 5],  preTge: [6, 14], vk: "slow" },
  RWA:     { label: "RWA",               real: "Ondo",             since: 2024, drift: .006,   vol: .03, tail: .0015,tailMult: .6,  unlockProb: .04, unlockHit: .04, tge: [1.4, 2.2],preTge:[6, 12], vk: "mid" },
  AI:      { label: "AI x Crypto",       real: "Bittensor",        since: 2024, drift: -0.005, vol: .18, tail: .006, tailMult: .4,  unlockProb: .08, unlockHit: .09, tge: [3, 9],  preTge: [5, 12], vk: "mid" },
  PREDICT: { label: "Prediction Market", real: "Polymarket",       since: 2026, drift: .010,   vol: .09, tail: .003, tailMult: .5,  unlockProb: .06, unlockHit: .06, tge: [2, 4],  preTge: [6, 12], vk: "mid" },
  // будущее (2028+): космос, сингулярность, клоны, Марс, материя, нейро, пришельцы
  QUANTUM: { label: "Quantum Chain",     real: "quantum L1",       since: 2028, drift: -0.010, vol: .20, tail: .008, tailMult: .3,  unlockProb: .10, unlockHit: .10, tge: [3, 12], preTge: [6, 14], vk: "slow" },
  NEURO:   { label: "Neuro-DePIN",       real: "brain nets",       since: 2032, drift: -0.006, vol: .22, tail: .009, tailMult: .3,  unlockProb: .09, unlockHit: .10, tge: [3, 12], preTge: [6, 14], vk: "mid" },
  SPACE:   { label: "Space Infra",       real: "orbital mining",   since: 2038, drift: -0.018, vol: .24, tail: .010, tailMult: .25, unlockProb: .09, unlockHit: .11, tge: [4, 15], preTge: [8, 16], vk: "slow" },
  CLONE:   { label: "Clone Tokens",      real: "bio / cloning",    since: 2045, drift: -0.030, vol: .26, tail: .012, tailMult: .2,  unlockProb: .08, unlockHit: .12, tge: [3, 14], preTge: [5, 12], vk: "mid" },
  MARS:    { label: "Mars Colony",       real: "crypto-Mars",      since: 2052, drift: -0.020, vol: .28, tail: .012, tailMult: .2,  unlockProb: .09, unlockHit: .12, tge: [4, 20], preTge: [8, 18], vk: "slow" },
  MATTER:  { label: "Programmable Matter",real: "nano-matter",     since: 2060, drift: -0.010, vol: .30, tail: .012, tailMult: .2,  unlockProb: .08, unlockHit: .12, tge: [4, 18], preTge: [8, 16], vk: "slow" },
  SINGU:   { label: "Singularity Net",   real: "AGI mesh",         since: 2070, drift: .000,   vol: .32, tail: .012, tailMult: .2,  unlockProb: .08, unlockHit: .12, tge: [5, 25], preTge: [8, 18], vk: "slow" },
  ALIEN:   { label: "Xeno-Tech",         real: "alien contact",    since: 2085, drift: -0.040, vol: .35, tail: .020, tailMult: .05, unlockProb: .10, unlockHit: .14, tge: [4, 30], preTge: [8, 20], vk: "slow" },
};
const ARCH_KEYS = Object.keys(ARCH);
const availableSectors = (year) => ARCH_KEYS.filter((k) => ARCH[k].since <= year);

// ---------- расписание реальных событий (намёками) ----------
const wk = (year, off) => (year - 2019) * 52 + off;
const SCHEDULE = [
  { code: "deFiSummer", week: wk(2020, 22), pause: true, regime: "bull", hot: "YIELD", logKind: "special" },
  { code: "nftMania",   week: wk(2021, 28), pause: true, regime: "bull", hot: "NFT", logKind: "special" },
  { code: "terraDepeg", week: wk(2022, 18), pause: true, regime: "bear", regimeLen: 30, crash: { sectors: ["STABLE"], mult: 0.25 }, logKind: "crash" },
  { code: "ftxCollapse",week: wk(2022, 45), pause: true, regime: "bear", regimeLen: 45, crash: { sectors: ["CEX"], mult: 0.02 }, logKind: "crash" },
  { code: "recovery23", week: wk(2023, 14), pause: true, regime: "bull", hot: "ROLLUP", logKind: "special" },
  { code: "aiNarrative",week: wk(2024, 8),  pause: true, regime: "bull", hot: "AI", logKind: "special" },
  { code: "memeMania",  week: wk(2025, 10), pause: true, regime: "bull", hot: "MEME", logKind: "special" },
  { code: "predictEra", week: wk(2026, 6),  pause: true, hot: "PREDICT", logKind: "special" },
];
const EVENTS_TEXT = {
  deFiSummer: { ru: "🌱 DeFi Summer: доходности фарма взлетают, деньги хлынули в протоколы. Эйфория.", en: "🌱 DeFi Summer: farm yields explode, money floods in. Euphoria." },
  nftMania:   { ru: "🖼 NFT-мания: JPEG'и уходят за состояния, на рынок валит толпа.", en: "🖼 NFT mania: JPEGs sell for fortunes, the crowd pours in." },
  terraDepeg: { ru: "💥 Крупный алго-стейбл потерял привязку — десятки млрд испарились за дни. Паника.", en: "💥 A major algo-stable lost its peg — tens of billions gone in days. Panic." },
  ftxCollapse:{ ru: "🏦 Крупнейшая биржа рухнула в банкротство. Рынок в свободном падении, доверие обнулено.", en: "🏦 A top exchange collapsed into bankruptcy. Markets in freefall, trust gone." },
  recovery23: { ru: "📈 Рынок оживает: приходят L2 и рестейкинг, деньги возвращаются.", en: "📈 Market wakes up: L2s and restaking arrive, capital returns." },
  aiNarrative:{ ru: "🤖 Нарратив AI×крипта и RWA захватывает рынок — новая волна ликвидности.", en: "🤖 AI×crypto and RWA narratives take over — a fresh liquidity wave." },
  memeMania:  { ru: "🐸 Мемкоин-лаунчпады заполонили всё. Казино открыто.", en: "🐸 Memecoin launchpads everywhere. The casino is open." },
  predictEra: { ru: "🎲 Рынки предсказаний выходят на первый план.", en: "🎲 Prediction markets take center stage." },
};
const FUTURE_EVENTS = [
  { code: "quantumBreak", regime: "bull", ru: "🧪 Квантовый прорыв ломает старую крипту — новый L1-хайп.", en: "🧪 Quantum breakthrough breaks old crypto — new L1 hype." },
  { code: "marsColony",   regime: "bull", ru: "🚀 Первая крипто-колония на Марсе выпускает токен.", en: "🚀 First crypto colony on Mars issues a token." },
  { code: "cloneRush",    regime: "neutral", ru: "🧬 Токенизация клонов: биорынок открылся, ажиотаж.", en: "🧬 Clone tokenization: bio-market opens, frenzy." },
  { code: "singularity",  regime: "bull", ru: "🧠 AGI-сеть достигла сингулярности — рынок сходит с ума.", en: "🧠 AGI mesh hits singularity — markets go wild." },
  { code: "alienSignal",  regime: "bear", ru: "👽 Получен сигнал внеземной цивилизации — рынки в шоке.", en: "👽 A signal from an alien civilization — markets in shock." },
  { code: "matterHack",   regime: "bear", ru: "⚛️ Взлом программируемой материи вайпнул сектор.", en: "⚛️ Programmable-matter exploit wiped the sector." },
];
const FUTURE_TEXT = Object.fromEntries(FUTURE_EVENTS.map((e) => [e.code, { ru: e.ru, en: e.en }]));

// ---------- имена ----------
const PREFIX = ["Zeph", "Nyx", "Aeon", "Volt", "Umbra", "Kairo", "Sol", "Nova", "Ryza", "Obol", "Fyra", "Halo", "Quanta", "Aether", "Mira", "Cyra", "Odyn", "Pyra", "Lumen", "Drift", "Vex", "Orin", "Tesa", "Ludo", "Zeta", "Krios"];
const SUFFIX = {
  ICO: ["Coin", "Token", "Cap"], CEX: ["Exchange", "Trade"], LST: ["Stake", "ETH"], LENDING: ["Lend", "Fi"], ORACLE: ["Oracle", "Feed"],
  PRIVACY: ["Shield", "Veil"], BRIDGE: ["Bridge", "Port"], DEX: ["Swap", "DEX"], YIELD: ["Farm", "Yield", "Vault"], PERP: ["Perps", "DEX"],
  STABLE: ["USD", "Dollar"], DEPIN: ["Net", "Grid"], L1: ["Chain", "Net", "One"], NFT: ["Market", "Mint"], GAMEFI: ["Play", "Arcade"],
  MEME: ["Inu", "Pump", "Fun"], SOCIALFI: ["Social", "Fren"], ROLLUP: ["Rollup", "Layer"], MODULAR: ["DA", "Data"], RESTAKE: ["Restake", "Layer"],
  RWA: ["RWA", "Real"], AI: ["AI", "Tensor", "Mind"], PREDICT: ["Bet", "Odds"], QUANTUM: ["Q", "Quant"], NEURO: ["Neuro", "Synapse"],
  SPACE: ["Orbit", "Star"], CLONE: ["Clone", "Gene"], MARS: ["Mars", "Ares"], MATTER: ["Matter", "Nano"], SINGU: ["Mind", "Omega"], ALIEN: ["Xeno", "Nova"],
};
const PARODY = ["Solyra", "Lunaris", "Etheria", "Dogo", "Peppo", "Ondix", "Chainlynk", "Avax0", "Polygo", "Uniswhap"];
const F_FIRST = ["Alex", "Kai", "Mira", "Deniz", "Sasha", "Leo", "Yuki", "Nadia", "Ravi", "Ivo", "Tomer", "Lena", "Zed", "Nora"];
const F_LAST = ["Voss", "Okafor", "Lindqvist", "Marchetti", "Petrov", "Nakamura", "Cohen", "Silva", "Ashraf", "Dubois", "Bell", "Hara"];
const BIO = { ru: ["экс-инженер Coinbase", "серийный фаундер, 1 exit", "анон, только код", "дропнул PhD", "ex-Jump трейдер", "два провала в бэкграунде", "бывший ресёрчер L1", "фаундер-соло"], en: ["ex-Coinbase eng", "serial founder, 1 exit", "anon, code only", "PhD dropout", "ex-Jump trader", "two prior failures", "ex-L1 researcher", "solo founder"] };
const STAGES = ["Pre-Seed", "Seed", "Series A"];

// ---------- утилиты ----------
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
let _id = 1; const uid = () => _id++;
// seeded PRNG (mulberry32)
function makeRng(seed) {
  let s = seed >>> 0;
  const fn = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  fn.state = () => s;
  return fn;
}
const mix = (a, b) => { let h = (a >>> 0) ^ Math.imul(b >>> 0, 0x9E3779B1); h = Math.imul(h ^ (h >>> 16), 0x85EBCA6B); h ^= h >>> 13; return h >>> 0; };
const rr = (rand, a, b) => a + rand() * (b - a);
const rp = (rand, arr) => arr[Math.floor(rand() * arr.length)];

function fmt$(n) {
  const s = n < 0 ? "-" : ""; n = Math.abs(n);
  if (n >= 1e9) return s + "$" + (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return s + "$" + (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return s + "$" + Math.round(n / 1e3) + "K";
  return s + "$" + Math.round(n);
}
const fmtX = (x) => (x >= 1 ? x.toFixed(1) : x.toFixed(2)) + "×";
const fmtPct = (x) => (x >= 0 ? "+" : "") + (x * 100).toFixed(0) + "%";
function fmtShare(sh) { const p = sh * 100; if (p < 0.01) return p.toFixed(4) + "%"; if (p < 1) return p.toFixed(3) + "%"; return p.toFixed(2) + "%"; }
const TIERS = [
  { max: 25e6, ru: "нано-фонд", en: "nano fund" }, { max: 100e6, ru: "микро-фонд", en: "micro fund" },
  { max: 500e6, ru: "малый фонд", en: "small fund" }, { max: 2e9, ru: "средний фонд", en: "mid fund" },
  { max: 10e9, ru: "крупный фонд", en: "large fund" }, { max: Infinity, ru: "мега-фонд", en: "mega fund" },
];
const tierIdx = (aum) => TIERS.findIndex((t) => aum < t.max);

const REGIMES = { neutral: { drift: 0, val: 1, tail: 1 }, bull: { drift: .008, val: 1.4, tail: .8 }, bear: { drift: -.015, val: .7, tail: 1.6 } };
const SWANS = ["cexInsolvency", "bridgeHack", "regCrackdown", "depeg", "l1Outage", "memeCollapse"];

function vestParams(rand, vk) {
  if (vk === "slow") return { tgeUnlock: rr(rand, 0.03, 0.08), cliff: Math.round(rr(rand, 12, 24)), vest: Math.round(rr(rand, 90, 160)) };
  if (vk === "fast") return { tgeUnlock: rr(rand, 0.3, 0.6), cliff: Math.round(rr(rand, 0, 2)), vest: Math.round(rr(rand, 6, 18)) };
  return { tgeUnlock: rr(rand, 0.08, 0.18), cliff: Math.round(rr(rand, 4, 12)), vest: Math.round(rr(rand, 40, 90)) };
}
function drawQuality(rand, rep, hot, key) { let b = rand(); let q = 0.08 + 0.85 * b * b; q += (rep - 50) / 320; if (hot === key) q += 0.12; return clamp(q, 0.03, 0.98); }
function coInvestors(rand, q) {
  const s = new Set();
  if (rand() < q * 0.9 || rand() < 0.08) s.add(rp(rand, FUNDS.S));
  if (rand() < 0.3 + q * 0.4) s.add(rp(rand, FUNDS.MID));
  if (rand() < 0.4) s.add(rp(rand, FUNDS.STRAT));
  if (q > 0.6 && rand() < 0.4) s.add(rp(rand, FUNDS.INST));
  if (rand() < 0.6 - q * 0.5) s.add(rp(rand, FUNDS.NOISE));
  if (s.size === 0) s.add(rp(rand, FUNDS.MID));
  return [...s];
}
function mkName(rand, key) {
  if (rand() < 0.08) return rp(rand, PARODY);
  return rp(rand, PREFIX) + rp(rand, SUFFIX[key] || ["X"]);
}
function makeDeal(week, ctx, rand) {
  const key = rp(rand, ctx.sectors); const a = ARCH[key];
  const q = drawQuality(rand, ctx.rep, ctx.hot, key);
  const co = coInvestors(rand, q);
  const hasNoise = co.some((n) => tierOf(n) === "NOISE"), hasS = co.some((n) => tierOf(n) === "S");
  const redFlag = q < 0.16 && hasNoise && !hasS && rand() < 0.6;
  const stage = rp(rand, STAGES);
  const stageMult = { "Pre-Seed": 1, Seed: 3, "Series A": 9 }[stage];
  const rg = REGIMES[ctx.regime];
  const valuation = Math.round(rr(rand, 6e6, 20e6) * stageMult * rg.val * (ctx.hot === key ? 1.25 : 1) / 1e5) * 1e5;
  const ask = Math.min(3e6, Math.max(1e5, Math.round(valuation * rr(rand, 0.03, 0.11) / 1e4) * 1e4));
  const oversub = (q > 0.68 || ctx.hot === key) && rand() < 0.7;
  const name = mkName(rand, key);
  const vp = vestParams(rand, a.vk);
  return {
    id: uid(), seed: Math.floor(rand() * 4294967296), week, archetype: key, q, redFlag, dd: false,
    name, ticker: name.slice(0, 4).toUpperCase(), sector: a.label, real: a.real, stage, valuation, ask, oversub,
    traction: Math.round((0.3 + q * 0.6 + rr(rand, -0.15, 0.15)) * 100),
    tgeMult: rr(rand, a.tge[0], a.tge[1]), preTge: Math.round(rr(rand, a.preTge[0], a.preTge[1])) || 1,
    tgeUnlock: vp.tgeUnlock, cliff: vp.cliff, vest: vp.vest,
    fFirst: rp(rand, F_FIRST), fLast: rp(rand, F_LAST), bioIdx: Math.floor(rand() * BIO.ru.length), coInvestors: co,
  };
}
function makeSpecial(week, ctx, rand) {
  const d = makeDeal(week, ctx, rand);
  d.special = true; d.redFlag = false; d.oversub = true; d.q = rr(rand, 0.8, 0.95); d.traction = Math.round(rr(rand, 72, 95));
  const co = new Set([rp(rand, FUNDS.S)]);
  d.coInvestors.forEach((f) => { if (tierOf(f) !== "NOISE") co.add(f); });
  if (rand() < 0.6) co.add(rp(rand, FUNDS.INST));
  d.coInvestors = [...co];
  return d;
}
function makeTarget(week, aum, rand) { const a = Math.max(2e6, aum * rr(rand, 0.1, 0.6)); return { id: uid(), week, name: rp(rand, TARGET_FUNDS), aum: a, price: a * rr(rand, 0.2, 0.35) }; }

function unlockedPct(h, week) {
  if (!h.liquid || week < h.tgeWeek) return 0;
  const t = week - h.tgeWeek;
  if (t < h.cliff) return h.tgeUnlock;
  return Math.min(1, h.tgeUnlock + (1 - h.tgeUnlock) * (t - h.cliff) / h.vest);
}
function availableValue(h, week) { const u = unlockedPct(h, week); const av = clamp(u - (1 - h.held), 0, h.held); return h.fullMark * av; }

function initGame(seed) {
  const s = seed != null ? (seed >>> 0) : (Math.floor(Math.random() * 4294967296) >>> 0);
  const R = makeRng(s);
  const sectors = availableSectors(2019);
  const ctx = { rep: 50, regime: "neutral", hot: rp(R, sectors), sectors, year: 2019 };
  const inbox = [makeDeal(0, ctx, R), makeDeal(0, ctx, R), makeDeal(0, ctx, R)];
  return {
    seed: s, rngState: R.state(), week: 0, cash: 5e6, lpCapital: 5e6, gpEarnings: 0, realized: 0,
    reputation: 50, dd: 3, ops: 2, ddTick: 0, opsTick: 0, holdings: [], loans: [], inbox,
    mnaTargets: [], special: null, lastSpecialWeek: 0, event: null, fired: [],
    regime: "neutral", regimeUntil: 30, hotSector: ctx.hot, hotUntil: 24,
    navHistory: [{ week: 0, nav: 5e6 }], peak: 5e6, over: false,
    log: [{ week: 0, kind: "info", code: "fundOpen" }],
  };
}

// ---------- тик ----------
function advance(g) {
  const week = g.week + 1;
  const R = makeRng(g.rngState);
  const rnd = (a, b) => a + R() * (b - a); const pick = (a) => a[Math.floor(R() * a.length)];
  let { cash, lpCapital, gpEarnings, realized, reputation, dd, ops, ddTick, opsTick } = g;
  const log = []; const L = (kind, code, args) => log.push({ week, kind, code, args });
  let holdings = g.holdings.map((h) => ({ ...h }));
  let loans = g.loans.map((l) => ({ ...l }));
  const year = 2019 + Math.floor(week / 52);
  const sectors = availableSectors(year);

  let regime = g.regime, regimeUntil = g.regimeUntil, hotSector = g.hotSector, hotUntil = g.hotUntil;
  if (week >= regimeUntil) { regime = pick(["neutral", "bull", "bear", "neutral"]); regimeUntil = week + Math.round(rnd(30, 60)); L("macro", "macro", { regime }); }
  if (week >= hotUntil) { hotSector = pick(sectors); hotUntil = week + Math.round(rnd(24, 44)); L("info", "hot", { sector: ARCH[hotSector].label }); }
  const rg = REGIMES[regime];
  if (++ddTick >= 6) { dd = Math.min(5, dd + 1); ddTick = 0; }
  if (++opsTick >= 9) { ops = Math.min(3, ops + 1); opsTick = 0; }

  holdings.forEach((h) => {
    if (h.status !== "active") return;
    const a = ARCH[h.archetype]; const hr = makeRng(mix(h.seed, week));
    if (!h.liquid) {
      if (week >= h.tgeWeek) { h.liquid = true; h.fullMark *= h.tgeMult; L("tge", "tge", { t: h.ticker, x: fmtX(h.fullMark / h.invested) }); reputation = clamp(reputation + (h.fullMark > h.invested * 2 ? 1 : 0), 0, 100); }
      else if (h.followOn && week - h.followOnWeek > 6) { h.tgeMult *= 0.85; h.followOn = null; }
      else if (!h.followOn && hr() < 0.025) { h.followOn = Math.round(h.invested * (0.4 + hr() * 0.4)); h.followOnWeek = week; L("info", "follow", { t: h.ticker, amt: fmt$(h.followOn) }); }
      return;
    }
    const g3 = hr() + hr() + hr() - 1.5;
    let drift = a.drift + (h.q - 0.5) * 0.02 + (h.redFlag ? -0.07 : 0) + rg.drift + (h.archetype === hotSector ? 0.012 : 0);
    let m = h.fullMark * (1 + drift + g3 * a.vol);
    if (a.unlockProb && hr() < a.unlockProb) m *= 1 - a.unlockHit;
    const tailP = (h.redFlag ? 0.05 : a.tail) * rg.tail;
    if (tailP && hr() < tailP) { m *= a.tailMult; if (h.redFlag) { L("crash", "rug", { t: h.ticker }); reputation = clamp(reputation - 5, 0, 100); } else L("crash", "crash", { t: h.ticker, pct: Math.round((1 - a.tailMult) * 100) }); }
    h.fullMark = Math.max(0, m);
  });

  // расписание исторических событий
  let fired = g.fired.slice(); let event = g.event; let special = g.special; let lastSpecialWeek = g.lastSpecialWeek;
  for (const e of SCHEDULE) {
    if (week >= e.week && !fired.includes(e.code)) {
      fired.push(e.code);
      if (e.regime) { regime = e.regime; regimeUntil = week + (e.regimeLen || 40); }
      if (e.hot && sectors.includes(e.hot)) { hotSector = e.hot; hotUntil = week + 30; }
      if (e.crash) holdings.forEach((h) => { if (h.status === "active" && h.liquid && e.crash.sectors.includes(h.archetype)) h.fullMark *= e.crash.mult; });
      L(e.logKind || "macro", "evt", { code: e.code });
      if (e.pause && !event) event = { code: e.code };
    }
  }
  // будущее (2028+): процедурные события
  if (year >= 2028 && !event && R() < 0.01) {
    const fe = pick(FUTURE_EVENTS);
    if (fe.regime) { regime = fe.regime; regimeUntil = week + 40; }
    const fut = sectors.filter((k) => ARCH[k].since >= 2028);
    if (fut.length) { hotSector = pick(fut); hotUntil = week + 30; }
    L("special", "futu", { code: fe.code }); event = { code: "futu:" + fe.code };
  }

  // случайный чёрный лебедь
  if (R() < 0.005) {
    const s = pick(SWANS);
    const hit = (keys, mult) => holdings.forEach((h) => { if (h.status === "active" && h.liquid && keys.includes(h.archetype)) h.fullMark *= mult; });
    if (s === "cexInsolvency") { hit(["CEX"], 0.02); regime = "bear"; regimeUntil = week + 40; }
    else if (s === "bridgeHack") hit(["BRIDGE"], 0.05);
    else if (s === "regCrackdown") hit(["PRIVACY", "STABLE"], 0.55);
    else if (s === "depeg") hit(["STABLE"], 0.35);
    else if (s === "l1Outage") hit(["L1", "ROLLUP"], 0.7);
    else if (s === "memeCollapse") hit(["MEME", "SOCIALFI"], 0.3);
    L("crash", "swan", { kind: s });
  }

  loans.forEach((l) => { l.principal *= 1.0025; });
  loans = loans.filter((l) => {
    const h = holdings.find((x) => x.id === l.holdingId && x.status === "active");
    if (!h) return false;
    if (h.fullMark * h.held < l.principal / 0.7) { h.status = "liquidated"; h.held = 0; reputation = clamp(reputation - 4, 0, 100); L("crash", "liq", { t: h.ticker }); return false; }
    return true;
  });

  const ctx = { rep: reputation, regime, hot: hotSector, sectors, year };
  let inbox = g.inbox.slice();
  if (inbox.length < 7 && week >= 2 && R() < 0.28) inbox.push(makeDeal(week, ctx, R));
  inbox = inbox.filter((d) => week - d.week < 16);

  if (!special && !event && week - lastSpecialWeek > 35 && week > 12 && R() < 0.03) {
    const sd = makeSpecial(week, ctx, R); inbox.push(sd); special = sd.id; lastSpecialWeek = week; L("special", "special", { name: sd.name });
  }
  if (special && !inbox.some((d) => d.id === special)) special = null;

  const holdVal = holdings.reduce((s, h) => s + (h.status === "active" ? h.fullMark * h.held : 0), 0);
  const debt = loans.reduce((s, l) => s + l.principal, 0);
  const nav = cash + holdVal - debt;
  const peak = Math.max(g.peak, nav);
  const aum = Math.max(lpCapital, nav);

  let mnaTargets = g.mnaTargets.slice();
  if (mnaTargets.length < 3 && week > 8 && R() < 0.02) mnaTargets.push(makeTarget(week, aum, R));
  mnaTargets = mnaTargets.filter((tg) => week - tg.week < 26);

  if (week % 13 === 0) { const fee = lpCapital * 0.005; gpEarnings += fee; L("fee", "fee", { amt: fmt$(fee) }); }
  if (nav > lpCapital * 1.2 && reputation > 58 && R() < 0.025) { const add = lpCapital * rnd(0.1, 0.25); lpCapital += add; cash += add; reputation = clamp(reputation + 2, 0, 100); L("lpin", "lpIn", { amt: fmt$(add) }); }
  if (nav < peak * 0.75 && week > 16 && R() < 0.06) { const want = lpCapital * 0.1, out = Math.min(cash, want); cash -= out; lpCapital -= out; reputation = clamp(reputation - (out < want ? 8 : 4), 0, 100); L("lpout", "lpOut", { amt: fmt$(out) }); }

  const navHistory = g.navHistory.concat([{ week, nav }]).slice(-200);
  let over = g.over;
  if (!over && nav < peak * 0.3 && week > 16) { over = true; L("crash", "gameOver", {}); }
  const newLog = (log.length ? log.concat(g.log) : g.log).slice(0, 90);

  return { ...g, rngState: R.state(), week, cash, lpCapital, gpEarnings, realized, reputation, dd, ops, ddTick, opsTick, holdings, loans, inbox, mnaTargets, special, lastSpecialWeek, event, fired, regime, regimeUntil, hotSector, hotUntil, navHistory, peak, over, log: newLog };
}

// ---------- действия ----------
function doInvest(g, deal, amount) {
  amount = Math.min(amount, g.cash);
  if (amount < 1000) return g;
  const h = { id: uid(), seed: deal.seed, name: deal.name, ticker: deal.ticker, archetype: deal.archetype, q: deal.q, redFlag: deal.redFlag, invested: amount, fullMark: amount, held: 1, liquid: false, tgeWeek: g.week + deal.preTge, tgeMult: deal.tgeMult, tgeUnlock: deal.tgeUnlock, cliff: deal.cliff, vest: deal.vest, followOn: null, status: "active" };
  return { ...g, cash: g.cash - amount, holdings: [...g.holdings, h], inbox: g.inbox.filter((d) => d.id !== deal.id), special: g.special === deal.id ? null : g.special, log: [{ week: g.week, kind: "buy", code: "invest", args: { t: deal.ticker, amt: fmt$(amount), val: fmt$(deal.valuation) } }, ...g.log].slice(0, 90) };
}
const doPass = (g, deal) => ({ ...g, inbox: g.inbox.filter((d) => d.id !== deal.id), special: g.special === deal.id ? null : g.special });
const doDD = (g, deal) => (g.dd < 1 ? g : { ...g, dd: g.dd - 1, inbox: g.inbox.map((d) => (d.id === deal.id ? { ...d, dd: true } : d)) });
function doSellValue(g, h, value) {
  const avail = availableValue(h, g.week); value = Math.min(value, avail);
  if (value < 1) return g;
  const fracOrig = value / h.fullMark, costPart = h.invested * fracOrig, profit = value - costPart, gp = profit > 0 ? profit * 0.2 : 0;
  let cash = g.cash, netCash = value, loans = g.loans;
  const loan = g.loans.find((l) => l.holdingId === h.id);
  if (loan) { const pay = Math.min(netCash, loan.principal); netCash -= pay; const np = loan.principal - pay; loans = np <= 1 ? g.loans.filter((l) => l.id !== loan.id) : g.loans.map((l) => (l.id === loan.id ? { ...l, principal: np } : l)); }
  cash += netCash;
  const held = h.held - fracOrig;
  const holdings = g.holdings.map((x) => (x.id === h.id ? { ...x, held: held <= 0.005 ? 0 : held, status: held <= 0.005 ? "sold" : "active" } : x));
  const rep = clamp(g.reputation + (profit > costPart ? 2 : profit < 0 ? -1 : 0), 0, 100);
  return { ...g, cash, realized: g.realized + profit, gpEarnings: g.gpEarnings + gp, reputation: rep, holdings, loans, log: [{ week: g.week, kind: profit >= 0 ? "up" : "down", code: "sell", args: { t: h.ticker, amt: fmt$(value), pct: fmtPct(h.fullMark / h.invested - 1) } }, ...g.log].slice(0, 90) };
}
function doLoan(g, h) {
  if (g.loans.some((l) => l.holdingId === h.id)) return g;
  const principal = availableValue(h, g.week) * 0.4; if (principal < 1000) return g;
  return { ...g, cash: g.cash + principal, loans: [...g.loans, { id: uid(), holdingId: h.id, principal }], log: [{ week: g.week, kind: "loan", code: "loan", args: { t: h.ticker, amt: fmt$(principal) } }, ...g.log].slice(0, 90) };
}
function doFollow(g, h) {
  if (!h.followOn || g.cash < h.followOn) return g;
  const amt = h.followOn;
  return { ...g, cash: g.cash - amt, holdings: g.holdings.map((x) => (x.id === h.id ? { ...x, invested: x.invested + amt, fullMark: x.fullMark + amt, followOn: null } : x)), log: [{ week: g.week, kind: "buy", code: "followTake", args: { t: h.ticker } }, ...g.log].slice(0, 90) };
}
function doHelp(g, h) {
  if (g.ops < 1 || h.helped) return g;
  return { ...g, ops: g.ops - 1, holdings: g.holdings.map((x) => (x.id === h.id ? { ...x, q: Math.min(1, x.q + 0.06), helped: true } : x)), log: [{ week: g.week, kind: "up", code: "help", args: { t: h.ticker } }, ...g.log].slice(0, 90) };
}
function doAcquire(g, tg) {
  if (g.cash < tg.price) return g;
  return { ...g, cash: g.cash - tg.price + tg.aum * 0.5, lpCapital: g.lpCapital + tg.aum, reputation: clamp(g.reputation + 3, 0, 100), mnaTargets: g.mnaTargets.filter((x) => x.id !== tg.id), log: [{ week: g.week, kind: "acq", code: "acquire", args: { name: tg.name, aum: fmt$(tg.aum) } }, ...g.log].slice(0, 90) };
}
function doSellMany(g, predicate) {
  let ng = g;
  g.holdings.filter((h) => h.status === "active" && h.liquid && predicate(h)).forEach((h) => {
    const cur = ng.holdings.find((x) => x.id === h.id);
    if (cur && cur.status === "active") ng = doSellValue(ng, cur, availableValue(cur, ng.week));
  });
  return ng;
}
const doClearEvent = (g) => ({ ...g, event: null });

// ---------- i18n ----------
const L = {
  ru: { fund: "ФОНД I", cash: "кэш", deployed: "в сделках", debt: "долг", gp: "заработок GP", rep: "репутация", week: "Нед.", pitches: "Питчи проектов", queue: "в очереди", portfolio: "Портфель", positions: "позиций", eventlog: "лента событий", emptyInbox: "Тихо. Запусти время — придут заявки.", emptyPort: "Пусто. Заходи в сделки.", sell: "продать", loan: "кредит", help: "помочь", followBtn: "follow-on", invest: "Инвестировать", pass: "Пасс", newFund: "Новый фонд", gameOver: "Фонд закрыт — LP вывели капитал.", valuation: "Оценка (post)", ask: "Раунд (ask)", type: "Тип", traction: "Трекшн", founder: "Фаундер", coinv: "Со-инвесторы", check: "твой чек", share: "доля", runDD: "Провести DD", oversubMsg: "Oversubscribed — макс аллокация по репутации", ddHigh: "качество: высокое", ddMid: "качество: среднее", ddLow: "качество: низкое", ddRed: "⚠ признаки скама", locked: "локап · TGE через", weeks: "нед.", regimeN: "нейтрал", regimeBull: "бычий", regimeBear: "медвежий", hotPrefix: "в фаворе", token: "токен / SAFT", unlocked: "разблок.", available: "доступно", vesting: "вестинг", sellTitle: "Продать", sellAmt: "сколько продать", aum: "AUM", marketShare: "доля рынка", mna: "Другие фонды · M&A", acquire: "Поглотить", mnaEmpty: "Целей пока нет — расти, появятся.", goalTip: "Цель — откусить долю рынка. Топ-игроки управляют $1B+.", special: "★ Особый проект — прорывной раунд. Время на паузе.", legend: "токены на TGE залочены и разлочиваются вестингом — бумажный памп сразу не продать.", sellLosers: "продать убыточные", sellWinners: "продать прибыльные", sort: "сорт", filter: "фильтр", compact: "компакт", cards: "карточки", fAll: "все", fLiquid: "ликвидные", fLosers: "в минусе", fWinners: "в плюсе", sPnl: "по P&L", sSize: "по размеру", sSector: "по сектору", confirm: "Подтвердить", cancel: "Отмена", continue: "Продолжить", seed: "seed", newGame: "новая игра", playSeed: "играть по seed", copied: "скопировано", confirmSellLosers: "Продать все убыточные позиции (доступный объём)?", confirmSellWinners: "Продать все прибыльные позиции (доступный объём)?" },
  en: { fund: "FUND I", cash: "cash", deployed: "deployed", debt: "debt", gp: "GP earnings", rep: "reputation", week: "Wk", pitches: "Pitches", queue: "in queue", portfolio: "Portfolio", positions: "positions", eventlog: "event log", emptyInbox: "Quiet. Run time — pitches will come.", emptyPort: "Empty. Back some deals.", sell: "sell", loan: "loan", help: "help", followBtn: "follow-on", invest: "Invest", pass: "Pass", newFund: "New fund", gameOver: "Fund closed — LPs pulled out.", valuation: "Valuation (post)", ask: "Round (ask)", type: "Type", traction: "Traction", founder: "Founder", coinv: "Co-investors", check: "your check", share: "stake", runDD: "Run DD", oversubMsg: "Oversubscribed — max allocation by reputation", ddHigh: "quality: high", ddMid: "quality: medium", ddLow: "quality: low", ddRed: "⚠ scam signals", locked: "lockup · TGE in", weeks: "wk", regimeN: "neutral", regimeBull: "bull", regimeBear: "bear", hotPrefix: "in favor", token: "token / SAFT", unlocked: "unlocked", available: "available", vesting: "vesting", sellTitle: "Sell", sellAmt: "amount to sell", aum: "AUM", marketShare: "market share", mna: "Other funds · M&A", acquire: "Acquire", mnaEmpty: "No targets yet — grow, they'll appear.", goalTip: "Goal — capture market share. Top players run $1B+.", special: "★ Special deal — breakout round. Time paused.", legend: "tokens are locked at TGE and vest over time — you can't dump the paper pop.", sellLosers: "sell losers", sellWinners: "sell winners", sort: "sort", filter: "filter", compact: "compact", cards: "cards", fAll: "all", fLiquid: "liquid", fLosers: "losers", fWinners: "winners", sPnl: "by P&L", sSize: "by size", sSector: "by sector", confirm: "Confirm", cancel: "Cancel", continue: "Continue", seed: "seed", newGame: "new game", playSeed: "play seed", copied: "copied", confirmSellLosers: "Sell all losing positions (available amount)?", confirmSellWinners: "Sell all winning positions (available amount)?" },
};
const regimeLabel = (r, lang) => ({ neutral: L[lang].regimeN, bull: L[lang].regimeBull, bear: L[lang].regimeBear }[r]);

const GLOSSARY = {
  nav: { ru: "Net Asset Value — активы фонда минус долги.", en: "Net Asset Value — fund assets minus debt." },
  tge: { ru: "Token Generation Event — запуск токена (листинг).", en: "Token Generation Event — token goes live." },
  valuation: { ru: "Оценка компании после раунда.", en: "Company valuation after the round." },
  saft: { ru: "Договор на будущие токены.", en: "Simple Agreement for Future Tokens." },
  vesting: { ru: "Токены разлочиваются постепенно (клифф + линейно). До этого продать нельзя.", en: "Tokens unlock gradually. Locked until then." },
  ltv: { ru: "Размер кредита относительно залога.", en: "Loan vs collateral." },
  carry: { ru: "Доля прибыли управляющего (обычно 20%).", en: "GP's share of profits (usually 20%)." },
  dd: { ru: "Due diligence — проверка проекта перед сделкой.", en: "Vetting a deal before investing." },
  allocation: { ru: "Сколько дают вложить в раунд.", en: "How much you can invest in a round." },
  oversub: { ru: "Желающих больше, чем места в раунде.", en: "More demand than room in the round." },
  rep: { ru: "Трек-рекорд: влияет на доступ и приток LP.", en: "Track record — affects deal access and LP inflows." },
  traction: { ru: "Показатели роста проекта.", en: "Project growth metrics." },
  ops: { ru: "Помощь портфелю: усиливает шансы компании.", en: "Portfolio-help that boosts a company's odds." },
  regime: { ru: "Фаза рынка: бык / медведь / нейтрал.", en: "Market phase: bull / bear / neutral." },
  hot: { ru: "Сектор в фаворе: выше оценки и рост.", en: "Hot sector: higher valuations and growth." },
  aum: { ru: "Весь капитал под твоим управлением.", en: "Total capital you manage." },
  marketShare: { ru: "Твоя доля от крипто-VC рынка (~$80B).", en: "Your share of the ~$80B crypto-VC market." },
  mna: { ru: "Поглощение фондов: платишь цену — получаешь их AUM.", en: "Acquiring funds: pay a price, gain their AUM." },
  seed: { ru: "Зерно генерации: один seed = один и тот же расклад мира. Поделись — сыграете одинаковый.", en: "Generation seed: same seed = same world. Share it to play the identical run." },
};

function logText(e, lang) {
  const a = e.args || {}; const ru = lang === "ru";
  switch (e.code) {
    case "fundOpen": return ru ? "2019. Фонд I закрыт на $5.0M. Ты — нано-фонд, 0.006% рынка." : "2019. Fund I closed at $5.0M. You're a nano fund, 0.006% of market.";
    case "invest": return ru ? `Инвестировал ${a.amt} в $${a.t} @ ${a.val} post` : `Invested ${a.amt} in $${a.t} @ ${a.val} post`;
    case "tge": return ru ? `$${a.t}: TGE — ${a.x} на бумаге, токены на вестинге` : `$${a.t}: TGE — ${a.x} on paper, tokens vesting`;
    case "crash": return ru ? `$${a.t}: обвал −${a.pct}%` : `$${a.t}: dropped −${a.pct}%`;
    case "rug": return ru ? `$${a.t}: RUG PULL — почти в ноль` : `$${a.t}: RUG PULL — near zero`;
    case "sell": return ru ? `Продал $${a.t}: ${a.amt} (поз. ${a.pct})` : `Sold $${a.t}: ${a.amt} (pos ${a.pct})`;
    case "loan": return ru ? `Кредит под $${a.t}: +${a.amt}` : `Loan vs $${a.t}: +${a.amt}`;
    case "liq": return ru ? `$${a.t}: ликвидация залога — позиция потеряна` : `$${a.t}: collateral liquidated`;
    case "follow": return ru ? `$${a.t}: предложен follow-on ${a.amt}` : `$${a.t}: follow-on offered ${a.amt}`;
    case "followTake": return ru ? `$${a.t}: доинвестировал` : `$${a.t}: followed on`;
    case "help": return ru ? `Помог $${a.t}` : `Helped $${a.t}`;
    case "acquire": return ru ? `Поглотил ${a.name} — +${a.aum} AUM` : `Acquired ${a.name} — +${a.aum} AUM`;
    case "lpIn": return ru ? `Новый LP: +${a.amt}` : `New LP: +${a.amt}`;
    case "lpOut": return ru ? `Редемпшн LP: −${a.amt}` : `LP redemption: −${a.amt}`;
    case "fee": return ru ? `Комиссия за управление: +${a.amt}` : `Management fee: +${a.amt}`;
    case "macro": return (ru ? "Смена цикла: " : "Regime shift: ") + regimeLabel(a.regime, lang);
    case "hot": return (ru ? "Сектор в фаворе: " : "Hot sector: ") + a.sector;
    case "gameOver": return ru ? "−70% от пика NAV. Фонд закрыт." : "−70% from NAV peak. Fund closed.";
    case "evt": return (EVENTS_TEXT[a.code] || { ru: a.code, en: a.code })[lang];
    case "futu": return (FUTURE_TEXT[a.code] || { ru: a.code, en: a.code })[lang];
    case "special": return ru ? `★ Особый проект: ${a.name} — время остановлено` : `★ Special deal: ${a.name} — time paused`;
    case "swan": {
      const S = { cexInsolvency: ru ? "🦢 Крупная биржа неплатёжеспособна — CEX в ноль" : "🦢 Major exchange insolvent — CEX wiped", bridgeHack: ru ? "🦢 Взлом мостов — bridge обвалились" : "🦢 Bridge exploit — bridges crashed", regCrackdown: ru ? "🦢 Регуляторка — privacy и стейблы под ударом" : "🦢 Crackdown — privacy & stables hit", depeg: ru ? "🦢 Депег стейбла — yield просели" : "🦢 Stablecoin depeg", l1Outage: ru ? "🦢 Сбой L1 — L1/rollup упали" : "🦢 L1 outage", memeCollapse: ru ? "🦢 Мем-мания лопнула" : "🦢 Meme mania popped" };
      return S[a.kind] || "🦢";
    }
    default: return e.code;
  }
}
const eventText = (code, lang) => code && code.startsWith("futu:") ? (FUTURE_TEXT[code.slice(5)] || {})[lang] : (EVENTS_TEXT[code] || {})[lang];

// ---------- фон ----------
const _sr = makeRng(12345);
const BG_CANDLES = Array.from({ length: 46 }, (_, i) => ({ x: 12 + i * 26, up: _sr() > 0.48, bodyH: 12 + _sr() * 80, baseY: 600 + _sr() * 150, wick: 10 + _sr() * 28 }));
let _ty = 430; const BG_TREND = Array.from({ length: 60 }, (_, i) => { _ty += (_sr() - 0.42) * 34; _ty = Math.max(180, Math.min(520, _ty)); return `${(i * (1200 / 59)).toFixed(0)},${_ty.toFixed(0)}`; }).join(" ");
const BG_NODES = Array.from({ length: 14 }, () => ({ x: _sr() * 1200, y: 50 + _sr() * 320 }));
const Bg = React.memo(function Bg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="dcSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0c1526" /><stop offset="0.5" stopColor="#0a1120" /><stop offset="1" stopColor="#070b16" /></linearGradient>
          <radialGradient id="dcA" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#f59e0b" stopOpacity="0.55" /><stop offset="1" stopColor="#f59e0b" stopOpacity="0" /></radialGradient>
          <radialGradient id="dcG" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#10b981" stopOpacity="0.5" /><stop offset="1" stopColor="#10b981" stopOpacity="0" /></radialGradient>
          <pattern id="dcGrid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="#22304a" strokeWidth="1" /></pattern>
        </defs>
        <rect width="1200" height="800" fill="url(#dcSky)" /><rect width="1200" height="800" fill="url(#dcGrid)" opacity="0.6" />
        <circle cx="250" cy="180" r="320" fill="url(#dcA)" /><circle cx="1010" cy="470" r="360" fill="url(#dcG)" />
        <g stroke="#38bdf8" opacity="0.18" strokeWidth="1">{BG_NODES.map((n, i) => (i < BG_NODES.length - 1 ? <line key={i} x1={n.x} y1={n.y} x2={BG_NODES[i + 1].x} y2={BG_NODES[i + 1].y} /> : null))}</g>
        <g fill="#38bdf8" opacity="0.35">{BG_NODES.map((n, i) => <circle key={i} cx={n.x} cy={n.y} r="3" />)}</g>
        <polyline points={BG_TREND} fill="none" stroke="#f59e0b" strokeWidth="3" opacity="0.3" />
        {BG_CANDLES.map((c, i) => (<g key={i} opacity="0.5"><line x1={c.x} y1={c.baseY - c.bodyH - c.wick} x2={c.x} y2={c.baseY + c.wick} stroke={c.up ? "#34d399" : "#fb7185"} strokeWidth="1.5" /><rect x={c.x - 6} y={c.baseY - c.bodyH} width="12" height={c.bodyH} fill={c.up ? "#34d399" : "#fb7185"} opacity="0.6" /></g>))}
        <rect width="1200" height="800" fill="#060a14" opacity="0.38" />
      </svg>
    </div>
  );
});

// ---------- UI-примитивы ----------
const LangCtx = createContext("ru");
function Term({ k, children }) {
  const lang = useContext(LangCtx); const g = GLOSSARY[k];
  return (<span className="relative group cursor-help border-b border-dotted border-slate-500">{children}<span className="pointer-events-none absolute left-1/2 bottom-full z-40 mb-1.5 hidden group-hover:block w-52 -translate-x-1/2 rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-[11px] font-normal leading-snug text-slate-100 shadow-xl">{g ? g[lang] : k}</span></span>);
}
function Spark({ data, base }) {
  if (data.length < 2) return null;
  const w = 240, hh = 40, vals = data.map((d) => d.nav), lo = Math.min(...vals, base), hi = Math.max(...vals, base), rng = hi - lo || 1;
  const pts = data.map((d, i) => `${((i / (data.length - 1)) * w).toFixed(1)},${(hh - ((d.nav - lo) / rng) * hh).toFixed(1)}`).join(" ");
  const up = vals[vals.length - 1] >= base, yb = hh - ((base - lo) / rng) * hh;
  return (<svg width={w} height={hh}><line x1="0" y1={yb} x2={w} y2={yb} className="stroke-slate-700" strokeDasharray="3 3" /><polyline points={pts} fill="none" strokeWidth="1.75" className={up ? "stroke-emerald-400" : "stroke-rose-400"} /></svg>);
}
const Empty = ({ text }) => <div className="rounded-lg border border-dashed border-slate-700/60 px-3 py-8 text-center text-xs text-slate-600">{text}</div>;
const logColor = (k) => ({ buy: "text-amber-300", up: "text-emerald-400", tge: "text-emerald-300", down: "text-rose-300", crash: "text-rose-400", loan: "text-sky-300", lpin: "text-emerald-300", lpout: "text-rose-300", fee: "text-amber-300", macro: "text-violet-300", acq: "text-amber-300", special: "text-amber-300", info: "text-slate-400" }[k] || "text-slate-400");
function Res({ icon, label, value, tip }) {
  return (<div className="flex items-center gap-1.5 rounded-md border border-slate-700/60 bg-slate-900/60 backdrop-blur-md px-2.5 py-1">{icon}<span className="text-[10px] text-slate-500">{tip ? <Term k={tip}>{label}</Term> : label}</span><span className="font-mono text-xs text-slate-200">{value}</span></div>);
}

export default function App() {
  const [game, setGame] = useState(initGame);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [openId, setOpenId] = useState(null);
  const [sellId, setSellId] = useState(null);
  const [amt, setAmt] = useState(0);
  const [sellAmt, setSellAmt] = useState(0);
  const [lang, setLang] = useState("ru");
  const [sortKey, setSortKey] = useState("pnl");
  const [filterKey, setFilterKey] = useState("all");
  const [compact, setCompact] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [seedInput, setSeedInput] = useState("");
  const [copied, setCopied] = useState(false);
  const t = (k) => L[lang][k];

  useEffect(() => {
    if (running && !game.over && !game.special && !game.event) {
      const id = setInterval(() => setGame((g) => (g.over || g.special || g.event ? g : advance(g))), Math.max(400, 10000 / speed));
      return () => clearInterval(id);
    }
  }, [running, speed, game.over, game.special, game.event]);

  const g = game;
  const holdVal = g.holdings.reduce((s, h) => s + (h.status === "active" ? h.fullMark * h.held : 0), 0);
  const debt = g.loans.reduce((s, l) => s + l.principal, 0);
  const nav = g.cash + holdVal - debt;
  const aum = Math.max(g.lpCapital, nav);
  const navPct = nav / g.lpCapital - 1;
  const share = aum / TOTAL_MARKET;
  const ti = tierIdx(aum), tier = TIERS[ti], tierLo = ti === 0 ? 0 : TIERS[ti - 1].max;
  const tierProg = clamp((Math.log10(aum + 1) - Math.log10(tierLo + 1)) / (Math.log10(tier.max) - Math.log10(tierLo + 1) || 1), 0, 1);
  const active = g.holdings.filter((h) => h.status === "active");
  const year = 2019 + Math.floor(g.week / 52), wkn = (g.week % 52) + 1;
  const deal = g.inbox.find((d) => d.id === openId);
  const sellH = g.holdings.find((h) => h.id === sellId && h.status === "active");
  useEffect(() => { if (deal) setAmt(Math.min(deal.ask, g.cash)); }, [openId]);
  useEffect(() => { if (sellH) setSellAmt(availableValue(sellH, g.week)); }, [sellId]);
  const act = (fn) => setGame(fn);

  // особые события: пауза
  const seenSpecial = useRef(null), seenEvent = useRef(null);
  useEffect(() => { if (g.special && seenSpecial.current !== g.special) { seenSpecial.current = g.special; setRunning(false); setOpenId(g.special); } }, [g.special]);
  useEffect(() => { if (g.event && seenEvent.current !== g.event) { seenEvent.current = g.event; setRunning(false); } }, [g.event]);

  const maxAlloc = deal ? (deal.oversub ? deal.ask * (0.25 + g.reputation / 100) : deal.ask * 2) : 0;
  const sliderMax = deal ? Math.max(100000, Math.min(g.cash, maxAlloc)) : 0;
  const regClr = { neutral: "text-slate-300", bull: "text-emerald-400", bear: "text-rose-400" }[g.regime];
  const sellAvail = sellH ? availableValue(sellH, g.week) : 0;

  // портфель: фильтр + сортировка
  let view = active.slice();
  if (filterKey === "liquid") view = view.filter((h) => h.liquid);
  else if (filterKey === "losers") view = view.filter((h) => h.fullMark < h.invested);
  else if (filterKey === "winners") view = view.filter((h) => h.fullMark > h.invested);
  if (sortKey === "pnl") view.sort((a, b) => (b.fullMark / b.invested) - (a.fullMark / a.invested));
  else if (sortKey === "size") view.sort((a, b) => (b.fullMark * b.held) - (a.fullMark * a.held));
  else if (sortKey === "sector") view.sort((a, b) => ARCH[a.archetype].label.localeCompare(ARCH[b.archetype].label));

  const copySeed = () => { try { navigator.clipboard.writeText(String(g.seed)); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch (e) {} };
  const startSeed = () => { const n = parseInt(seedInput, 10); if (!isNaN(n)) { setGame(initGame(n)); setRunning(false); setSeedInput(""); } };

  const evText = g.event ? eventText(g.event.code, lang) : "";

  return (
    <LangCtx.Provider value={lang}>
      <div className="relative min-h-screen w-full bg-slate-950 text-slate-200 font-sans">
        <Bg />
        <div className="relative z-10 mx-auto max-w-6xl p-3 sm:p-5">
          {/* шапка */}
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 backdrop-blur-md p-4 mb-4">
            <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3">
              <div>
                <span className="text-amber-300 font-mono text-xs tracking-[0.25em]">DEGEN CAPITAL · {t("fund")}</span>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="font-mono text-3xl font-semibold tabular-nums" style={{ textShadow: "0 0 24px rgba(245,158,11,0.18)" }}>{fmt$(nav)}</span>
                  <span className={`font-mono text-sm ${navPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}><Term k="nav">NAV</Term> {fmtPct(navPct)}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 font-mono">
                  <span>{t("cash")} {fmt$(g.cash)}</span><span>{t("deployed")} {fmt$(holdVal)}</span>
                  <span className={debt > 0 ? "text-rose-400" : ""}>{t("debt")} {fmt$(debt)}</span>
                  <span className="text-amber-300"><Term k="carry">{t("gp")}</Term> {fmt$(g.gpEarnings)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => setLang((x) => (x === "ru" ? "en" : "ru"))} className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-mono hover:bg-slate-700"><Globe size={12} /> {lang === "ru" ? "RU" : "EN"}</button>
                  <div className="flex items-center gap-1.5 text-slate-300 text-sm font-mono"><Clock size={14} className="text-amber-300" /> {t("week")} {wkn} · {year}</div>
                  <button onClick={() => setRunning((r) => !r)} disabled={g.over} className="rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 p-1.5">{running ? <Pause size={16} /> : <Play size={16} />}</button>
                  {[1, 4].map((s) => (<button key={s} onClick={() => setSpeed(s)} className={`rounded-md border px-2 py-1 text-xs font-mono ${speed === s ? "border-amber-500/50 bg-amber-500/15 text-amber-300" : "border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>{s}×</button>))}
                </div>
                <Spark data={g.navHistory} base={g.lpCapital} />
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-slate-700/60 bg-slate-950/40 px-3 py-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-1.5 text-slate-300"><Target size={13} className="text-amber-300" /><Term k="aum">{t("aum")}</Term> {fmt$(aum)} · <Term k="marketShare">{t("marketShare")}</Term> <span className="text-amber-300">{fmtShare(share)}</span></span>
                <span className="text-slate-400">{lang === "ru" ? tier.ru : tier.en}</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden"><div className="h-full bg-amber-400" style={{ width: `${tierProg * 100}%`, boxShadow: "0 0 12px rgba(245,158,11,0.5)" }} /></div>
              <div className="mt-1 text-[10px] text-slate-600">{t("goalTip")}</div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Res icon={<Users size={13} className="text-sky-400" />} label={t("rep")} tip="rep" value={Math.round(g.reputation)} />
              <Res icon={<Search size={13} className="text-emerald-400" />} label="DD" tip="dd" value={g.dd} />
              <Res icon={<Sparkles size={13} className="text-amber-300" />} label="ops" tip="ops" value={g.ops} />
              <div className="flex items-center gap-1.5 rounded-md border border-slate-700/60 bg-slate-900/60 backdrop-blur-md px-2.5 py-1"><Activity size={13} className={regClr} /><span className="text-[10px] text-slate-500"><Term k="regime">{lang === "ru" ? "цикл" : "regime"}</Term></span><span className={`font-mono text-xs ${regClr}`}>{regimeLabel(g.regime, lang)}</span></div>
              <div className="flex items-center gap-1.5 rounded-md border border-slate-700/60 bg-slate-900/60 backdrop-blur-md px-2.5 py-1"><span className="text-[10px] text-slate-500"><Term k="hot">{t("hotPrefix")}</Term></span><span className="font-mono text-xs text-amber-300">{ARCH[g.hotSector].label}</span></div>
            </div>
            {g.over && (<div className="mt-3 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-rose-300 text-sm flex items-center justify-between"><span className="flex items-center gap-2"><AlertTriangle size={15} /> {t("gameOver")}</span><button onClick={() => { setGame(initGame()); setRunning(false); }} className="rounded border border-rose-400/40 px-2 py-0.5 text-xs hover:bg-rose-500/20">{t("newFund")}</button></div>)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* питчи */}
            <section className="rounded-xl border border-slate-700/60 bg-slate-900/50 backdrop-blur-md p-3">
              <div className="flex items-center gap-2 mb-2 text-slate-300 text-sm font-medium"><Inbox size={15} className="text-amber-300" /> {t("pitches")}<span className="ml-auto text-xs text-slate-500 font-mono">{g.inbox.length} {t("queue")}</span></div>
              <div className="space-y-2 max-h-[46vh] overflow-auto pr-1">
                {g.inbox.length === 0 && <Empty text={t("emptyInbox")} />}
                {g.inbox.map((d) => (
                  <button key={d.id} onClick={() => setOpenId(d.id)} className={`w-full text-left rounded-lg border p-3 transition-colors ${d.special ? "border-amber-500/60 bg-amber-500/5 hover:bg-amber-500/10" : "border-slate-700/60 bg-slate-900/70 backdrop-blur-sm hover:border-amber-500/40 hover:bg-slate-800/60"}`}>
                    <div className="flex items-center justify-between"><span className="font-medium text-slate-100">{d.name} <span className="text-slate-500 font-mono text-xs">${d.ticker}</span></span><span className="text-xs font-mono text-slate-400">{d.stage}</span></div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">{d.sector}{d.special && <span className="rounded bg-amber-500/20 text-amber-300 px-1.5 py-0.5 text-[10px]">★ special</span>}{d.oversub && !d.special && <span className="rounded bg-amber-500/15 text-amber-300 px-1.5 py-0.5 text-[10px]">hot</span>}</div>
                    <div className="mt-2 flex items-center justify-between"><span className="font-mono text-xs text-slate-300">ask {fmt$(d.ask)} · @{fmt$(d.valuation)}</span><div className="flex gap-1">{d.coInvestors.slice(0, 3).map((f, i) => (<span key={i} className={`rounded border px-1.5 py-0.5 text-[10px] ${TIER_COLOR[tierOf(f)]}`}>{f}</span>))}</div></div>
                  </button>
                ))}
              </div>
            </section>

            {/* портфель */}
            <section className="rounded-xl border border-slate-700/60 bg-slate-900/50 backdrop-blur-md p-3">
              <div className="flex items-center gap-2 mb-2 text-slate-300 text-sm font-medium"><Wallet size={15} className="text-amber-300" /> {t("portfolio")}<span className="ml-auto text-xs text-slate-500 font-mono">{active.length} {t("positions")}</span></div>
              {/* панель массовых действий */}
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <button onClick={() => setConfirm({ text: t("confirmSellLosers"), run: () => doSellMany(g, (h) => h.fullMark < h.invested) })} className="flex items-center gap-1 rounded border border-rose-600/40 bg-rose-500/10 text-rose-300 px-2 py-1 text-[11px] font-mono hover:bg-rose-500/20"><TrendingDown size={11} /> {t("sellLosers")}</button>
                <button onClick={() => setConfirm({ text: t("confirmSellWinners"), run: () => doSellMany(g, (h) => h.fullMark > h.invested) })} className="flex items-center gap-1 rounded border border-emerald-600/40 bg-emerald-500/10 text-emerald-300 px-2 py-1 text-[11px] font-mono hover:bg-emerald-500/20"><TrendingUp size={11} /> {t("sellWinners")}</button>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-1.5 py-1"><ArrowUpDown size={11} className="text-slate-400" /><select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="bg-transparent text-[11px] text-slate-300 outline-none"><option className="bg-slate-800" value="pnl">{t("sPnl")}</option><option className="bg-slate-800" value="size">{t("sSize")}</option><option className="bg-slate-800" value="sector">{t("sSector")}</option></select></span>
                  <span className="flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-1.5 py-1"><Filter size={11} className="text-slate-400" /><select value={filterKey} onChange={(e) => setFilterKey(e.target.value)} className="bg-transparent text-[11px] text-slate-300 outline-none"><option className="bg-slate-800" value="all">{t("fAll")}</option><option className="bg-slate-800" value="liquid">{t("fLiquid")}</option><option className="bg-slate-800" value="losers">{t("fLosers")}</option><option className="bg-slate-800" value="winners">{t("fWinners")}</option></select></span>
                  <button onClick={() => setCompact((c) => !c)} className="flex items-center gap-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[11px] font-mono text-slate-300"><List size={11} /> {compact ? t("cards") : t("compact")}</button>
                </div>
              </div>
              <div className="space-y-2 max-h-[44vh] overflow-auto pr-1">
                {active.length === 0 && <Empty text={t("emptyPort")} />}
                {view.map((h) => {
                  const pnl = h.fullMark / h.invested - 1, val = h.fullMark * h.held;
                  const loan = g.loans.find((l) => l.holdingId === h.id), u = unlockedPct(h, g.week), avail = availableValue(h, g.week);
                  if (compact) return (
                    <div key={h.id} className="flex items-center gap-2 rounded-md border border-slate-700/60 bg-slate-900/70 backdrop-blur-sm px-2.5 py-1.5 text-xs font-mono">
                      <span className="text-slate-100 w-16 shrink-0">${h.ticker}</span>
                      <span className={`w-14 shrink-0 ${pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{fmtPct(pnl)}</span>
                      <span className="text-slate-400 w-16 shrink-0">{fmt$(val)}</span>
                      <span className="text-slate-500 flex-1 truncate">{ARCH[h.archetype].label}</span>
                      {h.liquid ? (<button onClick={() => setSellId(h.id)} disabled={avail < 1} className="rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 px-1.5 py-0.5 text-[10px]">{t("sell")}</button>) : (<span className="text-slate-600 text-[10px]">{Math.max(0, h.tgeWeek - g.week)}{t("weeks")}</span>)}
                    </div>
                  );
                  return (
                    <div key={h.id} className="rounded-lg border border-slate-700/60 bg-slate-900/70 backdrop-blur-sm p-3">
                      <div className="flex items-center justify-between"><span className="font-medium text-slate-100">${h.ticker}</span><span className={`font-mono text-sm ${pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{fmtPct(pnl)}</span></div>
                      <div className="mt-0.5 flex items-center justify-between text-xs text-slate-400 font-mono"><span>{ARCH[h.archetype].label}{h.helped && " ★"}</span><span>{fmt$(val)}</span></div>
                      {loan && <div className="mt-1 text-[11px] text-rose-300 font-mono"><Term k="ltv">залог</Term> · {fmt$(loan.principal)}</div>}
                      {h.liquid && (<div className="mt-1 text-[11px] text-slate-500 font-mono"><Term k="vesting">{t("unlocked")}</Term> {Math.round(u * 100)}% · {t("available")} {fmt$(avail)}</div>)}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {!h.liquid ? (<><span className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-400 font-mono">{t("locked")} {Math.max(0, h.tgeWeek - g.week)} {t("weeks")}</span>{h.followOn && <button onClick={() => act((gg) => doFollow(gg, h))} disabled={g.cash < h.followOn} className="rounded border border-sky-600/40 bg-sky-500/10 text-sky-300 px-2 py-1 text-[11px] font-mono disabled:opacity-40">{t("followBtn")} {fmt$(h.followOn)}</button>}</>) : (<>
                          <button onClick={() => setSellId(h.id)} disabled={avail < 1} className="flex items-center gap-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 px-2 py-1 text-[11px] font-mono"><TrendingDown size={11} /> {t("sell")}</button>
                          <button onClick={() => act((gg) => doLoan(gg, h))} disabled={!!loan || avail < 1000} className="flex items-center gap-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 px-2 py-1 text-[11px] font-mono"><Landmark size={11} /> {t("loan")}</button>
                          <button onClick={() => act((gg) => doHelp(gg, h))} disabled={h.helped || g.ops < 1} className="flex items-center gap-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 px-2 py-1 text-[11px] font-mono"><Sparkles size={11} /> {t("help")}</button>
                        </>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* M&A */}
          <section className="mt-4 rounded-xl border border-slate-700/60 bg-slate-900/50 backdrop-blur-md p-3">
            <div className="flex items-center gap-2 mb-2 text-slate-300 text-sm font-medium"><Building2 size={15} className="text-amber-300" /> <Term k="mna">{t("mna")}</Term><span className="ml-auto text-xs text-slate-500 font-mono">{g.mnaTargets.length}</span></div>
            {g.mnaTargets.length === 0 ? <Empty text={t("mnaEmpty")} /> : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {g.mnaTargets.map((tg) => (<div key={tg.id} className="rounded-lg border border-slate-700/60 bg-slate-900/70 backdrop-blur-sm p-3"><div className="font-medium text-slate-100 text-sm">{tg.name}</div><div className="mt-1 text-xs text-slate-400 font-mono">AUM {fmt$(tg.aum)}</div><div className="text-xs text-amber-300 font-mono">{lang === "ru" ? "цена" : "price"} {fmt$(tg.price)}</div><button onClick={() => act((gg) => doAcquire(gg, tg))} disabled={g.cash < tg.price} className="mt-2 w-full rounded border border-amber-600/40 bg-amber-500/10 text-amber-300 px-2 py-1 text-[11px] font-mono hover:bg-amber-500/20 disabled:opacity-40">{t("acquire")}</button></div>))}
              </div>
            )}
          </section>

          {/* лог */}
          <section className="mt-4 rounded-xl border border-slate-700/60 bg-slate-900/50 backdrop-blur-md p-3">
            <div className="text-slate-400 text-xs font-mono mb-1.5">{t("eventlog")}</div>
            <div className="space-y-1 max-h-40 overflow-auto font-mono text-xs">{g.log.map((e, i) => (<div key={i} className={`flex gap-2 ${logColor(e.kind)}`}><span className="text-slate-600 shrink-0">W{e.week}</span><span>{logText(e, lang)}</span></div>))}</div>
          </section>

          {/* seed */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-slate-500">
            <Term k="seed">{t("seed")}</Term>: <span className="text-slate-300">{g.seed}</span>
            <button onClick={copySeed} className="flex items-center gap-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5"><Copy size={10} /> {copied ? t("copied") : ""}</button>
            <input value={seedInput} onChange={(e) => setSeedInput(e.target.value)} placeholder="seed…" className="w-24 rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-slate-300 outline-none" />
            <button onClick={startSeed} className="rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5">{t("playSeed")}</button>
            <button onClick={() => { setGame(initGame()); setRunning(false); }} className="flex items-center gap-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5"><Dices size={10} /> {t("newGame")}</button>
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-600">{t("legend")}</p>
        </div>

        {/* модал сделки */}
        {deal && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpenId(null)}>
            <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between"><div><div className="text-lg font-semibold text-slate-100">{deal.name} <span className="text-slate-500 font-mono text-sm">${deal.ticker}</span></div><div className="text-xs text-slate-400">{deal.sector} · {deal.stage} · <span className="text-slate-500">{lang === "ru" ? "кейс" : "case"}: {deal.real}</span></div></div><button onClick={() => setOpenId(null)} className="text-slate-500 hover:text-slate-300"><X size={18} /></button></div>
              {deal.special && <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-300 text-xs">{t("special")}</div>}
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-mono">
                <div className="rounded-md border border-slate-700/60 bg-slate-950/50 px-2.5 py-1.5"><div className="text-[10px] text-slate-500"><Term k="valuation">{t("valuation")}</Term></div><div className="text-slate-200">{fmt$(deal.valuation)}</div></div>
                <div className="rounded-md border border-slate-700/60 bg-slate-950/50 px-2.5 py-1.5"><div className="text-[10px] text-slate-500">{t("ask")}</div><div className="text-slate-200">{fmt$(deal.ask)}</div></div>
                <div className="rounded-md border border-slate-700/60 bg-slate-950/50 px-2.5 py-1.5"><div className="text-[10px] text-slate-500">{t("type")}</div><div className="text-slate-200"><Term k="saft">{t("token")}</Term></div></div>
                <div className="rounded-md border border-slate-700/60 bg-slate-950/50 px-2.5 py-1.5"><div className="text-[10px] text-slate-500"><Term k="traction">{t("traction")}</Term></div><div className="text-slate-200">{deal.traction}/100</div></div>
              </div>
              <div className="mt-3 text-sm text-slate-300"><span className="text-slate-500">{t("founder")}:</span> {deal.fFirst} {deal.fLast} — {BIO[lang][deal.bioIdx]}</div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1"><span>{t("coinv")}</span><button onClick={() => act((gg) => doDD(gg, deal))} disabled={g.dd < 1 || deal.dd} className="flex items-center gap-1 rounded border border-emerald-600/40 bg-emerald-500/10 text-emerald-300 px-2 py-0.5 text-[11px] disabled:opacity-40"><Search size={11} /> {deal.dd ? "✓ DD" : `${t("runDD")} (−1)`}</button></div>
                <div className="flex flex-wrap gap-1.5">{deal.coInvestors.map((f, i) => (<span key={i} className={`rounded border px-2 py-0.5 text-xs ${TIER_COLOR[tierOf(f)]}`}>{f}</span>))}</div>
                {deal.dd && (<div className="mt-2 rounded-md border border-emerald-600/30 bg-emerald-500/5 px-2.5 py-1.5 text-xs"><span className={deal.q > 0.66 ? "text-emerald-300" : deal.q > 0.4 ? "text-amber-300" : "text-rose-300"}>{deal.q > 0.66 ? t("ddHigh") : deal.q > 0.4 ? t("ddMid") : t("ddLow")}</span>{deal.redFlag && <span className="ml-2 text-rose-400">{t("ddRed")}</span>}</div>)}
              </div>
              {deal.oversub && (<div className="mt-3 rounded-md border border-amber-600/30 bg-amber-500/5 px-2.5 py-1.5 text-[11px] text-amber-300"><Term k="oversub">oversubscribed</Term> — {t("oversubMsg")}: {fmt$(maxAlloc)}</div>)}
              <div className="mt-4"><div className="flex items-center justify-between text-xs font-mono text-slate-400"><span>{t("check")}</span><span className="text-slate-200">{fmt$(amt)}</span></div><input type="range" min={100000} max={sliderMax} step={50000} value={Math.min(amt, sliderMax)} onChange={(e) => setAmt(Number(e.target.value))} className="w-full mt-1 accent-amber-500" /><div className="text-[11px] text-slate-500 font-mono mt-0.5"><Term k="allocation">{t("share")}</Term> ≈ {((Math.min(amt, sliderMax) / deal.valuation) * 100).toFixed(2)}% · {t("cash")} {fmt$(g.cash)}</div></div>
              <div className="mt-4 flex gap-2"><button onClick={() => { act((gg) => doInvest(gg, deal, Math.min(amt, sliderMax))); setOpenId(null); }} disabled={g.cash < 100000} className="flex-1 rounded-lg bg-amber-400 hover:bg-amber-300 shadow-lg shadow-amber-500/40 disabled:opacity-40 text-slate-950 font-medium py-2 text-sm">{t("invest")}</button><button onClick={() => { act((gg) => doPass(gg, deal)); setOpenId(null); }} className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm">{t("pass")}</button></div>
            </div>
          </div>
        )}

        {/* модал продажи */}
        {sellH && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4" onClick={() => setSellId(null)}>
            <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between"><div className="text-lg font-semibold text-slate-100">{t("sellTitle")} ${sellH.ticker}</div><button onClick={() => setSellId(null)} className="text-slate-500 hover:text-slate-300"><X size={18} /></button></div>
              <div className="mt-2 text-xs text-slate-400 font-mono"><Term k="vesting">{t("available")}</Term>: {fmt$(sellAvail)} ({Math.round(unlockedPct(sellH, g.week) * 100)}% {t("unlocked")})</div>
              <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-400"><span>{t("sellAmt")}</span><span className="text-slate-200">{fmt$(sellAmt)}</span></div>
              <input type="range" min={0} max={sellAvail} step={Math.max(1000, sellAvail / 100)} value={Math.min(sellAmt, sellAvail)} onChange={(e) => setSellAmt(Number(e.target.value))} className="w-full mt-1 accent-amber-500" />
              <div className="mt-2 flex gap-1.5">{[0.25, 0.5, 1].map((f) => (<button key={f} onClick={() => setSellAmt(sellAvail * f)} className="flex-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[11px] font-mono">{f * 100}%</button>))}</div>
              <button onClick={() => { act((gg) => doSellValue(gg, sellH, sellAmt)); setSellId(null); }} disabled={sellAmt < 1} className="mt-4 w-full rounded-lg bg-amber-400 hover:bg-amber-300 shadow-lg shadow-amber-500/40 disabled:opacity-40 text-slate-950 font-medium py-2 text-sm">{t("sell")} {fmt$(Math.min(sellAmt, sellAvail))}</button>
            </div>
          </div>
        )}

        {/* модал особого события (пауза) */}
        {g.event && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-xl border border-amber-500/40 bg-slate-900 p-6 text-center">
              <div className="text-amber-300 font-mono text-xs tracking-[0.25em] mb-2">{lang === "ru" ? "ОСОБОЕ СОБЫТИЕ" : "SPECIAL EVENT"} · {year}</div>
              <div className="text-slate-100 text-base leading-relaxed">{evText}</div>
              <button onClick={() => { seenEvent.current = g.event; act(doClearEvent); }} className="mt-5 rounded-lg bg-amber-400 hover:bg-amber-300 shadow-lg shadow-amber-500/40 text-slate-950 font-medium px-6 py-2 text-sm">{t("continue")}</button>
            </div>
          </div>
        )}

        {/* подтверждение массового действия */}
        {confirm && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4" onClick={() => setConfirm(null)}>
            <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-5 text-center" onClick={(e) => e.stopPropagation()}>
              <div className="text-slate-200 text-sm">{confirm.text}</div>
              <div className="mt-4 flex gap-2"><button onClick={() => { setGame(confirm.run); setConfirm(null); }} className="flex-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-medium py-2 text-sm">{t("confirm")}</button><button onClick={() => setConfirm(null)} className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm">{t("cancel")}</button></div>
            </div>
          </div>
        )}
      </div>
    </LangCtx.Provider>
  );
}

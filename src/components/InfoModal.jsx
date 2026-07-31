import React from "react";

const TEXT = {
  ru: {
    title: "DEGEN CAPITAL — что это",
    game: "Симулятор крипто-VC-фонда: инвестируй в проекты, следи за вестингом токенов и расти долю рынка.",
    walletT: "Кошелёк и профиль",
    wallet: "Подключи кошелёк и создай профиль-NFT (аватар + ник) — он хранит твой прогресс и рекорды на блокчейне Base. Играть можно и без кошелька.",
    seedT: "Seed и совместная игра",
    seed: "Каждый мир задаётся seed'ом. Поделись seed'ом — друг сыграет ровно твой расклад (основа будущих дуэлей).",
    close: "Понятно",
  },
  en: {
    title: "DEGEN CAPITAL — what is it",
    game: "A crypto VC fund simulator: back projects, watch token vesting, and grow your market share.",
    walletT: "Wallet & profile",
    wallet: "Connect a wallet and mint a profile NFT (avatar + nickname) — it stores your progress and records on the Base blockchain. You can also play without a wallet.",
    seedT: "Seed & shared play",
    seed: "Every world is defined by a seed. Share your seed and a friend plays your exact run (the basis for future duels).",
    close: "Got it",
  },
};

export default function InfoModal({ lang = "ru", onClose }) {
  const t = TEXT[lang] || TEXT.ru;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="text-amber-300 font-mono text-xs tracking-[0.25em] mb-3">{t.title}</div>
        <p className="text-sm text-slate-300 leading-relaxed">{t.game}</p>
        <div className="mt-4">
          <div className="text-slate-100 text-sm font-medium">{t.walletT}</div>
          <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{t.wallet}</p>
        </div>
        <div className="mt-3">
          <div className="text-slate-100 text-sm font-medium">{t.seedT}</div>
          <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{t.seed}</p>
        </div>
        <button onClick={onClose} className="mt-5 w-full rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-medium py-2 text-sm">
          {t.close}
        </button>
      </div>
    </div>
  );
}

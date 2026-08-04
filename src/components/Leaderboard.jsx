import React, { useState, useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { base } from "wagmi/chains";
import { avatarUrl } from "../web3/contract";
import { useProfile } from "../web3/useProfile";
import { useGameStats } from "../gameStats";
import { useLang } from "../lang";

const T = {
  ru: {
    title: "РЕЙТИНГ",
    empty: "Пока пусто. Стань первым.",
    loading: "Загрузка…",
    you: "твой фонд сейчас",
    submit: "Отправить свой результат",
    signing: "Подпись…",
    sending: "Отправка…",
    done: "Результат записан",
    notBest: "У тебя уже есть результат лучше",
    needProfile: "Создай профиль, чтобы попасть в рейтинг",
    aum: "AUM", weeks: "недель", close: "Закрыть",
    err: "Ошибка отправки",
  },
  en: {
    title: "LEADERBOARD",
    empty: "Empty for now. Be the first.",
    loading: "Loading…",
    you: "your fund now",
    submit: "Submit your result",
    signing: "Signing…",
    sending: "Sending…",
    done: "Result recorded",
    notBest: "You already have a better result",
    needProfile: "Mint a profile to enter the leaderboard",
    aum: "AUM", weeks: "weeks", close: "Close",
    err: "Submit failed",
  },
};

const fmt$ = (n) => {
  n = Number(n);
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return "$" + Math.round(n / 1e3) + "K";
  return "$" + Math.round(n);
};
const resultMessage = ({ address, aum, weeks, seed }) =>
  `DEGEN CAPITAL leaderboard\naddress: ${address.toLowerCase()}\naum: ${aum}\nweeks: ${weeks}\nseed: ${seed}`;

export default function Leaderboard({ onClose }) {
  const lang = useLang();
  const t = T[lang] || T.ru;
  const { address, isConnected, chainId } = useAccount();
  const { hasProfile } = useProfile();
  const stats = useGameStats();
  const { signMessageAsync } = useSignMessage();

  const [rows, setRows] = useState(null);
  const [status, setStatus] = useState(""); // "", signing, sending, done, notBest, err
  const canSubmit = isConnected && chainId === base.id && hasProfile;

  const load = () => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => setRows(d.rows || []))
      .catch(() => setRows([]));
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    try {
      const aum = Math.round(stats.aum), weeks = stats.weeks, seed = stats.seed;
      setStatus("signing");
      const message = resultMessage({ address, aum, weeks, seed });
      const signature = await signMessageAsync({ message });
      setStatus("sending");
      const r = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, aum, weeks, seed, signature }),
      });
      const d = await r.json();
      if (!r.ok) { setStatus("err"); return; }
      setStatus(d.updated ? "done" : "notBest");
      load();
    } catch (e) {
      setStatus("err");
    }
  };

  const busy = status === "signing" || status === "sending";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="text-amber-300 font-mono text-xs tracking-[0.25em] mb-3">🏆 {t.title}</div>

        <div className="max-h-[50vh] overflow-auto space-y-1">
          {rows === null && <div className="text-slate-500 text-xs">{t.loading}</div>}
          {rows && rows.length === 0 && <div className="text-slate-500 text-xs">{t.empty}</div>}
          {rows && rows.map((r, i) => (
            <div key={r.address} className="flex items-center gap-2 rounded-md border border-slate-700/60 bg-slate-900/70 px-2.5 py-1.5">
              <span className="w-5 text-center font-mono text-xs text-slate-500">{i + 1}</span>
              <img src={avatarUrl(Number(r.avatar_id))} alt="" className="w-6 h-6 rounded-full object-cover" />
              <span className="flex-1 truncate font-mono text-xs text-slate-200">{r.nick}</span>
              <span className="font-mono text-xs text-amber-300">{fmt$(r.final_aum)}</span>
              <span className="w-14 text-right font-mono text-[10px] text-slate-500">{r.weeks} {t.weeks}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-slate-800 pt-3">
          {canSubmit ? (
            <>
              <div className="text-[11px] font-mono text-slate-400 mb-2">
                {t.you}: <span className="text-amber-300">{fmt$(stats.aum)}</span> · {stats.weeks} {t.weeks}
              </div>
              <button onClick={submit} disabled={busy}
                className="w-full rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-medium py-2 text-sm shadow-lg shadow-amber-500/40 disabled:opacity-40">
                {status === "signing" ? t.signing : status === "sending" ? t.sending : t.submit}
              </button>
              <div className="mt-1 h-4 text-[11px] font-mono text-center">
                {status === "done" && <span className="text-emerald-400">✓ {t.done}</span>}
                {status === "notBest" && <span className="text-slate-500">{t.notBest}</span>}
                {status === "err" && <span className="text-rose-400">{t.err}</span>}
              </div>
            </>
          ) : (
            <div className="text-[11px] font-mono text-slate-500">{t.needProfile}</div>
          )}
        </div>

        <button onClick={onClose} className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 py-2 text-sm">{t.close}</button>
      </div>
    </div>
  );
}

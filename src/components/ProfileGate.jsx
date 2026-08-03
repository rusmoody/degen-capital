import React, { useState, useEffect } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESS, AVATAR_COUNT, avatarUrl, NICK_RE } from "../web3/contract";
import { abi } from "../web3/abi";
import { useLang } from "../lang";

const T = {
  ru: {
    title: "СОЗДАТЬ ПРОФИЛЬ",
    sub: "Профиль-NFT на Base: аватар навсегда, ник уникален. Минт бесплатный (только газ).",
    ph: "никнейм (a-z, 0-9, 3-16)",
    badFmt: "только a-z, 0-9, длина 3–16",
    checking: "проверка…",
    free: "✓ ник свободен",
    taken: "✗ ник занят",
    minting: "Минт…",
    create: "Создать профиль",
    later: "Позже",
  },
  en: {
    title: "CREATE PROFILE",
    sub: "Profile NFT on Base: avatar is permanent, nickname is unique. Mint is free (gas only).",
    ph: "nickname (a-z, 0-9, 3-16)",
    badFmt: "only a-z, 0-9, length 3–16",
    checking: "checking…",
    free: "✓ nickname available",
    taken: "✗ nickname taken",
    minting: "Minting…",
    create: "Create profile",
    later: "Later",
  },
};

export default function ProfileGate({ onClose, onDone }) {
  const lang = useLang();
  const t = T[lang] || T.ru;
  const [avatar, setAvatar] = useState(1);
  const [nick, setNick] = useState("");
  const valid = NICK_RE.test(nick);

  const nickCheck = useReadContract({
    address: CONTRACT_ADDRESS, abi, functionName: "nickAvailable", args: [nick],
    query: { enabled: valid },
  });
  const available = valid && nickCheck.data === true;
  const taken = valid && nickCheck.data === false;

  const feeQuery = useReadContract({ address: CONTRACT_ADDRESS, abi, functionName: "mintFee" });
  const fee = feeQuery.data ?? 0n;

  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: mining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => { if (isSuccess) { onDone && onDone(); } }, [isSuccess]);

  const mint = () => {
    if (!available) return;
    writeContract({
      address: CONTRACT_ADDRESS, abi, functionName: "mintProfile",
      args: [nick, avatar], value: fee,
    });
  };

  const busy = isPending || mining;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="text-amber-300 font-mono text-xs tracking-[0.25em] mb-1">{t.title}</div>
        <div className="text-slate-400 text-xs mb-4">{t.sub}</div>

        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: AVATAR_COUNT }, (_, i) => i + 1).map((id) => (
            <button key={id} onClick={() => setAvatar(id)}
              className={`aspect-square rounded-lg overflow-hidden border-2 ${avatar === id ? "border-amber-400" : "border-slate-700 hover:border-slate-500"}`}>
              <img src={avatarUrl(id)} alt={"avatar " + id} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        <div className="mt-4">
          <input
            value={nick}
            onChange={(e) => setNick(e.target.value.toLowerCase())}
            placeholder={t.ph}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-500/50 font-mono"
          />
          <div className="mt-1 h-4 text-[11px] font-mono">
            {nick && !valid && <span className="text-rose-400">{t.badFmt}</span>}
            {valid && nickCheck.isLoading && <span className="text-slate-500">{t.checking}</span>}
            {available && <span className="text-emerald-400">{t.free}</span>}
            {taken && <span className="text-rose-400">{t.taken}</span>}
          </div>
        </div>

        {error && <div className="mt-2 text-[11px] text-rose-400 font-mono break-words">{(error.shortMessage || error.message || "").slice(0, 160)}</div>}

        <div className="mt-4 flex gap-2">
          <button onClick={mint} disabled={!available || busy}
            className="flex-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-medium py-2 text-sm shadow-lg shadow-amber-500/40 disabled:opacity-40">
            {busy ? t.minting : t.create}
          </button>
          <button onClick={onClose} className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm">{t.later}</button>
        </div>
      </div>
    </div>
  );
}

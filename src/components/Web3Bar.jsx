import React, { useState } from "react";
import { useAccount } from "wagmi";
import { base } from "wagmi/chains";
import ConnectButton from "./ConnectButton";
import ProfileBadge from "./ProfileBadge";
import ProfileGate from "./ProfileGate";
import InfoModal from "./InfoModal";
import { useProfile } from "../web3/useProfile";
import { useLang } from "../lang";

export default function Web3Bar() {
  const lang = useLang();
  const { isConnected, chainId } = useAccount();
  const { hasProfile, profile, refetch } = useProfile();
  const [gate, setGate] = useState(false);
  const [info, setInfo] = useState(false);
  const onBase = chainId === base.id;

  return (
    <div className="fixed top-3 right-3 z-20 flex items-center gap-2">
      <button
        onClick={() => setInfo(true)}
        title={lang === "ru" ? "Что это" : "What is this"}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-800/80 text-slate-300 text-sm font-serif italic hover:bg-slate-700"
      >
        i
      </button>
      {isConnected && onBase && hasProfile && <ProfileBadge profile={profile} />}
      {isConnected && onBase && !hasProfile && (
        <button
          onClick={() => setGate(true)}
          className="rounded-md bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1.5 text-xs font-medium shadow-lg shadow-amber-500/30"
        >
          {lang === "ru" ? "Создать профиль" : "Create profile"}
        </button>
      )}
      <ConnectButton />

      {info && <InfoModal lang={lang} onClose={() => setInfo(false)} />}
      {gate && (
        <ProfileGate onClose={() => setGate(false)} onDone={() => { setGate(false); refetch(); }} />
      )}
    </div>
  );
}

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { base } from "wagmi/chains";
import ConnectButton from "./ConnectButton";
import ProfileBadge from "./ProfileBadge";
import ProfileGate from "./ProfileGate";
import { useProfile } from "../web3/useProfile";

export default function Web3Bar() {
  const { isConnected, chainId } = useAccount();
  const { hasProfile, profile, refetch } = useProfile();
  const [gate, setGate] = useState(false);
  const onBase = chainId === base.id;

  return (
    <div className="fixed top-3 left-3 z-20 flex items-center gap-2">
      {isConnected && onBase && hasProfile && <ProfileBadge profile={profile} />}
      {isConnected && onBase && !hasProfile && (
        <button
          onClick={() => setGate(true)}
          className="rounded-md bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1.5 text-xs font-medium shadow-lg shadow-amber-500/30"
        >
          Создать профиль
        </button>
      )}
      <ConnectButton />
      {gate && (
        <ProfileGate
          onClose={() => setGate(false)}
          onDone={() => { setGate(false); refetch(); }}
        />
      )}
    </div>
  );
}

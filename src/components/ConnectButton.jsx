import React, { useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { base } from "wagmi/chains";

const short = (a) => (a ? a.slice(0, 6) + "…" + a.slice(-4) : "");

export default function ConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [open, setOpen] = useState(false);

  // подключён, но не в сети Base → предложить переключить
  if (isConnected && chainId !== base.id) {
    return (
      <button
        onClick={() => switchChain({ chainId: base.id })}
        className="rounded-md border border-amber-500/50 bg-amber-500/15 text-amber-300 px-3 py-1.5 text-xs font-mono hover:bg-amber-500/25"
      >
        Switch to Base
      </button>
    );
  }

  if (isConnected) {
    return (
      <button
        onClick={() => disconnect()}
        title="Отключить кошелёк"
        className="rounded-md border border-slate-700 bg-slate-800 text-slate-300 px-3 py-1.5 text-xs font-mono hover:bg-slate-700"
      >
        {short(address)} · выйти
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        className="rounded-md bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1.5 text-xs font-medium shadow-lg shadow-amber-500/30 disabled:opacity-50"
      >
        {isPending ? "Подключение…" : "Connect Wallet"}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-48 rounded-lg border border-slate-700 bg-slate-900 p-1 z-50 shadow-xl">
          {connectors.map((c) => (
            <button
              key={c.uid}
              onClick={() => { connect({ connector: c }); setOpen(false); }}
              className="w-full text-left rounded-md px-3 py-2 text-xs font-mono text-slate-200 hover:bg-slate-800"
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

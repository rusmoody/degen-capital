import React from "react";
import { avatarUrl } from "../web3/contract";

export default function ProfileBadge({ profile }) {
  if (!profile) return null;
  return (
    <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1">
      <img src={avatarUrl(Number(profile.avatarId))} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
      <span className="font-mono text-xs text-slate-200">{profile.nick}</span>
    </div>
  );
}

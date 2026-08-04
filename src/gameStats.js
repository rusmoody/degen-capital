import { useSyncExternalStore } from "react";

// Shared snapshot of the current run, published by the game and read by the
// web3 layer (leaderboard submit lives outside App).
let stats = { aum: 0, weeks: 0, seed: 0, over: false };
const subs = new Set();

export function setGameStats(s) {
  stats = s;
  subs.forEach((f) => f());
}
export function getGameStats() {
  return stats;
}
function subscribe(cb) {
  subs.add(cb);
  return () => subs.delete(cb);
}
export function useGameStats() {
  return useSyncExternalStore(subscribe, getGameStats, getGameStats);
}

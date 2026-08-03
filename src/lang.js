import { useSyncExternalStore } from "react";

// Single shared language source for the whole app (game + web3 UI).
let lang = "ru";
try {
  const s = localStorage.getItem("dc_lang");
  if (s === "ru" || s === "en") lang = s;
} catch (e) {}

const subs = new Set();

export function getLang() {
  return lang;
}
export function setLang(next) {
  lang = next;
  try { localStorage.setItem("dc_lang", next); } catch (e) {}
  subs.forEach((f) => f());
}
export function toggleLang() {
  setLang(lang === "ru" ? "en" : "ru");
}
function subscribe(cb) {
  subs.add(cb);
  return () => subs.delete(cb);
}
export function useLang() {
  return useSyncExternalStore(subscribe, getLang, getLang);
}

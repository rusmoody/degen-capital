import React, { createContext, useContext, useState } from "react";

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState("ru");
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) return { lang: "ru", setLang: () => {} };
  return ctx;
}

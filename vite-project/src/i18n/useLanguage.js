import { useContext } from "react";
import { LanguageContext } from "./context";

/** Acceso al idioma activo y al copy ya traducido (`t`). */
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage debe usarse dentro de <LanguageProvider>");
  }
  return ctx;
}

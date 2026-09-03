import { useCallback, useEffect, useMemo, useState } from "react";
import { LanguageContext } from "./context";
import { content, DEFAULT_LANGUAGE, LANGUAGES } from "../data/content";

const STORAGE_KEY = "portfolio-lang";

/** Idioma inicial: preferencia guardada → idioma del navegador → español. */
function resolveInitialLanguage() {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && LANGUAGES.includes(stored)) return stored;
  } catch {
    // localStorage puede estar bloqueado (modo privado, cookies desactivadas).
    // No es motivo para romper la página: se sigue con la detección normal.
  }

  const browser = window.navigator?.language ?? "";
  return browser.toLowerCase().startsWith("es") ? "es" : "en";
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(resolveInitialLanguage);

  // El atributo lang del documento tiene que seguir al idioma real del
  // contenido: de eso dependen los lectores de pantalla y los buscadores.
  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Sin persistencia, pero la sesión actual funciona igual.
    }
  }, [lang]);

  const toggleLanguage = useCallback(() => {
    setLang((current) => (current === "es" ? "en" : "es"));
  }, []);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      toggleLanguage,
      t: content[lang],
      otherLang: lang === "es" ? "en" : "es",
    }),
    [lang, toggleLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

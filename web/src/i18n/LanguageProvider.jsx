import { useContext, useEffect, useMemo, useState } from "react";
import { LanguageContext } from "./context.js";
import { content, LANGUAGES, DEFAULT_LANGUAGE } from "../data/content.js";

export const LANG_KEY = "portfolio-lang";

function readStoredLang() {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    return LANGUAGES.includes(stored) ? stored : DEFAULT_LANGUAGE;
  } catch {
    // Private browsing can throw on access, not just return null.
    return DEFAULT_LANGUAGE;
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(readStoredLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      // Persistence is a convenience; failing to store must not break the UI.
    }
  }, [lang]);

  const value = useMemo(
    () => ({ lang, setLang, t: content[lang] }),
    [lang],
  );
  return <LanguageContext value={value}>{children}</LanguageContext>;
}

// This hook lives beside LanguageProvider because that is the interface this
// project requires (`useLanguage` imported from LanguageProvider.jsx). The
// react-refresh rule can't tell a hook export from any other function
// export, so it flags this as a false positive.
// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}

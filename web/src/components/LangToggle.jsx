import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { LANGUAGES } from "../data/content.js";

// A single button, not a two-segment switch, so the side rail's Tab-stop
// and button counts (Task 7) stay predictable. The active code slides out
// while the other slides in — transform + opacity only, clipped by the
// overflow-hidden button itself.
export default function LangToggle() {
  const { lang, setLang, t } = useLanguage();

  const handleClick = () => {
    const next = LANGUAGES.find((code) => code !== lang) ?? lang;
    setLang(next);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t.nav.languageLabel}
      className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface text-sm font-semibold text-text active:scale-[0.97]"
    >
      {LANGUAGES.map((code) => (
        <span
          key={code}
          aria-hidden="true"
          className={`absolute inset-0 flex items-center justify-center uppercase transition-[opacity,transform] duration-200 ease-entrance ${
            code === lang ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
          }`}
        >
          {code}
        </span>
      ))}
    </button>
  );
}

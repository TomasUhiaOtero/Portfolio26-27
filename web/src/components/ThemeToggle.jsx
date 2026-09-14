import { useTheme } from "../theme/ThemeProvider.jsx";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { SunIcon, MoonIcon } from "./icons.jsx";

// A true single-path sun<->moon morph needs two `d` strings with identical
// segment structure, and animating `d` is neither `transform` nor `opacity`
// (this project's only allowed animated properties). Rather than ship a
// path morph that either violates that rule or visibly snaps, this toggle
// crossfades and rotates two separate icons — transform + opacity only.
export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { t } = useLanguage();
  const label = theme === "dark" ? t.nav.themeLabelToLight : t.nav.themeLabelToDark;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className="relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-line bg-surface text-text transition-transform duration-200 ease-entrance active:scale-[0.97] md:size-10"
    >
      <SunIcon
        aria-hidden="true"
        className={`absolute size-5 transition-[opacity,transform] duration-200 ease-entrance ${
          theme === "dark" ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
        }`}
      />
      <MoonIcon
        aria-hidden="true"
        className={`absolute size-5 transition-[opacity,transform] duration-200 ease-entrance ${
          theme === "dark" ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
        }`}
      />
    </button>
  );
}

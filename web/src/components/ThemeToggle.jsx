import { useTheme } from "../theme/ThemeProvider.jsx";
import { SunIcon, MoonIcon } from "./icons.jsx";
import { content, DEFAULT_LANGUAGE } from "../data/content.js";

// Task 3 introduces LanguageProvider / useLanguage(). Until then this reads
// the default-language copy directly instead of inventing a placeholder
// language context.
const nav = content[DEFAULT_LANGUAGE].nav;

// A true single-path sun<->moon morph needs two `d` strings with identical
// segment structure, and animating `d` is neither `transform` nor `opacity`
// (this project's only allowed animated properties). Rather than ship a
// path morph that either violates that rule or visibly snaps, this toggle
// crossfades and rotates two separate icons — transform + opacity only.
export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const label = theme === "dark" ? nav.themeLabelToLight : nav.themeLabelToDark;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className="relative flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-text transition-transform duration-200 ease-entrance active:scale-[0.97]"
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

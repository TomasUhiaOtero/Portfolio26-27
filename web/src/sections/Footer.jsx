import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { profile } from "../data/content.js";
import { getLenis } from "../hooks/useLenis.js";

/**
 * The site footer: name, current year, rights and stack credit, plus a
 * back-to-top button. Rendered as a sibling of `<main>` in App.jsx, never
 * inside it — landmarks must not nest.
 */
export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  const handleBackToTop = () => {
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(0);
    } else {
      // getLenis() only returns null under reduced motion — exactly the
      // user who asked for no smooth scroll, so this fallback jumps
      // instantly rather than forcing behavior:"smooth". Mirrors how
      // SideRail.jsx and the skip link fall back to a plain native scroll
      // in the same situation.
      window.scrollTo(0, 0);
    }
  };

  return (
    <footer className="border-t border-line py-10">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center gap-4 px-6 text-center sm:flex-row sm:justify-between sm:px-10 sm:text-left">
        <p className="text-sm text-mute">
          {profile.name} · {year} · {t.footer.rights}
        </p>
        <p className="text-sm text-mute">{t.footer.builtWith}</p>
        <button
          type="button"
          onClick={handleBackToTop}
          className="text-sm text-text underline decoration-line underline-offset-4 transition-colors hover:decoration-accent"
        >
          {t.footer.backToTop}
        </button>
      </div>
    </footer>
  );
}

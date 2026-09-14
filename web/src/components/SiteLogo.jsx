import { useCallback } from "react";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { getLenis } from "../hooks/useLenis.js";

/**
 * Fixed brand mark, top-left. Clicking it returns to the very top of the
 * page — routed through Lenis (exactly like SideRail's section jumps) so
 * it doesn't fight the smooth-scroll driver, with a native fallback for
 * reduced motion, where no Lenis instance is ever created.
 *
 * No `backdrop-blur`: this sits over the hero's animated WebGL field, and
 * a live backdrop filter there recomputes every frame (SideRail drops its
 * own blur on desktop for the same reason). A solid chip instead.
 */
export default function SiteLogo() {
  const { t } = useLanguage();

  const handleClick = useCallback(() => {
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(0);
    } else {
      window.scrollTo({ top: 0 });
    }
  }, []);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t.nav.brandAria}
      className="fixed left-4 top-4 z-40 flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border border-line bg-surface text-sm font-semibold tracking-tight text-text shadow-sm transition-transform duration-200 ease-entrance hover:scale-105 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg md:left-6 md:top-6"
    >
      <span aria-hidden="true">TU</span>
    </button>
  );
}

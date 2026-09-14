import { ThemeProvider } from "./theme/ThemeProvider.jsx";
import { LanguageProvider, useLanguage } from "./i18n/LanguageProvider.jsx";
import SideRail from "./components/SideRail.jsx";
import SiteLogo from "./components/SiteLogo.jsx";
import Hero from "./sections/Hero.jsx";
import About from "./sections/About.jsx";
import Services from "./sections/Services.jsx";
import Experience from "./sections/Experience.jsx";
import Work from "./sections/Work.jsx";
import Contact from "./sections/Contact.jsx";
import Footer from "./sections/Footer.jsx";
import useLenis, { getLenis } from "./hooks/useLenis.js";

function AppShell() {
  const { t } = useLanguage();

  // Called once, here — later tasks reach the instance via `getLenis()`
  // instead of prop-drilling it through the tree.
  useLenis();

  // A plain `href="#main"` jump relies on the browser's native fragment
  // scroll, which fights Lenis: Lenis drives scroll position itself every
  // raf tick, and a native jump lands the viewport somewhere Lenis's own
  // target-scroll state never agreed to, which then snaps to a wrong
  // position (verified live — it landed near the bottom of the document,
  // inside a pinned section's spacer, not at `#main`). SideRail.jsx's own
  // `handleSelect` hits the exact same hazard for the nav links and
  // solves it the same way: route the jump through `lenis.scrollTo(el)`
  // when an instance exists, and fall back to native `scrollIntoView`
  // only when it does not (reduced motion). Focus is moved manually since
  // `preventDefault()` stops the browser from doing it for us.
  const handleSkipToContent = (event) => {
    event.preventDefault();
    const main = document.getElementById("main");
    if (!main) return;

    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(main, { immediate: true });
    } else {
      main.scrollIntoView();
    }

    // `<main>` has no tabindex, so it is not natively focusable — this
    // is what the fragment-navigation spec does for the target of a
    // hash link, and doing it explicitly here (rather than relying on
    // default anchor behaviour, which we just suppressed) is what
    // actually moves screen-reader/keyboard focus past the nav.
    main.setAttribute("tabindex", "-1");
    main.focus();
  };

  return (
    <>
      {/* First focusable element in the document. Visually hidden until
          focused (sr-only-until-focus), so a sighted keyboard/AT user
          tabbing from a blank page load lands here before anything else.
          Points at `#main` below. */}
      <a
        href="#main"
        onClick={handleSkipToContent}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-bg"
      >
        {t.nav.skipToContent}
      </a>

      <main id="main" className="relative min-h-dvh bg-bg text-text">
        <SiteLogo />
        <SideRail />
        <Hero />
        <About />
        <Services />
        <Experience />
        <Work />
        <Contact />
      </main>

      {/* Sibling of `<main>`, never nested inside it — landmarks must not
          nest. */}
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppShell />
      </LanguageProvider>
    </ThemeProvider>
  );
}

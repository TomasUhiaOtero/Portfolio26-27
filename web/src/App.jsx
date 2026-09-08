import { ThemeProvider } from "./theme/ThemeProvider.jsx";
import { LanguageProvider, useLanguage } from "./i18n/LanguageProvider.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import LangToggle from "./components/LangToggle.jsx";
import Reveal from "./components/Reveal.jsx";
import useLenis from "./hooks/useLenis.js";

function AppShell() {
  const { t } = useLanguage();
  // Called once, here — later tasks reach the instance via `getLenis()`
  // instead of prop-drilling it through the tree.
  useLenis();

  return (
    <main className="min-h-dvh bg-bg text-text">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LangToggle />
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-6 pb-16">
        <h1 className="text-3xl font-semibold text-text">{t.hero.headline}</h1>
        <p className="mt-3 text-mute">{t.hero.subheadline}</p>
        <Reveal className="mt-6 rounded-2xl border border-line bg-surface p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2 rounded-xl bg-surface-2 p-4">
            <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
            <span className="text-accent">{t.hero.primaryCta}</span>
          </div>
        </Reveal>
      </div>
    </main>
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

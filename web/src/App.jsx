import { ThemeProvider } from "./theme/ThemeProvider.jsx";
import { LanguageProvider } from "./i18n/LanguageProvider.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import LangToggle from "./components/LangToggle.jsx";
import Hero from "./sections/Hero.jsx";
import useLenis from "./hooks/useLenis.js";

function AppShell() {
  // Called once, here — later tasks reach the instance via `getLenis()`
  // instead of prop-drilling it through the tree.
  useLenis();

  return (
    <main className="relative min-h-dvh bg-bg text-text">
      {/* Placeholder header — Task 7 replaces this with the side rail nav
          that these two controls will move into. */}
      <div className="absolute inset-x-0 top-0 z-40 mx-auto flex max-w-[1400px] items-center justify-end gap-3 px-6 py-6 sm:px-10">
        <ThemeToggle />
        <LangToggle />
      </div>
      <Hero />
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

import { ThemeProvider } from "./theme/ThemeProvider.jsx";
import { LanguageProvider } from "./i18n/LanguageProvider.jsx";
import SideRail from "./components/SideRail.jsx";
import Hero from "./sections/Hero.jsx";
import useLenis from "./hooks/useLenis.js";

function AppShell() {
  // Called once, here — later tasks reach the instance via `getLenis()`
  // instead of prop-drilling it through the tree.
  useLenis();

  return (
    <main className="relative min-h-dvh bg-bg text-text">
      <SideRail />
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

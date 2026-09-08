import { ThemeProvider } from "./theme/ThemeProvider.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import { content } from "./data/content.js";

export default function App() {
  return (
    <ThemeProvider>
      <main className="min-h-dvh bg-bg text-text">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
          <ThemeToggle />
        </div>
        <div className="mx-auto max-w-3xl px-6 pb-16">
          <h1 className="text-3xl font-semibold text-text">
            {content.es.hero.headline}
          </h1>
          <p className="mt-3 text-mute">{content.es.hero.subheadline}</p>
          <div className="mt-6 rounded-2xl border border-line bg-surface p-6 shadow-sm dark:shadow-none">
            <div className="flex items-center gap-2 rounded-xl bg-surface-2 p-4">
              <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
              <span className="text-accent">{content.es.hero.primaryCta}</span>
            </div>
          </div>
        </div>
      </main>
    </ThemeProvider>
  );
}

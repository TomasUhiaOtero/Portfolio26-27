import { useRef } from "react";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { profile } from "../data/content.js";
import useReducedMotion from "../hooks/useReducedMotion.js";
import useInViewport from "../hooks/useInViewport.js";
import useIntroTimeline from "../hooks/useIntroTimeline.js";
import SplitText from "../components/SplitText.jsx";
import Counter from "../components/Counter.jsx";
import Button from "../components/Button.jsx";

/**
 * The hero. Ships with a CSS gradient background today — Task 6 swaps
 * only the background layer below for a `<LazyCanvas>` WebGL scene, so a
 * failure in that scene can never leave this section broken.
 */
export default function Hero() {
  const { t } = useLanguage();
  const reduced = useReducedMotion();
  const rootRef = useRef(null);
  const statsRef = useRef(null);
  const statsInView = useInViewport(statsRef, {
    rootMargin: "-10% 0px",
    once: true,
  });

  useIntroTimeline(rootRef, { enabled: !reduced });

  return (
    <section
      id="inicio"
      ref={rootRef}
      className="relative flex min-h-screen flex-col overflow-hidden bg-bg"
    >
      {/* The curtain: opaque until the entrance timeline fades it out (or
          reduced motion dismisses it instantly). It is never marked
          opacity-0 in JSX — it must start fully covering the hero. The
          no-js fallback in styles/index.css removes it outright if the
          bundle never executes at all. */}
      <div data-curtain className="fixed inset-0 z-50 bg-bg" />

      {/* Background layer: its own absolutely-positioned stack, painted
          onto nothing else, so Task 6 can swap it wholesale for a
          <LazyCanvas> without touching anything below. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-surface via-bg to-bg" />
        <div className="absolute left-1/2 top-1/4 h-[60vmax] w-[60vmax] -translate-x-1/2 -translate-y-1/2 bg-accent/20 blur-[120px]" />
      </div>
      {/* Veil: keeps the copy at AA contrast whether the layer above is
          this CSS gradient or the animated scene that replaces it. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent to-bg"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-6 py-32 sm:px-10">
        <p
          data-eyebrow
          className="js-hidden text-xs uppercase tracking-[0.3em] text-mute opacity-0"
        >
          {t.hero.eyebrow}
        </p>

        <SplitText
          as="h1"
          text={t.hero.headline}
          animate={false}
          className="mt-6 text-[clamp(3rem,9vw,8rem)] font-semibold leading-[0.95] tracking-[-0.045em] text-text"
        />

        <p data-sub className="js-hidden mt-8 max-w-2xl text-lg text-mute opacity-0">
          {t.hero.subheadline}
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button
            data-cta
            href="#proyectos"
            variant="primary"
            className="js-hidden opacity-0"
          >
            {t.hero.primaryCta}
          </Button>
          <Button
            data-cta
            href={profile.resume}
            variant="ghost"
            className="js-hidden opacity-0"
          >
            {t.hero.secondaryCta}
          </Button>
        </div>

        <div
          data-cue
          aria-hidden="true"
          className="js-hidden absolute bottom-10 left-1/2 flex h-10 w-6 -translate-x-1/2 justify-center rounded-[14px] border border-line pt-2 opacity-0"
        >
          <span className="h-2 w-1 rounded-[3px] bg-mute" />
        </div>
      </div>

      <div
        ref={statsRef}
        data-stats
        className="js-hidden relative z-10 mx-auto grid w-full max-w-[1400px] grid-cols-2 gap-8 border-t border-line px-6 py-10 opacity-0 sm:px-10 md:grid-cols-4"
      >
        {t.stats.items.map((item) => (
          <div key={item.label}>
            <p className="text-3xl font-semibold tracking-tight text-text">
              <Counter value={item.value} start={statsInView} />
            </p>
            <p className="mt-1 text-sm text-mute">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

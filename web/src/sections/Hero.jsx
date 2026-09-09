import { lazy, useRef } from "react";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { profile } from "../data/content.js";
import useReducedMotion from "../hooks/useReducedMotion.js";
import useInViewport from "../hooks/useInViewport.js";
import useIntroTimeline from "../hooks/useIntroTimeline.js";
import SplitText from "../components/SplitText.jsx";
import Counter from "../components/Counter.jsx";
import Button from "../components/Button.jsx";
import LazyCanvas from "../three/LazyCanvas.jsx";

// Lazy, not a static import: `LazyCanvas` only mounts this once the hero
// nears the viewport, but a plain `import HeroField from "../three/HeroField.jsx"`
// here would still pull three/@react-three statically into this module's
// import graph — and Hero.jsx is itself reachable from the app's entry
// point, so that chunk would get fetched on initial load regardless of
// when LazyCanvas actually renders it. Wrapping the reference in
// `React.lazy` keeps the `import()` deferred to first render attempt,
// which LazyCanvas doesn't make until the wrapper is actually near view.
const HeroField = lazy(() => import("../three/HeroField.jsx"));

/**
 * The hero. Its background is a `<LazyCanvas>` WebGL particle field
 * (Task 6); the veil below keeps the copy at AA contrast over any frame
 * of that animation, and the poster LazyCanvas shows before the scene
 * mounts (or in place of it, under reduced motion) is what keeps this
 * section looking correct even if the 3D chunk never loads.
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
          onto nothing else. Renders the poster until the hero nears the
          viewport, then lazily mounts the particle field; unmounts it
          again once scrolled far enough away. */}
      <LazyCanvas
        poster={profile.heroPoster}
        rootMargin="200px"
        className="absolute inset-0 -z-10 overflow-hidden"
      >
        <HeroField />
      </LazyCanvas>
      {/* Veil: keeps the copy at AA contrast over any frame of the layer
          above, whether that's the static poster or the animated scene. */}
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

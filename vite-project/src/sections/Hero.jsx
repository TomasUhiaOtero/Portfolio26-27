import { useRef } from "react";
import SplitWords from "../components/SplitWords";
import Button from "../components/Button";
import { ArrowRight, Download } from "../components/icons";
import { useLanguage } from "../i18n/useLanguage";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useIntroTimeline } from "../hooks/useIntroTimeline";
import { profile } from "../data/content";

export default function Hero() {
  const { t } = useLanguage();
  const reduced = useReducedMotion();
  const rootRef = useRef(null);

  useIntroTimeline(rootRef, reduced);

  return (
    <section
      id="inicio"
      ref={rootRef}
      className="relative flex min-h-[92svh] items-center overflow-hidden bg-surface-dark text-on-dark"
    >
      {/* Un único degradado radial muy tenue en lugar del fondo WebGL animado:
          mismo efecto de profundidad, sin canvas ni coste de GPU. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(255,255,255,0.10),transparent_65%)]"
      />

      <div className="relative mx-auto w-full max-w-[70rem] px-5 pb-24 pt-32 sm:px-8 sm:pb-32 sm:pt-40 lg:text-center">
        <h1 className="text-display text-balance sm:text-[4.5rem] lg:text-[5.5rem]">
          <SplitWords lines={t.hero.title} />
        </h1>

        <p
          data-intro="subtitle"
          className="mt-7 max-w-[34rem] text-body text-on-dark sm:text-[1.375rem] lg:mx-auto lg:max-w-[40rem]"
        >
          {t.hero.subtitle}
        </p>

        <p
          data-intro="description"
          className="mt-4 max-w-[34rem] text-body text-on-dark-soft lg:mx-auto lg:max-w-[38rem]"
        >
          {t.hero.description}
        </p>

        <div
          data-intro="actions"
          className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-center"
        >
          <Button href="#proyectos" icon={ArrowRight}>
            {t.hero.primaryCta}
          </Button>
          <Button
            href={profile.resume}
            download
            variant="onDark"
            icon={Download}
          >
            {t.hero.secondaryCta}
          </Button>
        </div>
      </div>

      <div
        data-intro="hint"
        aria-hidden
        className="absolute inset-x-0 bottom-8 hidden justify-center sm:flex"
      >
        <span className="text-caption uppercase tracking-[0.2em] text-white/35">
          {t.hero.scrollHint}
        </span>
      </div>
    </section>
  );
}

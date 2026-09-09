import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { localized } from "../data/projects.js";
import { services } from "../data/services.js";
import useReducedMotion from "../hooks/useReducedMotion.js";
import Reveal from "../components/Reveal.jsx";
import Chip from "../components/Chip.jsx";
import { ENTRANCE_EASE } from "../lib/ease.js";
import { onEnterIndex, onLeaveBackIndex } from "./servicesScroll.js";

gsap.registerPlugin(ScrollTrigger);

// Matches Tailwind's default `lg` breakpoint — About.jsx's own comment on
// its identical constant explains why this is hardcoded rather than
// imported: there is no Tailwind v4 JS config to read it from.
const DESKTOP_QUERY = "(min-width: 1024px)";

// Hazard 2 (this task's brief): the sticky label must never have two
// states visually dominant at once. Mirrors About.jsx's group cross-fade —
// fade the current label out, only swap its content once that fade has
// actually finished, then fade the new one in.
const LABEL_FADE_OUT = 0.2;
const LABEL_FADE_IN = 0.3;

function eyebrow(index) {
  return String(index + 1).padStart(2, "0");
}

/**
 * A single service's placeholder visual: an eyebrow index plus its title,
 * centred in a `bg-surface` panel. This is the "labelled placeholder"
 * Task 11 replaces wholesale with `<ServiceStage active={activeService} />`
 * — see the two call sites below for why there are two of them (the
 * shared sticky one, and each panel's own static mobile one).
 */
function ServicePlaceholder({ index, service, lang }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
      <span className="text-xs uppercase tracking-[0.3em] text-mute">{eyebrow(index)}</span>
      <span className="text-2xl font-semibold tracking-tight text-text">
        {localized(service.title, lang)}
      </span>
    </div>
  );
}

/**
 * The services section: a two-column grid at `lg` — a sticky visual slot
 * on the left, four scrolling panels on the right (the "Resonance"
 * pattern per spec §6.4). One `ScrollTrigger` per panel sets
 * `activeService` (0-3) as it scrolls into view; the sticky slot
 * cross-fades to match.
 *
 * `activeService` is state, not a ref — Task 11's `<ServiceStage />` reads
 * it as a prop the way Task 9's `TechCore` read About's `stage`, and it
 * only changes four times per pass, so a real render each time is cheap.
 *
 * Below `lg`, and under reduced motion at any width, no `ScrollTrigger` is
 * ever created (see Effect A) — structurally the mobile layout does not
 * hide a still-scroll-linked sticky element, it swaps in each panel's own
 * always-visible inline placeholder instead (`lg:hidden`, never touched by
 * Effect A), while the sticky slot itself is `hidden` below `lg`.
 */
export default function Services() {
  const { lang } = useLanguage();
  const reduced = useReducedMotion();

  const panelRefs = useRef([]);
  const labelRef = useRef(null);

  // The panel the scroll position currently targets (0-3). Task 11 reads
  // this directly.
  const [activeService, setActiveService] = useState(0);
  // The service actually rendered in the sticky slot right now. Lags
  // `activeService` by the fade-out below, so only one label is ever in
  // the DOM's visible state at a time.
  const [visibleService, setVisibleService] = useState(0);

  // Effect A: one ScrollTrigger per panel, gated to `lg` and skipped
  // outright under reduced motion — same discipline as About.jsx's own
  // Effect A. `onEnter` activates the panel being scrolled into forward;
  // `onLeaveBack` (the boundary a start-only trigger gets wrong if
  // ignored — see servicesScroll.js) reverts to the panel above once this
  // one is left scrolling back up.
  //
  // Deliberately NOT `onEnterBack`: with no explicit `end`, each trigger's
  // default end is "bottom top" (the panel's own bottom reaching the
  // viewport's top) — for an early panel that boundary sits far below its
  // start, often past a later panel's own start. Adding `onEnterBack` here
  // was tried and reverted after browser verification caught it firing
  // while scrolling up past an EARLIER panel's default end (e.g. panel 0's
  // "bottom top", well inside panel 1's territory), incorrectly resetting
  // `activeService` back to that earlier panel. `onEnter` + `onLeaveBack`
  // alone cover both directions correctly; see servicesScroll.js.
  useEffect(() => {
    const panels = panelRefs.current.filter(Boolean);

    if (reduced || panels.length === 0) {
      setActiveService(0);
      return undefined;
    }

    const mm = gsap.matchMedia();

    mm.add(DESKTOP_QUERY, () => {
      const triggers = panels
        .map((panelEl, index) => {
          const hasLayout = panelEl.getClientRects().length > 0 || panelEl.offsetParent !== null;
          if (!hasLayout) return null;

          return ScrollTrigger.create({
            trigger: panelEl,
            start: "top 60%",
            onEnter: () => setActiveService(onEnterIndex(index)),
            onLeaveBack: () => setActiveService(onLeaveBackIndex(index)),
          });
        })
        .filter(Boolean);

      return () => {
        triggers.forEach((trigger) => trigger.kill());
      };
    });

    return () => mm.revert();
  }, [reduced]);

  // Effect B: the sticky label's cross-fade out + swap.
  useEffect(() => {
    if (visibleService === activeService) return undefined;

    const el = labelRef.current;
    if (reduced || !el) {
      setVisibleService(activeService);
      return undefined;
    }

    const tween = gsap.to(el, {
      opacity: 0,
      duration: LABEL_FADE_OUT,
      ease: ENTRANCE_EASE,
      overwrite: "auto",
      onComplete: () => setVisibleService(activeService),
    });

    return () => tween.kill();
  }, [activeService, visibleService, reduced]);

  // Effect C: the incoming label's fade-in. `useLayoutEffect` so the
  // opacity reset happens before paint, matching About.jsx's Effect C.
  useLayoutEffect(() => {
    const el = labelRef.current;
    if (!el) return undefined;

    if (reduced) {
      gsap.set(el, { opacity: 1 });
      return undefined;
    }

    const tween = gsap.fromTo(
      el,
      { opacity: 0 },
      { opacity: 1, duration: LABEL_FADE_IN, ease: ENTRANCE_EASE, overwrite: "auto" },
    );

    return () => tween.kill();
  }, [visibleService, reduced]);

  return (
    <section id="servicios" className="relative">
      <div className="mx-auto grid w-full max-w-[1400px] gap-12 px-6 py-24 sm:px-10 lg:grid-cols-2 lg:gap-16 lg:py-32">
        {/* Sticky visual: a self-contained slot. Task 11 replaces this
            whole block with a <LazyCanvas> wrapping <ServiceStage /> — the
            same discipline Hero.jsx's background layer and About.jsx's
            right column already follow — so a failure in that scene can
            never take the rest of this section down with it. Decorative
            only (aria-hidden); the panel column below never assumes
            anything about what lives inside this box beyond its own. */}
        <div className="hidden lg:block">
          <div
            aria-hidden="true"
            className="sticky top-24 aspect-[4/5] overflow-hidden rounded-3xl bg-surface"
          >
            <div ref={labelRef}>
              <ServicePlaceholder index={visibleService} service={services[visibleService]} lang={lang} />
            </div>
          </div>
        </div>

        <div>
          {services.map((service, index) => (
            <article
              key={service.id}
              ref={(el) => {
                panelRefs.current[index] = el;
              }}
              className="border-b border-line py-14 first:pt-0 last:border-0"
            >
              {/* Inline visual: always rendered, never scroll-linked —
                  the structural half of the mobile fork. `lg:hidden`, not
                  a duplicate of the sticky slot above: this is a separate,
                  static placeholder per panel, so Effect A's ScrollTrigger
                  (gated to `lg`) never has anything to do with it. */}
              <div
                aria-hidden="true"
                className="mb-8 aspect-[4/5] w-full overflow-hidden rounded-3xl bg-surface lg:hidden"
              >
                <ServicePlaceholder index={index} service={service} lang={lang} />
              </div>

              <Reveal as="p" className="text-xs uppercase tracking-[0.3em] text-mute">
                {eyebrow(index)}
              </Reveal>

              <Reveal
                as="h3"
                delay={0.05}
                className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-text md:text-5xl"
              >
                {localized(service.title, lang)}
              </Reveal>

              <Reveal as="p" delay={0.08} className="mt-3 text-lg text-mute">
                {localized(service.tagline, lang)}
              </Reveal>

              <Reveal as="p" delay={0.1} className="mt-6 max-w-xl text-base leading-relaxed text-mute">
                {localized(service.description, lang)}
              </Reveal>

              <Reveal as="ul" delay={0.12} className="mt-6 space-y-2">
                {localized(service.includes, lang).map((item) => (
                  <li key={item} className="text-sm text-mute">
                    {item}
                  </li>
                ))}
              </Reveal>

              <Reveal as="div" delay={0.14} className="mt-6 flex flex-wrap gap-2">
                {service.stack.map((item) => (
                  <Chip key={item}>{item}</Chip>
                ))}
              </Reveal>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import useReducedMotion from "../hooks/useReducedMotion.js";
import Reveal from "../components/Reveal.jsx";
import Chip from "../components/Chip.jsx";
import { ENTRANCE_EASE } from "../lib/ease.js";
import { wordStagger } from "../lib/stagger.js";
import { progressToStage, paragraphProgress } from "./aboutScroll.js";

gsap.registerPlugin(ScrollTrigger);

// Matches Tailwind's default `lg` breakpoint. There is no Tailwind v4 JS
// config to import this from (index.css's `@theme` block only defines
// colour/ease tokens) — SideRail.jsx hardcodes its own `md:` the same way,
// so this follows the one precedent this codebase already has for tying a
// GSAP decision to a breakpoint.
const DESKTOP_QUERY = "(min-width: 1024px)";

// Hazard 2: `scrub` smooths the ScrollTrigger's progress against the
// (Lenis-smoothed) scroll position itself; it is not related to the
// 600-800ms scroll-reveal duration budget elsewhere in this project.
const SCRUB = 0.6;

// Hazard 3: the outgoing group must finish fading out before the incoming
// one starts entering — never both at once, or the chip labels collide
// mid-flight.
const GROUP_FADE_OUT = 0.2;
const CHIP_ENTER_DURATION = 0.4;

/**
 * The About section: a ~300vh tall wrapper containing a two-column layout
 * that GSAP pins for its own duration at `lg` and up. Scrolling through the
 * pin reveals the three `about.paragraphs` progressively, then cross-fades
 * through the four `stack.groups` (Frontend/Backend/Data/Tooling) as a
 * single technology showcase — one group on screen at a time.
 *
 * `progress` (this pin's own 0-1 scroll position) is kept in a ref, never
 * state: it changes every scrubbed frame, and Task 9's WebGL scene reads it
 * directly for that reason. `stage` (0-3, which group is targeted) is kept
 * in state instead: it only changes four times per pass, and the DOM needs
 * it to pick which `stack.groups` entry to render.
 *
 * Below `lg`, and under reduced motion at any width, this never pins at
 * all — see the two early-return branches below. Structurally this means
 * `stage` simply never advances past 0, so the section resolves to a
 * normal, fully static stacked flow: nothing is scroll-gated, nothing is
 * hidden behind a locked viewport.
 */
export default function About() {
  const { t } = useLanguage();
  const reduced = useReducedMotion();

  const sectionRef = useRef(null);
  const pinRef = useRef(null);
  const groupRef = useRef(null);
  const paragraphRefs = useRef([]);
  // Never read for render — see the docblock above. Task 9 reaches this via
  // the same ref object (this component is edited again to hand it over).
  const progressRef = useRef(0);

  // The group the scroll position is currently targeting (0-3).
  const [stage, setStage] = useState(0);
  // The group actually rendered right now. Lags `stage` by the ~200ms
  // fade-out below, so exactly one group is ever in the DOM at a time.
  const [visibleStage, setVisibleStage] = useState(0);

  // Effect A: the pin itself, gated to `lg` and up, and skipped outright
  // under reduced motion. Drives `progressRef`/`stage` and the paragraphs'
  // own scroll-linked opacity/lift.
  useEffect(() => {
    const root = sectionRef.current;
    const pinEl = pinRef.current;
    const paragraphs = paragraphRefs.current.filter(Boolean);

    if (reduced || !root || !pinEl) {
      // Reduced motion (or no layout yet): resting state, no pin, no
      // scroll-driven timeline — never run the pinned sequence at
      // duration 0, just skip it. Paragraphs are already visible by
      // default (see their className below, which sets no hiding style),
      // so this only needs to guarantee that stays true if `reduced`
      // flips on after a pin had already hidden them mid-scroll.
      progressRef.current = 0;
      setStage(0);
      if (paragraphs.length > 0) gsap.set(paragraphs, { opacity: 1, y: 0 });
      return undefined;
    }

    const mm = gsap.matchMedia();

    mm.add(DESKTOP_QUERY, () => {
      // jsdom (and a genuinely zero-size root) has no meaningful "top top"
      // to pin against — same guard Reveal.jsx uses.
      const hasLayout = root.getClientRects().length > 0 || root.offsetParent !== null;
      if (!hasLayout) return undefined;

      gsap.set(paragraphs, { opacity: 0, y: 16 });

      const trigger = ScrollTrigger.create({
        trigger: root,
        pin: pinEl,
        start: "top top",
        end: "bottom bottom",
        scrub: SCRUB,
        onUpdate: (self) => {
          progressRef.current = self.progress;

          const nextStage = progressToStage(self.progress);
          setStage((prev) => (prev === nextStage ? prev : nextStage));

          paragraphs.forEach((el, index) => {
            const local = paragraphProgress(index, paragraphs.length, self.progress);
            gsap.set(el, { opacity: local, y: 16 * (1 - local) });
          });
        },
      });

      // Runs when the query stops matching (resize below `lg`) as well as
      // on unmount — either way the paragraphs must return to their
      // default, fully visible resting state rather than staying stuck
      // mid-reveal.
      return () => {
        trigger.kill();
        gsap.set(paragraphs, { opacity: 1, y: 0, clearProps: "opacity,y" });
      };
    });

    return () => mm.revert();
  }, [reduced]);

  // Effect B: the cross-fade itself. Fades the currently-rendered group's
  // container out, and only swaps `visibleStage` (which changes what
  // renders) once that fade has actually finished — so the incoming
  // group's stagger (effect C) never starts while the outgoing one is
  // still on screen.
  useEffect(() => {
    if (visibleStage === stage) return undefined;

    const el = groupRef.current;
    if (reduced || !el) {
      setVisibleStage(stage);
      return undefined;
    }

    // `overwrite: "auto"` is GSAP's own default for `.to()`, stated
    // explicitly here: this tween and effect C's `gsap.set` both touch
    // `el`'s opacity, and this is the guarantee that whichever one runs
    // last always wins outright rather than the two fighting over it.
    const tween = gsap.to(el, {
      opacity: 0,
      duration: GROUP_FADE_OUT,
      ease: ENTRANCE_EASE,
      overwrite: "auto",
      onComplete: () => setVisibleStage(stage),
    });

    return () => tween.kill();
  }, [stage, visibleStage, reduced]);

  // Effect C: the incoming group's entrance. Runs on mount (bringing in
  // the first group) and again every time effect B commits a new
  // `visibleStage`. `useLayoutEffect` so the container's opacity is
  // restored before the browser paints the newly-swapped children.
  useLayoutEffect(() => {
    const el = groupRef.current;
    if (!el) return undefined;

    const chips = el.querySelectorAll("[data-chip]");

    if (reduced) {
      gsap.set(el, { opacity: 1 });
      gsap.set(chips, { opacity: 1, y: 0 });
      return undefined;
    }

    gsap.set(el, { opacity: 1 });
    const tween = gsap.fromTo(
      chips,
      { opacity: 0, y: 8 },
      {
        opacity: 1,
        y: 0,
        duration: CHIP_ENTER_DURATION,
        ease: ENTRANCE_EASE,
        stagger: wordStagger,
      },
    );

    return () => tween.kill();
  }, [visibleStage, reduced]);

  const group = t.stack.groups[visibleStage];

  return (
    <section id="sobre-mi" ref={sectionRef} className="relative lg:h-[300vh]">
      <div
        ref={pinRef}
        className="relative mx-auto flex w-full max-w-[1400px] flex-col gap-12 px-6 py-24 sm:px-10 lg:h-screen lg:grid lg:grid-cols-2 lg:gap-16 lg:py-0"
      >
        {/* No `items-center` on the grid above: a centered grid item never
            gets a definite height from its row, and the placeholder's own
            `lg:h-full` below needs one to resolve against — it collapsed to
            a single text line's height (~22px) until this was caught by
            inspecting live layout. Centering the left column's own content
            is done here instead, on a full-height (stretched) cell. */}
        <div className="lg:flex lg:h-full lg:flex-col lg:justify-center">
          <Reveal as="p" className="text-xs uppercase tracking-[0.3em] text-mute">
            {t.about.eyebrow}
          </Reveal>

          <Reveal
            as="h2"
            delay={0.05}
            className="mt-4 text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.05] tracking-tight text-text"
          >
            {t.about.title}
          </Reveal>

          <div className="mt-8 space-y-5">
            {t.about.paragraphs.map((paragraph, index) => (
              <p
                key={paragraph}
                ref={(el) => {
                  paragraphRefs.current[index] = el;
                }}
                data-about-paragraph
                className="max-w-xl text-base leading-relaxed text-mute lg:text-lg"
              >
                {paragraph}
              </p>
            ))}
          </div>

          <div ref={groupRef} className="mt-10">
            <h3 className="text-sm font-medium uppercase tracking-[0.2em] text-mute">
              {group.title}
            </h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {group.items.map((item) => (
                <Chip key={item} data-chip>
                  {item}
                </Chip>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: a self-contained slot. Task 9 replaces this whole
            block with a <LazyCanvas> wrapping the real scene — the way
            Hero.jsx's background layer was structured for Task 6 — so a
            failure in that scene can never take the rest of this section
            down with it. Decorative only (aria-hidden), matching the
            contract LazyCanvas's own wrapper already holds, so the swap
            changes nothing about this slot's accessibility semantics. */}
        <div aria-hidden="true" className="relative">
          <div className="flex aspect-[4/5] w-full items-center justify-center rounded-[28px] border border-line bg-surface-2 text-center text-sm text-mute lg:aspect-auto lg:h-full">
            {t.about.scenePlaceholder}
          </div>
        </div>
      </div>
    </section>
  );
}

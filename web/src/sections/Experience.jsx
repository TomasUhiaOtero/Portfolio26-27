import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import useReducedMotion from "../hooks/useReducedMotion.js";
import Reveal from "../components/Reveal.jsx";
import Chip from "../components/Chip.jsx";
import { cardSide, entranceOffsetX } from "./experienceScroll.js";
import { ENTRANCE_EASE } from "../lib/ease.js";

gsap.registerPlugin(ScrollTrigger);

// Matches Tailwind's default `lg` breakpoint — About.jsx's own comment on
// its identical constant explains why this is hardcoded rather than
// imported: there is no Tailwind v4 JS config to read it from.
const DESKTOP_QUERY = "(min-width: 1024px)";
const MOBILE_QUERY = "(max-width: 1023px)";

// Hazard 1: scrubbed, not a fixed-duration tween — the line has to follow
// the scroll in both directions, not just play once forward.
const LINE_SCRUB = 0.5;

// Hazard 2: each node pops exactly once. `start`/duration/overshoot below
// match the brief exactly (400ms, slight overshoot via `back.out`).
const NODE_START = "top 65%";
const NODE_DURATION = 0.4;
const NODE_EASE = "back.out(2)";

const CARD_START = "top 80%";
const CARD_DURATION = 0.7;

/**
 * A single job entry card: period, role, company, summary, impact and its
 * stack as `Chip`s.
 */
function JobCard({ entry, side }) {
  return (
    <div
      className={`rounded-[20px] border border-line bg-surface p-6 sm:p-8 lg:flex lg:flex-col ${
        side === "left" ? "lg:items-end lg:text-right" : "lg:items-start lg:text-left"
      }`}
    >
      <span className="text-xs uppercase tracking-[0.2em] text-mute">{entry.period}</span>
      <h3 className="mt-2 text-xl font-semibold text-text sm:text-2xl">{entry.role}</h3>
      <p className="mt-1 text-sm text-mute">{entry.company}</p>
      <p className="mt-4 text-base leading-relaxed text-mute">{entry.summary}</p>
      <p className="mt-3 text-base leading-relaxed text-text">{entry.impact}</p>
      <div className={`mt-5 flex flex-wrap gap-2 ${side === "left" ? "lg:justify-end" : ""}`}>
        {entry.stack.map((item) => (
          <Chip key={item}>{item}</Chip>
        ))}
      </div>
    </div>
  );
}

/** A single education entry card: period, title and place. */
function EducationCard({ entry, side }) {
  return (
    <div
      className={`rounded-[20px] border border-line bg-surface p-6 sm:p-8 lg:flex lg:flex-col ${
        side === "left" ? "lg:items-end lg:text-right" : "lg:items-start lg:text-left"
      }`}
    >
      <span className="text-xs uppercase tracking-[0.2em] text-mute">{entry.period}</span>
      <h3 className="mt-2 text-xl font-semibold text-text sm:text-2xl">{entry.title}</h3>
      <p className="mt-1 text-sm text-mute">{entry.place}</p>
    </div>
  );
}

/**
 * The Experience section: a scroll-drawn vertical rail with one node per
 * entry (the two `experience.items`, a divider carrying `educationTitle`,
 * then the two `experience.education` entries) and a card alongside each
 * non-divider node.
 *
 * Three independent scroll-linked behaviours live here, each with its own
 * effect and its own reduced-motion resting state — never a shared
 * timeline, so one hazard's fix can never regress another's:
 *
 * Effect A (the rail): an accent overlay line scrubbed from `scaleY: 0` to
 * `1` as the section scrolls through view. `scrub`, not a fixed-duration
 * tween, so it can run backward as cleanly as forward — see Task 10's
 * `servicesScroll.js` doc comment for why this project treats
 * both-directions correctness as a first-class hazard on every scrubbed
 * or `once`-gated trigger, not just an afterthought.
 *
 * Effect B (the nodes): one `ScrollTrigger` per node, `once: true`. A node
 * that re-popped on every pass back through it would be noise, so once it
 * has popped it simply stays popped regardless of further scrolling in
 * either direction.
 *
 * Effect C (the cards): the alternating-side entrance. This is the
 * section's own version of Task 10's `gsap.matchMedia` discipline — the
 * *direction* a card enters from (not just whether it animates at all)
 * depends on the `lg` breakpoint, so the breakpoint check has to gate the
 * animation itself, not just a CSS class layered on top of it. `mm.add`
 * is given both the desktop query and its exact mobile complement so the
 * callback re-runs (killing and recreating every card's trigger with the
 * correct sign) on either side of a live resize — see experienceScroll.js
 * for the pure "which sign, at which breakpoint" logic this defers to.
 *
 * None of the three effects gate *whether* they run behind `lg` — the
 * rail draws and the nodes pop the same way at every width. Only the
 * cards' entrance direction forks structurally on the breakpoint.
 *
 * Under reduced motion, all three resolve to their resting state
 * directly (line fully drawn, nodes at their popped scale, cards at rest
 * with no transform) and no `ScrollTrigger` is ever created — see each
 * effect's own early return.
 */
export default function Experience() {
  const { t } = useLanguage();
  const reduced = useReducedMotion();

  const sectionRef = useRef(null);
  const lineRef = useRef(null);
  const nodeRefs = useRef([]);
  const cardRefs = useRef([]);

  // Flattens `items` + a divider + `education` into the rail's render
  // order once per language change. `cardIndex` is assigned only to the
  // two groups of real cards (not the divider), continuously across both,
  // so `experienceScroll.js`'s alternation never restarts at "left" when
  // education begins.
  const timeline = useMemo(() => {
    let cardIndex = 0;
    return [
      ...t.experience.items.map((data) => ({ kind: "job", data, cardIndex: cardIndex++ })),
      { kind: "divider", label: t.experience.educationTitle },
      ...t.experience.education.map((data) => ({ kind: "education", data, cardIndex: cardIndex++ })),
    ];
  }, [t.experience]);

  // Effect A: the rail's accent overlay line.
  useEffect(() => {
    const root = sectionRef.current;
    const line = lineRef.current;
    if (!line) return undefined;

    if (reduced || !root) {
      gsap.set(line, { scaleY: 1 });
      return undefined;
    }

    const hasLayout = root.getClientRects().length > 0 || root.offsetParent !== null;
    if (!hasLayout) return undefined;

    const tween = gsap.fromTo(
      line,
      { scaleY: 0, transformOrigin: "top" },
      {
        scaleY: 1,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top 70%",
          end: "bottom 30%",
          scrub: LINE_SCRUB,
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced]);

  // Effect B: each node's one-shot pop.
  useEffect(() => {
    const nodes = nodeRefs.current.filter(Boolean);
    if (nodes.length === 0) return undefined;

    if (reduced) {
      gsap.set(nodes, { scale: 1, opacity: 1 });
      return undefined;
    }

    const triggers = nodes
      .map((el) => {
        const hasLayout = el.getClientRects().length > 0 || el.offsetParent !== null;
        if (!hasLayout) return null;

        gsap.set(el, { scale: 0.4, opacity: 0 });

        return ScrollTrigger.create({
          trigger: el,
          start: NODE_START,
          once: true,
          onEnter: () => {
            gsap.to(el, {
              scale: 1,
              opacity: 1,
              duration: NODE_DURATION,
              ease: NODE_EASE,
            });
          },
        });
      })
      .filter(Boolean);

    return () => triggers.forEach((trigger) => trigger.kill());
    // Deliberately `[reduced]` only, not `timeline`: a language switch
    // changes each entry's text but never the DOM nodes themselves (same
    // keys, same order, same count per data.test.js's shape guarantee),
    // so the existing refs and triggers stay valid. Re-running this on
    // every language toggle would re-hide already-popped nodes for no
    // reason — the same trap Effect C's own comment below explains for
    // cards.
  }, [reduced]);

  // Effect C: each card's alternating-side entrance — see the docblock
  // above for why the direction itself has to be gated by
  // `gsap.matchMedia` rather than a CSS class.
  useEffect(() => {
    const cards = cardRefs.current.filter(Boolean);
    if (cards.length === 0) return undefined;

    if (reduced) {
      gsap.set(cards, { opacity: 1, x: 0 });
      return undefined;
    }

    const mm = gsap.matchMedia();

    mm.add({ isDesktop: DESKTOP_QUERY, isMobile: MOBILE_QUERY }, (context) => {
      const { isDesktop } = context.conditions;

      const triggers = cards
        .map((el, cardIndex) => {
          const hasLayout = el.getClientRects().length > 0 || el.offsetParent !== null;
          if (!hasLayout) return null;

          const offsetX = entranceOffsetX(cardIndex, isDesktop);
          gsap.set(el, { opacity: 0, x: offsetX });

          return ScrollTrigger.create({
            trigger: el,
            start: CARD_START,
            once: true,
            onEnter: () => {
              gsap.to(el, {
                opacity: 1,
                x: 0,
                duration: CARD_DURATION,
                ease: ENTRANCE_EASE,
              });
            },
          });
        })
        .filter(Boolean);

      return () => {
        triggers.forEach((trigger) => trigger.kill());
        gsap.set(cards, { opacity: 1, x: 0, clearProps: "opacity,x" });
      };
    });

    return () => mm.revert();
    // Deliberately `[reduced]` only, not `timeline`: re-running this on a
    // language toggle (same DOM nodes, only their text changes) would
    // force `mm.revert()`'s cleanup — which resets every card to its
    // rest state — then immediately re-hide and re-arm a trigger for
    // every card, including ones a visitor had already scrolled past and
    // seen revealed. That would make already-popped cards vanish and
    // need a re-scroll just because the language toggled.
  }, [reduced]);

  return (
    <section id="experiencia" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
        <Reveal as="p" className="text-xs uppercase tracking-[0.3em] text-mute">
          {t.experience.eyebrow}
        </Reveal>
        <Reveal
          as="h2"
          delay={0.05}
          className="mt-4 text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.05] tracking-tight text-text"
        >
          {t.experience.title}
        </Reveal>

        <div ref={sectionRef} className="relative mt-16 lg:mt-24">
          {/* Base rail: always visible, 1px, full height. */}
          <div className="absolute left-4 top-0 h-full w-px -translate-x-1/2 bg-line lg:left-1/2" />
          {/* Accent overlay: scrubbed from scaleY 0 to 1 by Effect A. */}
          <div
            ref={lineRef}
            className="absolute left-4 top-0 h-full w-px origin-top -translate-x-1/2 scale-y-0 bg-accent lg:left-1/2"
          />

          <ol className="relative flex flex-col gap-16 lg:gap-24">
            {timeline.map((entry, index) => {
              if (entry.kind === "divider") {
                return (
                  <li key="education-divider" className="relative pl-10 lg:pl-0 lg:text-center">
                    <span
                      ref={(el) => {
                        nodeRefs.current[index] = el;
                      }}
                      aria-hidden="true"
                      className="absolute left-4 top-1 h-3 w-3 -translate-x-1/2 rounded-full bg-accent lg:left-1/2"
                    />
                    <p className="text-xs font-medium uppercase tracking-[0.3em] text-mute">
                      {entry.label}
                    </p>
                  </li>
                );
              }

              const side = cardSide(entry.cardIndex);
              const Card = entry.kind === "job" ? JobCard : EducationCard;

              return (
                <li key={`${entry.kind}-${entry.cardIndex}`} className="relative pl-10 lg:pl-0">
                  <span
                    ref={(el) => {
                      nodeRefs.current[index] = el;
                    }}
                    aria-hidden="true"
                    className="absolute left-4 top-6 h-3 w-3 -translate-x-1/2 rounded-full bg-accent lg:left-1/2"
                  />

                  <div className="lg:grid lg:grid-cols-2 lg:gap-x-16">
                    <div
                      ref={(el) => {
                        cardRefs.current[entry.cardIndex] = el;
                      }}
                      className={side === "left" ? "lg:col-start-1" : "lg:col-start-2"}
                    >
                      <Card entry={entry.data} side={side} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

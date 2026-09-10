import { useEffect, useRef } from "react";
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
      <h4 className="mt-2 text-xl font-semibold text-text sm:text-2xl">{entry.role}</h4>
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
      <h4 className="mt-2 text-xl font-semibold text-text sm:text-2xl">{entry.title}</h4>
      <p className="mt-1 text-sm text-mute">{entry.place}</p>
    </div>
  );
}

/**
 * One titled rail group — a heading, a base rail, a scroll-drawn accent
 * overlay line, and one node + card per entry. Experience renders two of
 * these: work history, then education, visually and semantically distinct
 * (their own `<h3>` and their own rail) rather than a single rail split by
 * a divider label.
 *
 * The `register*` callbacks hand this group's line/node/card DOM nodes up
 * to the parent, which owns the three scroll effects — keeping all the
 * ScrollTrigger wiring in one place regardless of how many groups there
 * are. `cardIndexBase` continues the left/right alternation from wherever
 * the previous group left off.
 */
function RailGroup({ title, kind, entries, cardIndexBase }) {
  const Card = kind === "job" ? JobCard : EducationCard;

  return (
    <div className="relative first:mt-0">
      {title ? (
        <h3 className="mt-20 text-2xl font-semibold tracking-tight text-text lg:mt-28 lg:text-center">
          {title}
        </h3>
      ) : null}

      {/* `data-rail-*` attributes let the parent's three scroll effects
          collect every line/node/card with a single querySelectorAll,
          instead of threading ref arrays through this presentational
          component. */}
      <div data-rail-group className={`relative ${title ? "mt-10 lg:mt-16" : ""}`}>
        {/* Base rail: always visible, 1px, full height. */}
        <div className="absolute left-4 top-0 h-full w-px -translate-x-1/2 bg-line lg:left-1/2" />
        {/* Accent overlay: scrubbed from scaleY 0 to 1 by the parent's Effect A. */}
        <div
          data-rail-line
          className="absolute left-4 top-0 h-full w-px origin-top -translate-x-1/2 scale-y-0 bg-accent lg:left-1/2"
        />

        <ol className="relative flex flex-col gap-16 lg:gap-24">
          {entries.map((entry, i) => {
            const cardIndex = cardIndexBase + i;
            const side = cardSide(cardIndex);

            return (
              <li key={`${kind}-${cardIndex}`} className="relative pl-10 lg:pl-0">
                <span
                  data-rail-node
                  aria-hidden="true"
                  className="absolute left-4 top-6 h-3 w-3 -translate-x-1/2 rounded-full bg-accent lg:left-1/2"
                />

                <div className="lg:grid lg:grid-cols-2 lg:gap-x-16">
                  <div
                    data-rail-card
                    className={side === "left" ? "lg:col-start-1" : "lg:col-start-2"}
                  >
                    <Card entry={entry} side={side} />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/**
 * The Experience section: two scroll-drawn rail groups — work history and
 * education — each with its own heading and its own rail.
 *
 * Three independent scroll-linked behaviours live here, each with its own
 * effect and its own reduced-motion resting state — never a shared
 * timeline, so one hazard's fix can never regress another's:
 *
 * Effect A (the rails): each group's accent overlay line, scrubbed from
 * `scaleY: 0` to `1` as it scrolls through view. `scrub`, not a
 * fixed-duration tween, so it can run backward as cleanly as forward.
 *
 * Effect B (the nodes): one `ScrollTrigger` per node, `once: true`.
 *
 * Effect C (the cards): the alternating-side entrance, gated by
 * `gsap.matchMedia` so the *direction* a card enters from forks
 * structurally on the `lg` breakpoint.
 *
 * Under reduced motion all three resolve to their resting state directly
 * and no `ScrollTrigger` is ever created — see each effect's early return.
 */
export default function Experience() {
  const { t } = useLanguage();
  const reduced = useReducedMotion();

  const rootRef = useRef(null);

  const jobs = t.experience.items;
  const education = t.experience.education;

  // Effect A: each rail group's accent overlay line.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const lines = [...root.querySelectorAll("[data-rail-line]")];
    if (lines.length === 0) return undefined;

    if (reduced) {
      gsap.set(lines, { scaleY: 1 });
      return undefined;
    }

    const tweens = lines
      .map((line) => {
        const hasLayout = line.getClientRects().length > 0 || line.offsetParent !== null;
        if (!hasLayout) return null;

        return gsap.fromTo(
          line,
          { scaleY: 0, transformOrigin: "top" },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: line.parentElement,
              start: "top 70%",
              end: "bottom 30%",
              scrub: LINE_SCRUB,
            },
          },
        );
      })
      .filter(Boolean);

    return () => {
      tweens.forEach((tween) => {
        tween.scrollTrigger?.kill();
        tween.kill();
      });
    };
  }, [reduced]);

  // Effect B: each node's one-shot pop.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const nodes = [...root.querySelectorAll("[data-rail-node]")];
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
    // Deliberately `[reduced]` only: a language switch changes each
    // entry's text but never the DOM nodes themselves (same keys, order
    // and count per data.test.js's shape guarantee), so re-running this
    // would only re-hide already-popped nodes.
  }, [reduced]);

  // Effect C: each card's alternating-side entrance.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const cards = [...root.querySelectorAll("[data-rail-card]")];
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
    // Deliberately `[reduced]` only — see Effect B's note.
  }, [reduced]);

  return (
    <section id="experiencia" className="relative border-t border-line bg-surface py-24 sm:py-32">
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

        <div ref={rootRef} className="mt-16 lg:mt-24">
          <RailGroup kind="job" entries={jobs} cardIndexBase={0} />
          <RailGroup
            title={t.experience.educationTitle}
            kind="education"
            entries={education}
            cardIndexBase={jobs.length}
          />
        </div>
      </div>
    </section>
  );
}

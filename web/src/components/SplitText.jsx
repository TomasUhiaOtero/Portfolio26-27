import { Fragment, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import useReducedMotion from "../hooks/useReducedMotion.js";
import { ENTRANCE_EASE } from "../lib/ease.js";
import { wordStagger } from "../lib/stagger.js";
import { isIntroDone } from "../hooks/useIntroTimeline.js";

const DURATION = 0.7;

// Splits `text` into per-word spans and animates them up into place on
// mount. The space between words is emitted as a literal sibling text node
// OUTSIDE each `[data-word]` span: a space living inside the span would sit
// under that span's `white-space: nowrap` (needed so an individual word
// never breaks mid-animation) and could never become a line-break
// opportunity, so the whole headline would render as one unbreakable run
// off the side of the viewport.
//
// The wrapper needs `overflow-hidden` plus `pb-[0.2em] -mb-[0.2em]`, and the
// intro tween uses `yPercent: 135` rather than 100 — both exist so the
// descenders of "p", "g" and "j" are not clipped by the mask.
export default function SplitText({
  text,
  as: Tag = "span",
  className = "",
  animate = true,
  highlight,
}) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const words = text.split(" ");

  // A word matches `highlight` ignoring case and any leading/trailing
  // punctuation, so "full-stack" also catches "full-stack," and "Full-stack".
  const norm = (w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "").toLowerCase();
  const highlightNorm = highlight ? norm(highlight) : null;

  // useLayoutEffect, not useEffect: the "from" state here is applied by
  // GSAP itself (there is no CSS class hiding these words before JS runs,
  // unlike `Reveal`), so it must be set before the browser paints or the
  // words flash at their resting position for a frame first.
  //
  // `animate` lets an owning timeline (e.g. the hero's `useIntroTimeline`)
  // take sole ownership of `[data-word]`'s motion. Without this, this
  // effect's own `fromTo` and the owning timeline's `fromTo` would both
  // target the same spans: the owning timeline force-renders its "from"
  // values the instant its playhead reaches that row, snapping the
  // already-revealed headline back to hidden and replaying it. Exactly one
  // timeline may own a given element's transform.
  useLayoutEffect(() => {
    if (!animate || reduced) return;
    const el = ref.current;
    if (!el) return;

    const spans = el.querySelectorAll("[data-word]");

    const tween = gsap.fromTo(
      spans,
      { yPercent: 135, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: DURATION,
        ease: ENTRANCE_EASE,
        stagger: wordStagger,
      },
    );

    return () => tween.kill();
  }, [animate, reduced, text]);

  // `animate={false}` mounts fresh, still hidden — but only the FIRST
  // time. Hero's `text` prop changes on a language switch, `words` then
  // differs at every index, and every `[data-word]`'s `key` (`${word}-
  // ${i}`) changes with it, so React tears down the old spans and mounts
  // brand new ones — starting hidden again. `useIntroTimeline`'s own
  // `fromTo`/`gsap.set` is a one-time mount effect on Hero, not something
  // that reruns for a later remount here, so nothing would ever reveal
  // these new spans: the exact "permanently invisible" failure mode this
  // project has shipped before, just from a different trigger. Once the
  // intro is verifiably done (`isIntroDone()`), skip waiting on it and
  // jump straight to the resting state ourselves — a language switch
  // isn't part of the entrance choreography anyway, so it should just
  // appear, not replay a reveal.
  useLayoutEffect(() => {
    if (animate || !isIntroDone()) return;
    const el = ref.current;
    if (!el) return;
    gsap.set(el.querySelectorAll("[data-word]"), { opacity: 1, yPercent: 0 });
  }, [animate, text]);

  // When `animate` is false, this component sets up no hiding mechanism of
  // its own — the owning timeline's `fromTo` is what hides and reveals
  // these spans. But that timeline only builds after fonts are ready
  // (up to 1.5s later) and only runs at all when `enabled`. In the
  // meantime — and in the reduced-motion/no-JS cases where that timeline
  // never runs the WORD row at all — the spans must still start hidden
  // exactly like the rest of the hero: `js-hidden`'s `@layer base` rule
  // forces opacity back to 1 the instant `html` lacks `.js` (bundle never
  // ran), and the owning timeline's own reduced-motion branch (or, for a
  // later remount, the effect just above) resets `[data-word]` to its
  // resting state explicitly. So this can never end up permanently
  // invisible the way a bare `opacity-0` with no fallback could.
  const wordClassName = animate
    ? "inline-block whitespace-nowrap"
    : "inline-block whitespace-nowrap js-hidden opacity-0";

  return (
    <Tag ref={ref} className={`overflow-hidden pb-[0.2em] -mb-[0.2em] ${className}`}>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span
            data-word
            className={`${wordClassName}${
              highlightNorm && norm(word) === highlightNorm ? " text-accent" : ""
            }`}
          >
            {word}
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}

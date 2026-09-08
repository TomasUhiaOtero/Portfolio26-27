import { Fragment, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import useReducedMotion from "../hooks/useReducedMotion.js";
import { ENTRANCE_EASE } from "../lib/ease.js";
import { wordStagger } from "../lib/stagger.js";

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
export default function SplitText({ text, as: Tag = "span", className = "" }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const words = text.split(" ");

  // useLayoutEffect, not useEffect: the "from" state here is applied by
  // GSAP itself (there is no CSS class hiding these words before JS runs,
  // unlike `Reveal`), so it must be set before the browser paints or the
  // words flash at their resting position for a frame first.
  useLayoutEffect(() => {
    if (reduced) return;
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
  }, [reduced, text]);

  return (
    <Tag ref={ref} className={`overflow-hidden pb-[0.2em] -mb-[0.2em] ${className}`}>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span data-word className="inline-block whitespace-nowrap">
            {word}
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}

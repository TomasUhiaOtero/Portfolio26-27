import { useEffect } from "react";
import gsap from "gsap";
import { ENTRANCE_EASE } from "../lib/ease.js";
import { wordStagger } from "../lib/stagger.js";

// If `document.fonts.ready` never settles (some browsers, some fonts),
// awaiting it bare would leave the curtain up and the site blank forever.
// This fallback guarantees the wait always resolves.
const FONT_FALLBACK_DELAY = 1500;

// Selectors the entrance timeline drives. Every call below is made inside
// a `gsap.context` scoped to `rootRef`, so these strings only ever match
// descendants of the hero's own root element.
const CURTAIN = "[data-curtain]";
const EYEBROW = "[data-eyebrow]";
const WORD = "[data-word]";
const SUB = "[data-sub]";
const CTA = "[data-cta]";
const STATS = "[data-stats]";
const CUE = "[data-cue]";

/**
 * Builds and plays the hero's entrance timeline once fonts are ready (or
 * the fallback timer above elapses). Returns nothing — everything this
 * hook does is a side effect on the DOM under `rootRef.current`.
 *
 * Scoped with `gsap.context` + `ctx.revert()` on cleanup so a hot reload
 * or a re-run of this effect can never stack a second timeline on top of
 * inline transforms the previous run already applied.
 */
export default function useIntroTimeline(rootRef, { enabled = true } = {}) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    if (!enabled) {
      // Reduced motion: skip the timeline outright rather than running it
      // at duration 0. The curtain is dismissed immediately and every
      // element the full timeline would otherwise animate is set straight
      // to its resting state.
      const ctx = gsap.context(() => {
        gsap.set(CURTAIN, { autoAlpha: 0 });
        gsap.set([EYEBROW, SUB, CTA, STATS, CUE], {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
        });
      }, root);

      return () => ctx.revert();
    }

    let cancelled = false;
    let ctx;

    const ready = Promise.race([
      document.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, FONT_FALLBACK_DELAY)),
    ]);

    ready.then(() => {
      // The effect may have been cleaned up (unmount, or `enabled` flipped)
      // while we were waiting on fonts — don't build a timeline for a root
      // that's no longer this effect's to manage.
      if (cancelled) return;

      ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: ENTRANCE_EASE } });

        tl.fromTo(
          CURTAIN,
          { opacity: 1, scale: 1 },
          {
            opacity: 0,
            scale: 1.04,
            duration: 0.9,
            // Set the instant the fade STARTS, not when it finishes — a
            // curtain that only stops capturing clicks on completion
            // leaves a ~900ms window where the hero looks interactive and
            // isn't.
            onStart: () => gsap.set(CURTAIN, { pointerEvents: "none" }),
          },
          0,
        )
          .fromTo(
            EYEBROW,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6 },
            "-=0.5",
          )
          .fromTo(
            WORD,
            { opacity: 0, yPercent: 135 },
            { opacity: 1, yPercent: 0, duration: 0.9, stagger: wordStagger },
            "-=0.4",
          )
          .fromTo(
            SUB,
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.7 },
            "-=0.5",
          )
          .fromTo(
            CTA,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              stagger: wordStagger,
              // GSAP's CSSPlugin animates `y` via the independent
              // `translate` CSS property and leaves `translate`,
              // `rotate` and `scale` behind inline once the tween ends.
              // An inline style always beats a stylesheet rule —
              // `:active` included — so without this, `Button`'s
              // `active:scale-[0.97]` press effect would be permanently
              // dead on both CTAs (confirmed live: the settled button's
              // `style` attribute read `scale: none`, which blocks
              // `.active\:scale-\[0.97\]:active { scale: .97 }`
              // regardless of press state). `clearProps` removes those
              // three properties once the tween completes so the
              // stylesheet rule governs `scale` again.
              clearProps: "translate,rotate,scale",
            },
            "-=0.4",
          )
          .fromTo(
            STATS,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6 },
            "-=0.3",
          )
          .fromTo(CUE, { opacity: 0 }, { opacity: 1, duration: 0.5 }, "-=0.2");
      }, root);
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [rootRef, enabled]);
}

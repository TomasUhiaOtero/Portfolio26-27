const STAGGER_STEP = 0.06;
const MAX_STAGGER_STEPS = 6;

// Per-word delay for `SplitText`'s intro tween, in its own module (not
// exported from the component file) so it stays testable without tripping
// react-refresh's only-export-components rule.
//
// GSAP's `stagger: { amount }` form spreads a FIXED TOTAL WINDOW across
// however many gaps exist — it silently compresses every word's spacing on
// headlines longer than MAX_STAGGER_STEPS words instead of holding the
// per-word delay at 60ms and capping only the tail. A stagger FUNCTION
// gives each word its own fixed delay: words 0..MAX_STAGGER_STEPS-1 step by
// STAGGER_STEP each, and every word beyond that shares the last step's
// delay.
export function wordStagger(i) {
  return Math.min(i, MAX_STAGGER_STEPS - 1) * STAGGER_STEP;
}

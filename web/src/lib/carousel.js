/**
 * Pure maths for the projects arc carousel — no DOM, no GSAP, fully unit
 * tested in isolation (`carousel.test.js`). `Work.jsx` and `ProjectCard.jsx`
 * consume these and stay thin wrappers around them.
 */

/** Always returns a value in [0, length) — negative inputs wrap correctly. */
export function wrapIndex(index, length) {
  return ((index % length) + length) % length;
}

/**
 * Shortest signed distance from `focus` to `index` around a ring of
 * `length` items — e.g. with length 8, index 7 and focus 0 gives -1, not
 * +7, so the card the short way round the ring is the one that visually
 * "wraps".
 */
export function shortestOffset(index, focus, length) {
  const raw = wrapIndex(index - focus, length);
  return raw > length / 2 ? raw - length : raw;
}

// Depth is conveyed by blur + brightness, never opacity: a translucent
// card lets the cards stacked behind it bleed through, which reads as a
// rendering glitch rather than depth. `dim` is a `brightness()` multiplier
// (1 = untouched, <1 = pushed back into shadow).
const RINGS = [
  { dim: 1, blur: 0 },
  { dim: 0.5, blur: 3 },
  { dim: 0.28, blur: 6 },
];

/**
 * The per-card transform for a card `offset` positions away from the
 * focused card. Cards beyond the third ring are removed from paint
 * entirely — otherwise eight blurred layers composite every frame for
 * nothing.
 */
export function cardTransform(offset, { step, radius }) {
  const ring = Math.abs(offset);
  if (ring >= RINGS.length) {
    return { transform: "", dim: 0, blur: 0, hidden: true };
  }
  const { dim, blur } = RINGS[ring];
  return {
    transform: `rotateY(${offset * step}deg) translateZ(${radius}px)`,
    dim,
    blur,
    hidden: false,
  };
}

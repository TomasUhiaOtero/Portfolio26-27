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

const RINGS = [
  { opacity: 1, blur: 0 },
  { opacity: 0.55, blur: 2 },
  { opacity: 0.25, blur: 4 },
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
    return { transform: "", opacity: 0, blur: 0, hidden: true };
  }
  const { opacity, blur } = RINGS[ring];
  return {
    transform: `rotateY(${offset * step}deg) translateZ(${radius}px)`,
    opacity,
    blur,
    hidden: false,
  };
}

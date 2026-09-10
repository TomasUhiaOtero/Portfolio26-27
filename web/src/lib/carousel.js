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

// Depth is conveyed by brightness + real z separation + scale, never
// opacity (a translucent card lets the ones behind bleed through) and
// never `filter: blur()` (re-rasterising a blurred layer every frame
// while the carousel moves is what made this section stutter). `dim` is a
// `brightness()` multiplier (1 = untouched); `push` pulls the ring back
// along Z and `scale` shrinks it, so a neighbour's inner edge stays
// firmly *behind* the focused card's plane instead of z-fighting.
const RINGS = [
  { dim: 1, push: 0, scale: 1 },
  { dim: 0.62, push: 150, scale: 0.9 },
  { dim: 0.36, push: 320, scale: 0.8 },
];

/**
 * The per-card transform for a card `offset` positions away from the
 * focused card. Cards beyond the third ring are removed from paint
 * entirely.
 */
export function cardTransform(offset, { step, radius }) {
  const ring = Math.abs(offset);
  if (ring >= RINGS.length) {
    return { transform: "", dim: 0, hidden: true };
  }
  const { dim, push, scale } = RINGS[ring];
  // Never let the pull-back cross behind the rotation origin (small mobile
  // radii would otherwise go negative).
  const z = Math.max(radius - push, radius * 0.4);
  return {
    transform: `rotateY(${offset * step}deg) translateZ(${z}px) scale(${scale})`,
    dim,
    hidden: false,
  };
}

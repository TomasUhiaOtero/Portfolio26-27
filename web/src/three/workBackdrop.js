import { wrapIndex } from "../lib/carousel.js";

/**
 * Pure maths for `WorkBackdrop.jsx`'s light blob: maps the projects
 * carousel's continuous (float) focus index to a horizontal NDC-ish
 * position in [-1, 1], so the blob glides smoothly with the cards instead
 * of jumping between discrete slots — extracted from the component the
 * same way `neighbourLines.js`/`orbit.js`/`serviceShapes.js` extracted the
 * other three scenes' non-trivial per-frame math, so it's unit-testable
 * without a WebGL context.
 *
 * One full lap around the carousel (`length` cards) maps to one full sine
 * cycle: `index` at a multiple of `length` sits at the centre (0), a
 * quarter-lap later sits at the right edge (+1), a quarter-lap before that
 * at the left edge (-1). `wrapIndex` (from `lib/carousel.js`, the same
 * helper `Work.jsx` itself uses to keep `focusIndex` in range) is what
 * makes this continuous across the wrap from the last card back to the
 * first — `wrapIndex` never jumps, so neither does `Math.sin` of it.
 */
export function blobPosition(index, length) {
  if (!(length > 0)) return 0;
  const t = wrapIndex(index, length) / length;
  return Math.sin(t * Math.PI * 2);
}

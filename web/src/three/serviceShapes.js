/**
 * Pure, DOM/Three-free geometry generators for `ServiceStage.jsx` — the
 * Services section's morphing-points scene. One function per service
 * state (`browserFramePositions` / `phonePositions` / `scatteredPositions`
 * / `ringsPositions`), each a pure function of a shared vertex `count` so
 * every state produces exactly the same number of vertices. That equal
 * length is not incidental: `ServiceStage.jsx` lerps between two of these
 * arrays in the vertex shader via a single `uProgress` uniform (see its
 * own docblock), so a mismatched length would either throw or silently
 * read garbage past one array's end.
 *
 * No `Math.random` anywhere in this module. Every "random-looking" value
 * (the scatter offsets) is a deterministic hash of the vertex index, so
 * calling any of these twice with the same `count` reproduces the exact
 * same array — required both for these functions to be unit-testable and
 * so a re-render can never silently reshuffle the shape underneath a
 * live, in-progress tween.
 *
 * Extracted for the same reason `orbit.js` (Task 9) and `aboutScroll.js`
 * (Task 8) were: this has a provable right answer and needs neither a
 * live WebGL frame loop nor even "three" itself to test.
 */

// ---------------------------------------------------------------------
// Shared grid layout for the two flat-panel states (browser frame / phone)
// ---------------------------------------------------------------------

// A roughly square `cols x rows` grid sized only from `count` — both flat
// states below place vertex `i` at the exact same (col, row) slot via
// `gridCoordinate`, so "narrowing" from one to the other is a pure rescale
// of the same underlying grid, never a reshuffle of which vertex sits
// where. `cols * rows` can exceed `count` (rounding); the extra slots are
// simply never assigned an index, since every caller loops `i` from 0 to
// `count - 1`.
export function gridLayout(count) {
  const cols = Math.max(1, Math.round(Math.sqrt(count)));
  const rows = Math.max(1, Math.ceil(count / cols));
  return { cols, rows };
}

// Vertex `index`'s normalized (u, v) position within that grid, each in
// [0, 1]. Falls back to the grid's center (0.5) on the degenerate
// single-column/row case rather than dividing by zero.
export function gridCoordinate(index, count) {
  const { cols, rows } = gridLayout(count);
  const col = index % cols;
  const row = Math.floor(index / cols);
  const u = cols > 1 ? col / (cols - 1) : 0.5;
  const v = rows > 1 ? row / (rows - 1) : 0.5;
  return { u, v };
}

// ---------------------------------------------------------------------
// "web-app": a flat grid in browser-window proportions. The outer border
// band of the grid is pulled forward in z (`FRAME_LIP`) so it reads as a
// raised frame/chrome around a recessed content plane, rather than a
// plain flat sheet.
// ---------------------------------------------------------------------

const BROWSER_WIDTH = 1.7;
const BROWSER_HEIGHT = 1.05;
const FRAME_LIP = 0.16;
const FRAME_BORDER_BAND = 0.08; // fraction of u/v treated as "the frame"

export function browserFramePositions(count, out = new Float32Array(count * 3)) {
  for (let i = 0; i < count; i += 1) {
    const { u, v } = gridCoordinate(i, count);
    const onBorder =
      u < FRAME_BORDER_BAND || u > 1 - FRAME_BORDER_BAND || v < FRAME_BORDER_BAND || v > 1 - FRAME_BORDER_BAND;
    out[i * 3] = (u - 0.5) * BROWSER_WIDTH;
    out[i * 3 + 1] = (v - 0.5) * BROWSER_HEIGHT;
    out[i * 3 + 2] = onBorder ? FRAME_LIP : 0;
  }
  return out;
}

// ---------------------------------------------------------------------
// "android": the exact same grid slots as `browserFramePositions`,
// narrowed to a portrait phone aspect and flattened back to z = 0 — no
// frame lip, so the transition from the browser-frame state reads as the
// border relaxing back into the plane while the whole sheet narrows.
// ---------------------------------------------------------------------

const PHONE_WIDTH = 0.6;
const PHONE_HEIGHT = 1.55;

export function phonePositions(count, out = new Float32Array(count * 3)) {
  for (let i = 0; i < count; i += 1) {
    const { u, v } = gridCoordinate(i, count);
    out[i * 3] = (u - 0.5) * PHONE_WIDTH;
    out[i * 3 + 1] = (v - 0.5) * PHONE_HEIGHT;
    out[i * 3 + 2] = 0;
  }
  return out;
}

// ---------------------------------------------------------------------
// Deterministic hash of an integer-ish index into [0, 1) — a common
// GLSL-style sine hash. Never `Math.random`: see the module docblock.
// ---------------------------------------------------------------------

function hash(n) {
  const x = Math.sin(n * 12.9898) * 43758.5453123;
  return x - Math.floor(x);
}

// ---------------------------------------------------------------------
// Shared ring layout for the two volumetric states (rings / scattered)
// ---------------------------------------------------------------------

const RING_COUNT = 6;
const RING_RADIUS_MIN = 0.55;
const RING_RADIUS_STEP = 0.22;
const RING_Y_STEP = 0.24;
// A small per-ring angular offset so successive rings don't all start
// their first slot at the same angle, which would read as spokes rather
// than independent rings when viewed from above.
const RING_ANGLE_OFFSET = 0.35;

function ringSlotCount(ringIndex, count) {
  // Spreads `count` as evenly as possible across `RING_COUNT` rings — a
  // plain `count / RING_COUNT` would leave a remainder unassigned.
  const base = Math.floor(count / RING_COUNT);
  const remainder = count % RING_COUNT;
  return base + (ringIndex < remainder ? 1 : 0);
}

// Vertex `index`'s position on its ring: which ring (`index % RING_COUNT`)
// and which slot within it (`index / RING_COUNT`), so consecutive indices
// distribute round-robin across rings rather than filling one ring at a
// time — the ring assignment stays stable and evenly spread regardless of
// `count`.
function ringPosition(index, count) {
  const ringIndex = index % RING_COUNT;
  const slot = Math.floor(index / RING_COUNT);
  const slotsInRing = Math.max(1, ringSlotCount(ringIndex, count));
  const angle = (slot / slotsInRing) * Math.PI * 2 + ringIndex * RING_ANGLE_OFFSET;
  const radius = RING_RADIUS_MIN + ringIndex * RING_RADIUS_STEP;
  const y = (ringIndex - (RING_COUNT - 1) / 2) * RING_Y_STEP;
  return { x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius };
}

// ---------------------------------------------------------------------
// "api-db": `RING_COUNT` concentric rings, stacked along y.
// ---------------------------------------------------------------------

export function ringsPositions(count, out = new Float32Array(count * 3)) {
  for (let i = 0; i < count; i += 1) {
    const { x, y, z } = ringPosition(i, count);
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
  return out;
}

// ---------------------------------------------------------------------
// "ia": each vertex's own ring position above, perturbed by a bounded
// deterministic offset. This state is deliberately built as "the rings,
// dissolved" rather than an unrelated random cloud — the task brief
// describes rings <-> scatter as a direct morph in both scroll
// directions, so the two states share the exact same underlying
// placement and differ only by this noise term (see `serviceShapes.test.js`
// for the assertion that the offset stays inside `SCATTER_NOISE_RADIUS`).
// ---------------------------------------------------------------------

export const SCATTER_NOISE_RADIUS = 0.6;

export function scatteredPositions(count, out = new Float32Array(count * 3)) {
  for (let i = 0; i < count; i += 1) {
    const { x, y, z } = ringPosition(i, count);
    const ox = (hash(i * 1.7 + 0.13) - 0.5) * 2 * SCATTER_NOISE_RADIUS;
    const oy = (hash(i * 2.63 + 4.11) - 0.5) * 2 * SCATTER_NOISE_RADIUS;
    const oz = (hash(i * 3.31 + 8.42) - 0.5) * 2 * SCATTER_NOISE_RADIUS;
    out[i * 3] = x + ox;
    out[i * 3 + 1] = y + oy;
    out[i * 3 + 2] = z + oz;
  }
  return out;
}

// ---------------------------------------------------------------------
// Linear interpolation between two equal-length position arrays.
// ---------------------------------------------------------------------

/**
 * Writes `from` lerped toward `to` by `t` into `out` (defaults to a new
 * array). Used off the render path by `ServiceStage.jsx`'s active-change
 * effect to snapshot the *actual* on-screen shape mid-tween — rather than
 * jumping from whatever `uProgress` last reached before starting the next
 * tween — which is what keeps a fast or reversed scroll from visibly
 * popping. Safe to call with `out === from` (every write only ever reads
 * index `i` before writing index `i`).
 */
export function mixPositions(from, to, t, out = new Float32Array(from.length)) {
  for (let i = 0; i < from.length; i += 1) {
    out[i] = from[i] + (to[i] - from[i]) * t;
  }
  return out;
}

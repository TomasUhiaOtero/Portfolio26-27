/**
 * Pure, DOM/Three-free geometry generators for `ServiceStage.jsx` — the
 * Services section's morphing-points scene. One function per service
 * state, each an icon-like silhouette the points fill:
 *   - `monitorPositions`  — a desktop monitor (screen + stand): "web-app"
 *   - `androidPositions`  — the Android robot mascot: "android"
 *   - `scatteredPositions` — a loose point cloud: "ia"
 *   - `ringsPositions`     — stacked concentric rings: "api-db"
 * Each is a pure function of a shared vertex `count` so every state
 * produces exactly the same number of vertices — `ServiceStage.jsx` lerps
 * between two of these arrays in the vertex shader via a single
 * `uProgress` uniform, so a mismatched length would throw or read garbage.
 *
 * No `Math.random` anywhere: every "random-looking" value is a
 * deterministic hash of the vertex index, so calling any of these twice
 * with the same `count` reproduces the exact same array — required for
 * unit-testability and so a re-render can never reshuffle a shape under a
 * live tween.
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
// Deterministic hash of an integer-ish index into [0, 1) — a common
// GLSL-style sine hash. Never `Math.random`: see the module docblock.
// ---------------------------------------------------------------------

function hash(n) {
  const x = Math.sin(n * 12.9898) * 43758.5453123;
  return x - Math.floor(x);
}

// ---------------------------------------------------------------------
// "web-app": a desktop monitor — a filled screen rectangle with a raised
// frame band, sitting on a short neck and a wide foot. `gridCoordinate`
// spreads the screen vertices across a grid so the panel stays evenly
// filled at any count; the last ~18% of vertices form the stand.
// ---------------------------------------------------------------------

const SCREEN_WIDTH = 1.95;
const SCREEN_HEIGHT = 1.16;
const SCREEN_Y = 0.2; // lift the screen so the stand has room below it
const FRAME_LIP = 0.16;
const FRAME_BORDER_BAND = 0.08;

export function monitorPositions(count, out = new Float32Array(count * 3)) {
  const screenCount = Math.max(1, Math.floor(count * 0.82));
  const neckCount = Math.max(0, Math.floor(count * 0.06));

  for (let i = 0; i < count; i += 1) {
    let x;
    let y;
    let z = 0;

    if (i < screenCount) {
      const { u, v } = gridCoordinate(i, screenCount);
      const onBorder =
        u < FRAME_BORDER_BAND ||
        u > 1 - FRAME_BORDER_BAND ||
        v < FRAME_BORDER_BAND ||
        v > 1 - FRAME_BORDER_BAND;
      x = (u - 0.5) * SCREEN_WIDTH;
      y = SCREEN_Y + (v - 0.5) * SCREEN_HEIGHT;
      z = onBorder ? FRAME_LIP : 0;
    } else if (i < screenCount + neckCount) {
      const j = i - screenCount;
      x = (hash(j * 1.7 + 0.3) - 0.5) * 0.16;
      y = SCREEN_Y - SCREEN_HEIGHT / 2 - hash(j * 2.1 + 1.1) * 0.22;
    } else {
      const j = i - screenCount - neckCount;
      x = (hash(j * 1.9 + 0.7) - 0.5) * 1.0;
      y =
        SCREEN_Y -
        SCREEN_HEIGHT / 2 -
        0.24 -
        hash(j * 2.7 + 3.3) * 0.09;
    }

    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
  return out;
}

// ---------------------------------------------------------------------
// "android": the Android robot mascot, filled with points — a domed head
// with two antennae, a rounded body, two arms and two legs. Each vertex
// is assigned to a body part by `index % PARTS.length` (round-robin, so
// every part fills evenly at any count) and placed inside that part with
// a deterministic hash.
// ---------------------------------------------------------------------

// Relative share of the vertices given to each part, in round-robin
// order. Head and body get the most; the limbs are thin.
const ANDROID_PARTS = ["head", "head", "head", "body", "body", "body", "body", "arm", "leg", "antenna"];

export function androidPositions(count, out = new Float32Array(count * 3)) {
  for (let i = 0; i < count; i += 1) {
    const part = ANDROID_PARTS[i % ANDROID_PARTS.length];
    const h1 = hash(i * 1.73 + 0.11);
    const h2 = hash(i * 2.61 + 4.07);
    const side = hash(i * 3.17 + 8.9) < 0.5 ? -1 : 1;
    let x;
    let y;

    if (part === "head") {
      // Upper half-disc, flat along the bottom at y ~ 0.28.
      const r = 0.42 * Math.sqrt(h1);
      const angle = Math.PI * h2;
      x = Math.cos(angle) * r;
      y = 0.3 + Math.sin(angle) * r * 0.92;
    } else if (part === "antenna") {
      // Two short stalks angling out from the top of the head.
      const s = h1;
      x = side * (0.2 + s * 0.16);
      y = 0.6 + s * 0.26;
    } else if (part === "body") {
      x = (h1 - 0.5) * 0.78;
      y = -0.56 + h2 * 0.82;
    } else if (part === "arm") {
      x = side * (0.47 + h1 * 0.11);
      y = -0.42 + h2 * 0.52;
    } else {
      // leg
      x = side * (0.08 + h1 * 0.16);
      y = -0.86 + h2 * 0.3;
    }

    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = (hash(i * 4.9 + 1.7) - 0.5) * 0.06;
  }
  return out;
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

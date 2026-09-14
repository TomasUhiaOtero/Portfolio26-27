/**
 * Pure, DOM/Three-free vertex-displacement functions for `AboutStage.jsx`
 * — the About section's morphing wireframe scene.
 *
 * The scene builds ONE triangulated icosphere and never changes its
 * topology; each function here takes that sphere's unit-direction array
 * (`dirs`, a flat `[dx, dy, dz, ...]` of unit vectors, one per mesh
 * vertex) and returns where every vertex sits for that stage. Because the
 * face list is shared, lerping between any two of these arrays deforms
 * the same polygons smoothly — the "wireframe solid morphing into
 * another solid" look.
 *
 * Stage order (matches About's `progressToStage`, 0-3): sphere ->
 * cylinder -> rhombic diamond (octahedron) -> torus. Each is a pure,
 * continuous map of the direction vector — no `Math.random`, no per-call
 * state — so two calls with the same `dirs` return byte-identical arrays
 * and a morph never tears.
 */

function clamp(x, lo, hi) {
  return x < lo ? lo : x > hi ? hi : x;
}

// ---------------------------------------------------------------------
// Stage 0 — a sphere: the icosphere at rest, scaled up.
// ---------------------------------------------------------------------

const SPHERE_RADIUS = 1.35;

export function sphereShape(dirs, out = new Float32Array(dirs.length)) {
  for (let i = 0; i < dirs.length; i += 1) {
    out[i] = dirs[i] * SPHERE_RADIUS;
  }
  return out;
}

// ---------------------------------------------------------------------
// Stage 1 — a cylinder: the sphere wrapped onto a tube of constant
// radius (angle kept from the horizontal direction, height from `dy`),
// with the pole caps flattened flush to the ends.
// ---------------------------------------------------------------------

const CYLINDER = { radius: 0.9, halfHeight: 1.35, capStart: 0.86 };

export function cylinderShape(dirs, out = new Float32Array(dirs.length)) {
  for (let i = 0; i < dirs.length; i += 3) {
    const dx = dirs[i];
    const dy = dirs[i + 1];
    const dz = dirs[i + 2];
    const angle = Math.atan2(dz, dx);
    const absY = Math.abs(dy);

    let radius = CYLINDER.radius;
    let y = dy * CYLINDER.halfHeight;

    if (absY > CYLINDER.capStart) {
      // Collapse the pole zone into a flat end cap.
      const t = (absY - CYLINDER.capStart) / (1 - CYLINDER.capStart);
      radius = CYLINDER.radius * (1 - t);
      y = Math.sign(dy || 1) * CYLINDER.halfHeight;
    }

    out[i] = Math.cos(angle) * radius;
    out[i + 1] = y;
    out[i + 2] = Math.sin(angle) * radius;
  }
  return out;
}

// ---------------------------------------------------------------------
// Stage 2 — a rhombic diamond: the sphere projected onto an octahedron
// (the L1-norm surface |x|+|y|+|z| = const), stretched on Y so it reads
// as a cut gem rather than a plain octahedron.
// ---------------------------------------------------------------------

const DIAMOND = { size: 1.55, stretchY: 1.35 };

export function diamondShape(dirs, out = new Float32Array(dirs.length)) {
  for (let i = 0; i < dirs.length; i += 3) {
    const dx = dirs[i];
    const dy = dirs[i + 1];
    const dz = dirs[i + 2];

    const l1 = Math.abs(dx) + Math.abs(dy) + Math.abs(dz) || 1;
    const k = DIAMOND.size / l1;

    out[i] = dx * k;
    out[i + 1] = dy * k * DIAMOND.stretchY;
    out[i + 2] = dz * k;
  }
  return out;
}

// ---------------------------------------------------------------------
// Stage 3 — a torus: the sphere's longitude becomes the ring angle and
// its latitude (doubled) sweeps the full tube, so the whole sphere maps
// onto the whole donut.
// ---------------------------------------------------------------------

const TORUS = { major: 0.95, tube: 0.44 };

export function torusShape(dirs, out = new Float32Array(dirs.length)) {
  for (let i = 0; i < dirs.length; i += 3) {
    const dx = dirs[i];
    const dy = dirs[i + 1];
    const dz = dirs[i + 2];

    const u = Math.atan2(dz, dx); // around the Y axis
    const v = 2 * Math.asin(clamp(dy, -1, 1)); // latitude -> full tube sweep

    const ringRadius = TORUS.major + TORUS.tube * Math.cos(v);
    out[i] = Math.cos(u) * ringRadius;
    out[i + 1] = TORUS.tube * Math.sin(v);
    out[i + 2] = Math.sin(u) * ringRadius;
  }
  return out;
}

// ---------------------------------------------------------------------
// Linear interpolation between two equal-length position arrays. Same
// contract as `serviceShapes.js`'s `mixPositions` (safe with `out ===
// from`): `AboutStage.jsx` uses it to snapshot the actual on-screen shape
// mid-tween before retargeting.
// ---------------------------------------------------------------------

export function mixPositions(from, to, t, out = new Float32Array(from.length)) {
  for (let i = 0; i < from.length; i += 1) {
    out[i] = from[i] + (to[i] - from[i]) * t;
  }
  return out;
}

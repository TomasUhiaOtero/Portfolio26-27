#!/usr/bin/env node
/**
 * Generates a still "poster" frame for one of the site's WebGL particle
 * scenes (see `src/three/HeroField.jsx` and `src/three/LazyCanvas.jsx`).
 * `LazyCanvas` shows this image until the real scene is in view, and shows
 * it permanently under reduced motion — so it has to read as a genuine
 * frame of the particle network, not a placeholder, in both themes.
 *
 * This script is deliberately NOT reachable from `src/`: it is a one-off
 * Node build tool, not application code, and must never enter the bundle.
 * It is plain Node (no `canvas` package, no other new dependency) — a
 * tiny hand-rolled PNG encoder plus `ffmpeg` for the final WebP encode.
 *
 * Algorithm (matches the live scene's spirit: a scatter of points, thin
 * lines joining nearby pairs, faint dots on top, a soft vignette):
 *   1. Fill the frame with `--bg`.
 *   2. Scatter `--points` points using a seeded PRNG (`--seed`), so the
 *      same invocation always produces the same image.
 *   3. For every pair of points closer than `--link-distance`, draw a
 *      `--glow` line, antialiased by distance-to-segment, at an alpha that
 *      fades from `--line-alpha-max` (touching) down to `--line-alpha-min`
 *      (right at the threshold) — closer pairs read as stronger links.
 *   4. Draw each point as an `--accent` dot: a soft outer halo
 *      (`--dot-halo-radius`, `--dot-halo-alpha`, quadratic falloff) plus a
 *      sharper core (`--dot-core-radius`, `--dot-core-alpha`).
 *   5. Blend a soft elliptical vignette over the top `--vignette-alpha` of
 *      the frame (past `--vignette-start` of the way to the edge, dx/dy
 *      normalised independently by half-width/half-height so a non-square
 *      canvas doesn't turn it into an off-centre "spotlight").
 *
 * Dark and light need DIFFERENT alpha values, not the same ones: dark
 * marks on a light ground read considerably stronger than light marks on
 * a dark ground at identical alpha (dark grounds give contrast almost for
 * free). The invocations below were tuned so the two posters sit at
 * comparable visual weight — see task-6-report.md's third fix section for
 * the side-by-side comparison that produced these numbers. Re-run both
 * whenever `--accent`/`--glow`/`--bg` change in `src/styles/index.css`.
 *
 * The vignette needs a DIFFERENT treatment per theme too, not just a
 * smaller alpha: it blends `--vignette-color` (default black) toward the
 * frame edges, and black-over-near-white at any noticeable alpha reads as
 * a crisp grey ellipse — a spotlight, not a background — while the same
 * black-over-black vignette on the dark poster is invisible. The light
 * poster therefore ships with `--vignette-alpha 0` (no vignette at all);
 * see task-6-report.md's fourth fix section. The dark poster keeps its
 * vignette — it does no harm there and the two posters are correctly
 * weight-matched without touching it.
 *
 * Usage — regenerate the two current hero posters (run from `web/`):
 *
 *   node scripts/gen-poster.mjs --bg "#000000" --accent "#0a84ff" --glow "#5e5ce6" \
 *     --points 200 --seed 6 --link-distance 68 \
 *     --line-alpha-min 0.06 --line-alpha-max 0.26 \
 *     --dot-halo-radius 7 --dot-halo-alpha 0.15 --dot-core-radius 2.2 --dot-core-alpha 0.75 \
 *     --vignette-alpha 0.14 --vignette-start 0.85 \
 *     --out public/img/hero-poster.png
 *   ffmpeg -y -i public/img/hero-poster.png -c:v libwebp -quality 82 public/img/hero-poster.webp
 *   rm public/img/hero-poster.png
 *
 *   node scripts/gen-poster.mjs --bg "#fbfbfd" --accent "#0071e3" --glow "#5856d6" \
 *     --points 200 --seed 6 --link-distance 68 \
 *     --line-alpha-min 0.03 --line-alpha-max 0.13 \
 *     --dot-halo-radius 6 --dot-halo-alpha 0.08 --dot-core-radius 2 --dot-core-alpha 0.4 \
 *     --vignette-alpha 0 --vignette-start 0.85 \
 *     --out public/img/hero-poster-light.png
 *   ffmpeg -y -i public/img/hero-poster-light.png -c:v libwebp -quality 82 public/img/hero-poster-light.webp
 *   rm public/img/hero-poster-light.png
 *
 * Tasks 11 and 15: reuse the hero invocations above as your starting
 * point if your scene is another scattered-particle-network look (Task
 * 11's "ia" stage is explicitly described as wanting exactly that), just
 * changing `--out` (and, once you decide your own scene's point count /
 * link distance, those two flags too). Keep the same two-pass tuning
 * discipline: generate both themes, look at them side by side, and adjust
 * the light variant's alphas down until neither reads louder than the
 * other — don't assume the dark numbers transfer.
 *
 * ---------------------------------------------------------------------
 * Mode 2: `--mode core-orbit` (added for Task 9's fix round, ruling R25)
 * ---------------------------------------------------------------------
 *
 * For a scene that is NOT a uniform scattered field but a distinct
 * "central body with things orbiting it" (About's `TechCore`: a wireframe
 * icosahedron core, instanced spheres orbiting it) — the `network` mode
 * above cannot produce that shape no matter how its knobs are tuned,
 * because it has no concept of a center. `--mode core-orbit` draws:
 *
 *   1. A faceted polygon at the canvas center (`--core-radius`,
 *      `--core-facets` vertices) with its outer edges PLUS internal
 *      chords (each vertex to the vertex `--core-chord-skip` steps
 *      around) at `--core-line-alpha`, in `--accent` — a 2D suggestion of
 *      a wireframe polyhedron, echoing the live scene's icosahedron
 *      (whose material is also colored from `--accent`).
 *   2. `--node-count` small dots scattered in a loose halo around that
 *      core: angle uniform-random, radius sqrt-distributed between
 *      `--orbit-radius-min` and `--orbit-radius-max` (area-uniform, not
 *      radius-uniform, so they don't clump near the inner edge), then the
 *      y-offset from center scaled by `--orbit-squash` (<1 flattens the
 *      halo into an ellipse, suggesting the live scene's tilted/inclined
 *      orbital rings rather than a flat circle face-on). Drawn in
 *      `--glow` using the SAME `--dot-halo-*`/`--dot-core-*` flags
 *      `network` mode uses for its points — one dot-rendering primitive,
 *      shared across both modes.
 *   3. The first `--orbit-line-count` of those dots (in scatter order,
 *      itself seeded) get a faint straight line back to the core center
 *      at `--orbit-line-alpha`, in `--glow` — a hint of orbital paths,
 *      kept few and faint so it doesn't turn back into a dense network.
 *
 * Draw order is core wireframe, then the faint orbit-line hints, then the
 * node dots on top — so the dots (the thing a viewer's eye should land
 * on as "the orbiting things") are never occluded by the lines under
 * them. The vignette (step 5 of `network` mode) applies identically in
 * both modes, same flags, same per-theme caveat below.
 *
 * Usage — regenerate the two current About posters (run from `web/`):
 *
 *   node scripts/gen-poster.mjs --mode core-orbit \
 *     --bg "#000000" --accent "#0a84ff" --glow "#5e5ce6" \
 *     --width 1200 --height 1500 --seed 33 \
 *     --core-radius 210 --core-facets 9 --core-chord-skip 3 --core-line-alpha 0.65 \
 *     --node-count 26 --orbit-radius-min 260 --orbit-radius-max 440 --orbit-squash 0.5 \
 *     --orbit-line-count 6 --orbit-line-alpha 0.16 \
 *     --dot-halo-radius 9 --dot-halo-alpha 0.18 --dot-core-radius 2.8 --dot-core-alpha 0.85 \
 *     --vignette-alpha 0.14 --vignette-start 0.85 \
 *     --out public/img/about-poster.png
 *   ffmpeg -y -i public/img/about-poster.png -c:v libwebp -quality 82 public/img/about-poster.webp
 *   rm public/img/about-poster.png
 *
 *   node scripts/gen-poster.mjs --mode core-orbit \
 *     --bg "#fbfbfd" --accent "#0071e3" --glow "#5856d6" \
 *     --width 1200 --height 1500 --seed 33 \
 *     --core-radius 210 --core-facets 9 --core-chord-skip 3 --core-line-alpha 0.4 \
 *     --node-count 26 --orbit-radius-min 260 --orbit-radius-max 440 --orbit-squash 0.5 \
 *     --orbit-line-count 6 --orbit-line-alpha 0.08 \
 *     --dot-halo-radius 8 --dot-halo-alpha 0.09 --dot-core-radius 2.3 --dot-core-alpha 0.46 \
 *     --vignette-alpha 0 --vignette-start 0.85 \
 *     --out public/img/about-poster-light.png
 *   ffmpeg -y -i public/img/about-poster-light.png -c:v libwebp -quality 82 public/img/about-poster-light.webp
 *   rm public/img/about-poster-light.png
 *
 * Task 15: if your scene is likewise a distinct-focal-object shape (not a
 * uniform field), reuse `core-orbit` rather than adding a third mode —
 * check first whether either existing mode already fits before writing a
 * new one.
 *
 * ---------------------------------------------------------------------
 * Mode 3: `--mode grid-frame` (added for Task 11)
 * ---------------------------------------------------------------------
 *
 * Task 11's `ServiceStage` morphs one points geometry between four
 * states (grid folding into a browser frame / narrowing into a phone /
 * dissolving into a scattered cloud / settling into stacked concentric
 * rings) as the active service changes. Neither existing mode can stand
 * in for a poster here: `network` draws a UNIFORM scattered field with
 * distance-linked lines, and this scene's scattered state has no lines at
 * all; `core-orbit` draws a distinct central body with a halo orbiting
 * it, and none of the four states has a center-with-orbiters shape. The
 * poster has to match whichever state is actually on screen the instant
 * the canvas swaps in — and `Services.jsx` always mounts at
 * `activeService === 0` (before any scroll), so `--mode grid-frame`
 * renders exactly that resting state: an ordered `--grid-cols` x
 * `--grid-rows` grid of dots in browser-window proportions, framed by a
 * rectangular border stroke.
 *
 * Draw order, reusing the same primitives every other mode does
 * (`drawLine`/`drawDot`/`applyVignette`/`mulberry32`):
 *
 *   1. A `--glow`-coloured rectangular stroke at `--frame-line-alpha`,
 *      inset from the canvas edges by `--frame-margin-x`/`--frame-margin-y`
 *      (fractions of width/height) — the poster's stand-in for the live
 *      scene's raised frame "lip".
 *   2. `--grid-cols` x `--grid-rows` `--accent` dots, evenly spaced across
 *      that same rect. Dots that land on the frame's own border row/column
 *      get `--border-radius-boost`/`--border-alpha-boost` applied to their
 *      halo radius / core alpha, echoing the live scene's border vertices
 *      sitting forward in z (see `serviceShapes.js`'s `FRAME_LIP`) —
 *      exactly the same "vertex forced toward the eye reads as slightly
 *      bigger/brighter" cue a real perspective render would produce.
 *   3. `--seed`-driven per-dot alpha jitter (±`--dot-jitter`, uniform):
 *      a perfectly even alpha grid reads as a printed pattern rather than
 *      a field of individually-lit points — the same reason `network`
 *      mode's per-dot rendering already has soft variation baked into its
 *      halo/core falloff.
 *
 * The vignette (step 5 of `network` mode) applies identically here, same
 * flags, same per-theme light-vignette caveat as both other modes.
 *
 * The rect itself is deliberately landscape (12 cols x 6 rows, wide
 * margins top/bottom, narrower left/right) even though the canvas is
 * portrait: `ServiceStage.jsx`'s own `BROWSER_WIDTH`/`BROWSER_HEIGHT`
 * (1.7 x 1.05, a landscape rect) sit inside a portrait camera frustum, so
 * the live "web-app" state genuinely reads as a wide, short rectangle
 * with empty space above and below, not a shape that fills the box — the
 * margins below were chosen to match that, not to center a square grid.
 *
 * Usage — regenerate the two current Services posters (run from `web/`):
 *
 *   node scripts/gen-poster.mjs --mode grid-frame \
 *     --bg "#000000" --accent "#0a84ff" --glow "#5e5ce6" \
 *     --width 1200 --height 1500 --seed 11 \
 *     --grid-cols 12 --grid-rows 6 --frame-margin-x 0.13 --frame-margin-y 0.315 \
 *     --frame-line-alpha 0.5 --border-radius-boost 1.35 --border-alpha-boost 1.3 \
 *     --dot-jitter 0.25 \
 *     --dot-halo-radius 11 --dot-halo-alpha 0.16 --dot-core-radius 3 --dot-core-alpha 0.82 \
 *     --vignette-alpha 0.14 --vignette-start 0.85 \
 *     --out public/img/services-poster.png
 *   ffmpeg -y -i public/img/services-poster.png -c:v libwebp -quality 82 public/img/services-poster.webp
 *   rm public/img/services-poster.png
 *
 *   node scripts/gen-poster.mjs --mode grid-frame \
 *     --bg "#fbfbfd" --accent "#0071e3" --glow "#5856d6" \
 *     --width 1200 --height 1500 --seed 11 \
 *     --grid-cols 12 --grid-rows 6 --frame-margin-x 0.13 --frame-margin-y 0.315 \
 *     --frame-line-alpha 0.24 --border-radius-boost 1.35 --border-alpha-boost 1.3 \
 *     --dot-jitter 0.25 \
 *     --dot-halo-radius 9 --dot-halo-alpha 0.08 --dot-core-radius 2.4 --dot-core-alpha 0.42 \
 *     --vignette-alpha 0 --vignette-start 0.85 \
 *     --out public/img/services-poster-light.png
 *   ffmpeg -y -i public/img/services-poster-light.png -c:v libwebp -quality 82 public/img/services-poster-light.webp
 *   rm public/img/services-poster-light.png
 *
 * ---------------------------------------------------------------------
 * Mode 4: `--mode radial-glow` (added for Task 15)
 * ---------------------------------------------------------------------
 *
 * `WorkBackdrop.jsx` (the projects carousel's backdrop) is neither a
 * scattered field, a central-body-with-orbiters, nor a grid — it's a
 * fragment shader: a full-bleed radial gradient from `--accent` (centre)
 * to `--glow` (edge) blended over `--bg`, plus a soft `--glow`-coloured
 * light blob whose horizontal position tracks the carousel's continuous
 * index (see `src/three/workBackdrop.js`'s `blobPosition`). None of the
 * three raster modes above has any notion of a smooth per-pixel gradient —
 * they all composite discrete dots/lines onto a flat background — so this
 * mode reimplements the live shader's exact formula in JS, per pixel,
 * rather than trying to bend an existing mode's discrete-primitive
 * language into a continuous one.
 *
 * `Work.jsx` always mounts at `focusIndex === 0` before any interaction,
 * so the poster renders `blobPosition(0, length) === 0` — the blob sits
 * dead centre, matching the resting frame the real canvas is replaced by.
 *
 * Per-pixel formula (mirrors the GLSL in `WorkBackdrop.jsx` exactly,
 * including its `smoothstep(0.85, 0.0, blobDist)` reversed-edge idiom):
 *
 *   1. Normalise each pixel to `p = (uv - 0.5) * vec2(aspect, 1)`, aspect
 *      from `--width`/`--height`.
 *   2. `d = length(p)`; gradient = lerp(accent, glow, smoothstep(0,
 *      `--gradient-outer`, d)); colour = lerp(bg, gradient,
 *      `--gradient-mix`).
 *   3. Blob centre at `(--blob-x * aspect * 0.45, 0)`; `blobDist =
 *      length(p - blobCenter)`; `blob = smoothstep(--blob-radius, 0,
 *      blobDist)`; colour += glow * blob * `--blob-alpha`.
 *   4. The same `applyVignette` step every other mode uses, same per-theme
 *      caveat (light poster ships `--vignette-alpha 0`).
 *
 * This composites colour across the *entire* frame (`mix(bg, gradient,
 * gradientMix)` at every pixel, not a sparse overlay), and — like the
 * other three modes, though for a different reason — it needs DIFFERENT
 * `--gradient-mix`/`--blob-alpha` per theme. The light theme's `--accent`/
 * `--glow` are vivid and its `--bg` is near white, so even a modest mix
 * washes the whole frame in saturated periwinkle; the dark theme needs
 * MORE weight for the same tint to register at all against near-black. The
 * live shader (`WorkBackdrop.jsx`'s `BACKDROP_TUNING`) carries the exact
 * same two value pairs — light `{mix 0.16, blob 0.14}`, dark `{mix 0.34,
 * blob 0.24}` — keep the invocations below and that table in sync. The
 * vignette keeps its usual per-theme fork on top (light ships
 * `--vignette-alpha 0`).
 *
 * Usage — regenerate the two current Work posters (run from `web/`):
 *
 *   node scripts/gen-poster.mjs --mode radial-glow \
 *     --bg "#000000" --accent "#0a84ff" --glow "#5e5ce6" \
 *     --width 1600 --height 900 \
 *     --gradient-outer 1.1 --gradient-mix 0.34 \
 *     --blob-x 0 --blob-radius 0.85 --blob-alpha 0.24 \
 *     --vignette-alpha 0.14 --vignette-start 0.85 \
 *     --out public/img/work-poster.png
 *   ffmpeg -y -i public/img/work-poster.png -c:v libwebp -quality 82 public/img/work-poster.webp
 *   rm public/img/work-poster.png
 *
 *   node scripts/gen-poster.mjs --mode radial-glow \
 *     --bg "#fbfbfd" --accent "#0071e3" --glow "#5856d6" \
 *     --width 1600 --height 900 \
 *     --gradient-outer 1.1 --gradient-mix 0.16 \
 *     --blob-x 0 --blob-radius 0.85 --blob-alpha 0.14 \
 *     --vignette-alpha 0 --vignette-start 0.85 \
 *     --out public/img/work-poster-light.png
 *   ffmpeg -y -i public/img/work-poster-light.png -c:v libwebp -quality 82 public/img/work-poster-light.webp
 *   rm public/img/work-poster-light.png
 */

import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[i + 1];
    args[key] = value;
    i += 1;
  }
  return args;
}

function requireNumber(args, key, fallback) {
  const raw = args[key];
  if (raw === undefined) {
    if (fallback === undefined) throw new Error(`Missing required --${key}`);
    return fallback;
  }
  const value = Number(raw);
  if (Number.isNaN(value)) throw new Error(`--${key} must be a number, got "${raw}"`);
  return value;
}

function requireString(args, key, fallback) {
  const raw = args[key];
  if (raw === undefined) {
    if (fallback === undefined) throw new Error(`Missing required --${key}`);
    return fallback;
  }
  return raw;
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const value = parseInt(
    normalized.length === 3
      ? normalized
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : normalized,
    16,
  );
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

// ---------------------------------------------------------------------------
// Deterministic PRNG (mulberry32) — same seed always produces the same
// scatter, so the exact same invocation is reproducible byte-for-byte.
// ---------------------------------------------------------------------------

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function makeCanvas(width, height, bgRgb) {
  const pixels = new Float64Array(width * height * 3);
  for (let i = 0; i < width * height; i += 1) {
    pixels[i * 3] = bgRgb[0];
    pixels[i * 3 + 1] = bgRgb[1];
    pixels[i * 3 + 2] = bgRgb[2];
  }
  return { width, height, pixels };
}

function blendPixel(canvas, x, y, rgb, alpha) {
  if (alpha <= 0) return;
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
  const i = (y * canvas.width + x) * 3;
  const a = Math.min(1, alpha);
  canvas.pixels[i] = rgb[0] * a + canvas.pixels[i] * (1 - a);
  canvas.pixels[i + 1] = rgb[1] * a + canvas.pixels[i + 1] * (1 - a);
  canvas.pixels[i + 2] = rgb[2] * a + canvas.pixels[i + 2] * (1 - a);
}

// Perpendicular distance from (px, py) to the segment (x1,y1)-(x2,y2),
// clamped to the segment's endpoints (not the infinite line through it).
function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  let t = lengthSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function drawLine(canvas, x1, y1, x2, y2, rgb, alpha, strokeHalfWidth) {
  const minX = Math.max(0, Math.floor(Math.min(x1, x2) - strokeHalfWidth - 1));
  const maxX = Math.min(canvas.width - 1, Math.ceil(Math.max(x1, x2) + strokeHalfWidth + 1));
  const minY = Math.max(0, Math.floor(Math.min(y1, y2) - strokeHalfWidth - 1));
  const maxY = Math.min(canvas.height - 1, Math.ceil(Math.max(y1, y2) + strokeHalfWidth + 1));

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const d = distanceToSegment(x + 0.5, y + 0.5, x1, y1, x2, y2);
      if (d > strokeHalfWidth) continue;
      const coverage = 1 - d / strokeHalfWidth;
      blendPixel(canvas, x, y, rgb, alpha * coverage);
    }
  }
}

function drawDot(canvas, cx, cy, rgb, haloRadius, haloAlpha, coreRadius, coreAlpha) {
  const radius = Math.max(haloRadius, coreRadius) + 1;
  const minX = Math.max(0, Math.floor(cx - radius));
  const maxX = Math.min(canvas.width - 1, Math.ceil(cx + radius));
  const minY = Math.max(0, Math.floor(cy - radius));
  const maxY = Math.min(canvas.height - 1, Math.ceil(cy + radius));

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d <= haloRadius) {
        const t = 1 - d / haloRadius;
        blendPixel(canvas, x, y, rgb, haloAlpha * t * t);
      }
      if (d <= coreRadius + 1) {
        const edge = Math.min(1, Math.max(0, coreRadius + 1 - d));
        blendPixel(canvas, x, y, rgb, coreAlpha * edge);
      }
    }
  }
}

function applyVignette(canvas, alphaMax, start, colorRgb) {
  const halfW = canvas.width / 2;
  const halfH = canvas.height / 2;
  for (let y = 0; y < canvas.height; y += 1) {
    const ny = (y + 0.5 - halfH) / halfH;
    for (let x = 0; x < canvas.width; x += 1) {
      const nx = (x + 0.5 - halfW) / halfW;
      const d = Math.hypot(nx, ny);
      if (d <= start) continue;
      // Quadratic ease-in: a linear ramp over such a narrow band (edge to
      // 1.0 in normalised space) reads as a hard ring rather than a soft
      // vignette; squaring it keeps the darkening negligible just past
      // `start` and lets it build toward `alphaMax` only right at the rim.
      const t = Math.min(1, (d - start) / (1 - start));
      blendPixel(canvas, x, y, colorRgb, alphaMax * t * t);
    }
  }
}

function generatePoster(options) {
  const {
    width,
    height,
    bg,
    accent,
    glow,
    points,
    seed,
    linkDistance,
    lineAlphaMin,
    lineAlphaMax,
    dotHaloRadius,
    dotHaloAlpha,
    dotCoreRadius,
    dotCoreAlpha,
    vignetteAlpha,
    vignetteStart,
    vignetteColor,
  } = options;

  const bgRgb = hexToRgb(bg);
  const accentRgb = hexToRgb(accent);
  const glowRgb = hexToRgb(glow);
  const vignetteRgb = hexToRgb(vignetteColor);

  const canvas = makeCanvas(width, height, bgRgb);
  const rand = mulberry32(seed);

  const scatter = [];
  const margin = 24;
  for (let i = 0; i < points; i += 1) {
    scatter.push({
      x: margin + rand() * (width - margin * 2),
      y: margin + rand() * (height - margin * 2),
    });
  }

  const linkDistanceSq = linkDistance * linkDistance;
  for (let i = 0; i < scatter.length; i += 1) {
    for (let j = i + 1; j < scatter.length; j += 1) {
      const a = scatter[i];
      const b = scatter[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distSq = dx * dx + dy * dy;
      if (distSq > linkDistanceSq) continue;
      const dist = Math.sqrt(distSq);
      const alpha = lineAlphaMax - (lineAlphaMax - lineAlphaMin) * (dist / linkDistance);
      drawLine(canvas, a.x, a.y, b.x, b.y, glowRgb, alpha, 0.9);
    }
  }

  for (const p of scatter) {
    drawDot(canvas, p.x, p.y, accentRgb, dotHaloRadius, dotHaloAlpha, dotCoreRadius, dotCoreAlpha);
  }

  applyVignette(canvas, vignetteAlpha, vignetteStart, vignetteRgb);

  return canvas;
}

// Draws a regular `count`-vertex polygon centered at (cx, cy): its outer
// edges plus internal chords (each vertex to the one `chordSkip` steps
// around), which is what makes it read as a faceted wireframe solid rather
// than a plain outlined shape. Chords are de-duplicated (an unordered pair
// drawn once) so no segment gets double alpha from being hit from both
// ends.
function drawFacetedPolygon(canvas, cx, cy, radius, count, chordSkip, rgb, alpha) {
  const vertices = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    vertices.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius });
  }

  const drawn = new Set();
  const drawEdge = (i, j) => {
    const key = i < j ? `${i}-${j}` : `${j}-${i}`;
    if (drawn.has(key)) return;
    drawn.add(key);
    drawLine(canvas, vertices[i].x, vertices[i].y, vertices[j].x, vertices[j].y, rgb, alpha, 1.1);
  };

  for (let i = 0; i < count; i += 1) {
    drawEdge(i, (i + 1) % count);
    if (chordSkip > 1 && chordSkip < count - 1) {
      drawEdge(i, (i + chordSkip) % count);
    }
  }
}

// Mode 2: a distinct central "core" with a loose halo of smaller "node"
// dots orbiting it, a handful with faint lines hinting an orbital path
// back to the core — see the docblock's "Mode 2" section for the full
// rationale. Reuses `drawDot`/`drawLine`/`applyVignette`/`mulberry32` from
// `network` mode; only the layout differs.
function generateCoreOrbitPoster(options) {
  const {
    width,
    height,
    bg,
    accent,
    glow,
    seed,
    coreRadius,
    coreFacets,
    coreChordSkip,
    coreLineAlpha,
    nodeCount,
    orbitRadiusMin,
    orbitRadiusMax,
    orbitSquash,
    orbitLineCount,
    orbitLineAlpha,
    dotHaloRadius,
    dotHaloAlpha,
    dotCoreRadius,
    dotCoreAlpha,
    vignetteAlpha,
    vignetteStart,
    vignetteColor,
  } = options;

  const bgRgb = hexToRgb(bg);
  const accentRgb = hexToRgb(accent);
  const glowRgb = hexToRgb(glow);
  const vignetteRgb = hexToRgb(vignetteColor);

  const canvas = makeCanvas(width, height, bgRgb);
  const rand = mulberry32(seed);
  const cx = width / 2;
  const cy = height / 2;

  const nodes = [];
  for (let i = 0; i < nodeCount; i += 1) {
    const angle = rand() * Math.PI * 2;
    // sqrt distribution: area-uniform across the annulus, so dots don't
    // clump near the inner radius the way a plain linear lerp would.
    const radius = orbitRadiusMin + (orbitRadiusMax - orbitRadiusMin) * Math.sqrt(rand());
    nodes.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius * orbitSquash,
    });
  }

  drawFacetedPolygon(canvas, cx, cy, coreRadius, coreFacets, coreChordSkip, accentRgb, coreLineAlpha);

  const lineCount = Math.min(orbitLineCount, nodes.length);
  for (let i = 0; i < lineCount; i += 1) {
    const node = nodes[i];
    drawLine(canvas, node.x, node.y, cx, cy, glowRgb, orbitLineAlpha, 0.8);
  }

  for (const node of nodes) {
    drawDot(canvas, node.x, node.y, glowRgb, dotHaloRadius, dotHaloAlpha, dotCoreRadius, dotCoreAlpha);
  }

  applyVignette(canvas, vignetteAlpha, vignetteStart, vignetteRgb);

  return canvas;
}

// Mode 3: an ordered grid of dots in browser-window proportions, framed by
// a rectangular border stroke — see the docblock's "Mode 3" section for
// the full rationale. Reuses `drawDot`/`drawLine`/`applyVignette`/
// `mulberry32` from `network` mode; only the layout differs.
function generateGridFramePoster(options) {
  const {
    width,
    height,
    bg,
    accent,
    glow,
    seed,
    gridCols,
    gridRows,
    frameMarginX,
    frameMarginY,
    frameLineAlpha,
    borderRadiusBoost,
    borderAlphaBoost,
    dotJitter,
    dotHaloRadius,
    dotHaloAlpha,
    dotCoreRadius,
    dotCoreAlpha,
    vignetteAlpha,
    vignetteStart,
    vignetteColor,
  } = options;

  const bgRgb = hexToRgb(bg);
  const accentRgb = hexToRgb(accent);
  const glowRgb = hexToRgb(glow);
  const vignetteRgb = hexToRgb(vignetteColor);

  const canvas = makeCanvas(width, height, bgRgb);
  const rand = mulberry32(seed);

  const left = width * frameMarginX;
  const right = width * (1 - frameMarginX);
  const top = height * frameMarginY;
  const bottom = height * (1 - frameMarginY);

  drawLine(canvas, left, top, right, top, glowRgb, frameLineAlpha, 1.4);
  drawLine(canvas, right, top, right, bottom, glowRgb, frameLineAlpha, 1.4);
  drawLine(canvas, right, bottom, left, bottom, glowRgb, frameLineAlpha, 1.4);
  drawLine(canvas, left, bottom, left, top, glowRgb, frameLineAlpha, 1.4);

  for (let row = 0; row < gridRows; row += 1) {
    const v = gridRows > 1 ? row / (gridRows - 1) : 0.5;
    const y = top + v * (bottom - top);
    const onBorderRow = row === 0 || row === gridRows - 1;
    for (let col = 0; col < gridCols; col += 1) {
      const u = gridCols > 1 ? col / (gridCols - 1) : 0.5;
      const x = left + u * (right - left);
      const onBorder = onBorderRow || col === 0 || col === gridCols - 1;

      // ±dotJitter uniform alpha variation so the grid reads as
      // individually-lit points rather than a printed pattern.
      const jitter = 1 + (rand() * 2 - 1) * dotJitter;
      const haloRadius = onBorder ? dotHaloRadius * borderRadiusBoost : dotHaloRadius;
      const coreAlpha = (onBorder ? dotCoreAlpha * borderAlphaBoost : dotCoreAlpha) * jitter;

      drawDot(canvas, x, y, accentRgb, haloRadius, dotHaloAlpha * jitter, dotCoreRadius, coreAlpha);
    }
  }

  applyVignette(canvas, vignetteAlpha, vignetteStart, vignetteRgb);

  return canvas;
}

// GLSL's `smoothstep(edge0, edge1, x)` — the plain clamp-and-Hermite-smooth
// formula. The spec calls `edge0 >= edge1` "undefined", but every WebGL
// implementation in practice just evaluates the same formula regardless,
// which is what `WorkBackdrop.jsx`'s fragment shader relies on for its
// `smoothstep(0.85, 0.0, blobDist)` (reversed edges, so the blob is
// brightest at its centre and fades OUT with distance). Reproduced here so
// this raster poster matches that shader pixel-for-pixel in spirit rather
// than approximating it with a differently-shaped falloff.
function smoothstepGlsl(edge0, edge1, x) {
  let t = (x - edge0) / (edge1 - edge0);
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}

function lerpRgb(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

// Mode 4: a per-pixel port of `WorkBackdrop.jsx`'s fragment shader — see
// the docblock's "Mode 4" section for the full rationale. Unlike the other
// three modes (which composite sparse dots/lines via `blendPixel`'s alpha
// mechanism), every pixel here gets a fully-opaque colour written directly,
// matching the live shader's `gl_FragColor = vec4(color, 1.0)`.
function generateRadialGlowPoster(options) {
  const {
    width,
    height,
    bg,
    accent,
    glow,
    gradientOuter,
    gradientMix,
    blobX,
    blobRadius,
    blobAlpha,
    vignetteAlpha,
    vignetteStart,
    vignetteColor,
  } = options;

  const bgRgb = hexToRgb(bg);
  const accentRgb = hexToRgb(accent);
  const glowRgb = hexToRgb(glow);
  const vignetteRgb = hexToRgb(vignetteColor);

  const canvas = makeCanvas(width, height, bgRgb);
  const aspect = width / height;
  const blobCenterX = blobX * aspect * 0.45;

  for (let y = 0; y < height; y += 1) {
    const py = (y + 0.5) / height - 0.5; // matches (vUv.y - 0.5)
    for (let x = 0; x < width; x += 1) {
      const px = ((x + 0.5) / width - 0.5) * aspect; // matches (vUv.x - 0.5) * aspect

      const d = Math.hypot(px, py);
      const gradient = lerpRgb(accentRgb, glowRgb, smoothstepGlsl(0, gradientOuter, d));
      let color = lerpRgb(bgRgb, gradient, gradientMix);

      const blobDist = Math.hypot(px - blobCenterX, py);
      const blob = smoothstepGlsl(blobRadius, 0, blobDist) * blobAlpha;
      color = [
        color[0] + glowRgb[0] * blob,
        color[1] + glowRgb[1] * blob,
        color[2] + glowRgb[2] * blob,
      ];

      const i = (y * width + x) * 3;
      canvas.pixels[i] = color[0];
      canvas.pixels[i + 1] = color[1];
      canvas.pixels[i + 2] = color[2];
    }
  }

  applyVignette(canvas, vignetteAlpha, vignetteStart, vignetteRgb);

  return canvas;
}

// ---------------------------------------------------------------------------
// Minimal PNG encoder — chunk framing + CRC32 + zlib deflate. No `canvas`
// package is installed in this project and adding a dependency for a
// one-off asset script isn't warranted; Node's built-in `zlib` is enough.
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lengthBuf, typeBuf, data, crcBuf]);
}

function encodePng(canvas) {
  const { width, height, pixels } = canvas;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: RGB
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = chunk("IHDR", ihdrData);

  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0; // filter type: none
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 3;
      const o = rowStart + 1 + x * 3;
      raw[o] = Math.round(Math.max(0, Math.min(255, pixels[i])));
      raw[o + 1] = Math.round(Math.max(0, Math.min(255, pixels[i + 1])));
      raw[o + 2] = Math.round(Math.max(0, Math.min(255, pixels[i + 2])));
    }
  }
  const idat = chunk("IDAT", deflateSync(raw, { level: 9 }));
  const iend = chunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv.slice(2));

  const mode = requireString(args, "mode", "network");
  const VALID_MODES = ["network", "core-orbit", "grid-frame", "radial-glow"];
  if (!VALID_MODES.includes(mode)) {
    throw new Error(`--mode must be one of ${VALID_MODES.map((m) => `"${m}"`).join(", ")}, got "${mode}"`);
  }

  const shared = {
    width: requireNumber(args, "width", 1600),
    height: requireNumber(args, "height", 1000),
    bg: requireString(args, "bg"),
    accent: requireString(args, "accent"),
    glow: requireString(args, "glow"),
    seed: requireNumber(args, "seed", 6),
    dotHaloRadius: requireNumber(args, "dot-halo-radius", 10),
    dotHaloAlpha: requireNumber(args, "dot-halo-alpha", 0.25),
    dotCoreRadius: requireNumber(args, "dot-core-radius", 3.4),
    dotCoreAlpha: requireNumber(args, "dot-core-alpha", 0.9),
    vignetteAlpha: requireNumber(args, "vignette-alpha", 0.14),
    vignetteStart: requireNumber(args, "vignette-start", 0.8),
    vignetteColor: requireString(args, "vignette-color", "#000000"),
  };

  const out = requireString(args, "out");
  let canvas;
  let summary;

  if (mode === "network") {
    const options = {
      ...shared,
      points: requireNumber(args, "points", 200),
      linkDistance: requireNumber(args, "link-distance", 68),
      lineAlphaMin: requireNumber(args, "line-alpha-min", 0.16),
      lineAlphaMax: requireNumber(args, "line-alpha-max", 0.55),
    };
    canvas = generatePoster(options);
    summary = `${options.points} points, seed ${options.seed}`;
  } else if (mode === "core-orbit") {
    const options = {
      ...shared,
      coreRadius: requireNumber(args, "core-radius", 220),
      coreFacets: requireNumber(args, "core-facets", 9),
      coreChordSkip: requireNumber(args, "core-chord-skip", 3),
      coreLineAlpha: requireNumber(args, "core-line-alpha", 0.5),
      nodeCount: requireNumber(args, "node-count", 24),
      orbitRadiusMin: requireNumber(args, "orbit-radius-min", 300),
      orbitRadiusMax: requireNumber(args, "orbit-radius-max", 460),
      orbitSquash: requireNumber(args, "orbit-squash", 0.55),
      orbitLineCount: requireNumber(args, "orbit-line-count", 5),
      orbitLineAlpha: requireNumber(args, "orbit-line-alpha", 0.1),
    };
    canvas = generateCoreOrbitPoster(options);
    summary = `core-orbit, ${options.nodeCount} nodes, seed ${options.seed}`;
  } else if (mode === "grid-frame") {
    const options = {
      ...shared,
      gridCols: requireNumber(args, "grid-cols", 12),
      gridRows: requireNumber(args, "grid-rows", 6),
      frameMarginX: requireNumber(args, "frame-margin-x", 0.13),
      frameMarginY: requireNumber(args, "frame-margin-y", 0.315),
      frameLineAlpha: requireNumber(args, "frame-line-alpha", 0.5),
      borderRadiusBoost: requireNumber(args, "border-radius-boost", 1.35),
      borderAlphaBoost: requireNumber(args, "border-alpha-boost", 1.3),
      dotJitter: requireNumber(args, "dot-jitter", 0.25),
    };
    canvas = generateGridFramePoster(options);
    summary = `grid-frame, ${options.gridCols}x${options.gridRows}, seed ${options.seed}`;
  } else {
    const options = {
      ...shared,
      // Defaults are the dark-theme pair (see WorkBackdrop.jsx's
      // BACKDROP_TUNING); the light poster passes 0.16 / 0.14 explicitly.
      gradientOuter: requireNumber(args, "gradient-outer", 1.1),
      gradientMix: requireNumber(args, "gradient-mix", 0.34),
      blobX: requireNumber(args, "blob-x", 0),
      blobRadius: requireNumber(args, "blob-radius", 0.85),
      blobAlpha: requireNumber(args, "blob-alpha", 0.24),
    };
    canvas = generateRadialGlowPoster(options);
    summary = `radial-glow, blob-x ${options.blobX}`;
  }

  const png = encodePng(canvas);
  writeFileSync(out, png);
  console.log(`Wrote ${out} (${shared.width}x${shared.height}, ${summary})`);
}

main();

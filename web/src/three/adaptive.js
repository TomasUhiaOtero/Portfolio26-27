/**
 * The single source of truth for how much WebGL work any scene in this
 * project is allowed to do. Every particle/segment/instance count lives
 * here — no scene hardcodes its own — so tuning the budget for a slow
 * device only ever means editing this file.
 *
 * Pure function, no DOM reads: callers pass in `window.innerWidth` and
 * `navigator.deviceMemory` themselves. That keeps this testable without a
 * browser and keeps every scene's sizing decision in one auditable place.
 */

const PHONE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1280;

// `stagePoints`: the fixed vertex count for `ServiceStage.jsx`'s single
// morphing-points geometry (Task 11). Every one of its four states is a
// pure function of this one count (see `serviceShapes.js`) — it has to
// live here rather than as a local constant so a slow device gets a
// smaller shape the same way it gets fewer hero particles or a smaller
// TechCore capacity, and so no scene ever hardcodes its own per-device
// number (see this file's own docblock).
// Particle counts feed an O(n²) neighbour search every other frame in
// HeroField — kept deliberately modest so a mid-range GPU holds 60fps
// with the CSS aurora compositing behind it. dpr ceilings stay at 1.5:
// WebGL fill cost scales with dpr², and a soft particle field gains
// almost nothing visible above 1.5×.
const PHONE_BUDGET = { particles: 70, stagePoints: 220, dpr: [1, 1.5] };
const TABLET_BUDGET = { particles: 120, stagePoints: 420, dpr: [1, 1.5] };
const DESKTOP_BUDGET = { particles: 170, stagePoints: 640, dpr: [1, 1.5] };

const LOW_MEMORY_THRESHOLD = 4;

// Matches `Canvas3D.jsx`'s own `DPR_STEP` (its `PerformanceMonitor` decline
// step). Duplicated rather than imported: `Canvas3D.jsx` pulls in
// `@react-three/fiber`/`three`, and this module is imported eagerly by
// `LazyCanvas.jsx` — outside the lazy boundary that keeps that whole stack
// out of the initial bundle (see `LazyCanvas.jsx`'s own docblock). Importing
// `Canvas3D.jsx` from here would defeat that split.
const DPR_STEP = 0.25;

const DISABLED_BUDGET = { particles: 0, stagePoints: 0, dpr: [1, 1], backdropDpr: [1, 1], enabled: false };

export function getBudget({ width, deviceMemory, reduced }) {
  if (reduced) return DISABLED_BUDGET;

  const tier =
    width < PHONE_BREAKPOINT
      ? PHONE_BUDGET
      : width < TABLET_BREAKPOINT
        ? TABLET_BUDGET
        : DESKTOP_BUDGET;

  // `undefined <= 4` is `false`, so a device that never reports
  // `navigator.deviceMemory` (Safari, Firefox) gets the full tier budget
  // rather than being penalised for missing data.
  const isLowMemory = deviceMemory <= LOW_MEMORY_THRESHOLD;
  const particles = isLowMemory ? Math.round(tier.particles / 2) : tier.particles;
  const stagePoints = isLowMemory ? Math.round(tier.stagePoints / 2) : tier.stagePoints;

  // `backdropDpr`: Task 15's `WorkBackdrop` is a full-bleed fragment-shader
  // backdrop, not a particle field — softness there costs nothing visually
  // (the brief's own words), so it renders one DPR step below whatever tier
  // the hero (and every other scene) uses, via `LazyCanvas`'s
  // `dprVariant="backdrop"`. `Math.max(tier.dpr[0], ...)` keeps the floor
  // from ever dropping below the tier's own minimum.
  const backdropDpr = [tier.dpr[0], Math.max(tier.dpr[0], tier.dpr[1] - DPR_STEP)];

  return { particles, stagePoints, dpr: tier.dpr, backdropDpr, enabled: true };
}

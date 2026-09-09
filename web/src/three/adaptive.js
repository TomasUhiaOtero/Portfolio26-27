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

const PHONE_BUDGET = { particles: 90, dpr: [1, 1.5] };
const TABLET_BUDGET = { particles: 160, dpr: [1, 1.75] };
const DESKTOP_BUDGET = { particles: 260, dpr: [1, 2] };

const LOW_MEMORY_THRESHOLD = 4;

const DISABLED_BUDGET = { particles: 0, dpr: [1, 1], enabled: false };

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

  return { particles, dpr: tier.dpr, enabled: true };
}

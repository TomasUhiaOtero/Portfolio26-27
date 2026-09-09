/**
 * Pure logic for the services section's panel-to-`activeService` mapping.
 * Kept out of Services.jsx so the direction-agnostic part — the actual
 * hazard on this pattern — is testable without mounting GSAP/ScrollTrigger.
 * See aboutScroll.js for the precedent this file follows.
 *
 * Each panel gets its own `ScrollTrigger` at `start: "top 60%"` (no
 * explicit `end`, so it defaults to "bottom top" — the panel's own bottom
 * reaching the viewport's top, far below its start). That default `end` is
 * too far away to usefully mark "scrolled back up past this panel", so the
 * reverse direction is handled with its own callback instead of relying on
 * the far boundary:
 *
 * - Scrolling down, panel `index`'s trigger crosses its start → `onEnter`
 *   → this panel becomes active. `onEnterIndex` is the identity — kept as
 *   a named export so Services.jsx never inlines the mapping and so this
 *   file is the one place that states it.
 * - Scrolling up, panel `index`'s trigger crosses back out of its own
 *   start (`onLeaveBack`) → the panel *above* it (`index - 1`) is now the
 *   one in view, clamped at 0 so panel 0 leaving backward has nowhere
 *   lower to go.
 */

export function onEnterIndex(index) {
  return index;
}

export function onLeaveBackIndex(index) {
  return Math.max(0, index - 1);
}

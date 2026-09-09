/**
 * Pure scroll-progress math for the About section's pinned sequence.
 * Kept out of About.jsx so it is testable without mounting GSAP/ScrollTrigger
 * or faking a layout — see three/adaptive.js for the precedent this file
 * follows (a single auditable place for a scroll/viewport decision, plain
 * function in, plain value out, no DOM reads).
 *
 * `progress` throughout this module is assumed to be ScrollTrigger's own
 * `self.progress`, which is always within [0, 1] by construction (a scrub
 * ScrollTrigger clamps at both ends) — neither function defends against an
 * out-of-range input below 0.
 */

export const STAGE_COUNT = 4;

/**
 * Maps the pinned section's overall scroll progress (0–1) to the technology
 * group currently on screen (0–3, one of Frontend/Backend/Data/Tooling).
 *
 * `Math.floor(progress * STAGE_COUNT)` alone reaches STAGE_COUNT (4) at
 * `progress === 1` — one past the last valid index (0–3) — because
 * `Math.floor(1.0 * 4)` is exactly `4`, not `3.999...`. The `Math.min` clamp
 * exists solely for that one boundary: without it, scrolling all the way to
 * the end of the pin would ask for `stack.groups[4]`, which does not exist.
 */
export function progressToStage(progress) {
  return Math.min(STAGE_COUNT - 1, Math.floor(progress * STAGE_COUNT));
}

/** How far through the pin the paragraphs finish revealing — the remaining
 * (1 - PARAGRAPH_REVEAL_END) of the scroll is left for the technology
 * groups to cross-fade through, uncontested by paragraph motion. */
export const PARAGRAPH_REVEAL_END = 0.3;

/**
 * A single paragraph's own local reveal progress (0–1), given its index
 * among `total` paragraphs sharing the `[0, rangeEnd]` slice of the overall
 * scroll progress. Each paragraph gets an equal, non-overlapping slice
 * within that range, and its local progress is clamped to [0, 1] so it
 * holds at fully-revealed once the playhead has moved past its own slice
 * (rather than reporting >1) and at fully-hidden before the playhead has
 * reached it (rather than reporting negative).
 */
export function paragraphProgress(index, total, progress, rangeEnd = PARAGRAPH_REVEAL_END) {
  const sliceWidth = rangeEnd / total;
  const sliceStart = index * sliceWidth;
  const local = (progress - sliceStart) / sliceWidth;
  return Math.min(1, Math.max(0, local));
}

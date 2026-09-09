/**
 * Pure logic for the Experience timeline's alternating-card layout.
 * Kept out of Experience.jsx so the direction-agnostic part — the actual
 * hazard on this pattern (see Experience.jsx's Effect C doc comment) — is
 * testable without mounting GSAP/ScrollTrigger or faking a layout. See
 * aboutScroll.js and servicesScroll.js for the precedent this file follows.
 *
 * `cardIndex` here counts only the cards that actually alternate sides —
 * the two `experience.items` followed by the two `experience.education`
 * entries, in that render order. The divider node (carrying
 * `educationTitle`) is not a card and never appears in this numbering.
 */

/** How far, in pixels, a card travels during its entrance. */
export const ENTER_DISTANCE = 40;

/**
 * Which side of the centered rail a card sits on at `lg` and above.
 * Even indices sit left, odd indices sit right — the two `items` cards
 * alternate, then the two `education` cards continue the same alternation
 * rather than each restarting at "left".
 */
export function cardSide(cardIndex) {
  return cardIndex % 2 === 0 ? "left" : "right";
}

/**
 * The horizontal offset (px) a card starts its entrance from, signed so a
 * `gsap.to(..., { x: 0 })` always ends at rest regardless of side.
 *
 * At `lg` and above, a card enters from its own side: a left card starts
 * to the left of rest (negative), a right card starts to the right
 * (positive). Below `lg` the rail sits at the left edge and every card —
 * regardless of which side it would occupy on desktop — enters from the
 * right (positive), because there is no "left side" to enter from once
 * the rail itself has moved there.
 *
 * This is the one piece of the pattern's third hazard that has a right
 * answer independent of any DOM/ScrollTrigger state: which sign applies
 * to which card at which breakpoint. Experience.jsx still gates *when*
 * this runs behind `gsap.matchMedia`, but the sign itself is decided here
 * so it can be asserted directly instead of read back off a live tween.
 */
export function entranceOffsetX(cardIndex, isDesktop) {
  if (!isDesktop) return ENTER_DISTANCE;
  return cardSide(cardIndex) === "left" ? -ENTER_DISTANCE : ENTER_DISTANCE;
}

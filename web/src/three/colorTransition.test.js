import { describe, it, expect } from "vitest";
import { Color } from "three";
import {
  makeColorTransition,
  startColorTransition,
  tickColorTransition,
  isColorTransitionActive,
} from "./colorTransition.js";

// The theme lerp is the one part of HeroField that can't be exercised by
// scrolling a real browser in CI (or, as it turned out while building
// this, even in the interactive browser harness — its automated tab
// reported itself permanently hidden, which pauses the render loop these
// functions run inside). Testing the interpolation math directly proves
// the *cause* — the numbers move correctly over time — without depending
// on a live requestAnimationFrame loop to *observe* the effect.

const BLUE = new Color("#0000ff");
const RED = new Color("#ff0000");

describe("colorTransition", () => {
  it("starts a fresh transition already at its resting colour", () => {
    const transition = makeColorTransition(BLUE);
    expect(tickColorTransition(transition, 0).getHex()).toBe(BLUE.getHex());
  });

  it("holds the old colour at the instant a transition starts", () => {
    const transition = makeColorTransition(BLUE);
    startColorTransition(transition, RED, 1000);
    expect(tickColorTransition(transition, 1000).getHex()).toBe(BLUE.getHex());
  });

  it("reaches the target colour once the lerp duration has elapsed", () => {
    const transition = makeColorTransition(BLUE);
    startColorTransition(transition, RED, 1000);
    expect(tickColorTransition(transition, 1400).getHex()).toBe(RED.getHex());
  });

  it("is partway between the two colours mid-transition, not snapped", () => {
    const transition = makeColorTransition(BLUE);
    startColorTransition(transition, RED, 1000);
    const mid = tickColorTransition(transition, 1200).clone();
    expect(mid.getHex()).not.toBe(BLUE.getHex());
    expect(mid.getHex()).not.toBe(RED.getHex());
    // Halfway through a lerp from blue to red, red should be rising and
    // blue falling — a genuine interpolation, not a jump.
    expect(mid.r).toBeGreaterThan(0);
    expect(mid.r).toBeLessThan(1);
    expect(mid.b).toBeGreaterThan(0);
    expect(mid.b).toBeLessThan(1);
  });

  it("clamps at the target rather than overshooting past the duration", () => {
    const transition = makeColorTransition(BLUE);
    startColorTransition(transition, RED, 1000);
    expect(tickColorTransition(transition, 5000).getHex()).toBe(RED.getHex());
  });

  it("reports a fresh (never-started) transition as inactive", () => {
    const transition = makeColorTransition(BLUE);
    expect(isColorTransitionActive(transition, 1000)).toBe(false);
  });

  it("reports a transition as active from the instant it starts until the duration elapses", () => {
    const transition = makeColorTransition(BLUE);
    startColorTransition(transition, RED, 1000);
    expect(isColorTransitionActive(transition, 1000)).toBe(true);
    expect(isColorTransitionActive(transition, 1399)).toBe(true);
    expect(isColorTransitionActive(transition, 1400)).toBe(false); // COLOR_LERP_MS reached
    expect(isColorTransitionActive(transition, 5000)).toBe(false);
  });

  it("agrees with tickColorTransition on when the lerp is done", () => {
    const transition = makeColorTransition(BLUE);
    startColorTransition(transition, RED, 1000);
    // Still active → colour is not yet the target.
    expect(isColorTransitionActive(transition, 1200)).toBe(true);
    expect(tickColorTransition(transition, 1200).getHex()).not.toBe(RED.getHex());
    // No longer active → colour has landed on the target.
    expect(isColorTransitionActive(transition, 1400)).toBe(false);
    expect(tickColorTransition(transition, 1400).getHex()).toBe(RED.getHex());
  });

  it("a second transition starts from wherever the first one currently is", () => {
    const transition = makeColorTransition(BLUE);
    startColorTransition(transition, RED, 0);
    tickColorTransition(transition, 200); // 50% toward red
    const midway = transition.current.clone();

    const GREEN = new Color("#00ff00");
    startColorTransition(transition, GREEN, 200);
    // The very next tick should start from `midway`, not snap back to blue.
    expect(tickColorTransition(transition, 200).getHex()).toBe(midway.getHex());
  });
});

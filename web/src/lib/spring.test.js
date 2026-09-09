import { describe, it, expect } from "vitest";
import { createSpring } from "./spring.js";

const settle = (s) => {
  for (let i = 0; i < 600 && !s.isSettled(); i += 1) s.step(1 / 60);
  return s;
};

describe("createSpring", () => {
  it("converges on its target", () => {
    const s = createSpring({ stiffness: 120, damping: 20, mass: 1 });
    s.set(0);
    s.target(4);
    settle(s);
    expect(s.step(1 / 60)).toBeCloseTo(4, 2);
  });

  it("reports settled only once it has arrived", () => {
    const s = createSpring({ stiffness: 120, damping: 20, mass: 1 });
    s.set(0);
    s.target(4);
    expect(s.isSettled()).toBe(false);
    settle(s);
    expect(s.isSettled()).toBe(true);
  });

  it("does not oscillate when critically damped", () => {
    const s = createSpring({ stiffness: 100, damping: 20, mass: 1 });
    s.set(0);
    s.target(1);
    let previous = 0;
    for (let i = 0; i < 200; i += 1) {
      const v = s.step(1 / 60);
      expect(v).toBeGreaterThanOrEqual(previous - 1e-6);
      previous = v;
    }
  });

  it("clamps an absurd frame delta instead of exploding", () => {
    const s = createSpring({ stiffness: 120, damping: 20, mass: 1 });
    s.set(0);
    s.target(1);
    expect(Number.isFinite(s.step(5))).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { stepParticles } from "./particleText.js";

function particle(overrides = {}) {
  return { hx: 100, hy: 50, x: 100, y: 50, vx: 0, vy: 0, ...overrides };
}

const PARAMS = { px: -9999, py: -9999, radius: 90, repel: 2.2, friction: 0.86, ret: 0.12 };

describe("stepParticles", () => {
  it("leaves a settled particle at its home slot when the pointer is far away", () => {
    const p = particle();
    stepParticles([p], PARAMS);
    expect(p.x).toBeCloseTo(100);
    expect(p.y).toBeCloseTo(50);
  });

  it("eases a displaced particle back toward its home slot", () => {
    const p = particle({ x: 140, y: 50 });
    for (let i = 0; i < 60; i += 1) stepParticles([p], PARAMS);
    expect(Math.abs(p.x - p.hx)).toBeLessThan(1);
    expect(Math.abs(p.y - p.hy)).toBeLessThan(1);
  });

  it("pushes a particle away from a nearby pointer", () => {
    const p = particle();
    stepParticles([p], { ...PARAMS, px: 80, py: 50 });
    expect(p.x).toBeGreaterThan(100);
    expect(p.vx).toBeGreaterThan(0);
  });

  it("does not disturb a particle outside the influence radius", () => {
    const p = particle();
    stepParticles([p], { ...PARAMS, px: 100 + 200, py: 50 });
    expect(p.x).toBeCloseTo(100);
    expect(p.vx).toBeCloseTo(0);
  });

  it("damps velocity so a shove decays rather than growing", () => {
    const p = particle({ vx: 10, vy: 0 });
    const speeds = [];
    for (let i = 0; i < 5; i += 1) {
      stepParticles([p], PARAMS);
      speeds.push(Math.abs(p.vx));
    }
    for (let i = 1; i < speeds.length; i += 1) {
      expect(speeds[i]).toBeLessThan(speeds[i - 1]);
    }
  });

  it("adds a tangential component when swirl is set", () => {
    // Pointer directly left of the particle: a pure radial push moves it
    // only on x; swirl introduces motion on y too.
    const straight = particle();
    stepParticles([straight], { ...PARAMS, px: 70, py: 50 });
    expect(Math.abs(straight.vy)).toBeLessThan(1e-9);

    const swirled = particle();
    stepParticles([swirled], { ...PARAMS, px: 70, py: 50, swirl: 0.5 });
    expect(Math.abs(swirled.vy)).toBeGreaterThan(0);
  });
});

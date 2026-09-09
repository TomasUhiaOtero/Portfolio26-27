import { describe, it, expect } from "vitest";
import { nodeAngle, orbitPosition, instanceVisibility, nodeCountForStage } from "./orbit.js";

describe("nodeAngle", () => {
  it("spreads capacity slots evenly around a full turn at elapsed 0", () => {
    const capacity = 4;
    const angles = [0, 1, 2, 3].map((i) => nodeAngle(i, capacity, 0, 0));
    expect(angles).toEqual([0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]);
  });

  it("advances every slot by the same amount as elapsed time passes", () => {
    const speed = 0.5;
    const elapsed = 2;
    const before = nodeAngle(1, 4, 0, speed);
    const after = nodeAngle(1, 4, elapsed, speed);
    expect(after - before).toBeCloseTo(elapsed * speed);
  });

  it("never divides by zero for an empty ring", () => {
    expect(nodeAngle(0, 0, 5, 1)).toBe(5); // base is 0, only the time term remains
  });
});

describe("orbitPosition", () => {
  it("is a flat circle in XZ when inclination is 0", () => {
    const [x, y, z] = orbitPosition({ radius: 2, inclination: 0, angle: 0 });
    expect(x).toBeCloseTo(2);
    expect(y).toBeCloseTo(0);
    expect(z).toBeCloseTo(0);
  });

  it("stays on the flat circle a quarter turn later", () => {
    const [x, y, z] = orbitPosition({ radius: 2, inclination: 0, angle: Math.PI / 2 });
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(0);
    expect(z).toBeCloseTo(2);
  });

  it("lifts off the flat plane once inclination is nonzero", () => {
    const [, y] = orbitPosition({ radius: 2, inclination: Math.PI / 4, angle: Math.PI / 2 });
    expect(y).not.toBeCloseTo(0);
  });

  it("stays at radius distance from the origin regardless of inclination", () => {
    const [x, y, z] = orbitPosition({ radius: 3, inclination: 0.7, angle: 1.1 });
    expect(Math.hypot(x, y, z)).toBeCloseTo(3);
  });
});

describe("instanceVisibility", () => {
  it("is fully visible for every index below a whole-number count", () => {
    expect(instanceVisibility(0, 4)).toBe(1);
    expect(instanceVisibility(3, 4)).toBe(1);
  });

  it("is fully hidden for every index at or beyond the count", () => {
    expect(instanceVisibility(4, 4)).toBe(0);
    expect(instanceVisibility(5, 4)).toBe(0);
  });

  it("is fractional for the single index straddling a mid-tween count", () => {
    expect(instanceVisibility(4, 4.5)).toBeCloseTo(0.5);
  });

  it("clamps rather than reporting negative or greater than 1", () => {
    expect(instanceVisibility(0, -3)).toBe(0);
    expect(instanceVisibility(0, 99)).toBe(1);
  });
});

describe("nodeCountForStage", () => {
  const groups = [
    { title: "Frontend", items: ["a", "b", "c"] },
    { title: "Backend", items: ["a", "b"] },
  ];

  it("matches the exact item count of the addressed stage's group", () => {
    expect(nodeCountForStage(0, groups)).toBe(3);
    expect(nodeCountForStage(1, groups)).toBe(2);
  });

  it("follows a content edit with no code change: a longer items array yields a bigger count", () => {
    const edited = [{ title: "Frontend", items: ["a", "b", "c", "d", "e"] }];
    expect(nodeCountForStage(0, edited)).toBe(5);
  });

  it("resolves an out-of-range stage to 0 instead of throwing", () => {
    expect(nodeCountForStage(5, groups)).toBe(0);
  });
});

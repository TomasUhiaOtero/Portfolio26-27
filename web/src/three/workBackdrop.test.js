import { describe, it, expect } from "vitest";
import { blobPosition } from "./workBackdrop.js";

describe("blobPosition", () => {
  it("sits at centre when the index lands exactly on a card", () => {
    expect(blobPosition(0, 8)).toBeCloseTo(0);
    expect(blobPosition(8, 8)).toBeCloseTo(0); // one full lap
  });

  it("sits at the right edge a quarter-lap in", () => {
    expect(blobPosition(2, 8)).toBeCloseTo(1);
  });

  it("sits at the left edge three-quarters of a lap in", () => {
    expect(blobPosition(6, 8)).toBeCloseTo(-1);
  });

  it("is continuous across the wrap from the last card back to the first", () => {
    const justBefore = blobPosition(-0.001, 8);
    const justAfter = blobPosition(7.999, 8);
    expect(justBefore).toBeCloseTo(justAfter, 5);
  });

  it("handles negative indices the same way wrapIndex does", () => {
    expect(blobPosition(-2, 8)).toBeCloseTo(blobPosition(6, 8));
  });

  it("stays within [-1, 1] for an arbitrary continuous index", () => {
    for (const index of [0.3, 1.7, 4.999, -5.5, 12.25]) {
      const value = blobPosition(index, 8);
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it("returns 0 for a non-positive length rather than dividing by zero", () => {
    expect(blobPosition(3, 0)).toBe(0);
    expect(blobPosition(3, -1)).toBe(0);
  });
});

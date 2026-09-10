import { describe, it, expect } from "vitest";
import { wrapIndex, cardTransform } from "./carousel.js";

describe("wrapIndex", () => {
  it("leaves an in-range index alone", () => {
    expect(wrapIndex(3, 8)).toBe(3);
  });

  it("wraps past the end", () => {
    expect(wrapIndex(9, 8)).toBe(1);
  });

  it("wraps below zero instead of returning a negative", () => {
    expect(wrapIndex(-1, 8)).toBe(7);
    expect(wrapIndex(-9, 8)).toBe(7);
  });
});

describe("cardTransform", () => {
  const opts = { step: 26, radius: 560 };

  it("leaves the focused card unrotated, unscaled and at full brightness", () => {
    const t = cardTransform(0, opts);
    expect(t.dim).toBe(1);
    expect(t.transform).toContain("rotateY(0deg)");
    expect(t.transform).toContain("scale(1)");
  });

  it("rotates, pushes back and dims a neighbour — but never makes it translucent", () => {
    const t = cardTransform(1, opts);
    expect(t.transform).toContain("rotateY(26deg)");
    expect(t.transform).toMatch(/scale\(0\.\d+\)/);
    expect(t.dim).toBeGreaterThan(0);
    expect(t.dim).toBeLessThan(1);
    expect(t).not.toHaveProperty("opacity");
    expect(t).not.toHaveProperty("blur");
  });

  it("is symmetric in dim and depth for equal distances", () => {
    const left = cardTransform(-2, opts);
    const right = cardTransform(2, opts);
    expect(left.dim).toBe(right.dim);
    // Same translateZ and scale on both sides; only the rotateY sign differs.
    expect(left.transform.replace("rotateY(-52deg)", "")).toBe(
      right.transform.replace("rotateY(52deg)", ""),
    );
  });

  it("hides cards beyond the third ring so they are never painted", () => {
    expect(cardTransform(3, opts).hidden).toBe(true);
    expect(cardTransform(-3, opts).hidden).toBe(true);
    expect(cardTransform(2, opts).hidden).toBe(false);
  });
});

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

  it("leaves the focused card unrotated and fully opaque", () => {
    const t = cardTransform(0, opts);
    expect(t.opacity).toBe(1);
    expect(t.blur).toBe(0);
    expect(t.transform).toContain("rotateY(0deg)");
  });

  it("rotates and dims a neighbour", () => {
    const t = cardTransform(1, opts);
    expect(t.transform).toContain("rotateY(26deg)");
    expect(t.opacity).toBeLessThan(1);
    expect(t.blur).toBeGreaterThan(0);
  });

  it("is symmetric in opacity for equal distances", () => {
    expect(cardTransform(-2, opts).opacity).toBe(cardTransform(2, opts).opacity);
  });

  it("hides cards beyond the third ring so they are never painted", () => {
    expect(cardTransform(3, opts).hidden).toBe(true);
    expect(cardTransform(-3, opts).hidden).toBe(true);
    expect(cardTransform(2, opts).hidden).toBe(false);
  });
});

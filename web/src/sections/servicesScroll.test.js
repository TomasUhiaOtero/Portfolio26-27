import { describe, it, expect } from "vitest";
import { onEnterIndex, onLeaveBackIndex } from "./servicesScroll.js";

describe("onEnterIndex", () => {
  it("activates the panel that was just entered scrolling down", () => {
    expect(onEnterIndex(0)).toBe(0);
    expect(onEnterIndex(1)).toBe(1);
    expect(onEnterIndex(2)).toBe(2);
    expect(onEnterIndex(3)).toBe(3);
  });
});

describe("onLeaveBackIndex", () => {
  it("activates the previous panel when scrolling back up out of this one", () => {
    expect(onLeaveBackIndex(1)).toBe(0);
    expect(onLeaveBackIndex(2)).toBe(1);
    expect(onLeaveBackIndex(3)).toBe(2);
  });

  // The hazard this whole module exists to avoid: without this clamp,
  // scrolling up out of the very first panel would ask for panel -1.
  it("clamps panel 0 leaving backward to itself instead of going negative", () => {
    expect(onLeaveBackIndex(0)).toBe(0);
  });
});

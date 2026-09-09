import { describe, it, expect } from "vitest";
import { cardSide, entranceOffsetX, ENTER_DISTANCE } from "./experienceScroll.js";

describe("cardSide", () => {
  it("alternates left/right starting at left, continuing across items into education", () => {
    // Cards 0-1 are the two `items`, cards 2-3 are the two `education`
    // entries — the alternation must not reset to "left" when education
    // starts, or two adjacent cards would both land on the same side.
    expect(cardSide(0)).toBe("left");
    expect(cardSide(1)).toBe("right");
    expect(cardSide(2)).toBe("left");
    expect(cardSide(3)).toBe("right");
  });
});

describe("entranceOffsetX", () => {
  it("enters from its own side at lg and above: left cards from the left, right cards from the right", () => {
    expect(entranceOffsetX(0, true)).toBe(-ENTER_DISTANCE);
    expect(entranceOffsetX(1, true)).toBe(ENTER_DISTANCE);
    expect(entranceOffsetX(2, true)).toBe(-ENTER_DISTANCE);
    expect(entranceOffsetX(3, true)).toBe(ENTER_DISTANCE);
  });

  // The hazard this module exists to avoid: below `lg` the rail moves to
  // the left edge, so a card that would be a "left" card on desktop has
  // no left side left to enter from. Every card, regardless of its
  // desktop side, must enter from the right below `lg`.
  it("enters from the right for every card below lg, regardless of its desktop side", () => {
    expect(entranceOffsetX(0, false)).toBe(ENTER_DISTANCE);
    expect(entranceOffsetX(1, false)).toBe(ENTER_DISTANCE);
    expect(entranceOffsetX(2, false)).toBe(ENTER_DISTANCE);
    expect(entranceOffsetX(3, false)).toBe(ENTER_DISTANCE);
  });
});

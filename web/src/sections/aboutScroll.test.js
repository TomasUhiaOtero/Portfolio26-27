import { describe, it, expect } from "vitest";
import { progressToStage, paragraphProgress, STAGE_COUNT, PARAGRAPH_REVEAL_END } from "./aboutScroll.js";

describe("progressToStage", () => {
  it("is stage 0 for the first quarter, including its start", () => {
    expect(progressToStage(0)).toBe(0);
    expect(progressToStage(0.1)).toBe(0);
    expect(progressToStage(0.24)).toBe(0);
  });

  it("steps to the next stage at each quarter boundary", () => {
    expect(progressToStage(0.25)).toBe(1);
    expect(progressToStage(0.4)).toBe(1);
    expect(progressToStage(0.5)).toBe(2);
    expect(progressToStage(0.6)).toBe(2);
    expect(progressToStage(0.75)).toBe(3);
    expect(progressToStage(0.9)).toBe(3);
  });

  // The whole reason the clamp exists: Math.floor(1.0 * 4) is 4, one past
  // the last valid group index. Without Math.min, this would try to render
  // stack.groups[4], which does not exist.
  it("clamps progress === 1 to the last stage instead of overflowing to 4", () => {
    expect(progressToStage(1)).toBe(3);
    expect(Math.floor(1 * STAGE_COUNT)).toBe(4); // the unclamped value, for the record
  });

  it("never returns a stage outside 0..3 across the full range", () => {
    for (let p = 0; p <= 1; p += 0.01) {
      const stage = progressToStage(p);
      expect(stage).toBeGreaterThanOrEqual(0);
      expect(stage).toBeLessThanOrEqual(3);
    }
  });
});

describe("paragraphProgress", () => {
  const TOTAL = 3;

  it("is 0 before a paragraph's slice starts", () => {
    // Paragraph 1 (index 1 of 3) owns roughly [0.1, 0.2] of the default
    // 0.3 reveal range — untouched at progress 0.
    expect(paragraphProgress(1, TOTAL, 0)).toBe(0);
  });

  it("is 1 once the playhead has passed a paragraph's slice", () => {
    expect(paragraphProgress(0, TOTAL, 1)).toBe(1);
  });

  it("reaches exactly 1 at its own slice's end and holds there afterwards", () => {
    const sliceWidth = PARAGRAPH_REVEAL_END / TOTAL;
    expect(paragraphProgress(0, TOTAL, sliceWidth)).toBe(1);
    expect(paragraphProgress(0, TOTAL, sliceWidth + 0.2)).toBe(1);
  });

  it("interpolates linearly within its own slice", () => {
    const sliceWidth = PARAGRAPH_REVEAL_END / TOTAL;
    expect(paragraphProgress(0, TOTAL, sliceWidth / 2)).toBeCloseTo(0.5);
  });

  it("gives each paragraph a distinct, non-overlapping slice in order", () => {
    const sliceWidth = PARAGRAPH_REVEAL_END / TOTAL;
    const midOfFirst = sliceWidth / 2;
    // While paragraph 0 is mid-reveal, paragraph 1 has not started yet.
    expect(paragraphProgress(0, TOTAL, midOfFirst)).toBeCloseTo(0.5);
    expect(paragraphProgress(1, TOTAL, midOfFirst)).toBe(0);
  });

  it("clamps to [0, 1] rather than reporting negative or >1", () => {
    expect(paragraphProgress(2, TOTAL, 0)).toBe(0);
    expect(paragraphProgress(0, TOTAL, 1)).toBe(1);
  });
});

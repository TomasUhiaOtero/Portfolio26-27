import { describe, it, expect } from "vitest";
import { findNeighbourPairs, nextFramePairParity, isNeighbourRebuildFrame } from "./neighbourLines.js";

// This is hazard 3 from the task brief — "the frame budget" for the whole
// scene — extracted so its two load-bearing properties (no sqrt in the hot
// path, a hard segment cap) are provable without a live WebGL frame loop.

describe("findNeighbourPairs", () => {
  it("includes a pair within the link distance and excludes one beyond it", () => {
    // Particle 0-1 are 0.5 apart (within a link distance of 1); 0-2 are 5
    // apart (well outside it).
    const positions = new Float32Array([
      0, 0, 0,
      0.5, 0, 0,
      5, 0, 0,
    ]);
    const output = new Float32Array(3 * 6);

    const segmentCount = findNeighbourPairs({
      positions,
      particleCount: 3,
      linkDistanceSq: 1 * 1,
      maxSegments: 10,
      output,
    });

    expect(segmentCount).toBe(1);
    expect(Array.from(output.slice(0, 6))).toEqual([0, 0, 0, 0.5, 0, 0]);
  });

  it("never writes more segments than maxSegments, even when every pair qualifies", () => {
    // 6 coincident particles: every one of the C(6,2) = 15 pairs is within
    // range, so this only passes if the cap actually stops the scan.
    const particleCount = 6;
    const positions = new Float32Array(particleCount * 3); // all zeros
    const maxSegments = 4;
    const output = new Float32Array(maxSegments * 6);

    const segmentCount = findNeighbourPairs({
      positions,
      particleCount,
      linkDistanceSq: 1,
      maxSegments,
      output,
    });

    expect(segmentCount).toBe(maxSegments);
  });

  it("never calls Math.sqrt in the hot path", () => {
    // Structural, not behavioural: this fails the moment someone "fixes"
    // the distance check back to a real distance instead of a squared one.
    expect(findNeighbourPairs.toString()).not.toMatch(/sqrt/i);
  });
});

describe("frame parity", () => {
  it("genuinely alternates, skipping the rebuild on every other frame", () => {
    let parity = 0;
    const rebuilds = [];
    for (let i = 0; i < 6; i++) {
      parity = nextFramePairParity(parity);
      rebuilds.push(isNeighbourRebuildFrame(parity));
    }
    expect(rebuilds).toEqual([false, true, false, true, false, true]);
  });
});

import { describe, it, expect } from "vitest";
import {
  gridLayout,
  gridCoordinate,
  monitorPositions,
  androidPositions,
  scatteredPositions,
  ringsPositions,
  mixPositions,
  SCATTER_NOISE_RADIUS,
} from "./serviceShapes.js";

const STATE_GENERATORS = {
  monitor: monitorPositions,
  android: androidPositions,
  scattered: scatteredPositions,
  rings: ringsPositions,
};

const SAMPLE_COUNTS = [1, 2, 5, 64, 220, 640];

function expectAllFinite(array) {
  for (let i = 0; i < array.length; i += 1) {
    expect(Number.isFinite(array[i])).toBe(true);
  }
}

describe("every state generator", () => {
  for (const [name, generate] of Object.entries(STATE_GENERATORS)) {
    describe(name, () => {
      it.each(SAMPLE_COUNTS)("produces exactly count * 3 values for count %i", (count) => {
        expect(generate(count)).toHaveLength(count * 3);
      });

      it("never produces NaN or Infinity", () => {
        expectAllFinite(generate(220));
      });

      it("is a pure function of count: calling it twice reproduces the same array", () => {
        const first = generate(64);
        const second = generate(64);
        expect(Array.from(second)).toEqual(Array.from(first));
      });
    });
  }
});

describe("gridLayout", () => {
  it("produces enough slots to cover every vertex", () => {
    for (const count of SAMPLE_COUNTS) {
      const { cols, rows } = gridLayout(count);
      expect(cols * rows).toBeGreaterThanOrEqual(count);
    }
  });

  it("never returns a zero dimension, even for a tiny count", () => {
    const { cols, rows } = gridLayout(1);
    expect(cols).toBeGreaterThan(0);
    expect(rows).toBeGreaterThan(0);
  });
});

describe("gridCoordinate", () => {
  it("keeps every coordinate inside [0, 1]", () => {
    const count = 220;
    for (let i = 0; i < count; i += 1) {
      const { u, v } = gridCoordinate(i, count);
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThanOrEqual(1);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

// The monitor and android states are now distinct icon silhouettes, not
// a shared grid rescale, so there is no cross-state correspondence to
// assert beyond equal length (covered above). What each *should* do is
// stay inside a sane bounding box — points that fly off make the morph
// read as an explosion rather than a shape change.
describe("monitor + android silhouettes", () => {
  it("keep every point within a modest bounding box", () => {
    for (const generate of [monitorPositions, androidPositions]) {
      const p = generate(640);
      for (let i = 0; i < p.length; i += 1) {
        expect(Math.abs(p[i])).toBeLessThan(2.2);
      }
    }
  });

  it("monitor puts its stand below its screen", () => {
    const p = monitorPositions(640);
    const ys = [];
    for (let i = 1; i < p.length; i += 3) ys.push(p[i]);
    // The lowest points (the foot) sit well below the vertical centre.
    expect(Math.min(...ys)).toBeLessThan(-0.4);
    expect(Math.max(...ys)).toBeGreaterThan(0.4);
  });

  it("android is taller than it is wide (a standing figure)", () => {
    const p = androidPositions(640);
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < p.length; i += 3) {
      minX = Math.min(minX, p[i]);
      maxX = Math.max(maxX, p[i]);
      minY = Math.min(minY, p[i + 1]);
      maxY = Math.max(maxY, p[i + 1]);
    }
    expect(maxY - minY).toBeGreaterThan(maxX - minX);
  });
});

// The brief's table also describes "ia" (scattered) settling into "api-db"
// (rings) as a direct morph, in both directions. `scatteredPositions` is
// built as `ringsPositions` plus a bounded per-vertex offset, so this
// checks that relationship holds structurally rather than assuming the
// implementation: every vertex's scattered position must stay within
// `SCATTER_NOISE_RADIUS * sqrt(3)` of its own ring position, and the
// scatter must be a genuine perturbation (nonzero on average), not an
// unrelated distribution that happens to share a vertex count.
describe("scattered <-> rings correspondence", () => {
  it("keeps every scattered vertex within a bounded distance of its own ring position", () => {
    const count = 220;
    const rings = ringsPositions(count);
    const scattered = scatteredPositions(count);
    const maxAllowed = SCATTER_NOISE_RADIUS * Math.sqrt(3) + 1e-6;

    for (let i = 0; i < count; i += 1) {
      const dx = scattered[i * 3] - rings[i * 3];
      const dy = scattered[i * 3 + 1] - rings[i * 3 + 1];
      const dz = scattered[i * 3 + 2] - rings[i * 3 + 2];
      const distance = Math.hypot(dx, dy, dz);
      expect(distance).toBeLessThanOrEqual(maxAllowed);
    }
  });

  it("actually perturbs most vertices rather than leaving them identical", () => {
    const count = 220;
    const rings = ringsPositions(count);
    const scattered = scatteredPositions(count);

    let movedCount = 0;
    for (let i = 0; i < count; i += 1) {
      const dx = scattered[i * 3] - rings[i * 3];
      const dy = scattered[i * 3 + 1] - rings[i * 3 + 1];
      const dz = scattered[i * 3 + 2] - rings[i * 3 + 2];
      if (Math.hypot(dx, dy, dz) > 1e-3) movedCount += 1;
    }
    expect(movedCount).toBeGreaterThan(count * 0.9);
  });
});

describe("mixPositions", () => {
  it("returns the from array unchanged at t = 0", () => {
    const from = new Float32Array([1, 2, 3, 4]);
    const to = new Float32Array([5, 6, 7, 8]);
    expect(Array.from(mixPositions(from, to, 0))).toEqual([1, 2, 3, 4]);
  });

  it("returns the to array at t = 1", () => {
    const from = new Float32Array([1, 2, 3, 4]);
    const to = new Float32Array([5, 6, 7, 8]);
    expect(Array.from(mixPositions(from, to, 1))).toEqual([5, 6, 7, 8]);
  });

  it("returns the midpoint at t = 0.5", () => {
    const from = new Float32Array([0, 0, 0]);
    const to = new Float32Array([2, 4, 10]);
    const result = mixPositions(from, to, 0.5);
    expect(result[0]).toBeCloseTo(1);
    expect(result[1]).toBeCloseTo(2);
    expect(result[2]).toBeCloseTo(5);
  });

  it("writes safely in place when out === from", () => {
    const from = new Float32Array([0, 0, 0]);
    const to = new Float32Array([10, 20, 30]);
    mixPositions(from, to, 0.5, from);
    expect(Array.from(from)).toEqual([5, 10, 15]);
  });

  it("never produces NaN or Infinity for any t in [0, 1]", () => {
    const from = monitorPositions(64);
    const to = androidPositions(64);
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      expectAllFinite(mixPositions(from, to, t));
    }
  });
});

import { describe, it, expect } from "vitest";
import {
  sphereShape,
  cylinderShape,
  diamondShape,
  torusShape,
  mixPositions,
} from "./aboutShapes.js";

// A deterministic set of unit directions (a fibonacci sphere), standing in
// for the icosphere's own vertex directions that AboutStage feeds in.
function unitDirs(n) {
  const out = new Float32Array(n * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i += 1) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    out[i * 3] = Math.cos(theta) * r;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = Math.sin(theta) * r;
  }
  return out;
}

const GENERATORS = {
  sphere: sphereShape,
  cylinder: cylinderShape,
  diamond: diamondShape,
  torus: torusShape,
};
const DIRS = unitDirs(600);

function bounds(arr) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < arr.length; i += 3) {
    for (let a = 0; a < 3; a += 1) {
      min[a] = Math.min(min[a], arr[i + a]);
      max[a] = Math.max(max[a], arr[i + a]);
    }
  }
  return { min, max };
}

describe("aboutShapes vertex-displacement functions", () => {
  for (const [name, generate] of Object.entries(GENERATORS)) {
    describe(name, () => {
      it("returns one position per input direction, all finite", () => {
        const out = generate(DIRS);
        expect(out).toHaveLength(DIRS.length);
        for (const v of out) expect(Number.isFinite(v)).toBe(true);
      });

      it("is deterministic — two calls are byte-identical", () => {
        expect(Array.from(generate(DIRS))).toEqual(Array.from(generate(DIRS)));
      });

      it("writes into a provided output array and returns it", () => {
        const out = new Float32Array(DIRS.length);
        expect(generate(DIRS, out)).toBe(out);
        expect(out.some((v) => v !== 0)).toBe(true);
      });

      it("keeps a sane overall size", () => {
        const { min, max } = bounds(generate(DIRS));
        const diag = Math.hypot(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
        expect(diag).toBeGreaterThan(1);
        expect(diag).toBeLessThan(6);
      });

      it("is centred on the origin (roughly symmetric bounds)", () => {
        const { min, max } = bounds(generate(DIRS));
        for (let a = 0; a < 3; a += 1) {
          expect(Math.abs(max[a] + min[a])).toBeLessThan(0.25);
        }
      });
    });
  }

  it("every function agrees on the vertex count for shared input", () => {
    const lengths = Object.values(GENERATORS).map((g) => g(DIRS).length);
    expect(new Set(lengths)).toEqual(new Set([DIRS.length]));
  });

  it("the sphere has near-equal extent on every axis", () => {
    const { min, max } = bounds(sphereShape(DIRS));
    const spans = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
    const avg = spans.reduce((s, v) => s + v, 0) / 3;
    for (const span of spans) expect(Math.abs(span - avg)).toBeLessThan(avg * 0.15);
  });

  it("the cylinder is round in x/z and has a near-constant body radius", () => {
    const out = cylinderShape(DIRS);
    const { min, max } = bounds(out);
    expect(Math.abs((max[0] - min[0]) - (max[2] - min[2]))).toBeLessThan(0.15);

    // Vertices around the mid-height band should all sit at ~one radius.
    const radii = [];
    for (let i = 0; i < out.length; i += 3) {
      if (Math.abs(out[i + 1]) < 0.8) radii.push(Math.hypot(out[i], out[i + 2]));
    }
    const rMax = Math.max(...radii);
    const rMin = Math.min(...radii);
    expect(rMax - rMin).toBeLessThan(0.08);
  });

  it("the diamond lies on an octahedron: |x'|+|y'|+|z'| is ~constant", () => {
    const out = diamondShape(DIRS);
    const norms = [];
    for (let i = 0; i < out.length; i += 3) {
      // Undo the Y stretch before measuring the L1 norm.
      norms.push(Math.abs(out[i]) + Math.abs(out[i + 1] / 1.35) + Math.abs(out[i + 2]));
    }
    const spread = Math.max(...norms) - Math.min(...norms);
    expect(spread).toBeLessThan(0.05);
  });

  it("the torus has a hole: no vertex reaches the central axis", () => {
    const out = torusShape(DIRS);
    let minHoriz = Infinity;
    for (let i = 0; i < out.length; i += 3) {
      minHoriz = Math.min(minHoriz, Math.hypot(out[i], out[i + 2]));
    }
    // Inner radius is major - tube = 0.95 - 0.44.
    expect(minHoriz).toBeGreaterThan(0.35);
  });
});

describe("mixPositions", () => {
  it("interpolates linearly between two arrays", () => {
    const from = new Float32Array([0, 0, 0, 10, -4, 2]);
    const to = new Float32Array([2, 4, 6, 20, 0, 2]);
    expect(Array.from(mixPositions(from, to, 0))).toEqual([0, 0, 0, 10, -4, 2]);
    expect(Array.from(mixPositions(from, to, 1))).toEqual([2, 4, 6, 20, 0, 2]);
    expect(Array.from(mixPositions(from, to, 0.5))).toEqual([1, 2, 3, 15, -2, 2]);
  });

  it("is safe to call with out === from", () => {
    const from = new Float32Array([0, 10, -2]);
    const to = new Float32Array([4, 10, 2]);
    mixPositions(from, to, 0.25, from);
    expect(Array.from(from)).toEqual([1, 10, -1]);
  });
});

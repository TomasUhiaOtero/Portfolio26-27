import { describe, it, expect } from "vitest";
import { getBudget } from "./adaptive.js";

describe("getBudget", () => {
  it("disables 3D entirely under reduced motion", () => {
    expect(getBudget({ width: 1920, reduced: true }).enabled).toBe(false);
  });

  it("caps device pixel ratio at 1.5 on phones", () => {
    expect(getBudget({ width: 390, reduced: false }).dpr[1]).toBe(1.5);
  });

  it("uses fewer particles on a phone than on a desktop", () => {
    const phone = getBudget({ width: 390, reduced: false }).particles;
    const desktop = getBudget({ width: 1920, reduced: false }).particles;
    expect(phone).toBeLessThan(desktop);
  });

  it("steps down on a low-memory device", () => {
    const low = getBudget({ width: 1920, deviceMemory: 2, reduced: false });
    const normal = getBudget({ width: 1920, deviceMemory: 8, reduced: false });
    expect(low.particles).toBeLessThan(normal.particles);
  });

  describe("stagePoints", () => {
    it("disables 3D entirely under reduced motion", () => {
      expect(getBudget({ width: 1920, reduced: true }).stagePoints).toBe(0);
    });

    it("uses fewer points on a phone than on a desktop", () => {
      const phone = getBudget({ width: 390, reduced: false }).stagePoints;
      const desktop = getBudget({ width: 1920, reduced: false }).stagePoints;
      expect(phone).toBeLessThan(desktop);
    });

    it("steps down on a low-memory device", () => {
      const low = getBudget({ width: 1920, deviceMemory: 2, reduced: false });
      const normal = getBudget({ width: 1920, deviceMemory: 8, reduced: false });
      expect(low.stagePoints).toBeLessThan(normal.stagePoints);
    });
  });
});

import { describe, it, expect } from "vitest";
import { services } from "./services.js";

describe("services", () => {
  it("has exactly four services with unique ids", () => {
    expect(services).toHaveLength(4);
    expect(new Set(services.map((s) => s.id)).size).toBe(4);
  });

  it("translates every translatable field into both languages", () => {
    for (const s of services) {
      for (const field of ["title", "tagline", "description"]) {
        expect(s[field].es).toBeTruthy();
        expect(s[field].en).toBeTruthy();
      }
    }
  });

  it("lists the same number of deliverables in both languages", () => {
    for (const s of services) {
      expect(s.includes.en).toHaveLength(s.includes.es.length);
      expect(s.includes.es.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("names a stack for every service", () => {
    for (const s of services) {
      expect(s.stack.length).toBeGreaterThan(0);
    }
  });
});

import { describe, it, expect } from "vitest";
import { content, profile, LANGUAGES } from "./content.js";
import { projects, localized } from "./projects.js";

/**
 * Describes the *shape* of a value's keys, recursively, ignoring the
 * actual leaf values (strings differ between languages by design — that
 * is the whole point of `content`). Two values have the same shape when:
 *   - both are plain objects with the same set of keys (order-independent
 *     — `keys` is sorted), and every key's value has the same shape;
 *   - both are arrays of the same length, and each element (by index) has
 *     the same shape as its counterpart — so an array of objects has its
 *     elements' own key sets checked too, not just the array's length;
 *   - anything else (string, number, boolean, null) is a "leaf" — its
 *     shape carries no information beyond "not an object and not an
 *     array", which is enough to catch a field that is a string in one
 *     language and an object in the other (as project taglines/roles are,
 *     deliberately — this project mixes both forms).
 *
 * Comparing only `Object.keys(content[lang])` (the previous version of
 * this test) checks the section names — `about`, `stack`, `nav`, etc. —
 * but never looks inside them. A nested key added to one language only
 * (e.g. `nav.railLabel` existing in `es` but not `en`) passes that
 * shallow check and ships as `undefined` in the UI. This walks every
 * depth instead.
 */
function shapeOf(value) {
  if (Array.isArray(value)) {
    return { kind: "array", length: value.length, items: value.map(shapeOf) };
  }
  if (value !== null && typeof value === "object") {
    const keys = Object.keys(value).sort();
    const shape = {};
    for (const key of keys) shape[key] = shapeOf(value[key]);
    return { kind: "object", keys, shape };
  }
  return "leaf";
}

describe("content", () => {
  it("exposes an identical key structure, at every depth, in every language", () => {
    const [first, ...rest] = LANGUAGES;
    const reference = shapeOf(content[first]);
    for (const lang of rest) {
      expect(shapeOf(content[lang])).toEqual(reference);
    }
  });

  it("uses the same nav link ids in every language", () => {
    const ids = (lang) => content[lang].nav.links.map((l) => l.id);
    expect(ids("en")).toEqual(ids("es"));
  });

  it("navigates to section ids that the rail can anchor to", () => {
    expect(content.es.nav.links.map((l) => l.id)).toEqual([
      "inicio",
      "sobre-mi",
      "servicios",
      "experiencia",
      "proyectos",
      "contacto",
    ]);
  });

  it("has a complete profile", () => {
    for (const key of ["name", "email", "github", "linkedin", "resume"]) {
      expect(profile[key]).toBeTruthy();
    }
  });
});

describe("projects", () => {
  it("gives every project a unique id", () => {
    const ids = projects.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every project an image, a year and a non-empty stack", () => {
    for (const p of projects) {
      expect(p.image).toMatch(/^\/img\//);
      expect(p.year).toMatch(/^\d{4}$/);
      expect(p.stack.length).toBeGreaterThan(0);
    }
  });

  it("gives every project at least one link to follow", () => {
    for (const p of projects) {
      expect(p.demo || p.code).toBeTruthy();
    }
  });
});

describe("localized", () => {
  it("returns an empty string for a missing field", () => {
    expect(localized(null, "es")).toBe("");
    expect(localized(undefined, "en")).toBe("");
  });

  it("passes a plain string straight through", () => {
    expect(localized("TomasDex", "en")).toBe("TomasDex");
  });

  it("picks the requested language", () => {
    expect(localized({ es: "Hola", en: "Hi" }, "en")).toBe("Hi");
  });

  it("falls back to Spanish when the language is missing", () => {
    expect(localized({ es: "Hola" }, "en")).toBe("Hola");
  });
});

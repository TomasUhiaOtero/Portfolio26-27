import { describe, it, expect } from "vitest";
import { content, profile, LANGUAGES } from "./content.js";
import { projects, localized } from "./projects.js";

describe("content", () => {
  it("exposes the same section keys in every language", () => {
    const [first, ...rest] = LANGUAGES;
    const reference = Object.keys(content[first]).sort();
    for (const lang of rest) {
      expect(Object.keys(content[lang]).sort()).toEqual(reference);
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

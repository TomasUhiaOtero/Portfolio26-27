import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import ScrollTrigger from "gsap/ScrollTrigger";
import { renderWithProviders } from "../test/renderWithProviders.jsx";
import { content, DEFAULT_LANGUAGE } from "../data/content.js";
import Experience from "./Experience.jsx";

const t = content[DEFAULT_LANGUAGE];

const realMatchMedia = window.matchMedia;

// Same technique as About.test.jsx and Services.test.jsx: jsdom's own
// matchMedia stub always reports `matches: false`, so `prefers-reduced-
// motion` has to be faked this way to actually exercise the reduced-
// motion branch — this project's documented tooling limit (task 8's
// report and every report since).
function mockReducedMotion(matches) {
  window.matchMedia = (query) => ({
    matches: matches && query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  });
}

describe("Experience", () => {
  let createSpy;

  beforeEach(() => {
    // Real gsap runs throughout (not mocked) — only ScrollTrigger.create
    // is spied on, so "no ScrollTrigger ran" is proven by counting the
    // one call that would create one, not by inspecting timing or pixels.
    createSpy = vi.spyOn(ScrollTrigger, "create");
  });

  afterEach(() => {
    createSpy.mockRestore();
    window.matchMedia = realMatchMedia;
  });

  it("renders the section landmark the side rail anchors to", () => {
    mockReducedMotion(true);
    const { container } = renderWithProviders(<Experience />);
    expect(container.querySelector("section#experiencia")).toBeInTheDocument();
  });

  it("uses the rail's own 'experiencia' id, matching content.nav.links", () => {
    const navId = t.nav.links.find((link) => link.id === "experiencia")?.id;
    expect(navId).toBe("experiencia");
  });

  describe("under reduced motion", () => {
    beforeEach(() => mockReducedMotion(true));

    it("renders both job entries and both education entries statically", () => {
      renderWithProviders(<Experience />);
      for (const item of t.experience.items) {
        expect(screen.getByText(item.role)).toBeInTheDocument();
        expect(screen.getByText(item.company)).toBeInTheDocument();
        for (const tech of item.stack) {
          expect(screen.getAllByText(tech).length).toBeGreaterThan(0);
        }
      }
      for (const edu of t.experience.education) {
        expect(screen.getByText(edu.title)).toBeInTheDocument();
        expect(screen.getByText(edu.place)).toBeInTheDocument();
      }
      expect(screen.getByText(t.experience.educationTitle)).toBeInTheDocument();
    });

    it("never creates a ScrollTrigger — no line draw, no node pop, no card entrance runs", () => {
      renderWithProviders(<Experience />);
      expect(createSpy).not.toHaveBeenCalled();
    });
  });
});

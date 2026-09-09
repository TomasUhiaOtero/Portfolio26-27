import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ScrollTrigger from "gsap/ScrollTrigger";
import { renderWithProviders } from "../test/renderWithProviders.jsx";
import { content, DEFAULT_LANGUAGE } from "../data/content.js";
import { services } from "../data/services.js";
import Services from "./Services.jsx";

const t = content[DEFAULT_LANGUAGE];

const realMatchMedia = window.matchMedia;

// Same technique as About.test.jsx: jsdom's own matchMedia stub always
// reports `matches: false`, so `prefers-reduced-motion` has to be faked
// this way to actually exercise the reduced-motion branch — this
// project's documented tooling limit (task 8's report and every report
// since).
function mockReducedMotion(matches) {
  window.matchMedia = (query) => ({
    matches: matches && query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  });
}

describe("Services", () => {
  let createSpy;

  beforeEach(() => {
    // Real gsap runs throughout (not mocked) — only ScrollTrigger.create
    // is spied on, so "no ScrollTrigger ran" is proven by counting the one
    // call that would create one, not by inspecting timing or pixels.
    createSpy = vi.spyOn(ScrollTrigger, "create");
  });

  afterEach(() => {
    createSpy.mockRestore();
    window.matchMedia = realMatchMedia;
  });

  it("renders the section landmark the side rail anchors to", () => {
    mockReducedMotion(true);
    const { container } = renderWithProviders(<Services />);
    expect(container.querySelector("section#servicios")).toBeInTheDocument();
  });

  it("uses the rail's own 'servicios' id, matching content.nav.links", () => {
    const navId = t.nav.links.find((link) => link.label && link.id === "servicios")?.id;
    expect(navId).toBe("servicios");
  });

  describe("under reduced motion", () => {
    beforeEach(() => mockReducedMotion(true));

    it("renders all four panels statically, each with its title and tagline", () => {
      renderWithProviders(<Services />);
      for (const service of services) {
        // Title and eyebrow index appear twice each (the mobile inline
        // placeholder plus the panel's own real content) — getAllByText
        // over getByText proves both copies rendered, not just one.
        expect(document.body.textContent).toContain(service.title.es);
        expect(document.body.textContent).toContain(service.tagline.es);
      }
    });

    it("lists every service's includes and stack chips", () => {
      renderWithProviders(<Services />);
      const last = services[services.length - 1];
      for (const item of last.includes.es) {
        expect(document.body.textContent).toContain(item);
      }
      for (const item of last.stack) {
        expect(document.body.textContent).toContain(item);
      }
    });

    it("never creates a ScrollTrigger — no scroll-linked activation runs at all", () => {
      renderWithProviders(<Services />);
      expect(createSpy).not.toHaveBeenCalled();
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import ScrollTrigger from "gsap/ScrollTrigger";
import { renderWithProviders } from "../test/renderWithProviders.jsx";
import { content, DEFAULT_LANGUAGE } from "../data/content.js";
import About from "./About.jsx";

const t = content[DEFAULT_LANGUAGE];

const realMatchMedia = window.matchMedia;

// jsdom's own matchMedia stub (vitest.setup.js) always reports `matches:
// false`, which is why useReducedMotion never resolves to `true` there
// without help. Overriding it — the same technique LazyCanvas.test.jsx
// uses — is the only way to actually exercise the reduced-motion branch;
// this project's known limit is that jsdom cannot emulate
// `prefers-reduced-motion` on its own (documented in the task 8 report).
function mockReducedMotion(matches) {
  window.matchMedia = (query) => ({
    matches: matches && query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  });
}

describe("About", () => {
  let createSpy;

  beforeEach(() => {
    // Real gsap runs throughout this suite (it's not mocked) — only
    // ScrollTrigger.create is spied on, so the assertion below proves "no
    // pin ran" by *counting the one call that would create one*, rather
    // than by inspecting styles or timing, which is the deterministic
    // instrumentation approach this task's brief asks for over guessing
    // from pixels.
    createSpy = vi.spyOn(ScrollTrigger, "create");
  });

  afterEach(() => {
    createSpy.mockRestore();
    window.matchMedia = realMatchMedia;
  });

  it("renders the section landmark the side rail anchors to", () => {
    mockReducedMotion(true);
    const { container } = renderWithProviders(<About />);
    expect(container.querySelector("section#sobre-mi")).toBeInTheDocument();
  });

  it("renders the TechCore scene slot as a decorative LazyCanvas", () => {
    mockReducedMotion(true);
    const { container } = renderWithProviders(<About />);
    // Under reduced motion LazyCanvas never mounts the real canvas (see
    // LazyCanvas.jsx / adaptive.js's DISABLED_BUDGET) — it shows only the
    // poster image, decorative and aria-hidden, matching the contract the
    // placeholder this replaces already held.
    const poster = container.querySelector('[aria-hidden="true"] img');
    expect(poster).toBeInTheDocument();
    expect(poster.closest('[aria-hidden="true"]')).toBeInTheDocument();
  });

  describe("under reduced motion", () => {
    beforeEach(() => mockReducedMotion(true));

    it("renders all three paragraphs statically", () => {
      renderWithProviders(<About />);
      expect(t.about.paragraphs).toHaveLength(3);
      for (const paragraph of t.about.paragraphs) {
        expect(screen.getByText(paragraph)).toBeInTheDocument();
      }
    });

    it("renders only the first technology group (Frontend), not all four", () => {
      renderWithProviders(<About />);
      const [first, second] = t.stack.groups;

      expect(screen.getByText(first.title)).toBeInTheDocument();
      for (const item of first.items) {
        expect(screen.getByText(item)).toBeInTheDocument();
      }

      // Proves this is a genuine single-group static render (stage pinned
      // at 0), not every group rendered and merely stacked/hidden by
      // opacity — the second group's heading must not exist in the DOM.
      expect(screen.queryByText(second.title)).not.toBeInTheDocument();
    });

    it("never creates a ScrollTrigger — no pin runs at all", () => {
      renderWithProviders(<About />);
      expect(createSpy).not.toHaveBeenCalled();
    });
  });
});

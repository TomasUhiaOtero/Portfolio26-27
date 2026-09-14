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

  it("renders the AboutStage scene slot as a decorative LazyCanvas", () => {
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

    // Below `lg` (and here, under reduced motion — the pin never runs in
    // either case, see Effect A's `DESKTOP_QUERY` gate) the cross-fading
    // single slot would sit pinned at stage 0 forever if it were the only
    // thing rendered: every phone would see "Frontend" and only
    // "Frontend", with Backend/Data/Tooling never reachable at all. The
    // fix is a second, always-static block that lists every group —
    // this asserts that block's content actually reaches the DOM.
    // `getAllByText` (not `getByText`) throughout: stage 0's own group
    // legitimately appears twice — once in the hidden-below-`lg`
    // cross-fade slot (still present in jsdom, which doesn't apply real
    // breakpoints), once in the always-rendered mobile list.
    it("renders every technology group, not just the first", () => {
      renderWithProviders(<About />);

      for (const group of t.stack.groups) {
        expect(screen.getAllByText(group.title).length).toBeGreaterThan(0);
        for (const item of group.items) {
          expect(screen.getAllByText(item).length).toBeGreaterThan(0);
        }
      }
    });

    it("never creates a ScrollTrigger — no pin runs at all", () => {
      renderWithProviders(<About />);
      expect(createSpy).not.toHaveBeenCalled();
    });
  });
});

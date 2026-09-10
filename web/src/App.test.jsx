import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import App from "./App.jsx";
import { content, DEFAULT_LANGUAGE } from "./data/content.js";

const t = content[DEFAULT_LANGUAGE];

const realMatchMedia = window.matchMedia;

// Same technique as Experience.test.jsx and others: fake
// `prefers-reduced-motion` to skip every section's GSAP entrance/scroll
// wiring — this test only cares about the skip link and landmark
// structure, not motion.
function mockReducedMotion(matches) {
  window.matchMedia = (query) => ({
    matches: matches && query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  });
}

describe("App", () => {
  beforeEach(() => mockReducedMotion(true));
  afterEach(() => {
    window.matchMedia = realMatchMedia;
  });

  it("renders the skip link as the first focusable element, pointing at #main", () => {
    const { container } = render(<App />);
    const focusable = container.querySelectorAll("a[href], button, input, select, textarea, [tabindex]");
    expect(focusable.length).toBeGreaterThan(0);
    expect(focusable[0]).toHaveAttribute("href", "#main");
    expect(focusable[0]).toHaveTextContent(t.nav.skipToContent);
  });

  it("gives <main> the id the skip link targets", () => {
    const { container } = render(<App />);
    expect(container.querySelector("main#main")).toBeInTheDocument();
  });

  it("renders <footer> as a sibling of <main>, never nested inside it", () => {
    const { container } = render(<App />);
    const footer = container.querySelector("footer");
    expect(footer).toBeInTheDocument();
    expect(footer.closest("main")).toBeNull();
  });
});

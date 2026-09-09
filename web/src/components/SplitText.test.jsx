import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import SplitText from "./SplitText.jsx";
import gsap from "gsap";
import { wordStagger } from "../lib/stagger.js";

// gsap.fromTo is mocked out for these tests. Real GSAP, when it measures a
// percentage-based transform (yPercent) on an element whose `offsetParent`
// is null, temporarily reparents that element to `document.documentElement`
// to read its computed transform, then reinserts it via
// `nextElementSibling` — which skips text-node siblings and silently
// reorders the space text nodes around it. Every element has a null
// `offsetParent` in jsdom (no real layout engine), so this fires on every
// mount and corrupts the very sibling-space-node structure this test
// exists to verify — an artifact of jsdom's lack of layout, not of
// anything SplitText does (in a real browser a normally-flowed element has
// a non-null offsetParent, so GSAP never takes that path). Mocking the
// tween keeps this test about SplitText's markup, not GSAP's jsdom quirks.
vi.mock("gsap", () => ({
  default: {
    fromTo: vi.fn(() => ({ kill: vi.fn() })),
    // lib/ease.js registers CustomEase on module load — a no-op stub keeps
    // that import path working under the mock.
    registerPlugin: vi.fn(),
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("SplitText", () => {
  it("makes no GSAP call when animate is false, but still renders the words", () => {
    // Task 5 review finding: SplitText's own tween and the hero's master
    // timeline both targeted [data-word], so the master timeline's
    // `fromTo` snapped the already-revealed headline back to hidden and
    // replayed it. `animate={false}` must give up ownership entirely —
    // no `gsap` call of any kind — while still rendering the words for
    // that other timeline to target.
    const text = "Uno dos tres";
    const { container } = render(<SplitText text={text} animate={false} />);

    expect(gsap.fromTo).not.toHaveBeenCalled();

    const words = container.querySelectorAll("[data-word]");
    expect(words).toHaveLength(3);
    expect(container.textContent).toBe(text);
  });

  it("keeps spaces out of every [data-word] span but preserves them in the rendered text", () => {
    // Nine words — long enough to exercise the stagger cap and to prove the
    // headline still reads back with spaces intact.
    const text = "Desarrollador full-stack, del modelo de datos a la interfaz.";
    const { container } = render(<SplitText text={text} as="h1" />);

    const words = container.querySelectorAll("[data-word]");
    expect(words.length).toBeGreaterThan(0);
    words.forEach((word) => {
      expect(word.textContent).not.toMatch(/\s/);
    });

    expect(container.textContent).toBe(text);
  });

  describe("wordStagger", () => {
    it("steps by 60ms per word for the first six words (indices 0-5), then holds at the sixth step", () => {
      // This is the arithmetic that broke under `stagger: { amount }`: that
      // form spreads a fixed total window across all gaps, so a regression
      // back to it would shrink these values on any headline with more than
      // six words. Asserting the raw per-index output — not a live GSAP
      // timeline — is what catches that regression directly.
      const expected = [0, 0.06, 0.12, 0.18, 0.24, 0.3, 0.3, 0.3, 0.3, 0.3];

      expected.forEach((value, i) => {
        expect(wordStagger(i)).toBeCloseTo(value, 10);
      });
    });

    it("never exceeds the sixth step's delay, even far past word six", () => {
      expect(wordStagger(20)).toBeCloseTo(0.3, 10);
      expect(wordStagger(100)).toBeCloseTo(0.3, 10);
    });
  });
});

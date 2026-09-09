import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import useIntroTimeline from "./useIntroTimeline.js";

// gsap is mocked so this test is about useIntroTimeline's branching (the
// reduced-motion path must skip the timeline outright, never run it at
// duration 0), not about GSAP's own tween/timeline mechanics.
const { contextMock, setMock, timelineMock, revertMock } = vi.hoisted(() => {
  const revertMock = vi.fn();
  return {
    revertMock,
    contextMock: vi.fn((fn) => {
      fn();
      return { revert: revertMock };
    }),
    setMock: vi.fn(),
    timelineMock: vi.fn(() => ({ fromTo: vi.fn().mockReturnThis() })),
  };
});

vi.mock("gsap", () => ({
  default: {
    context: contextMock,
    set: setMock,
    timeline: timelineMock,
    // lib/ease.js registers CustomEase on module load — a no-op stub keeps
    // that import path working under the mock (same reasoning as
    // SplitText.test.jsx).
    registerPlugin: vi.fn(),
  },
}));

function makeRootRef() {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return { current: el };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("useIntroTimeline", () => {
  it("under reduced motion, dismisses the curtain and sets every element to its resting state instead of running the timeline", () => {
    const rootRef = makeRootRef();
    renderHook(() => useIntroTimeline(rootRef, { enabled: false }));

    // The reduced-motion branch must never build (or play) the entrance
    // timeline — not even at duration 0.
    expect(timelineMock).not.toHaveBeenCalled();

    expect(contextMock).toHaveBeenCalledTimes(1);
    expect(setMock).toHaveBeenCalledWith("[data-curtain]", { autoAlpha: 0 });
    expect(setMock).toHaveBeenCalledWith(
      ["[data-eyebrow]", "[data-sub]", "[data-cta]", "[data-stats]", "[data-cue]"],
      { opacity: 1, x: 0, y: 0, scale: 1 },
    );
  });

  it("reverts the gsap context on cleanup, so a re-run can never stack on top of a previous run's inline styles", () => {
    const rootRef = makeRootRef();
    const { unmount } = renderHook(() =>
      useIntroTimeline(rootRef, { enabled: false }),
    );

    unmount();

    expect(revertMock).toHaveBeenCalledTimes(1);
  });

  it("does nothing when the root ref has no element yet", () => {
    const rootRef = { current: null };
    renderHook(() => useIntroTimeline(rootRef, { enabled: false }));

    expect(contextMock).not.toHaveBeenCalled();
  });
});

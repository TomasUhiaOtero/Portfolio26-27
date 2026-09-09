import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import useIntroTimeline from "./useIntroTimeline.js";

// gsap is mocked so this test is about useIntroTimeline's branching (the
// reduced-motion path must skip the timeline outright, never run it at
// duration 0) and about the shape of the timeline it builds when enabled
// (targets/durations/positions/clearProps) — not about GSAP's own
// tween/timeline mechanics.
const { contextMock, setMock, timelineMock, fromToMock, revertMock } = vi.hoisted(() => {
  const revertMock = vi.fn();
  // Shared across the whole suite: `tl.fromTo(...)` is called as a method
  // of the object `timelineMock()` returns, so `mockReturnThis()` resolves
  // to that same object on every call, preserving the real chain
  // (`tl.fromTo(...).fromTo(...)...`) while every call — across the whole
  // sequence — lands in `fromToMock.mock.calls`, in order.
  const fromToMock = vi.fn().mockReturnThis();
  return {
    revertMock,
    fromToMock,
    contextMock: vi.fn((fn) => {
      fn();
      return { revert: revertMock };
    }),
    setMock: vi.fn(),
    timelineMock: vi.fn(() => ({ fromTo: fromToMock })),
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

const originalFonts = document.fonts;

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
  // jsdom has no native `document.fonts` — tests below install their own
  // stub. Restore whatever was there (nothing, in this project) so no
  // stub leaks into an unrelated test file.
  document.fonts = originalFonts;
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
    // [data-word] is included here (unlike the rest of the hero's rows, it
    // needs `yPercent` reset too, not just `x`/`y`): with `SplitText`
    // rendering `animate={false}`, this is the only place `[data-word]`
    // is ever reset to its resting state when the master timeline is
    // skipped — omitting it would leave the headline stuck invisible.
    expect(setMock).toHaveBeenCalledWith(
      [
        "[data-eyebrow]",
        "[data-word]",
        "[data-sub]",
        "[data-cta]",
        "[data-stats]",
        "[data-cue]",
      ],
      { opacity: 1, x: 0, y: 0, yPercent: 0, scale: 1 },
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

  it("builds the timeline rows in the brief's order, with matching targets, durations and positions, and keeps the clearProps fix on the CTA row", async () => {
    document.fonts = { ready: Promise.resolve() };
    const rootRef = makeRootRef();
    renderHook(() => useIntroTimeline(rootRef, { enabled: true }));

    // Flush the microtask chain (Promise.race -> its own resolution ->
    // this hook's `.then`) via a real macrotask boundary, without pinning
    // down exactly how many microtask hops `Promise.race` takes internally.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(timelineMock).toHaveBeenCalledTimes(1);
    expect(fromToMock).toHaveBeenCalledTimes(7);

    const rows = fromToMock.mock.calls.map(([target, , toVars, position]) => ({
      target,
      duration: toVars.duration,
      position,
    }));

    expect(rows).toEqual([
      { target: "[data-curtain]", duration: 0.9, position: 0 },
      { target: "[data-eyebrow]", duration: 0.6, position: "-=0.5" },
      { target: "[data-word]", duration: 0.9, position: "-=0.4" },
      { target: "[data-sub]", duration: 0.7, position: "-=0.5" },
      { target: "[data-cta]", duration: 0.5, position: "-=0.4" },
      { target: "[data-stats]", duration: 0.6, position: "-=0.3" },
      { target: "[data-cue]", duration: 0.5, position: "-=0.2" },
    ]);

    // The one real bug this task found and fixed: without `clearProps`,
    // GSAP leaves `translate`/`rotate`/`scale` inline on the CTA buttons,
    // permanently blocking their `active:scale-[0.97]` press effect. This
    // failure is silent (no error, no warning) if it regresses.
    const [, , ctaToVars] = fromToMock.mock.calls[4];
    expect(ctaToVars).toMatchObject({ clearProps: "translate,rotate,scale" });
  });

  it("still builds the timeline via the 1500ms fallback when document.fonts.ready never resolves", async () => {
    vi.useFakeTimers();
    document.fonts = { ready: new Promise(() => {}) }; // never settles
    const rootRef = makeRootRef();
    renderHook(() => useIntroTimeline(rootRef, { enabled: true }));

    expect(timelineMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1500);

    expect(timelineMock).toHaveBeenCalledTimes(1);
  });

  it("does not build a timeline, and does not throw, if the effect is cleaned up while the font-ready race is still pending", async () => {
    vi.useFakeTimers();
    document.fonts = { ready: new Promise(() => {}) }; // never settles
    const rootRef = makeRootRef();
    const { unmount } = renderHook(() =>
      useIntroTimeline(rootRef, { enabled: true }),
    );

    // Still waiting on the race — nothing has been built yet.
    expect(timelineMock).not.toHaveBeenCalled();

    expect(() => unmount()).not.toThrow();

    // Let the 1500ms fallback fire (and any microtasks it unblocks) now
    // that the root is torn down. Without the `cancelled` guard in
    // useIntroTimeline.js, the pending `.then` would still build a
    // timeline for a root this effect no longer owns.
    await vi.advanceTimersByTimeAsync(1500);

    expect(timelineMock).not.toHaveBeenCalled();
    expect(contextMock).not.toHaveBeenCalled();
  });
});

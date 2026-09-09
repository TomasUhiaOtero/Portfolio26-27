import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, lazy } from "react";
import { render, waitFor } from "@testing-library/react";
import LazyCanvas from "./LazyCanvas.jsx";
import { ThemeProvider, THEME_KEY } from "../theme/ThemeProvider.jsx";

// `Canvas3D.jsx` is the module that actually imports three/@react-three —
// mocking it here keeps this suite fast and jsdom-safe (there is no real
// WebGL context in jsdom) while still exercising the one thing this file
// is actually responsible for: deciding *whether* the canvas subtree is
// mounted at all, and what it's told about pausing. That decision — and
// un-mounting it again — is the part Tasks 9, 11 and 15 depend on, since
// the browser caps how many WebGL contexts can be alive at once.
vi.mock("./Canvas3D.jsx", () => ({
  default: ({ children, paused }) => (
    <div data-testid="canvas3d-mock" data-paused={String(paused)}>
      {children}
    </div>
  ),
}));

// A controllable stand-in for the browser's IntersectionObserver: tests
// drive `nearViewport` directly via `trigger(...)` instead of depending on
// real intersection timing, which is unreliable to script in a test.
let observers = [];
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
    observers.push(this);
  }
  observe() {}
  disconnect() {}
  trigger(isIntersecting) {
    this.callback([{ isIntersecting }]);
  }
}

const POSTER = { dark: "/poster-dark.webp", light: "/poster-light.webp" };

// A real React.lazy()-wrapped stand-in scene, for the tests that need to
// satisfy (or deliberately violate) LazyCanvas's own "children must be
// lazy" contract. It's never actually rendered by these tests (LazyCanvas
// only renders `children` once `mounted` is true, and nothing here drives
// that far), so the promise never needs to resolve.
const LazyScene = lazy(() => new Promise(() => {}));

let warnSpy;

beforeEach(() => {
  observers = [];
  window.IntersectionObserver = MockIntersectionObserver;
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  // The dev-only lazy-children check (finding 3) warns whenever `children`
  // isn't wrapped in React.lazy() — true for every plain `<div>` stand-in
  // most of these tests use for "scene" on purpose, to keep them focused
  // on mount/unmount timing. Silencing it here keeps that noise out of
  // the suite's output; the dedicated describe block below asserts on it
  // directly instead.
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

function renderLazyCanvas(ui, { theme } = {}) {
  if (theme) localStorage.setItem(THEME_KEY, theme);
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

function poster(container) {
  return container.querySelector("img");
}

function scene(container) {
  return container.querySelector('[data-testid="canvas3d-mock"]');
}

describe("LazyCanvas", () => {
  it("renders only the poster before nearing the viewport", () => {
    const { container } = renderLazyCanvas(
      <LazyCanvas poster={POSTER}>
        <div>scene</div>
      </LazyCanvas>,
    );

    expect(poster(container)).toBeTruthy();
    expect(scene(container)).toBeFalsy();
  });

  it("mounts the canvas once the wrapper nears the viewport", async () => {
    const { container } = renderLazyCanvas(
      <LazyCanvas poster={POSTER}>
        <div>scene</div>
      </LazyCanvas>,
    );

    act(() => observers[0].trigger(true));

    await waitFor(() => expect(scene(container)).toBeTruthy());
  });

  it("unmounts the canvas again once it leaves by more than rootMargin", async () => {
    const { container } = renderLazyCanvas(
      <LazyCanvas poster={POSTER}>
        <div>scene</div>
      </LazyCanvas>,
    );

    act(() => observers[0].trigger(true));
    await waitFor(() => expect(scene(container)).toBeTruthy());

    act(() => observers[0].trigger(false));
    await waitFor(() => expect(scene(container)).toBeFalsy());
    // Back to showing the poster, not a blank gap — no layout shift.
    expect(poster(container)).toBeTruthy();
  });

  it("passes the wrapper's own rootMargin through to the observer", () => {
    const observeSpy = vi.spyOn(MockIntersectionObserver.prototype, "observe");
    let capturedOptions;
    window.IntersectionObserver = class extends MockIntersectionObserver {
      constructor(callback, options) {
        super(callback);
        capturedOptions = options;
      }
    };

    renderLazyCanvas(
      <LazyCanvas poster={POSTER} rootMargin="200px">
        <div>scene</div>
      </LazyCanvas>,
    );

    expect(capturedOptions.rootMargin).toBe("200px");
    observeSpy.mockRestore();
  });

  it("never mounts the canvas at all under reduced motion", async () => {
    window.matchMedia = (query) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener() {},
      removeEventListener() {},
    });

    const { container } = renderLazyCanvas(
      <LazyCanvas poster={POSTER}>
        <div>scene</div>
      </LazyCanvas>,
    );

    act(() => observers[0].trigger(true));
    // Give any pending microtask a chance to run; the assertion is that
    // nothing ever appears, not just that it isn't there yet.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(scene(container)).toBeFalsy();
    expect(poster(container)).toBeTruthy();

    // Restore the default mock used by every other test in this file.
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      addEventListener() {},
      removeEventListener() {},
    });
  });

  // Finding 1: pausing on `document.hidden` is an explicitly promised part
  // of the interface (see the docblock), and is otherwise just three lines
  // wired into a `visibilitychange` listener with nothing exercising them.
  describe("pausing on document.hidden", () => {
    afterEach(() => {
      // Restore jsdom's own default so it can't leak into later tests.
      Object.defineProperty(document, "hidden", { value: false, configurable: true });
    });

    it("initializes paused from the current document.hidden", async () => {
      Object.defineProperty(document, "hidden", { value: true, configurable: true });

      const { container } = renderLazyCanvas(
        <LazyCanvas poster={POSTER}>
          <div>scene</div>
        </LazyCanvas>,
      );
      act(() => observers[0].trigger(true));
      await waitFor(() => expect(scene(container)).toBeTruthy());

      expect(scene(container)).toHaveAttribute("data-paused", "true");
    });

    it("flips paused to true when the tab hides, and back to false when it's shown again", async () => {
      Object.defineProperty(document, "hidden", { value: false, configurable: true });

      const { container } = renderLazyCanvas(
        <LazyCanvas poster={POSTER}>
          <div>scene</div>
        </LazyCanvas>,
      );
      act(() => observers[0].trigger(true));
      await waitFor(() => expect(scene(container)).toBeTruthy());
      expect(scene(container)).toHaveAttribute("data-paused", "false");

      Object.defineProperty(document, "hidden", { value: true, configurable: true });
      act(() => document.dispatchEvent(new Event("visibilitychange")));
      await waitFor(() => expect(scene(container)).toHaveAttribute("data-paused", "true"));

      Object.defineProperty(document, "hidden", { value: false, configurable: true });
      act(() => document.dispatchEvent(new Event("visibilitychange")));
      await waitFor(() => expect(scene(container)).toHaveAttribute("data-paused", "false"));
    });
  });

  // Finding 3: the `three` chunk only stays out of the initial bundle if
  // every caller passes a React.lazy()-wrapped scene. This can't be
  // enforced at the type level in plain JSX, so it's a dev-only runtime
  // warning instead — asserted here so a caller that regresses to a
  // static import gets caught by the suite, not just by eyeballing prose.
  describe("dev-only lazy-children check", () => {
    it("warns when children is not a React.lazy component", () => {
      renderLazyCanvas(
        <LazyCanvas poster={POSTER}>
          <div>scene</div>
        </LazyCanvas>,
      );

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toMatch(/React\.lazy/);
    });

    it("does not warn when children is a React.lazy component", () => {
      renderLazyCanvas(
        <LazyCanvas poster={POSTER}>
          <LazyScene />
        </LazyCanvas>,
      );

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  // Finding 4 (controller ruling R17): the poster itself must be
  // theme-aware, resolved internally rather than by the caller.
  describe("theme-aware poster", () => {
    it("renders the dark poster in dark theme", () => {
      const { container } = renderLazyCanvas(
        <LazyCanvas poster={POSTER}>
          <div>scene</div>
        </LazyCanvas>,
        { theme: "dark" },
      );

      expect(poster(container)).toHaveAttribute("src", POSTER.dark);
    });

    it("renders the light poster in light theme", () => {
      const { container } = renderLazyCanvas(
        <LazyCanvas poster={POSTER}>
          <div>scene</div>
        </LazyCanvas>,
        { theme: "light" },
      );

      expect(poster(container)).toHaveAttribute("src", POSTER.light);
    });
  });
});

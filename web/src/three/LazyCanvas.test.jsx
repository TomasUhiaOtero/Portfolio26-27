import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import LazyCanvas from "./LazyCanvas.jsx";

// `Canvas3D.jsx` is the module that actually imports three/@react-three —
// mocking it here keeps this suite fast and jsdom-safe (there is no real
// WebGL context in jsdom) while still exercising the one thing this file
// is actually responsible for: deciding *whether* the canvas subtree is
// mounted at all. That decision — and un-mounting it again — is the part
// Tasks 9, 11 and 15 depend on, since the browser caps how many WebGL
// contexts can be alive at once.
vi.mock("./Canvas3D.jsx", () => ({
  default: ({ children }) => <div data-testid="canvas3d-mock">{children}</div>,
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

beforeEach(() => {
  observers = [];
  window.IntersectionObserver = MockIntersectionObserver;
});

function poster(container) {
  return container.querySelector('img[src="/poster.webp"]');
}

function scene(container) {
  return container.querySelector('[data-testid="canvas3d-mock"]');
}

describe("LazyCanvas", () => {
  it("renders only the poster before nearing the viewport", () => {
    const { container } = render(
      <LazyCanvas poster="/poster.webp">
        <div>scene</div>
      </LazyCanvas>,
    );

    expect(poster(container)).toBeTruthy();
    expect(scene(container)).toBeFalsy();
  });

  it("mounts the canvas once the wrapper nears the viewport", async () => {
    const { container } = render(
      <LazyCanvas poster="/poster.webp">
        <div>scene</div>
      </LazyCanvas>,
    );

    observers[0].trigger(true);

    await waitFor(() => expect(scene(container)).toBeTruthy());
  });

  it("unmounts the canvas again once it leaves by more than rootMargin", async () => {
    const { container } = render(
      <LazyCanvas poster="/poster.webp">
        <div>scene</div>
      </LazyCanvas>,
    );

    observers[0].trigger(true);
    await waitFor(() => expect(scene(container)).toBeTruthy());

    observers[0].trigger(false);
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

    render(
      <LazyCanvas poster="/poster.webp" rootMargin="200px">
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

    const { container } = render(
      <LazyCanvas poster="/poster.webp">
        <div>scene</div>
      </LazyCanvas>,
    );

    observers[0].trigger(true);
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
});

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Counter from "./Counter.jsx";

// gsap.to is mocked to resolve synchronously to its target value instead of
// tweening over real time — the animating-branch test below only needs to
// know the component reaches its target and does not reset back to zero,
// not that GSAP's easing curve is correct (that belongs to GSAP's own
// tests).
const { gsapToMock } = vi.hoisted(() => ({
  gsapToMock: vi.fn((target, vars) => {
    target.val = vars.val;
    vars.onUpdate?.();
    return { kill: vi.fn() };
  }),
}));

vi.mock("gsap", () => ({
  default: { to: gsapToMock },
}));

function mockMatchMedia(matches) {
  window.matchMedia = () => ({
    matches,
    media: "",
    addEventListener() {},
    removeEventListener() {},
  });
}

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  gsapToMock.mockClear();
});

describe("Counter", () => {
  it("shows zero before it is told to start", () => {
    render(<Counter value="8" start={false} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("passes a non-numeric value straight through", () => {
    render(<Counter value="Java · React" start={false} />);
    expect(screen.getByText("Java · React")).toBeInTheDocument();
  });

  it("keeps the suffix of a numeric value", () => {
    render(<Counter value="2+" start={false} />);
    expect(screen.getByText("0+")).toBeInTheDocument();
  });

  it("shows the final value immediately under reduced motion, with no animation", () => {
    mockMatchMedia(true);
    render(<Counter value="8" start={false} />);

    expect(screen.getByText("8")).toBeInTheDocument();
    expect(gsapToMock).not.toHaveBeenCalled();
  });

  it("animates from zero to its target once start flips true, and does not reset back to zero", () => {
    mockMatchMedia(false);
    const { rerender } = render(<Counter value="8" start={false} />);
    expect(screen.getByText("0")).toBeInTheDocument();

    rerender(<Counter value="8" start={true} />);

    expect(gsapToMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import useReducedMotion from "./useReducedMotion.js";

function Probe() {
  const reduced = useReducedMotion();
  return <span>{reduced ? "reduced" : "full"}</span>;
}

describe("useReducedMotion", () => {
  let changeListeners;
  let originalMatchMedia;

  beforeEach(() => {
    changeListeners = [];
    originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: (event, handler) => {
        if (event === "change") changeListeners.push(handler);
      },
      removeEventListener: (event, handler) => {
        changeListeners = changeListeners.filter((fn) => fn !== handler);
      },
    }));
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("starts false when the media query does not match", () => {
    render(<Probe />);
    expect(screen.getByText("full")).toBeInTheDocument();
  });

  it("re-renders when the media query changes", () => {
    render(<Probe />);
    act(() => {
      changeListeners.forEach((handler) => handler({ matches: true }));
    });
    expect(screen.getByText("reduced")).toBeInTheDocument();
  });
});

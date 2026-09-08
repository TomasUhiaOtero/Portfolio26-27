import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ScrollTrigger from "gsap/ScrollTrigger";
import Reveal from "./Reveal.jsx";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Reveal", () => {
  it("always renders its children into the document", () => {
    render(
      <Reveal>
        <p>Contenido</p>
      </Reveal>,
    );
    expect(screen.getByText("Contenido")).toBeInTheDocument();
  });

  it("reveals via the 3000ms fallback, with no ScrollTrigger involved, when the element has no layout", () => {
    // jsdom reports zero layout for every mounted node (no real layout
    // engine), so the `hasLayout` guard's false branch is exercised here
    // without any extra stubbing — this is the guard's default path.
    const createSpy = vi.spyOn(ScrollTrigger, "create");
    vi.useFakeTimers();

    const { container } = render(
      <Reveal>
        <p>Contenido</p>
      </Reveal>,
    );
    const el = container.firstChild;

    expect(el.dataset.revealed).toBeUndefined();

    vi.advanceTimersByTime(3000);

    expect(el.dataset.revealed).toBe("true");
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("clears the fallback timeout on unmount so it cannot fire against a dead node", () => {
    vi.useFakeTimers();

    const { unmount, container } = render(
      <Reveal>
        <p>Contenido</p>
      </Reveal>,
    );
    const el = container.firstChild;

    unmount();
    vi.advanceTimersByTime(5000);

    expect(el.dataset.revealed).toBeUndefined();
  });

  it("creates a ScrollTrigger when the element reports real layout (hasLayout guard's true branch)", () => {
    const originalGetClientRects = Element.prototype.getClientRects;
    Element.prototype.getClientRects = function stubbedGetClientRects() {
      return [{}];
    };

    const createSpy = vi
      .spyOn(ScrollTrigger, "create")
      .mockReturnValue({ kill: vi.fn() });

    try {
      render(
        <Reveal>
          <p>Contenido</p>
        </Reveal>,
      );

      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(createSpy.mock.calls[0][0]).toMatchObject({
        start: "top 85%",
        once: true,
      });
    } finally {
      Element.prototype.getClientRects = originalGetClientRects;
    }
  });
});

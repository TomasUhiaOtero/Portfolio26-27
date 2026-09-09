import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import useActiveSection from "./useActiveSection.js";

function Probe({ ids }) {
  const active = useActiveSection(ids);
  return <span data-testid="active">{active}</span>;
}

describe("useActiveSection", () => {
  let observers;
  let originalIntersectionObserver;

  beforeEach(() => {
    observers = [];
    originalIntersectionObserver = window.IntersectionObserver;
    window.IntersectionObserver = class {
      constructor(callback, options) {
        this.callback = callback;
        this.options = options;
        this.observed = [];
        observers.push(this);
      }
      observe(el) {
        this.observed.push(el);
      }
      unobserve(el) {
        this.observed = this.observed.filter((observed) => observed !== el);
      }
      disconnect() {
        this.observed = [];
      }
    };
  });

  afterEach(() => {
    window.IntersectionObserver = originalIntersectionObserver;
    document.body.innerHTML = "";
  });

  it("defaults to the first id before any intersection is reported", () => {
    document.body.innerHTML = '<div id="a"></div><div id="b"></div>';
    render(<Probe ids={["a", "b"]} />);
    expect(screen.getByTestId("active")).toHaveTextContent("a");
  });

  it("observes with a single observer using the middle-band rootMargin", () => {
    document.body.innerHTML = '<div id="a"></div><div id="b"></div>';
    render(<Probe ids={["a", "b"]} />);
    expect(observers).toHaveLength(1);
    expect(observers[0].options.rootMargin).toBe("-45% 0px -45% 0px");
    expect(observers[0].observed).toHaveLength(2);
  });

  it("switches to the section reported as intersecting", () => {
    document.body.innerHTML = '<div id="a"></div><div id="b"></div>';
    render(<Probe ids={["a", "b"]} />);
    const [observer] = observers;
    const elB = document.getElementById("b");
    act(() => {
      observer.callback([
        { target: elB, isIntersecting: true, boundingClientRect: { top: 10 } },
      ]);
    });
    expect(screen.getByTestId("active")).toHaveTextContent("b");
  });

  it("picks the topmost of several simultaneously intersecting sections", () => {
    document.body.innerHTML = '<div id="a"></div><div id="b"></div>';
    render(<Probe ids={["a", "b"]} />);
    const [observer] = observers;
    const elA = document.getElementById("a");
    const elB = document.getElementById("b");
    act(() => {
      observer.callback([
        { target: elA, isIntersecting: true, boundingClientRect: { top: 50 } },
        { target: elB, isIntersecting: true, boundingClientRect: { top: 5 } },
      ]);
    });
    expect(screen.getByTestId("active")).toHaveTextContent("b");
  });

  it("keeps the last known section instead of flickering to nothing", () => {
    document.body.innerHTML = '<div id="a"></div><div id="b"></div>';
    render(<Probe ids={["a", "b"]} />);
    const [observer] = observers;
    const elA = document.getElementById("a");
    act(() => {
      observer.callback([
        { target: elA, isIntersecting: true, boundingClientRect: { top: 0 } },
      ]);
    });
    expect(screen.getByTestId("active")).toHaveTextContent("a");

    act(() => {
      observer.callback([
        { target: elA, isIntersecting: false, boundingClientRect: { top: -500 } },
      ]);
    });
    expect(screen.getByTestId("active")).toHaveTextContent("a");
  });

  it("does not throw when an id has no matching element in the document", () => {
    document.body.innerHTML = '<div id="a"></div>';
    expect(() => render(<Probe ids={["a", "missing"]} />)).not.toThrow();
    expect(screen.getByTestId("active")).toHaveTextContent("a");
    expect(observers[0].observed).toHaveLength(1);
  });
});

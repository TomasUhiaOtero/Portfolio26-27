import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "../test/renderWithProviders.jsx";
import { projects } from "../data/projects.js";
import { content, DEFAULT_LANGUAGE } from "../data/content.js";
import Work from "./Work.jsx";

const t = content[DEFAULT_LANGUAGE];

const realMatchMedia = window.matchMedia;

// Same technique as About/Services/Experience.test.jsx: jsdom's own
// matchMedia stub always reports `matches: false`, so `prefers-reduced-
// motion` has to be faked this way to actually exercise either branch —
// documented tooling limit, repeated in every section's tests.
function mockMatchMedia({ reducedMotion = false, desktop = true } = {}) {
  window.matchMedia = (query) => ({
    matches: query.includes("prefers-reduced-motion") ? reducedMotion : desktop,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  });
}

describe("Work", () => {
  beforeEach(() => {
    mockMatchMedia({ reducedMotion: true });
  });

  afterEach(() => {
    window.matchMedia = realMatchMedia;
  });

  it("renders the section landmark the side rail anchors to", () => {
    const { container } = renderWithProviders(<Work />);
    expect(container.querySelector("section#proyectos")).toBeInTheDocument();
  });

  it("puts all eight projects in the DOM, each as a button", () => {
    renderWithProviders(<Work />);
    const options = screen.getAllByRole("option", { hidden: true });
    expect(options).toHaveLength(projects.length);
    for (const option of options) {
      expect(option.tagName).toBe("BUTTON");
    }
  });

  it("selects the first card initially", () => {
    renderWithProviders(<Work />);
    const options = screen.getAllByRole("option", { hidden: true });
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    expect(options.slice(1).every((el) => el.getAttribute("aria-selected") === "false")).toBe(
      true,
    );
  });

  it("moves the selection when ArrowRight is pressed", () => {
    renderWithProviders(<Work />);
    const listbox = screen.getByRole("listbox", { name: t.projects.title });
    const options = screen.getAllByRole("option", { hidden: true });

    expect(options[0]).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(listbox, { key: "ArrowRight" });

    const optionsAfter = screen.getAllByRole("option", { hidden: true });
    expect(optionsAfter[0]).toHaveAttribute("aria-selected", "false");
    expect(optionsAfter[1]).toHaveAttribute("aria-selected", "true");
  });

  it("moves focus and selection together on ArrowRight", () => {
    renderWithProviders(<Work />);
    const listbox = screen.getByRole("listbox", { name: t.projects.title });

    fireEvent.keyDown(listbox, { key: "ArrowRight" });

    const optionsAfter = screen.getAllByRole("option", { hidden: true });
    expect(optionsAfter[1]).toHaveAttribute("tabIndex", "0");
  });
});

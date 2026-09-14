import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
// eslint-disable-next-line no-unused-vars -- kept for parity with the task brief's specified test code.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/renderWithProviders.jsx";
import { content, DEFAULT_LANGUAGE } from "../data/content.js";
import SideRail from "./SideRail.jsx";

// `getLenis` is mocked so the two `handleSelect` branches (Lenis active vs.
// the reduced-motion fallback) can be driven directly, instead of depending
// on a real Lenis instance's rAF-driven animation, which doesn't tick in
// this project's test harness at all (see the Task 7 report).
const { getLenisMock } = vi.hoisted(() => ({ getLenisMock: vi.fn(() => null) }));

vi.mock("../hooks/useLenis.js", () => ({
  getLenis: getLenisMock,
  default: vi.fn(() => null),
}));

const t = content[DEFAULT_LANGUAGE];

describe("SideRail", () => {
  it("renders one button per navigation link", () => {
    renderWithProviders(<SideRail />);
    expect(screen.getAllByRole("button")).toHaveLength(8); // 6 links + theme + lang
  });

  it("labels every link button with its section name", () => {
    renderWithProviders(<SideRail />);
    for (const label of ["Inicio", "Sobre mí", "Servicios", "Experiencia", "Proyectos", "Contacto"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("marks the first section as current by default", () => {
    renderWithProviders(<SideRail />);
    expect(screen.getByRole("button", { name: "Inicio" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  // Ruling R23: this test's name claims the landmark is *labelled*, so it
  // must assert the accessible name, not just that a lone `nav` resolves —
  // the old version passed whether or not `aria-label` existed, because
  // the rail was the page's only nav landmark.
  it("exposes the rail as a labelled navigation landmark", () => {
    renderWithProviders(<SideRail />);
    expect(
      screen.getByRole("navigation", { name: t.nav.railLabel }),
    ).toBeInTheDocument();
  });

  describe("the per-item tooltips", () => {
    it("gives every link button a decorative, aria-hidden label tooltip", () => {
      renderWithProviders(<SideRail />);
      for (const link of t.nav.links) {
        const button = screen.getByRole("button", { name: link.label });
        const tip = button.querySelector('span[aria-hidden="true"]');
        expect(tip).toBeTruthy();
        expect(tip).toHaveTextContent(link.label);
      }
    });

    // The tooltips are `aria-hidden` `<span>`s, never focusable, so the
    // whole Tab sequence is exactly the 8 real buttons in DOM order —
    // nothing the tooltip markup contributes. (Same property the rail's
    // old hover panel was checked for; kept now for the icon buttons.)
    it("contributes no Tab stops — the full sequence is exactly the 8 real buttons", async () => {
      renderWithProviders(<SideRail />);
      const user = userEvent.setup();

      const expectedOrder = [
        ...t.nav.links.map((link) => link.label),
        t.nav.themeLabelToLight, // ThemeProvider defaults to the dark theme
        t.nav.languageLabel,
      ];

      for (const name of expectedOrder) {
        await user.tab();
        expect(document.activeElement).toBe(screen.getByRole("button", { name }));
      }

      await user.tab();
      expect(
        expectedOrder.some(
          (name) => document.activeElement === screen.getByRole("button", { name }),
        ),
      ).toBe(false);
    });
  });

  describe("clicking a bar", () => {
    let section;

    beforeEach(() => {
      section = document.createElement("div");
      section.id = t.nav.links[0].id;
      document.body.appendChild(section);
    });

    afterEach(() => {
      section.remove();
      getLenisMock.mockReset();
    });

    it("calls lenis.scrollTo with the section element when Lenis is active", async () => {
      const scrollTo = vi.fn();
      getLenisMock.mockReturnValue({ scrollTo });
      renderWithProviders(<SideRail />);
      const user = userEvent.setup();

      await user.click(screen.getByRole("button", { name: t.nav.links[0].label }));

      expect(scrollTo).toHaveBeenCalledTimes(1);
      expect(scrollTo).toHaveBeenCalledWith(section);
    });

    it("falls back to el.scrollIntoView() when getLenis() returns null (reduced motion)", async () => {
      getLenisMock.mockReturnValue(null);
      const scrollIntoView = vi.fn();
      section.scrollIntoView = scrollIntoView;
      renderWithProviders(<SideRail />);
      const user = userEvent.setup();

      await user.click(screen.getByRole("button", { name: t.nav.links[0].label }));

      expect(scrollIntoView).toHaveBeenCalledTimes(1);
      // Called on `section` itself — asserted via `this`/target, not just
      // call count, since a call on the wrong element is the failure mode
      // a bare call-count check would miss.
      expect(scrollIntoView.mock.contexts[0]).toBe(section);
    });
  });
});

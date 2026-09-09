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

// The panel is the only `<div>` carrying `aria-hidden="true"` directly under
// the rail — the per-bar indicator spans also carry `aria-hidden="true"`,
// but they're `<span>`s, so this selector can't accidentally match one of
// them.
function railPanel(container) {
  return container.querySelector('nav > div[aria-hidden="true"]');
}

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

  describe("the decorative label panel", () => {
    it("carries inert while collapsed, and does not while expanded", async () => {
      const { container } = renderWithProviders(<SideRail />);
      const panel = railPanel(container);
      expect(panel).toBeTruthy();
      // jsdom (v30, as pinned by this project) doesn't implement the
      // `inert` IDL property at all — `panel.inert` is `undefined`
      // regardless of the attribute (confirmed by probing a plain
      // `<div inert>` outside this suite: `'inert' in div` is `false`).
      // `hasAttribute` is the only jsdom-visible signal of the actual
      // markup, so that's what's asserted here.
      expect(panel.hasAttribute("inert")).toBe(true);

      const user = userEvent.setup();
      // Focusing the first bar (the first Tab stop in the document) is the
      // rail's own `onFocus` → expand path, exactly what a keyboard user
      // hitting Tab triggers.
      await user.tab();

      expect(panel.hasAttribute("inert")).toBe(false);
    });

    it("is hidden from assistive tech", () => {
      const { container } = renderWithProviders(<SideRail />);
      expect(railPanel(container)).toHaveAttribute("aria-hidden", "true");
    });

    // jsdom (v30, as pinned by this project) does not implement `inert` at
    // all beyond reflecting it as a plain attribute (no IDL property, and
    // none of its browser behaviour) — confirmed by probing a minimal
    // `<div inert><button/></div>` outside this suite: `userEvent.tab()`
    // moved focus straight into it regardless of the attribute. So a
    // Tab-traversal assertion cannot prove `inert` is what's keeping the
    // panel out of the tab order — jsdom would let a real interactive
    // descendant grab focus even with `inert` set. What it *can* prove,
    // for real, via a real interaction,
    // is that today's panel contributes zero tab stops: the whole Tab
    // sequence below is exactly the 8 real buttons, in DOM order, with no
    // extra or missing stop from the panel. That is the same property the
    // task 7 implementer checked by hand in a real browser once; this
    // repeats it in CI. The `inert`/`aria-hidden` tests above cover the
    // actual mechanism the real browser relies on.
    it("contributes no Tab stops while collapsed — the full sequence is exactly the 8 real buttons", async () => {
      renderWithProviders(<SideRail />);
      const user = userEvent.setup();

      const expectedOrder = [
        ...t.nav.links.map((link) => link.label),
        t.nav.themeLabelToLight, // ThemeProvider defaults to the dark theme
        t.nav.languageLabel,
      ];

      for (const name of expectedOrder) {
        await user.tab();
        expect(document.activeElement).toBe(
          screen.getByRole("button", { name }),
        );
      }

      // A 9th Tab must leave the rail entirely, not loop back or land on
      // anything the panel might have contributed.
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

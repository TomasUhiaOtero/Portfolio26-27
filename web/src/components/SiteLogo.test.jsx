import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/renderWithProviders.jsx";
import { content, DEFAULT_LANGUAGE } from "../data/content.js";
import SiteLogo from "./SiteLogo.jsx";

// Same pattern as SideRail.test.jsx: mock `getLenis` so both branches of
// the click handler (Lenis present vs. the reduced-motion native
// fallback) can be exercised without a real rAF-driven Lenis instance.
const { getLenisMock } = vi.hoisted(() => ({ getLenisMock: vi.fn(() => null) }));

vi.mock("../hooks/useLenis.js", () => ({
  getLenis: getLenisMock,
  default: vi.fn(() => null),
}));

const t = content[DEFAULT_LANGUAGE];

beforeEach(() => {
  getLenisMock.mockReset();
  getLenisMock.mockReturnValue(null);
});

describe("SiteLogo", () => {
  it("renders a button labelled with the brand aria text", () => {
    renderWithProviders(<SiteLogo />);
    expect(screen.getByRole("button", { name: t.nav.brandAria })).toBeInTheDocument();
  });

  it("jumps to the top through Lenis when an instance exists", async () => {
    const scrollTo = vi.fn();
    getLenisMock.mockReturnValue({ scrollTo });
    renderWithProviders(<SiteLogo />);

    await userEvent.click(screen.getByRole("button", { name: t.nav.brandAria }));

    expect(scrollTo).toHaveBeenCalledWith(0);
  });

  it("falls back to window.scrollTo when there is no Lenis instance", async () => {
    const windowScrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    renderWithProviders(<SiteLogo />);

    await userEvent.click(screen.getByRole("button", { name: t.nav.brandAria }));

    expect(windowScrollTo).toHaveBeenCalledWith({ top: 0 });
    windowScrollTo.mockRestore();
  });
});

import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../test/renderWithProviders.jsx";
import { content, profile, DEFAULT_LANGUAGE } from "../data/content.js";
import * as useLenisModule from "../hooks/useLenis.js";
import Footer from "./Footer.jsx";

const t = content[DEFAULT_LANGUAGE];

describe("Footer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is a footer landmark, not nested inside a main", () => {
    const { container } = renderWithProviders(<Footer />);
    const footer = container.querySelector("footer");
    expect(footer).toBeInTheDocument();
    expect(footer.closest("main")).toBeNull();
  });

  it("renders the name, current year, rights and built-with credit", () => {
    renderWithProviders(<Footer />);
    const year = String(new Date().getFullYear());
    expect(screen.getByText(new RegExp(profile.name))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
    expect(screen.getByText(t.footer.builtWith)).toBeInTheDocument();
  });

  it("calls lenis.scrollTo(0) when back-to-top is clicked and a Lenis instance exists", () => {
    const scrollTo = vi.fn();
    vi.spyOn(useLenisModule, "getLenis").mockReturnValue({ scrollTo });

    renderWithProviders(<Footer />);
    fireEvent.click(screen.getByRole("button", { name: t.footer.backToTop }));

    expect(scrollTo).toHaveBeenCalledWith(0);
  });

  it("falls back to window.scrollTo when no Lenis instance exists (e.g. reduced motion)", () => {
    vi.spyOn(useLenisModule, "getLenis").mockReturnValue(null);
    const windowScrollTo = vi.fn();
    window.scrollTo = windowScrollTo;

    renderWithProviders(<Footer />);
    fireEvent.click(screen.getByRole("button", { name: t.footer.backToTop }));

    // Instant jump, not behavior:"smooth" — the no-Lenis path is the
    // reduced-motion user.
    expect(windowScrollTo).toHaveBeenCalledWith(0, 0);
  });
});

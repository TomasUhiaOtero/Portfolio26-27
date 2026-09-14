import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/renderWithProviders.jsx";
import { content, profile, DEFAULT_LANGUAGE } from "../data/content.js";
import Contact from "./Contact.jsx";

const t = content[DEFAULT_LANGUAGE];

const realMatchMedia = window.matchMedia;

// Same technique as Experience.test.jsx: jsdom's own matchMedia stub always
// reports `matches: false`, so `prefers-reduced-motion` has to be faked to
// exercise Reveal's reduced-motion branch and avoid unmeasured-layout
// ScrollTrigger noise in this environment.
function mockReducedMotion(matches) {
  window.matchMedia = (query) => ({
    matches: matches && query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  });
}

describe("Contact", () => {
  beforeEach(() => mockReducedMotion(true));
  afterEach(() => {
    window.matchMedia = realMatchMedia;
  });

  it("renders the section landmark the side rail anchors to", () => {
    const { container } = renderWithProviders(<Contact />);
    expect(container.querySelector("section#contacto")).toBeInTheDocument();
  });

  it("renders a mailto link for the profile email", () => {
    renderWithProviders(<Contact />);
    // The address itself is the accessible name — no aria-label override
    // (WCAG 2.5.3 Label-in-Name).
    const link = screen.getByRole("link", { name: profile.email });
    expect(link).toHaveAttribute("href", `mailto:${profile.email}`);
    expect(link).toHaveTextContent(profile.email);
  });

  it("renders phone, location, GitHub, LinkedIn and résumé links", () => {
    renderWithProviders(<Contact />);
    expect(screen.getByRole("link", { name: profile.phone })).toHaveAttribute(
      "href",
      `tel:${profile.phoneHref}`,
    );
    expect(screen.getByText(t.contact.location)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", profile.github);
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
      "href",
      profile.linkedin,
    );
    expect(screen.getByRole("link", { name: t.about.resumeCta })).toHaveAttribute(
      "href",
      profile.resume[DEFAULT_LANGUAGE],
    );
  });
});

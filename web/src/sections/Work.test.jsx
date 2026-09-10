import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import { renderWithProviders } from "../test/renderWithProviders.jsx";
import { projects, projectsByFilter, localized } from "../data/projects.js";
import { content, DEFAULT_LANGUAGE } from "../data/content.js";
import Work from "./Work.jsx";

const t = content[DEFAULT_LANGUAGE];

const realMatchMedia = window.matchMedia;

// jsdom's matchMedia stub always reports matches:false; fake
// prefers-reduced-motion so Reveal shows its content immediately.
function mockReducedMotion(matches) {
  window.matchMedia = (query) => ({
    matches: matches && query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  });
}

describe("Work", () => {
  beforeEach(() => mockReducedMotion(true));
  afterEach(() => {
    window.matchMedia = realMatchMedia;
  });

  it("renders the section landmark the side rail anchors to", () => {
    const { container } = renderWithProviders(<Work />);
    expect(container.querySelector("section#proyectos")).toBeInTheDocument();
  });

  it("shows every project as a button by default (filter = all)", () => {
    renderWithProviders(<Work />);
    const grid = screen.getByRole("list");
    const cards = within(grid).getAllByRole("button");
    expect(cards).toHaveLength(projects.length);
    for (const project of projects) {
      const label = new RegExp(localized(project.title, DEFAULT_LANGUAGE));
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("renders one filter pill per filter key, 'all' pressed initially", () => {
    renderWithProviders(<Work />);
    const group = screen.getByRole("group", { name: t.projects.filterLabel });
    const pills = within(group).getAllByRole("button");
    expect(pills.map((p) => p.textContent)).toEqual([
      t.projects.filters.all,
      t.projects.filters.frontend,
      t.projects.filters.backend,
      t.projects.filters.ia,
    ]);
    expect(within(group).getByRole("button", { name: t.projects.filters.all })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("narrows the grid to the chosen area when a filter pill is clicked", () => {
    renderWithProviders(<Work />);
    const group = screen.getByRole("group", { name: t.projects.filterLabel });

    fireEvent.click(within(group).getByRole("button", { name: t.projects.filters.ia }));

    const expected = projectsByFilter("ia");
    expect(expected.length).toBeGreaterThan(0);
    expect(expected.length).toBeLessThan(projects.length);

    const grid = screen.getByRole("list");
    expect(within(grid).getAllByRole("button")).toHaveLength(expected.length);
    for (const project of expected) {
      expect(project.categories).toContain("ia");
    }
    expect(
      within(group).getByRole("button", { name: t.projects.filters.ia }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});

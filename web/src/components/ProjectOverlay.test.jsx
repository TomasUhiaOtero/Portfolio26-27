import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/renderWithProviders.jsx";
import ProjectOverlay from "./ProjectOverlay.jsx";
import { projects } from "../data/projects.js";

const withDemoOnly = projects.find((p) => p.demo && !p.code);
const withCodeOnly = projects.find((p) => p.code && !p.demo);

describe("ProjectOverlay", () => {
  it("renders nothing without a project", () => {
    const { container } = renderWithProviders(
      <ProjectOverlay project={null} onClose={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("exposes itself as a modal dialog with the project title as its name", () => {
    renderWithProviders(
      <ProjectOverlay project={projects[0]} onClose={() => {}} />,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName(/TomasDex/);
  });

  it("omits the source button when a project has no repository", () => {
    renderWithProviders(
      <ProjectOverlay project={withDemoOnly} onClose={() => {}} />,
    );
    expect(screen.queryByRole("link", { name: /Código/ })).toBeNull();
  });

  it("omits the demo button when a project has no demo", () => {
    renderWithProviders(
      <ProjectOverlay project={withCodeOnly} onClose={() => {}} />,
    );
    expect(screen.queryByRole("link", { name: /demo/i })).toBeNull();
  });

  it("lists every technology in the stack", () => {
    renderWithProviders(
      <ProjectOverlay project={projects[0]} onClose={() => {}} />,
    );
    for (const tech of projects[0].stack) {
      expect(screen.getByText(tech)).toBeInTheDocument();
    }
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <ProjectOverlay project={projects[0]} onClose={onClose} />,
    );
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("keeps Tab inside the dialog", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ProjectOverlay project={projects[0]} onClose={() => {}} />,
    );
    const dialog = screen.getByRole("dialog");
    for (let i = 0; i < 12; i += 1) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement);
    }
  });
});

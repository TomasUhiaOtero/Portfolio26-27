import { describe, it, expect } from "vitest";
// eslint-disable-next-line no-unused-vars -- kept for parity with the task brief's specified test code.
import { render, screen } from "@testing-library/react";
import { renderWithProviders } from "../test/renderWithProviders.jsx";
import SideRail from "./SideRail.jsx";

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

  it("exposes the rail as a labelled navigation landmark", () => {
    renderWithProviders(<SideRail />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});

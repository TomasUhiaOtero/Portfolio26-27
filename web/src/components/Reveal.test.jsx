import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Reveal from "./Reveal.jsx";

describe("Reveal", () => {
  it("always renders its children into the document", () => {
    render(
      <Reveal>
        <p>Contenido</p>
      </Reveal>,
    );
    expect(screen.getByText("Contenido")).toBeInTheDocument();
  });
});

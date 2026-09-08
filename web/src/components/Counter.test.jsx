import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Counter from "./Counter.jsx";

describe("Counter", () => {
  it("shows zero before it is told to start", () => {
    render(<Counter value="8" start={false} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("passes a non-numeric value straight through", () => {
    render(<Counter value="Java · React" start={false} />);
    expect(screen.getByText("Java · React")).toBeInTheDocument();
  });

  it("keeps the suffix of a numeric value", () => {
    render(<Counter value="2+" start={false} />);
    expect(screen.getByText("0+")).toBeInTheDocument();
  });
});

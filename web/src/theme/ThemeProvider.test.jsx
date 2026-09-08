import { describe, it, expect, beforeEach } from "vitest";
// eslint-disable-next-line no-unused-vars -- kept for parity with the task brief's specified test code.
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme, THEME_KEY } from "./ThemeProvider.jsx";

function Probe() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} data-testid="probe">
      {theme}
    </button>
  );
}

const renderProbe = () =>
  render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  );

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it("defaults to dark when nothing is stored", () => {
    renderProbe();
    expect(screen.getByTestId("probe")).toHaveTextContent("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("restores a stored theme", () => {
    localStorage.setItem(THEME_KEY, "light");
    renderProbe();
    expect(screen.getByTestId("probe")).toHaveTextContent("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("ignores a corrupt stored value instead of applying it", () => {
    localStorage.setItem(THEME_KEY, "neon");
    renderProbe();
    expect(screen.getByTestId("probe")).toHaveTextContent("dark");
  });

  it("toggles, writes the attribute and persists", async () => {
    const user = userEvent.setup();
    renderProbe();
    await user.click(screen.getByTestId("probe"));
    expect(screen.getByTestId("probe")).toHaveTextContent("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem(THEME_KEY)).toBe("light");
  });
});

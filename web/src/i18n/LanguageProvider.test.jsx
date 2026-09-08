import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider, useLanguage, LANG_KEY } from "./LanguageProvider.jsx";

function Probe() {
  const { lang, t, setLang } = useLanguage();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="headline">{t.hero.headline}</span>
      <button onClick={() => setLang(lang === "es" ? "en" : "es")}>swap</button>
    </div>
  );
}

const renderProbe = () =>
  render(
    <LanguageProvider>
      <Probe />
    </LanguageProvider>,
  );

describe("LanguageProvider", () => {
  beforeEach(() => localStorage.clear());

  it("starts in Spanish and sets the document language", () => {
    renderProbe();
    expect(screen.getByTestId("lang")).toHaveTextContent("es");
    expect(document.documentElement.lang).toBe("es");
  });

  it("swaps the copy and the document language together", async () => {
    const user = userEvent.setup();
    renderProbe();
    await user.click(screen.getByRole("button", { name: "swap" }));
    expect(screen.getByTestId("headline")).toHaveTextContent(
      "Full-stack developer",
    );
    expect(document.documentElement.lang).toBe("en");
    expect(localStorage.getItem(LANG_KEY)).toBe("en");
  });

  it("ignores an unknown stored language", () => {
    localStorage.setItem(LANG_KEY, "fr");
    renderProbe();
    expect(screen.getByTestId("lang")).toHaveTextContent("es");
  });
});

import { describe, it, expect, afterEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/renderWithProviders.jsx";
import { content, DEFAULT_LANGUAGE } from "../data/content.js";
import ChatWidget from "./ChatWidget.jsx";

const t = content[DEFAULT_LANGUAGE].chat;

describe("ChatWidget", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is closed by default and opens the panel on click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatWidget />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: t.openLabel }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(t.greeting)).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatWidget />);

    await user.click(screen.getByRole("button", { name: t.openLabel }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("sends a message and renders the assistant's reply", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ reply: "Trabajo con React y Java." }),
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<ChatWidget />);

    await user.click(screen.getByRole("button", { name: t.openLabel }));
    await user.type(screen.getByPlaceholderText(t.placeholder), "¿Con qué tecnologías trabajas?");
    await user.click(screen.getByRole("button", { name: t.send }));

    expect(await screen.findByText("Trabajo con React y Java.")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/.netlify/functions/chat",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("shows an error message on a failed request, without losing prior messages", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const user = userEvent.setup();
    renderWithProviders(<ChatWidget />);

    await user.click(screen.getByRole("button", { name: t.openLabel }));
    await user.type(screen.getByPlaceholderText(t.placeholder), "Hola");
    await user.click(screen.getByRole("button", { name: t.send }));

    expect(await screen.findByText(t.errorMessage)).toBeInTheDocument();
    expect(screen.getByText("Hola")).toBeInTheDocument();
  });
});

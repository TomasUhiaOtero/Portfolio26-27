import { describe, it, expect, afterEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/renderWithProviders.jsx";
import { content, DEFAULT_LANGUAGE } from "../data/content.js";
import { REQUEST_LIMITS } from "../../netlify/functions/lib/requestGuards.js";
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

  it("trims the outgoing request payload to fit the server's limits once history grows past them, while still rendering the full history", async () => {
    // Regression test: ChatWidget used to send the ENTIRE growing history
    // on every request. Once a real conversation crossed
    // REQUEST_LIMITS.MAX_MESSAGES or MAX_TOTAL_CHARS, validateMessages()
    // on the server would reject every subsequent request with a 400 and
    // there was no recovery short of reloading the page.
    const REPLY_LEN = 300;
    // Comfortably exceeds MAX_TOTAL_CHARS (and, since each exchange adds 2
    // messages, MAX_MESSAGES too) well before the loop ends.
    const iterations = Math.ceil(REQUEST_LIMITS.MAX_TOTAL_CHARS / REPLY_LEN) + 3;

    let callCount = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => {
        const replyIndex = callCount++;
        return {
          ok: true,
          json: async () => ({ reply: `reply-${replyIndex}-${"x".repeat(REPLY_LEN)}` }),
        };
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ChatWidget />);

    await user.click(screen.getByRole("button", { name: t.openLabel }));
    const input = screen.getByPlaceholderText(t.placeholder);
    const sendButton = screen.getByRole("button", { name: t.send });

    for (let i = 0; i < iterations; i++) {
      await user.type(input, `msg-${i}`);
      await user.click(sendButton);
      await screen.findByText(new RegExp(`^reply-${i}-`));
    }

    // The rendered history still holds everything the user sent — trimming
    // only applies to the outgoing request payload, not the UI.
    expect(screen.getByText("msg-0")).toBeInTheDocument();
    expect(screen.getByText(`msg-${iterations - 1}`)).toBeInTheDocument();

    const lastCall = fetch.mock.calls.at(-1);
    const lastBody = JSON.parse(lastCall[1].body);
    const totalChars = lastBody.messages.reduce((sum, m) => sum + m.content.length, 0);

    expect(lastBody.messages.length).toBeLessThanOrEqual(REQUEST_LIMITS.MAX_MESSAGES);
    expect(totalChars).toBeLessThanOrEqual(REQUEST_LIMITS.MAX_TOTAL_CHARS);
  });
});

import { describe, it, expect, afterEach, vi } from "vitest";
import handler from "../chat.js";
import { REQUEST_LIMITS } from "./requestGuards.js";

function makeRequest({ method = "POST", headers = {}, body } = {}) {
  const map = new Map(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
  return {
    method,
    headers: { get: (name) => map.get(name.toLowerCase()) ?? null },
    json: async () => body,
  };
}

describe("chat handler", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("rejects non-POST requests", async () => {
    const response = await handler(makeRequest({ method: "GET" }));
    expect(response.status).toBe(405);
  });

  it("rejects a request from a mismatched Origin", async () => {
    vi.stubEnv("URL", "https://tomasuhia.netlify.app");
    const response = await handler(
      makeRequest({
        headers: { origin: "https://evil.example", "x-nf-client-connection-ip": "1.1.1.1" },
        body: { messages: [{ role: "user", content: "hola" }] },
      }),
    );
    expect(response.status).toBe(403);
  });

  it("rejects an invalid message history", async () => {
    const response = await handler(
      makeRequest({
        headers: { "x-nf-client-connection-ip": "1.1.1.2" },
        body: { messages: [] },
      }),
    );
    expect(response.status).toBe(400);
  });

  it("returns 500 when GROQ_API_KEY is not configured", async () => {
    const response = await handler(
      makeRequest({
        headers: { "x-nf-client-connection-ip": "1.1.1.3" },
        body: { messages: [{ role: "user", content: "hola" }] },
      }),
    );
    expect(response.status).toBe(500);
  });

  it("calls Groq with the system prompt prepended and returns its reply", async () => {
    vi.stubEnv("GROQ_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "Trabajo con React y Java." } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await handler(
      makeRequest({
        headers: { "x-nf-client-connection-ip": "1.1.1.4" },
        body: { messages: [{ role: "user", content: "¿Con qué tecnologías trabajas?" }] },
      }),
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.reply).toBe("Trabajo con React y Java.");

    const [, requestInit] = fetchMock.mock.calls[0];
    const sentBody = JSON.parse(requestInit.body);
    expect(sentBody.messages[0].role).toBe("system");
    expect(sentBody.messages[1]).toEqual({ role: "user", content: "¿Con qué tecnologías trabajas?" });
  });

  it("returns 502 when Groq responds with an error status", async () => {
    vi.stubEnv("GROQ_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    const response = await handler(
      makeRequest({
        headers: { "x-nf-client-connection-ip": "1.1.1.5" },
        body: { messages: [{ role: "user", content: "hola" }] },
      }),
    );
    expect(response.status).toBe(502);
  });

  it("returns 429 once the per-IP rate limit is exceeded", async () => {
    vi.stubEnv("GROQ_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: "ok" } }] }),
      }),
    );

    const ip = "1.1.1.6";
    let last;
    for (let i = 0; i < REQUEST_LIMITS.RATE_LIMIT_MAX + 1; i += 1) {
      last = await handler(
        makeRequest({
          headers: { "x-nf-client-connection-ip": ip },
          body: { messages: [{ role: "user", content: "hola" }] },
        }),
      );
    }
    expect(last.status).toBe(429);
  });

  it("returns 502 when Groq responds with ok status but invalid JSON", async () => {
    vi.stubEnv("GROQ_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error("invalid json");
        },
      }),
    );

    const response = await handler(
      makeRequest({
        headers: { "x-nf-client-connection-ip": "1.1.1.7" },
        body: { messages: [{ role: "user", content: "hola" }] },
      }),
    );
    expect(response.status).toBe(502);
  });
});

import { describe, it, expect } from "vitest";
import { validateMessages, isAllowedOrigin, checkRateLimit, REQUEST_LIMITS } from "./requestGuards.js";

describe("validateMessages", () => {
  it("accepts a well-formed history", () => {
    expect(validateMessages([{ role: "user", content: "Hola" }])).toEqual({ ok: true });
  });

  it("rejects a missing or empty array", () => {
    expect(validateMessages(undefined).ok).toBe(false);
    expect(validateMessages([]).ok).toBe(false);
  });

  it("rejects more than the configured message limit", () => {
    const messages = Array.from({ length: REQUEST_LIMITS.MAX_MESSAGES + 1 }, () => ({
      role: "user",
      content: "hola",
    }));
    const result = validateMessages(messages);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  it("rejects a history over the combined character limit", () => {
    const longMessage = "a".repeat(REQUEST_LIMITS.MAX_TOTAL_CHARS + 1);
    const result = validateMessages([{ role: "user", content: longMessage }]);
    expect(result.ok).toBe(false);
  });

  it("rejects a message with an invalid role or empty content", () => {
    expect(validateMessages([{ role: "system", content: "x" }]).ok).toBe(false);
    expect(validateMessages([{ role: "user", content: "  " }]).ok).toBe(false);
    expect(validateMessages([{ role: "user" }]).ok).toBe(false);
  });
});

describe("isAllowedOrigin", () => {
  const siteUrl = "https://tomasuhia.netlify.app";

  it("allows a matching origin", () => {
    expect(isAllowedOrigin("https://tomasuhia.netlify.app", siteUrl)).toBe(true);
  });

  it("rejects a different origin", () => {
    expect(isAllowedOrigin("https://evil.example", siteUrl)).toBe(false);
  });

  it("rejects a missing origin header", () => {
    expect(isAllowedOrigin(null, siteUrl)).toBe(false);
  });

  it("rejects a malformed origin header instead of throwing", () => {
    expect(isAllowedOrigin("not-a-url", siteUrl)).toBe(false);
  });
});

describe("checkRateLimit", () => {
  it("allows requests under the limit and tracks the count", () => {
    const store = new Map();
    const now = Date.now();
    for (let i = 0; i < REQUEST_LIMITS.RATE_LIMIT_MAX; i += 1) {
      expect(checkRateLimit("1.2.3.4", store, now).allowed).toBe(true);
    }
  });

  it("blocks the request once the limit is exceeded", () => {
    const store = new Map();
    const now = Date.now();
    for (let i = 0; i < REQUEST_LIMITS.RATE_LIMIT_MAX; i += 1) {
      checkRateLimit("5.6.7.8", store, now);
    }
    const result = checkRateLimit("5.6.7.8", store, now);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets the count once the window has elapsed", () => {
    const store = new Map();
    const now = Date.now();
    for (let i = 0; i < REQUEST_LIMITS.RATE_LIMIT_MAX; i += 1) {
      checkRateLimit("9.9.9.9", store, now);
    }
    const later = now + REQUEST_LIMITS.RATE_LIMIT_WINDOW_MS + 1;
    expect(checkRateLimit("9.9.9.9", store, later).allowed).toBe(true);
  });
});

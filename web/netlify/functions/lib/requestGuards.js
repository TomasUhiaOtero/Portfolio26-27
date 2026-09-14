/**
 * Pure request-validation and abuse-limiting helpers for chat.js. Kept
 * separate from the handler so they're testable without mocking `fetch` or
 * `Request`/`Response` — see docs/superpowers/specs/2026-09-14-portfolio-chatbot-design.md.
 */

export const REQUEST_LIMITS = {
  MAX_MESSAGES: 12,
  MAX_TOTAL_CHARS: 4000,
  RATE_LIMIT_MAX: 20,
  RATE_LIMIT_WINDOW_MS: 10 * 60 * 1000,
};

export function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, status: 400, error: "messages must be a non-empty array" };
  }
  if (messages.length > REQUEST_LIMITS.MAX_MESSAGES) {
    return { ok: false, status: 400, error: `messages must not exceed ${REQUEST_LIMITS.MAX_MESSAGES}` };
  }

  let totalChars = 0;
  for (const message of messages) {
    const validRole = message?.role === "user" || message?.role === "assistant";
    const validContent = typeof message?.content === "string" && message.content.trim() !== "";
    if (!validRole || !validContent) {
      return { ok: false, status: 400, error: "each message needs a valid role and non-empty content" };
    }
    totalChars += message.content.length;
  }

  if (totalChars > REQUEST_LIMITS.MAX_TOTAL_CHARS) {
    return {
      ok: false,
      status: 400,
      error: `messages must not exceed ${REQUEST_LIMITS.MAX_TOTAL_CHARS} characters combined`,
    };
  }

  return { ok: true };
}

export function isAllowedOrigin(originHeader, siteUrl) {
  if (!originHeader) return false;
  try {
    return new URL(originHeader).origin === new URL(siteUrl).origin;
  } catch {
    return false;
  }
}

export function checkRateLimit(id, store, now = Date.now()) {
  const entry = store.get(id);

  if (!entry || now >= entry.resetAt) {
    store.set(id, { count: 1, resetAt: now + REQUEST_LIMITS.RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= REQUEST_LIMITS.RATE_LIMIT_MAX) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { allowed: true };
}

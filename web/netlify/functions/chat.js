/**
 * POST /.netlify/functions/chat — the only network call ChatWidget.jsx
 * makes. Stateless per request except for the module-level rate-limit
 * store below, which is best-effort and resets on cold start by design —
 * see docs/superpowers/specs/2026-09-14-portfolio-chatbot-design.md.
 */
import { buildSystemPrompt } from "./lib/portfolioContext.js";
import { validateMessages, isAllowedOrigin, checkRateLimit } from "./lib/requestGuards.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const JSON_HEADERS = { "Content-Type": "application/json" };

// Module-level: persists across invocations on the same warm instance,
// which is what makes it a rate limiter at all rather than a no-op. Lost
// on cold start — an accepted trade-off, not a bug.
const rateLimitStore = new Map();

function json(body, status) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

export default async function handler(req) {
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  // Best-effort only: an Origin header can be spoofed outside a browser.
  // It stops the trivial case (another site's frontend fetching this
  // endpoint directly) without needing any server-side session state.
  const siteUrl = process.env.URL || process.env.DEPLOY_URL;
  const origin = req.headers.get("origin") ?? req.headers.get("referer");
  if (siteUrl && !isAllowedOrigin(origin, siteUrl)) {
    return json({ error: "forbidden" }, 403);
  }

  const clientIp = req.headers.get("x-nf-client-connection-ip") ?? "unknown";
  if (!checkRateLimit(clientIp, rateLimitStore).allowed) {
    return json({ error: "rate_limited" }, 429);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const validation = validateMessages(body?.messages);
  if (!validation.ok) {
    return json({ error: validation.error }, validation.status);
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return json({ error: "not_configured" }, 500);
  }

  let upstream;
  try {
    upstream = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: buildSystemPrompt() }, ...body.messages],
        temperature: 0.4,
        max_tokens: 600,
      }),
    });
  } catch {
    return json({ error: "upstream_unreachable" }, 502);
  }

  if (!upstream.ok) {
    return json({ error: "upstream_error" }, 502);
  }

  const data = await upstream.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) {
    return json({ error: "empty_reply" }, 502);
  }

  return json({ reply }, 200);
}

import { useEffect, useId, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import useFocusTrap from "../hooks/useFocusTrap.js";
import { ChatIcon } from "./icons.jsx";
import { REQUEST_LIMITS } from "../../netlify/functions/lib/requestGuards.js";

/**
 * Floating chat bubble, bottom-right. The button sits clear of SideRail,
 * which is a centered bottom bar on mobile (`bottom-4 inset-x-0 w-fit
 * mx-auto`) and a vertically-centered right-edge column on desktop
 * (`md:right-5 md:top-1/2`, ~56px wide: size-10 buttons + px-2 padding) —
 * see SideRail.jsx. The open panel is wider (`max-w-sm`) than the gap
 * between the button and SideRail, so it uses a larger `md:right-24` offset
 * to clear SideRail's column on desktop instead of sharing the button's
 * `right-5` — that leaves a visible gap between button and panel on
 * desktop, which is an accepted tradeoff.
 *
 * No persistence by design: `messages` is plain component state and is
 * gone on reload, matching the approved spec.
 */

/**
 * Trims a message history down to what the server's validateMessages()
 * will accept (REQUEST_LIMITS.MAX_MESSAGES and MAX_TOTAL_CHARS), dropping
 * the oldest messages first so the most recent, most relevant context is
 * kept. The full history is still what's rendered in the UI — this is only
 * applied to the outgoing request payload.
 */
function trimForRequest(messages) {
  let trimmed = messages.slice(-REQUEST_LIMITS.MAX_MESSAGES);

  let totalChars = trimmed.reduce((sum, m) => sum + m.content.length, 0);
  while (trimmed.length > 0 && totalChars > REQUEST_LIMITS.MAX_TOTAL_CHARS) {
    totalChars -= trimmed[0].content.length;
    trimmed = trimmed.slice(1);
  }

  return trimmed;
}

export default function ChatWidget() {
  const { t } = useLanguage();
  const c = t.chat;
  const titleId = useId();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const panelRef = useRef(null);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || pending) return;

    const nextMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setPending(true);

    try {
      const response = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: trimForRequest(nextMessages) }),
      });

      if (!response.ok) throw new Error("request_failed");
      const data = await response.json();
      if (!data?.reply) throw new Error("empty_reply");

      setMessages((current) => [...current, { role: "assistant", content: data.reply }]);
    } catch {
      setError(c.errorMessage);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? c.closeLabel : c.openLabel}
        aria-expanded={open}
        className="fixed bottom-20 md:bottom-5 right-5 z-40 flex size-12 cursor-pointer items-center justify-center rounded-full border border-line bg-accent text-bg shadow-[0_8px_30px_-12px_rgba(0,0,0,0.5)] transition-transform duration-200 ease-entrance active:scale-[0.97]"
      >
        <ChatIcon aria-hidden="true" className="size-6" />
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed bottom-36 md:bottom-20 right-5 md:right-24 z-40 flex max-h-[70vh] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-[22px] border border-line bg-surface/95 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 id={titleId} className="text-sm font-semibold text-text">
              {c.title}
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={c.closeLabel}
              className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-mute transition-colors hover:text-text"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            <p className="max-w-[85%] rounded-2xl rounded-bl-sm bg-bg px-3 py-2 text-sm text-text">
              {c.greeting}
            </p>
            {messages.map((message, index) => (
              <p
                key={index}
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                  message.role === "user"
                    ? "ml-auto rounded-br-sm bg-accent text-bg"
                    : "rounded-bl-sm bg-bg text-text"
                }`}
              >
                {message.content}
              </p>
            ))}
            {pending && (
              <p className="max-w-[85%] rounded-2xl rounded-bl-sm bg-bg px-3 py-2 text-sm text-mute">
                {c.thinking}
              </p>
            )}
            {error && <p className="text-xs text-mute">{error}</p>}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-line p-3">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={c.placeholder}
              className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 py-2 text-sm text-text outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              aria-label={c.send}
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-accent text-bg transition-transform duration-200 ease-entrance active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span aria-hidden="true">→</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
}

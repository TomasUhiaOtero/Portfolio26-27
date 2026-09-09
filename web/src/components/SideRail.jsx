import { useCallback, useMemo, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { getLenis } from "../hooks/useLenis.js";
import useActiveSection from "../hooks/useActiveSection.js";
import ThemeToggle from "./ThemeToggle.jsx";
import LangToggle from "./LangToggle.jsx";

/**
 * The site's whole-page navigation: a fixed column of six section
 * "bars" plus the theme and language toggles. Each bar is its own full
 * `<button>` — 40px accessible hit area, `aria-label` for its section
 * name, a decorative indicator span inside it — so it is always in the
 * Tab sequence, in a fixed on-screen position, whether or not the rail
 * has been hovered or focused. Nothing about reaching or activating a
 * link ever depends on the hover-expand state below.
 *
 * Hovering or focusing anywhere in the rail also reveals a second,
 * purely decorative panel that repeats each bar's label as legible text
 * for sighted users, styled as a glass card. It is `aria-hidden` and
 * carries `inert` while collapsed. Both are needed together: `aria-hidden`
 * only removes it from the accessibility tree, it does not remove its
 * contents from the Tab sequence, so on its own it would leave a repeat
 * of this project's earlier focus-management bug — keyboard focus
 * landing on something invisible. `inert` is what actually keeps the
 * panel out of Tab order while collapsed, which matters even though the
 * panel holds nothing but `<span>`s today: it is defence against a
 * later edit turning one of those spans into a real control and
 * silently reopening that exact bug. The real navigation controls are
 * the bars above, never this panel.
 *
 * One component renders both layouts: above `md` this is the vertical
 * right-edge rail; below `md` the same buttons render as a horizontally
 * centred bottom dock. Only the container's CSS changes between them —
 * never two separate component trees, and never two sets of buttons.
 */
export default function SideRail() {
  const { t } = useLanguage();
  const { links } = t.nav;
  const ids = useMemo(() => links.map((link) => link.id), [links]);
  const active = useActiveSection(ids);
  const [expanded, setExpanded] = useState(false);
  const navRef = useRef(null);

  const expand = useCallback(() => setExpanded(true), []);

  const collapse = useCallback((event) => {
    // A blur/mouseleave that lands on another element still inside the
    // rail (e.g. Tab moving from one bar to the next) must not collapse
    // the panel mid-traversal. `relatedTarget` is typed `EventTarget`,
    // not `Node` — it can be `null`, or (observed from a synthetic
    // pointer event) something that isn't a `Node` at all, and
    // `Node.contains()` throws on anything else, which was silently
    // aborting the click that was about to fire right after. Guard with
    // `instanceof Node` before ever calling `contains`.
    const related = event?.relatedTarget;
    if (related instanceof Node && navRef.current?.contains(related)) {
      return;
    }
    setExpanded(false);
  }, []);

  const handleSelect = useCallback((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(el);
    } else {
      el.scrollIntoView();
    }
  }, []);

  return (
    <nav
      ref={navRef}
      aria-label={t.nav.railLabel}
      onMouseEnter={expand}
      onMouseLeave={collapse}
      onFocus={expand}
      onBlur={collapse}
      className="fixed bottom-4 inset-x-0 z-40 mx-auto flex w-fit flex-row items-center gap-2 rounded-2xl border border-line bg-surface/60 px-3 py-2 backdrop-blur-xl md:inset-x-auto md:right-6 md:top-1/2 md:bottom-auto md:mx-0 md:w-auto md:-translate-y-1/2 md:flex-col md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none"
    >
      {/* Decorative label panel — see the block comment above for why it
          is aria-hidden *and* inert, and why it never holds a control. */}
      <div
        aria-hidden="true"
        inert={!expanded}
        className={`pointer-events-none absolute bottom-full left-1/2 mb-3 flex origin-bottom -translate-x-1/2 flex-col gap-2 whitespace-nowrap rounded-2xl border border-line bg-surface/60 px-4 py-3 backdrop-blur-xl transition-[opacity,transform] duration-200 ease-entrance md:bottom-auto md:left-auto md:right-full md:top-1/2 md:mb-0 md:mr-3 md:origin-right md:-translate-y-1/2 md:translate-x-0 ${
          expanded ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {links.map((link, index) => (
          <span
            key={link.id}
            style={{ transitionDelay: expanded ? `${Math.min(index, 5) * 40}ms` : "0ms" }}
            className="text-sm text-text transition-opacity duration-200 ease-entrance"
          >
            {link.label}
          </span>
        ))}
      </div>

      {links.map((link) => {
        const isActive = link.id === active;
        return (
          <button
            key={link.id}
            type="button"
            aria-label={link.label}
            aria-current={isActive ? "true" : undefined}
            onClick={() => handleSelect(link.id)}
            className="flex h-10 w-10 shrink-0 items-center justify-center active:scale-[0.97]"
          >
            <span
              aria-hidden="true"
              className={`block h-1.5 w-10 origin-center rounded-full transition-transform duration-200 ease-entrance ${
                isActive ? "scale-x-100 bg-accent" : "scale-x-[0.6] bg-line"
              }`}
            />
          </button>
        );
      })}

      <div className="mx-1 h-6 w-px shrink-0 bg-line md:mx-0 md:my-1 md:h-px md:w-6" />

      <ThemeToggle />
      <LangToggle />
    </nav>
  );
}

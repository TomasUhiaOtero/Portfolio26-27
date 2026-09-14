import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { getLenis } from "../hooks/useLenis.js";
import useActiveSection from "../hooks/useActiveSection.js";
import ThemeToggle from "./ThemeToggle.jsx";
import LangToggle from "./LangToggle.jsx";

// One line-icon per section id (24×24, drawn with `currentColor` strokes
// so the active/inactive colour is just the button's text colour).
const ICONS = {
  inicio: <path d="M3 10.5 12 4l9 6.5M5 9.5V20h5v-5h4v5h5V9.5" />,
  "sobre-mi": (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19.5c1.2-3.4 4-5 6.5-5s5.3 1.6 6.5 5" />
    </>
  ),
  servicios: (
    <>
      <circle cx="7" cy="7" r="2.1" />
      <circle cx="17" cy="7" r="2.1" />
      <circle cx="7" cy="17" r="2.1" />
      <circle cx="17" cy="17" r="2.1" />
    </>
  ),
  experiencia: (
    <>
      <rect x="4" y="7" width="16" height="12" rx="2" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
    </>
  ),
  proyectos: <path d="M4 7a2 2 0 0 1 2-2h3.2l1.6 2H18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />,
  contacto: (
    <>
      <rect x="4" y="5.5" width="16" height="13" rx="2" />
      <path d="m5 7 7 5 7-5" />
    </>
  ),
};

/**
 * The site's whole-page navigation: a fixed strip of six circular section
 * buttons plus the theme and language toggles. Each button is its own
 * `<button>` — 40px hit area, a line icon, and `aria-label` for its
 * section name — always in the Tab sequence and in a fixed on-screen
 * position. Hovering (or keyboard-focusing) a button reveals a small
 * decorative tooltip repeating its label; the tooltip is `aria-hidden`
 * (the `aria-label` already carries the name) and never focusable, so it
 * adds no Tab stop.
 *
 * One component renders both layouts: above `md` this is the vertical
 * right-edge strip; below `md` the same buttons render as a horizontally
 * centred bottom dock. Only the container's CSS changes between them —
 * never two separate component trees, and never two sets of buttons.
 */
export default function SideRail() {
  const { t } = useLanguage();
  const { links } = t.nav;
  const ids = useMemo(() => links.map((link) => link.id), [links]);
  const active = useActiveSection(ids);
  const navRef = useRef(null);

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

  // Magnet effect (native): on the vertical `md` rail every bar's
  // indicator springs toward the pointer as it nears, with a sharper pull
  // on the closest and a soft falloff on its neighbours so the whole
  // column visibly bends toward the cursor — then springs back when the
  // pointer leaves. A per-channel spring (`v += (target - x) * STIFFNESS;
  // v *= DAMPING; x += v`) run in one rAF loop gives the elastic feel; a
  // plain CSS transition would just glide.
  //
  // The transform lives on an inner span (`[data-rail-magnet]`) so the
  // button itself is never transformed: its rect stays stable to measure
  // against and its own `active:` press scale keeps working. The loop
  // idles (no rAF scheduled) whenever the pointer is away and every bar
  // has settled. Skipped under reduced motion and below `md`.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return undefined;

    const RADIUS = 150; // px around a bar centre where the pull reaches
    const MAX_X = 18; // px toward the pointer, along the rail's short axis
    const MAX_Y = 9; // px along its long axis
    const MAX_SCALE = 0.4; // extra scale on the closest bar (1 -> 1.4)
    const STIFFNESS = 0.16;
    const DAMPING = 0.72;

    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wideMq = window.matchMedia("(min-width: 768px)");

    const pointer = { x: -9999, y: -9999, inside: false };
    let bars = [];
    let raf = 0;

    const measure = () => {
      bars = Array.from(nav.querySelectorAll("[data-rail-bar]")).map((el) => {
        const prev = bars.find((b) => b.el === el);
        return {
          el,
          target: el.querySelector("[data-rail-magnet]"),
          rect: el.getBoundingClientRect(),
          x: prev?.x ?? 0,
          y: prev?.y ?? 0,
          s: prev?.s ?? 0,
          vx: prev?.vx ?? 0,
          vy: prev?.vy ?? 0,
          vs: prev?.vs ?? 0,
        };
      });
    };

    const tick = () => {
      const on = !reduceMq.matches && wideMq.matches;
      let moving = false;

      for (const b of bars) {
        let tx = 0;
        let ty = 0;
        let ts = 0;

        if (on && pointer.inside) {
          const dx = pointer.x - (b.rect.left + b.rect.width / 2);
          const dy = pointer.y - (b.rect.top + b.rect.height / 2);
          const pull = Math.max(0, 1 - Math.hypot(dx, dy) / RADIUS);
          tx = (dx / RADIUS) * MAX_X * pull;
          ty = (dy / RADIUS) * MAX_Y * pull;
          ts = MAX_SCALE * pull * pull;
        }

        b.vx += (tx - b.x) * STIFFNESS;
        b.vx *= DAMPING;
        b.x += b.vx;
        b.vy += (ty - b.y) * STIFFNESS;
        b.vy *= DAMPING;
        b.y += b.vy;
        b.vs += (ts - b.s) * STIFFNESS;
        b.vs *= DAMPING;
        b.s += b.vs;

        if (
          Math.abs(b.x - tx) > 0.05 ||
          Math.abs(b.y - ty) > 0.05 ||
          Math.abs(b.s - ts) > 0.002 ||
          Math.abs(b.vx) > 0.05 ||
          Math.abs(b.vy) > 0.05 ||
          Math.abs(b.vs) > 0.002
        ) {
          moving = true;
        }

        if (b.target) {
          // Written as CSS vars (not `style.transform`) so the button's
          // own `active:` press scale composes with the magnet transform.
          b.target.style.setProperty("--mx", `${b.x.toFixed(2)}px`);
          b.target.style.setProperty("--my", `${b.y.toFixed(2)}px`);
          b.target.style.setProperty("--ms", (1 + b.s).toFixed(3));
        }
      }

      raf = moving || pointer.inside ? requestAnimationFrame(tick) : 0;
    };

    const onMove = (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      const r = nav.getBoundingClientRect();
      pointer.inside =
        event.clientX > r.left - RADIUS &&
        event.clientX < r.right + RADIUS &&
        event.clientY > r.top - RADIUS &&
        event.clientY < r.bottom + RADIUS;
      if (pointer.inside && !raf) raf = requestAnimationFrame(tick);
    };

    measure();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure, { passive: true });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      for (const b of bars) {
        if (!b.target) continue;
        b.target.style.removeProperty("--mx");
        b.target.style.removeProperty("--my");
        b.target.style.removeProperty("--ms");
      }
    };
  }, []);

  return (
    <nav
      ref={navRef}
      aria-label={t.nav.railLabel}
      className="fixed bottom-4 inset-x-0 z-40 mx-auto flex w-fit max-w-[calc(100vw-1.5rem)] flex-row items-center gap-1.5 rounded-2xl border border-line bg-surface/60 px-2 py-2 backdrop-blur-xl md:inset-x-auto md:right-5 md:top-1/2 md:bottom-auto md:mx-0 md:w-auto md:max-w-none md:-translate-y-1/2 md:flex-col md:gap-3 md:rounded-[26px] md:bg-surface/70 md:px-2 md:py-3 md:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.5)] md:backdrop-blur-none"
    >
      {links.map((link) => {
        const isActive = link.id === active;
        return (
          // `[data-rail-bar]` is the wrapper the magnet loop measures — it
          // is never transformed, so its rect stays a stable anchor. The
          // button inside (`[data-rail-magnet]`) is what the spring moves.
          <div key={link.id} data-rail-bar className="shrink-0">
            <button
              type="button"
              data-rail-magnet
              aria-label={link.label}
              aria-current={isActive ? "true" : undefined}
              onClick={() => handleSelect(link.id)}
              className={`group relative flex size-9 cursor-pointer items-center justify-center rounded-full border transition-colors duration-200 ease-out will-change-transform [transform:translate3d(var(--mx,0),var(--my,0),0)_scale(calc(var(--ms,1)*var(--press,1)))] active:[--press:0.92] motion-reduce:!transform-none md:size-10 ${
                isActive
                  ? "border-accent bg-accent text-bg"
                  : "border-line bg-surface text-mute hover:border-text/25 hover:text-text"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="h-[18px] w-[18px]"
              >
                {ICONS[link.id] ?? <circle cx="12" cy="12" r="3" />}
              </svg>

              {/* Decorative label tooltip — the `aria-label` above already
                  names the button, so this is `aria-hidden` and not
                  focusable, adding no Tab stop. Above the button on the
                  mobile dock, to its left on the desktop strip. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 scale-95 whitespace-nowrap rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-medium text-text opacity-0 shadow-md transition-[opacity,transform] duration-150 ease-out group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 md:bottom-1/2 md:left-auto md:right-full md:mb-0 md:mr-3 md:translate-x-0 md:translate-y-1/2"
              >
                {link.label}
              </span>
            </button>
          </div>
        );
      })}

      <div className="mx-1 h-6 w-px shrink-0 bg-line md:mx-0 md:my-1 md:h-px md:w-6" />

      <ThemeToggle />
      <LangToggle />
    </nav>
  );
}

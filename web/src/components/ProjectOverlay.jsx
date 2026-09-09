import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { localized } from "../data/projects.js";
import useReducedMotion from "../hooks/useReducedMotion.js";
import useFocusTrap from "../hooks/useFocusTrap.js";
import { getLenis } from "../hooks/useLenis.js";
import { ENTRANCE_EASE } from "../lib/ease.js";
import Chip from "./Chip.jsx";
import Button from "./Button.jsx";

const TRANSITION_DURATION = 0.5;

// The delta between two rects expressed as the transform that would move
// `from` on top of `to` — used both to mount the panel at the source
// card's rect and, in reverse, to send it back there on close. `transform`
// only (translate + scale from the panel's own center), never
// width/height/top/left: those trigger layout on every frame, this is a
// single composited layer the whole way through.
function deltaTransform(from, to) {
  const fromCenterX = from.left + from.width / 2;
  const fromCenterY = from.top + from.height / 2;
  const toCenterX = to.left + to.width / 2;
  const toCenterY = to.top + to.height / 2;
  return {
    x: fromCenterX - toCenterX,
    y: fromCenterY - toCenterY,
    scaleX: to.width === 0 ? 1 : from.width / to.width,
    scaleY: to.height === 0 ? 1 : from.height / to.height,
  };
}

/**
 * The project detail overlay — the destination of the shared-element
 * transition Task 13 deferred (ruling R4, progress.md). `Work.jsx` owns
 * `selectedProject`/`closeProject`; this component only renders it.
 *
 * Lifecycle note: `project` (the prop) and `displayProject` (local state)
 * are deliberately not the same thing. `Work.jsx` clears `project` to
 * `null` the instant `onClose` fires — `onClose` has to be synchronous,
 * both because a keyboard/mouse user expects a dialog to actually close
 * on Escape/backdrop-click right away, not after a tween, and because a
 * parent-driven unmount gives an in-flight GSAP tween nowhere to keep
 * animating. `displayProject` lags one beat behind: it keeps the last
 * project on screen for exactly as long as the reverse shared-element
 * tween needs, then clears itself in that tween's `onComplete`. That is
 * what makes "reverse it on close" possible without this component ever
 * delaying the `onClose` call itself.
 */
export default function ProjectOverlay({ project, onClose, originRef }) {
  const { lang, t } = useLanguage();
  const reduced = useReducedMotion();
  const titleId = useId();

  const [displayProject, setDisplayProject] = useState(project);
  const dialogRef = useRef(null);

  const open = Boolean(project);

  // Keep `displayProject` in sync the moment a (new) project opens — done
  // as a render-time state adjustment (React's own pattern for "derive
  // state from a prop change"), not a `setState` inside an effect, so a
  // test mounting directly with a project never sees an empty-then-
  // populated flash and there is no extra render round-trip.
  const [prevProject, setPrevProject] = useState(project);
  if (project !== prevProject) {
    setPrevProject(project);
    if (project) setDisplayProject(project);
  }

  // `inert` on the rest of the page, tied to `open` (`project`), not
  // `displayProject` — and declared, deliberately, BEFORE `useFocusTrap`
  // below. React runs effect cleanups in declaration order, and making an
  // ancestor of the currently-focused element inert forces the browser to
  // blur it: if this cleanup ran AFTER the focus trap's, `previous.focus()`
  // over there would still be reaching into an inert subtree and silently
  // lose focus to <body> instead of the originating card. A real browser
  // check caught exactly that regression once, which is what pins the
  // ordering here as load-bearing, not incidental. Releasing `inert` in
  // lockstep with the trap (rather than staying tied to `displayProject`,
  // which lags for the reverse tween) means the background becomes
  // interactive again a beat before that tween visually finishes — the
  // correct trade-off between the two requirements.
  useEffect(() => {
    if (!open) return;
    const root = document.getElementById("root");
    const previousInert = root?.hasAttribute("inert") ?? false;
    root?.setAttribute("inert", "");
    return () => {
      if (!previousInert) root?.removeAttribute("inert");
    };
  }, [open]);

  // The trap is only ever active while `project` itself is non-null: focus
  // must return to the originating card the instant Escape/backdrop-click
  // fires, not after the (possibly skipped, possibly reduced-motion-free)
  // exit tween finishes.
  useFocusTrap(dialogRef, open);

  // Escape closes. A native `keydown` listener on `document` rather than
  // relying on the dialog itself being focused — the focus trap always
  // keeps focus inside it, but this keeps the two concerns independent.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Body scroll lock + stop Lenis, for exactly as long as something is
  // actually shown (`displayProject`, not `project` — the lock must
  // outlive the reverse tween so the page can't scroll under the user
  // mid-close, which would make the exit's rect math wrong).
  useEffect(() => {
    if (!displayProject) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    getLenis()?.stop();

    return () => {
      document.body.style.overflow = previousOverflow;
      getLenis()?.start();
    };
  }, [displayProject]);

  // --- Shared-element transition, open direction ---------------------
  // Structurally skipped under reduced motion — no tween is ever created,
  // not a duration-0 one — and skipped when there is no origin card to
  // measure from (every unit test, which mounts the overlay directly).
  useLayoutEffect(() => {
    if (!displayProject) return;
    const panel = dialogRef.current;
    if (!panel || reduced || !originRef?.current) return;

    const originRect = originRef.current.getBoundingClientRect();
    const finalRect = panel.getBoundingClientRect();
    const { x, y, scaleX, scaleY } = deltaTransform(originRect, finalRect);

    gsap.set(panel, { x, y, scaleX, scaleY, transformOrigin: "50% 50%" });
    const tween = gsap.to(panel, {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      duration: TRANSITION_DURATION,
      ease: ENTRANCE_EASE,
      onComplete: () => gsap.set(panel, { clearProps: "transform" }),
    });
    return () => tween.kill();
    // `displayProject` is the only thing that should re-trigger the
    // mount-in tween — it changes exactly once per open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayProject]);

  // --- Shared-element transition, close direction ---------------------
  // Fires when `project` has gone back to null but `displayProject` still
  // holds the last one — i.e. exactly the "closing" window. Reverses the
  // same rect math and only then clears `displayProject`, which is what
  // actually removes the dialog from the tree.
  useEffect(() => {
    if (project || !displayProject) return;
    const panel = dialogRef.current;
    if (!panel || reduced || !originRef?.current) {
      setDisplayProject(null);
      return;
    }

    const originRect = originRef.current.getBoundingClientRect();
    const finalRect = panel.getBoundingClientRect();
    const { x, y, scaleX, scaleY } = deltaTransform(originRect, finalRect);

    const tween = gsap.to(panel, {
      x,
      y,
      scaleX,
      scaleY,
      duration: TRANSITION_DURATION,
      ease: ENTRANCE_EASE,
      onComplete: () => setDisplayProject(null),
    });
    return () => tween.kill();
  }, [project, displayProject, reduced, originRef]);

  if (!displayProject) return null;

  const p = displayProject;
  const title = localized(p.title, lang);
  const description = localized(p.description ?? p.tagline, lang);
  const role = p.role ? localized(p.role, lang) : null;
  const imageAlt = localized(p.imageAlt, lang);

  const handleBackdropClick = () => onClose?.();
  const handlePanelClick = (event) => event.stopPropagation();

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-bg/80 p-4 backdrop-blur-sm sm:p-8"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={handlePanelClick}
        className="relative my-auto w-full max-w-2xl overflow-hidden rounded-[28px] border border-line bg-surface text-left"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t.projects.close}
          className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-xl border border-line bg-surface/80 text-text outline-none backdrop-blur-xl transition-transform duration-200 ease-entrance active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span aria-hidden>×</span>
        </button>

        <picture>
          <source srcSet={`${p.image}-1600.avif`} type="image/avif" />
          <source
            srcSet={`${p.image}-800.webp 800w, ${p.image}-1600.webp 1600w`}
            type="image/webp"
          />
          <img
            src={`${p.image}-1600.webp`}
            alt={imageAlt}
            className="aspect-[16/10] w-full flex-shrink-0 object-cover"
          />
        </picture>

        <div className="flex flex-col gap-4 p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id={titleId} className="text-2xl font-semibold leading-tight text-text sm:text-3xl">
              {title}
            </h2>
            <span className="text-xs uppercase tracking-[0.3em] text-mute">{p.year}</span>
          </div>

          {role && (
            <p className="text-sm text-mute">
              <span className="uppercase tracking-[0.2em]">{t.projects.role}</span> — {role}
            </p>
          )}

          <p className="text-base text-mute">{description}</p>

          <div className="flex flex-wrap gap-2">
            {p.stack.map((tech) => (
              <Chip key={tech}>{tech}</Chip>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap gap-3">
            {p.demo && (
              <Button href={p.demo} target="_blank" rel="noreferrer noopener">
                {t.projects.demo}
              </Button>
            )}
            {p.code && (
              <Button href={p.code} variant="ghost" target="_blank" rel="noreferrer noopener">
                {t.projects.code}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

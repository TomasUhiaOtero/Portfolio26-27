import { lazy, useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { projects } from "../data/projects.js";
import useReducedMotion from "../hooks/useReducedMotion.js";
import { createSpring } from "../lib/spring.js";
import { wrapIndex, shortestOffset } from "../lib/carousel.js";
import ProjectCard from "../components/ProjectCard.jsx";
import ProjectOverlay from "../components/ProjectOverlay.jsx";
import LazyCanvas from "../three/LazyCanvas.jsx";

// Lazy, not a static import: see Hero.jsx's/Services.jsx's identical
// comment on `HeroField`/`ServiceStage` — a plain `import WorkBackdrop from
// "../three/WorkBackdrop.jsx"` here would pull three/@react-three into this
// module's import graph statically, and Work.jsx is reachable from the
// app's entry point. Wrapping the reference in `React.lazy` defers the
// `import()` to LazyCanvas's own first render attempt, which it only makes
// once this section nears the viewport.
const WorkBackdrop = lazy(() => import("../three/WorkBackdrop.jsx"));

const STEP = 26; // degrees of rotateY per ring — matches carousel.test.js
const DESKTOP_RADIUS = 560;
const MOBILE_RADIUS = 220;
const DESKTOP_QUERY = "(min-width: 768px)"; // Tailwind's default `md`

const DRAG_PX_PER_STEP = 220; // roughly one card per 220px of horizontal travel
// A flick's release velocity (px/ms) is projected forward this many
// milliseconds and folded into the same units as `deltaIndex`, so a fast
// swipe lands a few cards past where the finger actually travelled
// without a raw px/ms figure (typically 0.5-3) swamping the drag delta —
// an early version multiplied velocity by a flat factor and a realistic
// flick sent the carousel spinning six cards past the release point.
const FLICK_PROJECTION_MS = 90;
const WHEEL_LOCK_MS = 350; // one card per wheel gesture, not one per tick

// Ruling R4 (progress.md): Work owns `selectedProject` locally rather than
// exposing an `onOpen` prop — Task 14 renders the overlay from this same
// state.
const ordered = [...projects.filter((p) => p.featured), ...projects.filter((p) => !p.featured)];

function matchesDesktop() {
  return typeof window !== "undefined" && window.matchMedia?.(DESKTOP_QUERY).matches === true;
}

/**
 * The projects section: a CSS 3D arc carousel (spec §6.6). WebGL would
 * turn every card into a texture — blurry text, no real `<a>`/`<button>`
 * elements, no keyboard navigation — in the most important section of the
 * site, so the geometry here is real DOM elements under `perspective` and
 * `rotateY`. Task 15 adds a WebGL backdrop behind it, not instead of it:
 * `<WorkBackdrop>` reads `continuousIndexRef` (below) as a plain ref, the
 * same "read a ref inside useFrame, never subscribe to it as state" rule
 * `TechCore.jsx` established for its own externally-driven `progressRef` —
 * it is Effect B's rAF loop that owns writing that value every frame while
 * dragging or settling, so the backdrop has no business re-rendering (or
 * pulling this section along with it) every time it moves.
 *
 * Geometry model, so the two moving parts don't fight over the same
 * transform ("one owner of a given DOM element's transform at a time"):
 *  - Each card's OWN transform comes straight from `cardTransform`,
 *    driven by `focusIndex` (React state, an integer) — it updates once
 *    per selection change, declaratively, never per frame.
 *  - The TRACK's transform is the only thing the rAF loop ever touches.
 *    It holds `-(continuousIndex - focusIndex) * STEP`: the gap between
 *    where the spring's continuous position currently is and where the
 *    cards themselves already snapped to. That gap is 0 at rest, jumps
 *    to +-STEP the instant `focusIndex` changes, and the spring decays it
 *    back to 0 — which is what makes the snap look like a smooth glide
 *    instead of a jump-cut, without either owner writing the other's node.
 *  - While dragging, the same `continuousIndex` is driven directly by
 *    pointer position instead of the spring, so the loop has exactly one
 *    formula for both "settling" and "being dragged".
 *
 * Under reduced motion the rAF loop never starts at all (see Effect B) —
 * structurally, not "usually" — so there is no spring, no residual, no
 * per-frame anything: `focusIndex` alone decides each card's position.
 */
export default function Work() {
  const { t } = useLanguage();
  const reduced = useReducedMotion();
  const length = ordered.length;

  const [focusIndex, setFocusIndex] = useState(0);
  const [selectedProject, setSelectedProject] = useState(null);
  const [radius, setRadius] = useState(() => (matchesDesktop() ? DESKTOP_RADIUS : MOBILE_RADIUS));

  const trackRef = useRef(null);
  const cardRefs = useRef([]);
  // The DOM node of the card that opened the currently-shown overlay — the
  // "source" rect for ProjectOverlay's shared-element transition. Set the
  // instant an overlay opens (openProject, below) and left alone on close:
  // the overlay's own reverse tween reads it one more time before it
  // clears itself, so it must still point at the right card at that point.
  const originRef = useRef(null);
  // A lazy `useState` initializer, not `useRef` + a conditional assignment
  // during render — the spring is a stable object created exactly once,
  // and this is the pattern React's own ref-during-render lint rule wants
  // for that ("refs should only be accessed outside of render").
  const [spring] = useState(() => createSpring({ stiffness: 220, damping: 26, mass: 1 }));

  const focusIndexRef = useRef(focusIndex);
  const continuousIndexRef = useRef(focusIndex);
  const rafRef = useRef(null);
  const lastTsRef = useRef(null);
  // WorkBackdrop runs on `frameloop="demand"`, so its own `useFrame` never
  // wakes unless something calls its `invalidate()`. This section drives
  // `continuousIndexRef` from `ensureLoop`'s rAF (below) during a drag or
  // spring settle WITHOUT any React re-render, so nothing would otherwise
  // repaint the backdrop while the carousel is actually moving — the blob
  // would sit frozen through the drag and only catch up on release. The
  // backdrop hands its `invalidate` up through this ref on mount; the tick
  // loop calls it every frame it's alive, which is exactly the window the
  // index is in motion. Null whenever the scene is unmounted (reduced
  // motion, off-screen), where the `?.()` call is a harmless no-op.
  const backdropInvalidateRef = useRef(null);

  const dragRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    deltaIndex: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0,
  });
  const wheelRef = useRef({ locked: false, accX: 0, accY: 0, timer: null });

  useEffect(() => {
    focusIndexRef.current = focusIndex;
  }, [focusIndex]);

  // Effect A: card width/radius shrink below `md` so a card is never
  // wider than the viewport — the radius half lives here (in JS, because
  // it feeds the numeric `translateZ` inside `cardTransform`); the card
  // width half is plain responsive Tailwind classes in ProjectCard.jsx.
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = (event) => setRadius(event.matches ? DESKTOP_RADIUS : MOBILE_RADIUS);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const writeTrackTransform = useCallback(() => {
    if (!trackRef.current) return;
    const gap = continuousIndexRef.current - focusIndexRef.current;
    trackRef.current.style.transform = `rotateY(${-gap * STEP}deg)`;
  }, []);

  // Effect B: the ONLY writer of the track's transform. Structurally
  // absent under reduced motion (the effect returns before ever scheduling
  // a frame), which is what makes "no inertia" a guarantee rather than a
  // timing race.
  const ensureLoop = useCallback(() => {
    if (reduced || rafRef.current != null) return;
    lastTsRef.current = null;
    const tick = (ts) => {
      // `spring` closes over the stable instance from useState above.
      const drag = dragRef.current;
      if (drag.active) {
        continuousIndexRef.current = focusIndexRef.current - drag.deltaIndex;
        lastTsRef.current = ts;
      } else {
        if (lastTsRef.current == null) lastTsRef.current = ts;
        const dt = (ts - lastTsRef.current) / 1000;
        lastTsRef.current = ts;
        continuousIndexRef.current = spring.step(dt);
      }
      writeTrackTransform();
      // Repaint the demand-mode backdrop in lockstep with the index we
      // just moved (no-op until the scene mounts and registers itself).
      backdropInvalidateRef.current?.();
      if (!drag.active && spring.isSettled()) {
        rafRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [reduced, writeTrackTransform, spring]);

  useEffect(() => {
    if (reduced && rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (reduced && trackRef.current) {
      trackRef.current.style.transform = "rotateY(0deg)";
    }
    const wheel = wheelRef.current;
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (wheel.timer) clearTimeout(wheel.timer);
    };
  }, [reduced]);

  const focusCard = useCallback((index) => {
    const el = cardRefs.current[index];
    el?.focus?.();
  }, []);

  /**
   * Moves the focused card to `nextRaw` (wrapped). Under reduced motion
   * this is a direct index assignment with no interpolation: the spring
   * is snapped to the new value and the loop never runs, so there is
   * nothing left to animate. Otherwise the spring keeps its current
   * absolute position and only re-targets `focusIndex`, so `Effect B`'s
   * residual formula picks up the jump and decays it smoothly.
   */
  const moveFocus = useCallback(
    (nextRaw, { focusDom = true } = {}) => {
      const next = wrapIndex(nextRaw, length);
      setFocusIndex((prev) => {
        if (prev === next) return prev;
        focusIndexRef.current = next;
        if (reduced) {
          spring.set(next);
          continuousIndexRef.current = next;
          if (trackRef.current) trackRef.current.style.transform = "rotateY(0deg)";
        } else {
          spring.target(next);
          ensureLoop();
        }
        return next;
      });
      if (focusDom) {
        // Wait a tick so the card just becoming `selected` (tabIndex 0)
        // exists before we try to focus it.
        requestAnimationFrame(() => focusCard(next));
      }
    },
    [length, reduced, ensureLoop, focusCard, spring],
  );

  const openProject = useCallback((project) => {
    const index = ordered.findIndex((p) => p.id === project.id);
    originRef.current = cardRefs.current[index] ?? null;
    setSelectedProject(project);
  }, []);

  const closeProject = useCallback(() => {
    setSelectedProject(null);
  }, []);

  const handleSelect = useCallback(
    (project) => {
      const index = ordered.findIndex((p) => p.id === project.id);
      if (index === focusIndexRef.current) {
        openProject(project);
      } else {
        moveFocus(index);
      }
    },
    [moveFocus, openProject],
  );

  // --- Keyboard: Left/Right move one card, Home/End jump to the ends. ---
  const handleKeyDown = useCallback(
    (event) => {
      switch (event.key) {
        case "ArrowRight":
          event.preventDefault();
          moveFocus(focusIndexRef.current + 1);
          break;
        case "ArrowLeft":
          event.preventDefault();
          moveFocus(focusIndexRef.current - 1);
          break;
        case "Home":
          event.preventDefault();
          moveFocus(0);
          break;
        case "End":
          event.preventDefault();
          moveFocus(length - 1);
          break;
        case "Enter":
        case " ":
          break;
        default:
          break;
      }
    },
    [moveFocus, length],
  );

  // --- Drag: pointerdown/move/up with pointer capture. ~220px per card,
  // release biased by velocity so a flick advances more than one card. ---
  const handlePointerDown = useCallback((event) => {
    if (event.button != null && event.button !== 0) return;
    const drag = dragRef.current;
    drag.active = true;
    drag.pointerId = event.pointerId;
    drag.startX = event.clientX;
    drag.deltaIndex = 0;
    drag.lastX = event.clientX;
    drag.lastT = event.timeStamp;
    drag.velocity = 0;
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // jsdom and some older browsers don't implement pointer capture —
      // dragging still works, it just can't survive the pointer leaving
      // the element's bounds.
    }
    ensureLoop();
  }, [ensureLoop]);

  const handlePointerMove = useCallback((event) => {
    const drag = dragRef.current;
    if (!drag.active || event.pointerId !== drag.pointerId) return;
    const dx = event.clientX - drag.startX;
    drag.deltaIndex = -dx / DRAG_PX_PER_STEP;
    const dt = event.timeStamp - drag.lastT;
    if (dt > 0) {
      drag.velocity = (event.clientX - drag.lastX) / dt;
    }
    drag.lastX = event.clientX;
    drag.lastT = event.timeStamp;
    if (reduced) {
      continuousIndexRef.current = focusIndexRef.current - drag.deltaIndex;
      writeTrackTransform();
    }
  }, [reduced, writeTrackTransform]);

  const endDrag = useCallback(
    (event) => {
      const drag = dragRef.current;
      if (!drag.active || (event && event.pointerId !== drag.pointerId)) return;
      drag.active = false;
      try {
        event?.currentTarget?.releasePointerCapture?.(drag.pointerId);
      } catch {
        // See handlePointerDown.
      }

      // `drag.velocity` is in px/ms with the same sign as `dx`; negate and
      // divide by the same px-per-step used for `deltaIndex` so the two
      // terms are in the same units before adding them.
      const velocityBias = (-drag.velocity / DRAG_PX_PER_STEP) * FLICK_PROJECTION_MS;
      const steps = Math.round(drag.deltaIndex + velocityBias);
      const startIndex = focusIndexRef.current;
      const next = wrapIndex(startIndex + steps, length);

      if (reduced) {
        moveFocus(next, { focusDom: false });
        return;
      }

      // Hand off from "live drag" to "spring decay" without a visual
      // jump: keep the spring exactly where the drag left the carousel,
      // only then re-target it at the newly settled index.
      spring.set(continuousIndexRef.current);
      focusIndexRef.current = next;
      setFocusIndex(next);
      spring.target(next);
      ensureLoop();
    },
    [length, reduced, moveFocus, ensureLoop, spring],
  );

  // --- Wheel: accumulate deltaX (and deltaY with shift), debounce to one
  // card per gesture so a trackpad doesn't spin the carousel. ---
  const handleWheel = useCallback(
    (event) => {
      const wheel = wheelRef.current;
      const amount = event.shiftKey ? event.deltaY : event.deltaX;
      if (amount === 0) return;
      event.preventDefault();
      if (wheel.locked) return;

      wheel.accX += amount;
      const THRESHOLD = 40;
      if (Math.abs(wheel.accX) < THRESHOLD) return;

      const direction = wheel.accX > 0 ? 1 : -1;
      wheel.accX = 0;
      wheel.locked = true;
      moveFocus(focusIndexRef.current + direction, { focusDom: false });
      wheel.timer = setTimeout(() => {
        wheel.locked = false;
      }, WHEEL_LOCK_MS);
    },
    [moveFocus],
  );

  const listboxId = "proyectos-carousel";

  return (
    <section
      id="proyectos"
      className="relative overflow-hidden py-24 sm:py-32"
      data-selected-project={selectedProject?.id}
    >
      {/* Backdrop: its own absolutely-positioned stack behind everything
          else in the section, same discipline as Hero.jsx's background
          layer. `dprVariant="backdrop"` and `frameloop="demand"` are this
          scene's own opt-ins — see LazyCanvas.jsx/WorkBackdrop.jsx for why
          this is the one scene in the project that asks for either. */}
      <LazyCanvas
        poster={{ dark: "/img/work-poster.webp", light: "/img/work-poster-light.webp" }}
        dprVariant="backdrop"
        frameloop="demand"
        className="absolute inset-0 -z-10 overflow-hidden"
      >
        <WorkBackdrop
          indexRef={continuousIndexRef}
          length={length}
          onInvalidateReady={(fn) => {
            backdropInvalidateRef.current = fn;
          }}
        />
      </LazyCanvas>

      <div className="mx-auto w-full max-w-[1400px] px-6 sm:px-10">
        <p className="text-xs uppercase tracking-[0.3em] text-mute">{t.projects.eyebrow}</p>
        <h2 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-text md:text-5xl">
          {t.projects.title}
        </h2>
        <p className="mt-3 max-w-xl text-lg text-mute">{t.projects.intro}</p>
      </div>

      <div
        className="relative mt-16 h-[420px] w-full select-none md:h-[560px]"
        style={{ perspective: "1400px", perspectiveOrigin: "50% 50%" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={handleWheel}
      >
        <div
          ref={trackRef}
          id={listboxId}
          role="listbox"
          aria-label={t.projects.title}
          onKeyDown={handleKeyDown}
          className="relative h-full w-full outline-none"
          style={{ transformStyle: "preserve-3d", transform: "rotateY(0deg)" }}
        >
          {ordered.map((project, index) => {
            const offset = shortestOffset(index, focusIndex, length);
            const selected = index === focusIndex;
            return (
              <ProjectCard
                key={project.id}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                project={project}
                offset={offset}
                selected={selected}
                onSelect={handleSelect}
                step={STEP}
                radius={radius}
              />
            );
          })}
        </div>
      </div>

      <ProjectOverlay project={selectedProject} onClose={closeProject} originRef={originRef} />
    </section>
  );
}

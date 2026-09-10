import { Children, isValidElement, lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import useInViewport from "../hooks/useInViewport.js";
import useReducedMotion from "../hooks/useReducedMotion.js";
import { useTheme } from "../theme/ThemeProvider.jsx";
import { getBudget } from "./adaptive.js";

// A React.lazy() component is a plain object (not a function), tagged with
// this symbol — see react/cjs/react.production.js. Checking for it is how
// the dev-only assertion below tells a properly lazy-loaded scene apart
// from a statically-imported one without importing anything from "three".
const REACT_LAZY_TYPE = Symbol.for("react.lazy");

// The lazy boundary: this dynamic import is the ONLY thing standing between
// the initial bundle and the entire "three" chunk (three + @react-three/*,
// routed there by vite.config.js's codeSplitting.groups). Do not add a static
// `import ... from "@react-three/fiber"` or `"three"` anywhere in this
// file — that would pull the whole 3D stack back into the graph reachable
// from the app's entry point, and the hero would have to download it
// before it can paint text.
const Canvas3D = lazy(() => import("./Canvas3D.jsx"));

/**
 * Shared wrapper for every WebGL scene in the project. Shows `poster`
 * until the wrapper first nears the viewport (per `rootMargin`), then
 * lazily mounts a `<Canvas>` around `children` and KEEPS it mounted for
 * the rest of the session — rendering just pauses (`frameloop="never"`)
 * whenever the scene is scrolled out of view or the tab is hidden.
 *
 * (It used to unmount the `<Canvas>` on scroll-away to hold zero WebGL
 * contexts when off-screen. That turned out fragile: recreating a context
 * on scroll-back sometimes came up blank — a stale poster overlay, or the
 * browser's per-page context budget already spent. Four paused contexts
 * for the page's lifetime is well within every browser's limit, and a
 * paused context does no GPU work.)
 *
 * `children` must be a scene component that is itself lazy-loaded by its
 * caller (see `Hero.jsx`) — passing a statically-imported scene here would
 * reintroduce the exact bundle leak this wrapper exists to prevent. A
 * dev-only check below warns (never throws) when that contract is broken.
 *
 * `poster` is `{ dark, light }`, not a single string: every scene built on
 * this wrapper reads `--accent`/`--glow`, which genuinely differ per theme
 * (see styles/index.css), so a still of that scene has to differ per theme
 * too — that makes the resolved poster a property of the wrapper, not of
 * whatever section happens to use it. Resolving it here, via `useTheme()`,
 * follows the same precedent `adaptive.js`'s `getBudget` set for particle
 * counts: every such decision lives in one auditable place rather than as
 * a ternary repeated at each of Hero's/Tasks 9/11/15's call sites, where a
 * forgotten one would fail silently with a wrong (or blank) poster.
 *
 * `dprVariant` ("standard", the default, or "backdrop") picks which of
 * `getBudget`'s two dpr ceilings this mount uses — "backdrop" is one step
 * softer, for a full-bleed fragment-shader layer like `WorkBackdrop` where
 * resolution costs nothing visually (see `adaptive.js`'s `backdropDpr`).
 *
 * `frameloop` ("always", the default, or "demand") is passed straight
 * through to `Canvas3D`/`<Canvas>`. Every scene before Task 15 runs
 * `"always"` — colours/orbits/morphs tick every frame regardless. A scene
 * on `"demand"` is responsible for calling `useThree().invalidate()`
 * itself whenever it has something new to paint; nothing here does that
 * for it.
 */
export default function LazyCanvas({
  poster,
  className,
  rootMargin = "200px",
  dprVariant = "standard",
  frameloop = "always",
  children,
}) {
  const wrapperRef = useRef(null);
  const reduced = useReducedMotion();
  const nearViewport = useInViewport(wrapperRef, { rootMargin, once: false });
  const [tabHidden, setTabHidden] = useState(() => document.hidden);
  const [everInView, setEverInView] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const onVisibilityChange = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  // Both of these are "adjust state when a prop/derived value changes"
  // (React's documented render-time setState pattern, guarded by a
  // comparison so it bails out immediately), not effects:
  //   - `everInView` latches true the first time the scene nears the
  //     viewport, and the canvas then stays mounted for the session.
  //   - `contextLost` is optimistically cleared when the scene re-enters
  //     view — the `webglcontextrestored` event may have been missed while
  //     the tab was backgrounded.
  if (nearViewport && !everInView) setEverInView(true);
  if (nearViewport && contextLost) setContextLost(false);


  // Dev-only contract check: the docblock above has always said `children`
  // must be lazy-loaded, but prose is easy to miss and this wrapper's
  // whole reason to exist is keeping `three` out of the initial bundle.
  // `import.meta.env.DEV` is replaced with a literal `false` in production
  // builds, so this entire effect body is dead code there — Vite/Rolldown
  // eliminate it rather than shipping it. A warning, not a throw: a
  // statically-imported scene still works, it just costs more upfront, and
  // that may be a legitimate choice this wrapper hasn't anticipated.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    Children.forEach(children, (child) => {
      if (!isValidElement(child)) return;
      const isLazy =
        typeof child.type === "object" && child.type !== null && child.type.$$typeof === REACT_LAZY_TYPE;
      if (!isLazy) {
        console.warn(
          "LazyCanvas: `children` should be wrapped in React.lazy() (e.g. `const Scene = lazy(() => import(\"./Scene.jsx\"))`) so the `three`/`@react-three` chunk stays out of the initial bundle. Received a statically-imported component instead.",
        );
      }
    });
  }, [children]);

  // `width`/`deviceMemory` are read once — a device doesn't change tier
  // mid-session, and adaptive.js is a pure function so re-reading them on
  // every render would just recompute the same answer. `reduced` is the
  // one live input: flipping it should tear the canvas down immediately.
  const budget = useMemo(
    () => getBudget({ width: window.innerWidth, deviceMemory: navigator.deviceMemory, reduced }),
    [reduced],
  );

  const mounted = budget.enabled && everInView;
  // Pause GPU work whenever the scene isn't actually on screen.
  const paused = tabHidden || !nearViewport;
  const posterSrc = theme === "light" ? poster.light : poster.dark;
  const dpr = dprVariant === "backdrop" ? budget.backdropDpr : budget.dpr;

  // r3f measures its own container on mount; when the `<Canvas>` mounts
  // through a lazy chunk + Suspense swap inside this `absolute inset-0`
  // wrapper, that first measurement can land as 0×0 and — because the
  // ResizeObserver behind it only reports *changes* — never recover,
  // leaving the scene rendering into the 300×150 default until an
  // unrelated window resize. `resize={{ offsetSize: true }}` on the Canvas
  // covers the common case; this dispatches one `resize` a beat after the
  // scene mounts (by which point the async chunk has loaded and the
  // wrapper is laid out) to force a clean re-measure. One event per
  // canvas, once — nothing else listening on `resize` gets churned.
  useEffect(() => {
    if (!mounted) return undefined;
    const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 200);
    return () => clearTimeout(t);
  }, [mounted]);

  const posterImage = (
    <img
      src={posterSrc}
      alt=""
      aria-hidden="true"
      className="absolute inset-0 h-full w-full object-cover"
    />
  );

  return (
    <div ref={wrapperRef} aria-hidden="true" className={className}>
      {mounted ? (
        <Suspense fallback={posterImage}>
          <Canvas3D
            dpr={dpr}
            paused={paused}
            frameloop={frameloop}
            onContextLost={setContextLost}
          >
            {children}
          </Canvas3D>
          {/* Cover a lost context (which renders blank/white) with the
              poster until the browser restores it. */}
          {contextLost ? posterImage : null}
        </Suspense>
      ) : (
        posterImage
      )}
    </div>
  );
}

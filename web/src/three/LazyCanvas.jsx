import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import useInViewport from "../hooks/useInViewport.js";
import useReducedMotion from "../hooks/useReducedMotion.js";
import { getBudget } from "./adaptive.js";

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
 * until the wrapper nears the viewport (per `rootMargin`), then lazily
 * mounts a `<Canvas>` around `children`; unmounts it again once the
 * wrapper leaves by more than that same margin, so a scene scrolled far
 * out of view stops holding a WebGL context at all — the browser caps how
 * many can be alive at once, and this project has four of these.
 *
 * Rendering also pauses (without unmounting) while the tab is hidden.
 *
 * `children` must be a scene component that is itself lazy-loaded by its
 * caller (see `Hero.jsx`) — passing a statically-imported scene here would
 * reintroduce the exact bundle leak this wrapper exists to prevent.
 */
export default function LazyCanvas({ poster, className, rootMargin = "200px", children }) {
  const wrapperRef = useRef(null);
  const reduced = useReducedMotion();
  const nearViewport = useInViewport(wrapperRef, { rootMargin, once: false });
  const [paused, setPaused] = useState(() => document.hidden);

  useEffect(() => {
    const onVisibilityChange = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  // `width`/`deviceMemory` are read once — a device doesn't change tier
  // mid-session, and adaptive.js is a pure function so re-reading them on
  // every render would just recompute the same answer. `reduced` is the
  // one live input: flipping it should tear the canvas down immediately.
  const budget = useMemo(
    () => getBudget({ width: window.innerWidth, deviceMemory: navigator.deviceMemory, reduced }),
    [reduced],
  );

  const mounted = budget.enabled && nearViewport;

  const posterImage = (
    <img
      src={poster}
      alt=""
      aria-hidden="true"
      className="absolute inset-0 h-full w-full object-cover"
    />
  );

  return (
    <div ref={wrapperRef} aria-hidden="true" className={className}>
      {mounted ? (
        <Suspense fallback={posterImage}>
          <Canvas3D dpr={budget.dpr} paused={paused}>
            {children}
          </Canvas3D>
        </Suspense>
      ) : (
        posterImage
      )}
    </div>
  );
}

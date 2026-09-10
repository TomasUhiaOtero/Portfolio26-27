import { useCallback, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";

// This is the ONLY module in the project allowed to import from "three" or
// "@react-three/*" at the top level. `LazyCanvas` reaches it exclusively
// through `React.lazy(() => import("./Canvas3D.jsx"))`, which is what keeps
// the entire 3D stack out of the initial bundle — see LazyCanvas.jsx.

const DPR_STEP = 0.25;

/**
 * The actual `<Canvas>` mount. Scene content is passed in as `children` so
 * this stays generic across every WebGL scene in the project (Tasks 9, 11
 * and 15 reuse it as-is).
 *
 * Degrades resolution under load rather than letting frames drop: when
 * `PerformanceMonitor` reports sustained low FPS, the DPR ceiling steps
 * down. A softer image always beats a stuttering one.
 *
 * `frameloop` defaults to `"always"` (every scene before Task 15's
 * `WorkBackdrop` wants that — colours/orbits/morphs tick every frame) but
 * can be overridden to `"demand"` for a scene that calls its own
 * `invalidate()`. `paused` always wins over it: a hidden tab gets `"never"`
 * regardless of which mode the scene asked for.
 */
export default function Canvas3D({ dpr, paused, frameloop = "always", children }) {
  // `state.dpr` resets `maxDpr` whenever the incoming `dpr` prop changes
  // (e.g. a live reduced-motion flip recomputing the budget upstream).
  // This is React's documented "adjust state when a prop changes"
  // pattern — setState during render, guarded by a comparison — rather
  // than an effect, which would cost an extra commit for something that's
  // really just derived state.
  const [state, setState] = useState(() => ({ dpr, maxDpr: dpr[1] }));
  let maxDpr = state.maxDpr;
  if (state.dpr !== dpr) {
    maxDpr = dpr[1];
    setState({ dpr, maxDpr });
  }

  const handleDecline = useCallback(() => {
    setState((current) => ({
      dpr: current.dpr,
      maxDpr: Math.max(current.dpr[0], current.maxDpr - DPR_STEP),
    }));
  }, []);

  return (
    <Canvas
      dpr={[dpr[0], maxDpr]}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      frameloop={paused ? "never" : frameloop}
    >
      <PerformanceMonitor onDecline={handleDecline} />
      {children}
    </Canvas>
  );
}

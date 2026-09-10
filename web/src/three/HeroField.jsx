import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { useTheme } from "../theme/ThemeProvider.jsx";
import useReducedMotion from "../hooks/useReducedMotion.js";
import { getBudget } from "./adaptive.js";
import {
  readThemeColors,
  makeColorTransition,
  startColorTransition,
  tickColorTransition,
} from "./colorTransition.js";
import { findNeighbourPairs, nextFramePairParity, isNeighbourRebuildFrame } from "./neighbourLines.js";

// World-space bounds of the particle slab. Kept small and shallow relative
// to the camera below so the field reads as a coherent plane of depth
// rather than particles vanishing into the distance.
const SLAB = { width: 6.4, height: 3.8, depth: 3 };

// Two particles closer than this (world units) get a connecting line.
const LINK_DISTANCE = 1.15;
const LINK_DISTANCE_SQ = LINK_DISTANCE * LINK_DISTANCE;

// Hard ceiling on how many line segments one rebuild can emit. A slab this
// dense can have far more pairs within LINK_DISTANCE than is useful to
// draw; capping the geometry bounds the worst case in addition to the
// squared-distance/every-other-frame savings in the frame loop below.
const MAX_SEGMENTS_PER_PARTICLE = 6;

const PARALLAX_LERP = 0.02;

// Kept out of the component body (and so out of useMemo's factory) on
// purpose: the new React Compiler-oriented lint rules flag `Math.random`
// as an impure call when it's textually inside a render function. It's
// genuinely fine here — this only ever needs to run once per `particles`
// count, and re-running it a second time (e.g. React Strict Mode's
// double-invoke) would just scatter the same field slightly differently,
// which is invisible in a decorative background.
function randomSlabPositions(count) {
  const array = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    array[i * 3 + 0] = (Math.random() - 0.5) * SLAB.width;
    array[i * 3 + 1] = (Math.random() - 0.5) * SLAB.height;
    array[i * 3 + 2] = (Math.random() - 0.5) * SLAB.depth;
  }
  return array;
}

/**
 * The hero's background scene: a slab of drifting points with lines drawn
 * between near neighbours, plus a slow parallax tilt toward the pointer.
 * Valid only as a child of `<LazyCanvas>` — it relies on the r3f context
 * (`useFrame`/`useThree`) that `<Canvas>` provides.
 *
 * Reads its own particle budget from adaptive.js rather than taking a
 * prop, the same way any other scene consuming this wrapper would — every
 * count in the project lives in one place.
 */
export default function HeroField() {
  const { theme } = useTheme();
  const reduced = useReducedMotion();

  // r3f's own `pointer` only updates from events on the canvas, but this
  // scene sits behind the hero copy (`-z-10`), so the canvas never sees a
  // pointermove. Track it off `window` instead, normalised to [-1, 1].
  const pointerRef = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (reduced) return undefined;
    const onMove = (e) => {
      pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced]);

  const { particles } = useMemo(
    () => getBudget({ width: window.innerWidth, deviceMemory: navigator.deviceMemory, reduced }),
    [reduced],
  );

  const groupRef = useRef(null);
  const pointsGeometryRef = useRef(null);
  const pointsMaterialRef = useRef(null);
  const lineGeometryRef = useRef(null);
  const lineMaterialRef = useRef(null);
  const frameParityRef = useRef(0);
  const parallaxRef = useRef({ x: 0, y: 0 });

  // Colours are read once from computed styles at construction time (the
  // `data-theme` attribute is already correct by then — this only mounts
  // once the hero is near the viewport, long after ThemeProvider's own
  // mount effect has run) and lerped toward a new target whenever the
  // theme flips. An instant jump inside the canvas would read as a
  // rendering glitch rather than a theme change. Held in state (not a
  // ref) purely so the one-time initial read happens through a
  // React-sanctioned lazy initializer instead of a ref-during-render
  // check; the returned object is still mutated in place from
  // `useFrame`/effects below and never goes through `setState`.
  const [colors] = useState(() => {
    const { accent, glow } = readThemeColors();
    return {
      point: makeColorTransition(accent),
      line: makeColorTransition(glow),
    };
  });

  useEffect(() => {
    // Deferred a frame: `theme` changing triggers this effect and
    // ThemeProvider's own DOM-mutating effect in the same commit, and
    // React runs effects child-first — this component sits below
    // ThemeProvider, so without the defer this would read the *previous*
    // `data-theme` and lerp toward the wrong colour. By the next
    // animation frame every effect from that commit has already run.
    const raf = requestAnimationFrame(() => {
      const { accent, glow } = readThemeColors();
      const now = performance.now();
      startColorTransition(colors.point, accent, now);
      startColorTransition(colors.line, glow, now);
    });
    return () => cancelAnimationFrame(raf);
  }, [theme, colors]);

  const positions = useMemo(() => randomSlabPositions(particles), [particles]);

  const maxSegments = useMemo(() => particles * MAX_SEGMENTS_PER_PARTICLE, [particles]);

  const linePositions = useMemo(() => new Float32Array(maxSegments * 2 * 3), [maxSegments]);

  // `useFrame` is r3f's per-frame subscription: it runs inside the
  // WebGLRenderer's own render loop, entirely outside React's
  // render/commit cycle. Mutating buffer attributes and material colours
  // in place every frame — rather than reallocating and diffing through
  // React — is the standard three.js/r3f performance pattern, and is
  // exactly what the squared-distance neighbour rebuild needs to stay
  // cheap at 260 points (the mutation itself lives in
  // `findNeighbourPairs`, in neighbourLines.js, where it's unit-tested).
  useFrame(() => {
    const now = performance.now();

    // The field is always gently alive: a slow sine sway on both axes so
    // it reads as animated even with the pointer still (a full continuous
    // yaw would turn the flat slab edge-on and make it vanish). The
    // pointer then adds a trailing parallax offset on top — lerped, not
    // snapped, so the tilt follows the cursor rather than sticking to it.
    const group = groupRef.current;
    if (group) {
      const p = pointerRef.current;
      parallaxRef.current.x += (p.y * 0.12 - parallaxRef.current.x) * PARALLAX_LERP;
      parallaxRef.current.y += (p.x * 0.28 - parallaxRef.current.y) * PARALLAX_LERP;
      group.rotation.x = Math.sin(now * 0.00017) * 0.05 + parallaxRef.current.x;
      group.rotation.y = Math.sin(now * 0.00011) * 0.09 + parallaxRef.current.y;
      group.position.x = Math.sin(now * 0.00009) * 0.15;
    }

    const pointColor = tickColorTransition(colors.point, now);
    const lineColor = tickColorTransition(colors.line, now);
    if (pointsMaterialRef.current) pointsMaterialRef.current.color.copy(pointColor);
    if (lineMaterialRef.current) lineMaterialRef.current.color.copy(lineColor);

    // Rebuilding the neighbour graph is the frame budget: compare squared
    // distances (skip the sqrt) and only do it every other frame. Both
    // properties live in neighbourLines.js, where they're unit-tested.
    frameParityRef.current = nextFramePairParity(frameParityRef.current);
    if (!isNeighbourRebuildFrame(frameParityRef.current)) return;

    const geometry = lineGeometryRef.current;
    if (!geometry) return;

    const segmentCount = findNeighbourPairs({
      positions,
      particleCount: particles,
      linkDistanceSq: LINK_DISTANCE_SQ,
      maxSegments,
      output: linePositions,
    });

    geometry.attributes.position.needsUpdate = true;
    geometry.setDrawRange(0, segmentCount * 2);
  });

  // Belt-and-suspenders GPU cleanup: r3f already disposes non-`primitive`
  // three objects it constructed when this tree unmounts, but LazyCanvas
  // unmounting this scene is the entire point of the wrapper (the browser
  // caps simultaneous WebGL contexts, and this project has four scenes),
  // so dispose explicitly too rather than trust that alone. Ref values
  // are captured into locals here, inside the effect body, because React
  // may already have detached the refs (set `.current` back to `null`)
  // by the time this cleanup runs.
  useEffect(() => {
    const geometryPoints = pointsGeometryRef.current;
    const materialPoints = pointsMaterialRef.current;
    const geometryLines = lineGeometryRef.current;
    const materialLines = lineMaterialRef.current;
    return () => {
      geometryPoints?.dispose();
      materialPoints?.dispose();
      geometryLines?.dispose();
      materialLines?.dispose();
    };
  }, []);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={50} />
      <group ref={groupRef}>
        <points>
          <bufferGeometry ref={pointsGeometryRef}>
            <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            ref={pointsMaterialRef}
            color={colors.point.current}
            size={0.05}
            sizeAttenuation
            transparent
            opacity={0.85}
            depthWrite={false}
          />
        </points>
        <lineSegments>
          <bufferGeometry ref={lineGeometryRef}>
            <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
          </bufferGeometry>
          <lineBasicMaterial
            ref={lineMaterialRef}
            color={colors.line.current}
            transparent
            opacity={0.22}
            depthWrite={false}
          />
        </lineSegments>
      </group>
    </>
  );
}

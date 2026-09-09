import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { useTheme } from "../theme/ThemeProvider.jsx";
import useReducedMotion from "../hooks/useReducedMotion.js";
import { ENTRANCE_EASE } from "../lib/ease.js";
import { getBudget } from "./adaptive.js";
import {
  readThemeColors,
  makeColorTransition,
  startColorTransition,
  tickColorTransition,
} from "./colorTransition.js";
import {
  browserFramePositions,
  phonePositions,
  scatteredPositions,
  ringsPositions,
  mixPositions,
} from "./serviceShapes.js";

// One generator per service index (0-3), matching `data/services.js`'s own
// order exactly: web-app, android, ia, api-db. `Services.jsx` passes that
// same index straight through as `active` — see this component's docblock
// for why it reads `activeService`, not the section's lagged
// `visibleService`.
const STATE_GENERATORS = [browserFramePositions, phonePositions, scatteredPositions, ringsPositions];

// How long a state change takes to morph, and with what curve — the
// project's shared entrance easing/duration budget, same precedent
// `TechCore.jsx`'s `STAGE_TWEEN_SECONDS` set for its own orbit
// reconfiguration.
const MORPH_SECONDS = 0.9;

const CAMERA_POSITION = [0, 0, 3.4];
const CAMERA_FOV = 45;

// Idle spin, independent of the morph tween — purely decorative, the same
// spirit as `TechCore`'s continuously-spinning core.
const IDLE_SPIN_SPEED = 0.06;

const POINT_SIZE = 46;

// GLSL: `position` is three.js's own built-in attribute (auto-declared by
// `THREE.ShaderMaterial`, unlike a `RawShaderMaterial`) — it holds
// whichever state this geometry currently rests at. `aTargetPosition` is
// this scene's own custom attribute holding the state being morphed
// toward. `uProgress` lerps between the two entirely on the GPU, so a
// state change never rebuilds geometry — it only ever rewrites these two
// attributes' contents and restarts the progress tween (see the
// active-change effect below).
const VERTEX_SHADER = /* glsl */ `
  uniform float uProgress;
  uniform float uPointSize;
  attribute vec3 aTargetPosition;

  void main() {
    vec3 morphed = mix(position, aTargetPosition, uProgress);
    vec4 mvPosition = modelViewMatrix * vec4(morphed, 1.0);
    gl_PointSize = uPointSize / -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// A soft circular sprite per point: a `uGlowColor` edge fading into a
// solid `uColor` core, echoing the accent/glow pairing `HeroField.jsx`
// (points/lines) and `TechCore.jsx` (core/nodes) already use for the same
// two custom-property colours.
const FRAGMENT_SHADER = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  uniform vec3 uGlowColor;

  void main() {
    vec2 centered = gl_PointCoord - vec2(0.5);
    float dist = length(centered);
    if (dist > 0.5) discard;
    float core = smoothstep(0.5, 0.0, dist);
    vec3 color = mix(uGlowColor, uColor, core);
    float alpha = smoothstep(0.5, 0.08, dist);
    gl_FragColor = vec4(color, alpha);
  }
`;

/**
 * The Services section's WebGL scene: a single `Points` geometry morphing
 * between four configurations — one per service — as `active` (0-3)
 * changes. Valid only as a child of `<LazyCanvas>`, exactly like
 * `HeroField`/`TechCore`.
 *
 * Reads `active` directly rather than the section's lagged
 * `visibleService`: this scene owns its own transition timing (the
 * `uProgress` tween below), so it has no reason to wait for the sticky
 * label's DOM cross-fade to finish before starting its own morph — the two
 * are deliberately independent animations reacting to the same underlying
 * state, not a chain.
 *
 * One `BufferGeometry` for the whole scene's lifetime — never rebuilt on a
 * state change. It holds two same-length position attributes (`position`,
 * the state currently at rest or being morphed *from*; `aTargetPosition`,
 * the state being morphed *to*) and the vertex shader lerps between them
 * by `uProgress`, tweened 0 -> 1 via `gsap.to` on a plain ref object and
 * read inside `useFrame` — never through React state (see hazard 3 in
 * `TechCore.jsx`'s precedent, followed identically here).
 */
export default function ServiceStage({ active }) {
  const { theme } = useTheme();
  const reduced = useReducedMotion();

  const { stagePoints: count } = useMemo(
    () => getBudget({ width: window.innerWidth, deviceMemory: navigator.deviceMemory, reduced }),
    [reduced],
  );

  // Every state is a pure function of `count` alone (see
  // `serviceShapes.js`) — computed once per budget, not per state change.
  const stateArrays = useMemo(() => STATE_GENERATORS.map((generate) => generate(count)), [count]);

  const groupRef = useRef(null);
  const geometryRef = useRef(null);
  const materialRef = useRef(null);

  // The geometry's own live buffers, mutated in place. `position` starts
  // (and, between morphs, rests) at the incoming `active` state's own
  // positions; `aTargetPosition` starts equal to it too, so an initial
  // `uProgress` of 0 already reads as a settled shape rather than
  // mid-morph. `useState` initializers here run once, exactly like
  // `HeroField`'s/`TechCore`'s own one-time-read `colors` state below —
  // the arrays are still mutated in place afterward, never through
  // `setState`.
  const [buffers] = useState(() => ({
    position: new Float32Array(stateArrays[active]),
    target: new Float32Array(stateArrays[active]),
  }));

  // The live morph progress (0-1) and which state it was last set toward
  // — a plain ref object, tweened by gsap and read every `useFrame` tick.
  // Never React state: see this file's own docblock and the hazard-3
  // precedent in `TechCore.jsx`.
  const progressRef = useRef({ value: 0 });
  const tweenRef = useRef(null);
  const lastActiveRef = useRef(active);

  // Colours read once from computed styles and lerped toward a new target
  // on theme change via the shared `colorTransition.js` helper — never
  // reimplemented locally, matching `HeroField.jsx`/`TechCore.jsx`.
  const [colors] = useState(() => {
    const { accent, glow } = readThemeColors();
    return {
      point: makeColorTransition(accent),
      glow: makeColorTransition(glow),
    };
  });

  useEffect(() => {
    // Deferred a frame for the same reason HeroField.jsx/TechCore.jsx
    // defer this: ThemeProvider's own `data-theme` mutation runs in the
    // same commit, and effects run child-first, so a synchronous read
    // here would race it and pick up the outgoing theme.
    const raf = requestAnimationFrame(() => {
      const { accent, glow } = readThemeColors();
      const now = performance.now();
      startColorTransition(colors.point, accent, now);
      startColorTransition(colors.glow, glow, now);
    });
    return () => cancelAnimationFrame(raf);
  }, [theme, colors]);

  // Active-service change -> morph toward the new state. Skipped on mount
  // (`lastActiveRef.current === active` there, since `buffers` above
  // already initializes at the incoming `active` state) — matches
  // `TechCore.jsx`'s identical `lastStageRef` guard.
  //
  // Snapshots the *actual* on-screen shape (via `mixPositions` at
  // whatever progress the previous tween had reached) into `position`
  // before retargeting, rather than assuming the previous tween finished.
  // A fast scroll through multiple panels, or a direction reversal
  // mid-morph (the exact hazard Task 10's review caught in this same
  // section), would otherwise pop the shape to wherever `uProgress` last
  // was the instant a new target is assigned.
  useEffect(() => {
    if (lastActiveRef.current === active) return undefined;
    lastActiveRef.current = active;

    const geometry = geometryRef.current;
    if (geometry) {
      mixPositions(buffers.position, buffers.target, progressRef.current.value, buffers.position);
      geometry.attributes.position.needsUpdate = true;

      buffers.target.set(stateArrays[active]);
      geometry.attributes.aTargetPosition.needsUpdate = true;
    }

    tweenRef.current?.kill();
    progressRef.current.value = 0;
    tweenRef.current = gsap.to(progressRef.current, {
      value: 1,
      duration: MORPH_SECONDS,
      ease: ENTRANCE_EASE,
    });

    return () => {
      tweenRef.current?.kill();
    };
  }, [active, buffers, stateArrays]);

  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uPointSize: { value: POINT_SIZE },
      uColor: { value: new THREE.Color() },
      uGlowColor: { value: new THREE.Color() },
    }),
    [],
  );

  // The one per-frame loop: entirely outside React's render path. Colours
  // and `uProgress` are written straight into the material's uniforms
  // every tick; `progressRef.current` is only ever read here, never
  // written (gsap owns the writes, via the tween started above).
  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * IDLE_SPIN_SPEED;
    }

    const material = materialRef.current;
    if (material) {
      material.uniforms.uProgress.value = progressRef.current.value;

      const now = performance.now();
      const pointColor = tickColorTransition(colors.point, now);
      const glowColor = tickColorTransition(colors.glow, now);
      material.uniforms.uColor.value.copy(pointColor);
      material.uniforms.uGlowColor.value.copy(glowColor);
    }
  });

  // Belt-and-suspenders GPU cleanup, matching HeroField.jsx/TechCore.jsx's
  // precedent: r3f already disposes non-`primitive` three objects it
  // constructed when this tree unmounts (the whole point of `LazyCanvas`
  // unmounting a scene once it scrolls out of view), but this scene
  // disposes explicitly too rather than rely on that alone.
  useEffect(() => {
    const geometry = geometryRef.current;
    const material = materialRef.current;
    return () => {
      geometry?.dispose();
      material?.dispose();
    };
  }, []);

  return (
    <>
      <PerspectiveCamera makeDefault position={CAMERA_POSITION} fov={CAMERA_FOV} />
      <group ref={groupRef}>
        <points>
          <bufferGeometry ref={geometryRef}>
            <bufferAttribute attach="attributes-position" args={[buffers.position, 3]} />
            <bufferAttribute attach="attributes-aTargetPosition" args={[buffers.target, 3]} />
          </bufferGeometry>
          <shaderMaterial
            ref={materialRef}
            uniforms={uniforms}
            vertexShader={VERTEX_SHADER}
            fragmentShader={FRAGMENT_SHADER}
            transparent
            depthWrite={false}
          />
        </points>
      </group>
    </>
  );
}

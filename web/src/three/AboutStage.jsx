import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { useTheme } from "../theme/ThemeProvider.jsx";
import { ENTRANCE_EASE } from "../lib/ease.js";
import {
  readThemeColors,
  makeColorTransition,
  startColorTransition,
  tickColorTransition,
} from "./colorTransition.js";
import {
  sphereShape,
  cylinderShape,
  diamondShape,
  torusShape,
  mixPositions,
} from "./aboutShapes.js";

// One vertex-displacement function per About scroll stage (0-3), in
// scroll order: sphere, cylinder, rhombic diamond, torus. `About.jsx`
// maps its pinned scroll progress to this index via `progressToStage`.
const STATE_GENERATORS = [sphereShape, cylinderShape, diamondShape, torusShape];

// How long a stage change takes to morph, and with what curve — the
// project's shared entrance budget, same as `ServiceStage.jsx`.
const MORPH_SECONDS = 0.9;

const CAMERA_POSITION = [0, 0, 4.8];
const CAMERA_FOV = 45;

// Idle spin, plus a scroll-linked yaw offset (read from `progressRef`,
// never subscribed to as state) so moving through the pin turns the
// shape. There is no camera dolly / zoom.
const IDLE_SPIN_SPEED = 0.05;
const SCROLL_YAW = Math.PI * 0.9;

// Icosphere subdivision by viewport tier: enough triangles for the
// wireframe to read as faceted polygons, capped low on small screens.
// Non-indexed geometry, so vertex count is 60 * 4^detail.
function icoDetailFor(width) {
  if (width >= 1024) return 4;
  if (width >= 640) return 3;
  return 2;
}

// GLSL: `position` holds the shape currently at rest / morphed *from*;
// `aTargetPosition` the shape being morphed *to*; `uProgress` lerps
// between them on the GPU, so a stage change only rewrites those two
// attributes and restarts the tween — the face list never changes.
const VERTEX_SHADER = /* glsl */ `
  uniform float uProgress;
  attribute vec3 aTargetPosition;

  void main() {
    vec3 morphed = mix(position, aTargetPosition, uProgress);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(morphed, 1.0);
  }
`;

const WIRE_FRAGMENT_SHADER = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  uniform vec3 uGlowColor;
  void main() {
    gl_FragColor = vec4(mix(uGlowColor, uColor, 0.65), 0.92);
  }
`;

/**
 * The About section's WebGL scene: one triangulated icosphere whose
 * vertices morph between four geometric solids — sphere -> cylinder ->
 * rhombic diamond -> torus — as `stage` (0-3) changes, drawn as a
 * wireframe (the same faceted-polygon look the old core had). Valid only
 * as a child of `<LazyCanvas>`, like `HeroField` / `ServiceStage`.
 *
 * Topology is fixed for the scene's lifetime: one `BufferGeometry`
 * holding `position` (rest / morphed-from) and `aTargetPosition`
 * (morphed-to), lerped on the GPU by a `uProgress` uniform that gsap
 * tweens 0 -> 1 on a plain ref object read inside `useFrame` — never
 * React state. `progressRef` is About's pin scroll position, read here
 * only to add yaw; there is no zoom.
 */
export default function AboutStage({ progressRef, stage }) {
  const { theme } = useTheme();

  const detail = useMemo(() => icoDetailFor(window.innerWidth), []);

  // Unit-direction array of the base icosphere, one entry per mesh vertex
  // — every stage generator maps these directions to positions. Copied
  // out of the source geometry so disposing it can't invalidate the
  // arrays, then that geometry is kept only to release on unmount.
  const baseGeometry = useMemo(() => new THREE.IcosahedronGeometry(1, detail), [detail]);
  const dirs = useMemo(
    () => Float32Array.from(baseGeometry.attributes.position.array),
    [baseGeometry],
  );

  const stateArrays = useMemo(() => STATE_GENERATORS.map((generate) => generate(dirs)), [dirs]);

  const [buffers] = useState(() => ({
    position: new Float32Array(stateArrays[stage]),
    target: new Float32Array(stateArrays[stage]),
  }));

  const groupRef = useRef(null);
  const geometryRef = useRef(null);
  const materialRef = useRef(null);
  const idleYawRef = useRef(0);

  const morphRef = useRef({ value: 0 });
  const tweenRef = useRef(null);
  const lastStageRef = useRef(stage);

  const [colors] = useState(() => {
    const { accent, glow } = readThemeColors();
    return {
      point: makeColorTransition(accent),
      glow: makeColorTransition(glow),
    };
  });

  useEffect(() => {
    // Deferred a frame: ThemeProvider's `data-theme` mutation runs in the
    // same commit and effects run child-first (see HeroField.jsx).
    const raf = requestAnimationFrame(() => {
      const { accent, glow } = readThemeColors();
      const now = performance.now();
      startColorTransition(colors.point, accent, now);
      startColorTransition(colors.glow, glow, now);
    });
    return () => cancelAnimationFrame(raf);
  }, [theme, colors]);

  // Stage change -> morph toward the new silhouette. Skipped on mount
  // (`lastStageRef.current === stage`). Snapshots the actual on-screen
  // shape into `position` before retargeting so a fast scroll or a
  // reversal mid-morph never pops — identical to `ServiceStage.jsx`.
  useEffect(() => {
    if (lastStageRef.current === stage) return undefined;
    lastStageRef.current = stage;

    const geometry = geometryRef.current;
    if (geometry) {
      mixPositions(buffers.position, buffers.target, morphRef.current.value, buffers.position);
      geometry.attributes.position.needsUpdate = true;

      buffers.target.set(stateArrays[stage]);
      geometry.attributes.aTargetPosition.needsUpdate = true;
    }

    tweenRef.current?.kill();
    morphRef.current.value = 0;
    tweenRef.current = gsap.to(morphRef.current, {
      value: 1,
      duration: MORPH_SECONDS,
      ease: ENTRANCE_EASE,
    });

    return () => {
      tweenRef.current?.kill();
    };
  }, [stage, buffers, stateArrays]);

  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uColor: { value: new THREE.Color() },
      uGlowColor: { value: new THREE.Color() },
    }),
    [],
  );

  useFrame((_state, delta) => {
    const group = groupRef.current;
    if (group) {
      const scrollProgress = progressRef?.current ?? 0;
      idleYawRef.current += delta * IDLE_SPIN_SPEED;
      group.rotation.y = idleYawRef.current + scrollProgress * SCROLL_YAW;
      group.rotation.x = Math.sin(scrollProgress * Math.PI) * 0.12;
      group.position.y = -scrollProgress * 0.15;
    }

    // Written through the live material (a ref), never the memoised
    // `uniforms` object — same discipline as WorkBackdrop.jsx.
    const material = materialRef.current;
    if (material) {
      material.uniforms.uProgress.value = morphRef.current.value;
      const now = performance.now();
      material.uniforms.uColor.value.copy(tickColorTransition(colors.point, now));
      material.uniforms.uGlowColor.value.copy(tickColorTransition(colors.glow, now));
    }
  });

  useEffect(() => {
    const base = baseGeometry;
    const geometry = geometryRef.current;
    const material = materialRef.current;
    return () => {
      base.dispose();
      geometry?.dispose();
      material?.dispose();
    };
  }, [baseGeometry]);

  return (
    <>
      <PerspectiveCamera makeDefault position={CAMERA_POSITION} fov={CAMERA_FOV} />
      <group ref={groupRef}>
        <mesh>
          <bufferGeometry ref={geometryRef}>
            <bufferAttribute attach="attributes-position" args={[buffers.position, 3]} />
            <bufferAttribute attach="attributes-aTargetPosition" args={[buffers.target, 3]} />
          </bufferGeometry>
          <shaderMaterial
            ref={materialRef}
            uniforms={uniforms}
            vertexShader={VERTEX_SHADER}
            fragmentShader={WIRE_FRAGMENT_SHADER}
            wireframe
            transparent
            depthWrite={false}
          />
        </mesh>
      </group>
    </>
  );
}

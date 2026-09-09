import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { useTheme } from "../theme/ThemeProvider.jsx";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { ENTRANCE_EASE } from "../lib/ease.js";
import {
  readThemeColors,
  makeColorTransition,
  startColorTransition,
  tickColorTransition,
} from "./colorTransition.js";
import { nodeAngle, orbitPosition, instanceVisibility, nodeCountForStage } from "./orbit.js";

// The camera dollies in slightly as the pin advances (hazard 4: read from
// `progressRef.current` inside `useFrame`, never subscribed to as state).
const CAMERA_Z_START = 6;
const CAMERA_Z_END = 4.2;

// How long a stage's orbital reconfiguration takes to tween, and with what
// curve — matches the project's shared entrance easing/duration budget
// rather than inventing a one-off feel for this scene.
const STAGE_TWEEN_SECONDS = 0.8;

// The wireframe core: an icosahedron at detail 1, per the brief, spinning
// continuously and independently of the stage tween.
const CORE_RADIUS = 1.3;
const CORE_DETAIL = 1;
const CORE_SPIN_SPEED = 0.15; // radians/second around Y

// Node instances are small spheres; radius and segment count are fixed
// visual constants (not a per-device count — there are at most a handful
// of these per stage, already far below anything adaptive.js needs to cap).
const NODE_RADIUS = 0.09;
const NODE_SEGMENTS = 10;

// One orbital configuration per technology-group stage
// (Frontend/Backend/Data/Tooling), each visually distinct so a stage
// change reads as a genuine reconfiguration rather than a relayout of the
// same ring. Purely a scene design decision, not a performance budget, so
// it lives here rather than in adaptive.js.
const STAGE_ORBITS = [
  { radius: 2.1, inclination: 0.2, speed: 0.16 },
  { radius: 2.5, inclination: 0.55, speed: 0.22 },
  { radius: 1.9, inclination: 0.85, speed: 0.11 },
  { radius: 2.3, inclination: 0.4, speed: 0.19 },
];

// Scratch object reused for every instance, every frame — allocating a new
// Object3D per instance per frame would be needless GC pressure in the
// render loop.
const dummy = new THREE.Object3D();

/**
 * The About section's WebGL scene: a slowly spinning wireframe icosahedron
 * (the "core") orbited by one `InstancedMesh` of small spheres (the
 * "nodes") — one node per technology in the currently active
 * `stack.groups` entry. Valid only as a child of `<LazyCanvas>`, exactly
 * like `HeroField`.
 *
 * Node count and orbital shape both change with `stage` (0-3): the node
 * count follows `stack.groups[stage].items.length` directly, so a content
 * edit changes it with no code change (see `orbit.js`), and the ring's
 * radius/inclination/speed tween between `STAGE_ORBITS` presets over
 * `STAGE_TWEEN_SECONDS` via a single `gsap.to` on a plain ref object —
 * never through React state, since this runs inside `useFrame`.
 */
export default function TechCore({ progressRef, stage }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const groups = t.stack.groups;

  // The `InstancedMesh`'s fixed slot count: the largest group across every
  // stage. Every stage renders from this same pool of slots — a node
  // whose slot is beyond the *current* stage's item count is simply scaled
  // to 0 (see `instanceVisibility`) rather than the mesh being resized,
  // which would mean disposing and recreating GPU buffers on every stage
  // change instead of just writing new matrices into the ones that exist.
  const capacity = useMemo(
    () => groups.reduce((max, group) => Math.max(max, group.items.length), 0),
    [groups],
  );

  const coreGroupRef = useRef(null);
  const coreGeometryRef = useRef(null);
  const coreMaterialRef = useRef(null);
  const nodeMeshRef = useRef(null);
  const nodeGeometryRef = useRef(null);
  const nodeMaterialRef = useRef(null);

  const clockRef = useRef(0);
  const tweenRef = useRef(null);
  // The stage this scene last tweened toward — compared against the
  // incoming `stage` prop below to tell a genuine stage change apart from
  // this effect's own mount run (see hazard 3: the orbit config is a plain
  // object, read every frame, never React state).
  const lastStageRef = useRef(stage);

  // The live orbital configuration, mutated in place by gsap and read
  // every `useFrame` tick. Initialized straight at the incoming stage's
  // own preset so the first frame never has to tween from stage 0's
  // configuration if `stage` ever started elsewhere.
  const orbitRef = useRef({
    ...STAGE_ORBITS[stage],
    count: nodeCountForStage(stage, groups),
  });

  // Colours read once from computed styles (see HeroField.jsx for the same
  // pattern) and lerped toward a new target on theme change, via the
  // shared colorTransition.js helper — never re-implemented locally.
  const [colors] = useState(() => {
    const { accent, glow } = readThemeColors();
    return {
      core: makeColorTransition(accent),
      node: makeColorTransition(glow),
    };
  });

  useEffect(() => {
    // Deferred a frame for the same reason HeroField.jsx defers this: the
    // `data-theme` attribute is updated by ThemeProvider's own effect in
    // the same commit, and effects run child-first, so reading computed
    // styles synchronously here would race it and read the outgoing theme.
    const raf = requestAnimationFrame(() => {
      const { accent, glow } = readThemeColors();
      const now = performance.now();
      startColorTransition(colors.core, accent, now);
      startColorTransition(colors.node, glow, now);
    });
    return () => cancelAnimationFrame(raf);
  }, [theme, colors]);

  // Stage change -> tween the orbit config toward the new preset. Skipped
  // on mount (`lastStageRef.current === stage` there, since the ref above
  // already initializes at the current stage) and on a language switch
  // that leaves `stage` itself unchanged (this effect's dependency on
  // `groups` exists only so a mid-tween language change still targets the
  // right node count, not to retrigger the tween on its own).
  useEffect(() => {
    if (lastStageRef.current === stage) return undefined;
    lastStageRef.current = stage;

    const target = { ...STAGE_ORBITS[stage], count: nodeCountForStage(stage, groups) };

    tweenRef.current?.kill();
    tweenRef.current = gsap.to(orbitRef.current, {
      ...target,
      duration: STAGE_TWEEN_SECONDS,
      ease: ENTRANCE_EASE,
    });

    return () => {
      tweenRef.current?.kill();
    };
  }, [stage, groups]);

  // The one per-frame loop. Runs entirely outside React's render path:
  // camera position, instance matrices and colours are all mutated
  // in-place on the three.js objects, and `orbitRef.current` /
  // `progressRef.current` are read, never written, from here — nothing in
  // this callback ever calls `setState`.
  useFrame((state, delta) => {
    clockRef.current += delta;
    const elapsed = clockRef.current;

    if (coreGroupRef.current) {
      coreGroupRef.current.rotation.y += delta * CORE_SPIN_SPEED;
    }

    const now = performance.now();
    const coreColor = tickColorTransition(colors.core, now);
    const nodeColor = tickColorTransition(colors.node, now);
    if (coreMaterialRef.current) coreMaterialRef.current.color.copy(coreColor);
    if (nodeMaterialRef.current) nodeMaterialRef.current.color.copy(nodeColor);

    // Hazard 4: reading the ref directly keeps the scroll-driven camera
    // dolly off React's render path entirely.
    const progress = progressRef.current ?? 0;
    state.camera.position.z = THREE.MathUtils.lerp(CAMERA_Z_START, CAMERA_Z_END, progress);

    const mesh = nodeMeshRef.current;
    if (mesh) {
      const config = orbitRef.current;
      for (let i = 0; i < capacity; i += 1) {
        const angle = nodeAngle(i, capacity, elapsed, config.speed);
        const [x, y, z] = orbitPosition({ radius: config.radius, inclination: config.inclination, angle });
        const scale = instanceVisibility(i, config.count);
        dummy.position.set(x, y, z);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  // Belt-and-suspenders GPU cleanup, matching HeroField.jsx's precedent:
  // r3f already disposes non-`primitive` three objects it constructed when
  // this tree unmounts (LazyCanvas unmounting this scene when the section
  // scrolls out of view is the whole point of that wrapper), but this
  // scene adds an explicit pass anyway, including the `InstancedMesh`
  // itself — its own `dispose()` releases the instance-matrix buffer that
  // geometry/material disposal alone would not touch.
  useEffect(() => {
    const coreGeometry = coreGeometryRef.current;
    const coreMaterial = coreMaterialRef.current;
    const nodeGeometry = nodeGeometryRef.current;
    const nodeMaterial = nodeMaterialRef.current;
    const mesh = nodeMeshRef.current;
    return () => {
      coreGeometry?.dispose();
      coreMaterial?.dispose();
      nodeGeometry?.dispose();
      nodeMaterial?.dispose();
      mesh?.dispose();
    };
  }, []);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, CAMERA_Z_START]} fov={45} />
      <group ref={coreGroupRef}>
        <mesh>
          <icosahedronGeometry ref={coreGeometryRef} args={[CORE_RADIUS, CORE_DETAIL]} />
          <meshBasicMaterial ref={coreMaterialRef} wireframe transparent opacity={0.9} />
        </mesh>
      </group>
      <instancedMesh ref={nodeMeshRef} args={[null, null, capacity]}>
        <sphereGeometry ref={nodeGeometryRef} args={[NODE_RADIUS, NODE_SEGMENTS, NODE_SEGMENTS]} />
        <meshBasicMaterial ref={nodeMaterialRef} transparent opacity={0.9} />
      </instancedMesh>
    </>
  );
}

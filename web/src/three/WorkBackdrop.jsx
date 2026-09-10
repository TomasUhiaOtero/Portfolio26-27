import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useTheme } from "../theme/ThemeProvider.jsx";
import {
  readThemeColors,
  makeColorTransition,
  startColorTransition,
  tickColorTransition,
} from "./colorTransition.js";

// A full-screen-triangle-pair trick, not a camera-projected plane: the
// vertex shader writes `position.xy` (already in [-1, 1], see
// `<planeGeometry args={[2, 2]}>` below) straight to `gl_Position`,
// ignoring `modelViewMatrix`/`projectionMatrix` entirely. That's what makes
// this genuinely "no geometry beyond two triangles" (the brief's words) —
// there is no camera framing to get wrong, no aspect-ratio mismatch to
// chase, the quad always covers exactly the canvas's clip space.
const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// `uAccent`/`uGlow`/`uBg` are lerped CPU-side every frame (see `useFrame`
// below) and simply read here — same division of labour as every other
// scene's colour uniforms. The radial gradient is spatial (centre-to-edge);
// only the light blob moves, on a slow sine.
const FRAGMENT_SHADER = /* glsl */ `
  precision mediump float;
  uniform vec3 uAccent;
  uniform vec3 uGlow;
  uniform vec3 uBg;
  uniform float uBlobX;
  uniform float uMix;
  uniform float uBlobAlpha;
  uniform vec2 uResolution;
  varying vec2 vUv;

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);

    float d = length(p);
    vec3 gradient = mix(uAccent, uGlow, smoothstep(0.0, 1.1, d));
    // uMix / uBlobAlpha are per-theme (see BACKDROP_TUNING below), not a
    // constant: this is a -z-10 backdrop, not a hero. The light theme's
    // vivid --accent/--glow wash the near-white page hard, so light gets a
    // much lower mix (0.16) than dark (0.34), where a faint blue on black
    // needs the extra weight just to be visible at all.
    vec3 color = mix(uBg, gradient, uMix);

    // The soft light blob: horizontal position tracks uBlobX (-1..1,
    // driven by a slow sine), vertically centred.
    vec2 blobCenter = vec2(uBlobX * aspect * 0.45, 0.0);
    float blobDist = length(p - blobCenter);
    float blob = smoothstep(0.85, 0.0, blobDist);
    color += uGlow * blob * uBlobAlpha;

    gl_FragColor = vec4(color, 1.0);
  }
`;

function readBgColor() {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
  return new THREE.Color(value);
}

// Per-theme gradient weight and blob strength. Light sits far lower: the
// light theme's --accent/--glow are vivid and the page ground is near
// white (#fbfbfd), so even a modest mix reads as a saturated wash behind
// the carousel; dark needs more weight for the same tint to register at
// all against near-black. gen-poster.mjs's radial-glow mode is invoked
// with these exact values per theme — keep the two in sync.
const BACKDROP_TUNING = {
  light: { mix: 0.16, blobAlpha: 0.14 },
  dark: { mix: 0.34, blobAlpha: 0.24 },
};

/**
 * The projects section's ambient backdrop: a full-bleed fragment shader
 * behind `Work.jsx`'s DOM grid — a soft radial gradient between `--accent`
 * and `--glow` over `--bg`, plus a slow drifting light blob. Valid only as
 * a child of `<LazyCanvas>`, exactly like `HeroField`/`TechCore`/
 * `ServiceStage`. Self-contained: it drifts on its own clock (no external
 * index to follow) and lerps its colours on a theme change.
 */
export default function WorkBackdrop() {
  const { theme } = useTheme();
  const size = useThree((state) => state.size);

  const materialRef = useRef(null);

  // Colours read once from computed styles and lerped toward a new target
  // on theme change, via the shared colorTransition.js helper — never
  // reimplemented locally, matching HeroField.jsx/TechCore.jsx/
  // ServiceStage.jsx. `--bg` isn't part of that shared module's own
  // `readThemeColors` (only `--accent`/`--glow` are, since no prior scene
  // needed the page background as a scene colour), so it's read locally
  // here and fed through the same generic transition primitives.
  const [colors] = useState(() => {
    const { accent, glow } = readThemeColors();
    return {
      accent: makeColorTransition(accent),
      glow: makeColorTransition(glow),
      bg: makeColorTransition(readBgColor()),
    };
  });

  useEffect(() => {
    // Deferred a frame for the same reason HeroField.jsx/TechCore.jsx/
    // ServiceStage.jsx defer this: ThemeProvider's own `data-theme`
    // mutation runs in the same commit, and effects run child-first, so a
    // synchronous read here would race it and pick up the outgoing theme.
    const raf = requestAnimationFrame(() => {
      const { accent, glow } = readThemeColors();
      const now = performance.now();
      startColorTransition(colors.accent, accent, now);
      startColorTransition(colors.glow, glow, now);
      startColorTransition(colors.bg, readBgColor(), now);
    });
    return () => cancelAnimationFrame(raf);
  }, [theme, colors]);

  const uniforms = useMemo(
    () => ({
      uAccent: { value: new THREE.Color() },
      uGlow: { value: new THREE.Color() },
      uBg: { value: new THREE.Color() },
      uBlobX: { value: 0 },
      // Seeded from the theme at mount (this useMemo already opts out of
      // exhaustive-deps, so the closed-over `theme` is fine — the effect
      // below owns every later change).
      uMix: { value: (BACKDROP_TUNING[theme] ?? BACKDROP_TUNING.dark).mix },
      uBlobAlpha: { value: (BACKDROP_TUNING[theme] ?? BACKDROP_TUNING.dark).blobAlpha },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
    }),
    // Intentionally not depending on `size`: uniforms are created exactly
    // once and mutated in place from here on, the same pattern every other
    // scene's `useMemo(() => ({ ... uniforms }), [])` follows (see
    // ServiceStage.jsx/TechCore.jsx) — `size` is applied by the effect
    // right below instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Keep the resolution uniform current on canvas resize.
  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height);
  }, [size, uniforms]);

  // Per-theme mix/blob strength. Snapped, not lerped: the change is tiny
  // (0.16 <-> 0.34) and lands inside the 400ms colour cross-fade the theme
  // flip already kicks off. Written through the live material (a ref), not
  // the memoised `uniforms` object.
  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;
    const tuning = BACKDROP_TUNING[theme] ?? BACKDROP_TUNING.dark;
    material.uniforms.uMix.value = tuning.mix;
    material.uniforms.uBlobAlpha.value = tuning.blobAlpha;
  }, [theme]);

  // Per-frame loop: advance the colour lerps and drift the blob on a slow
  // sine. No `setState` — the colour lerps mutate plain objects in place,
  // exactly like HeroField.jsx/TechCore.jsx/ServiceStage.jsx.
  useFrame(() => {
    const material = materialRef.current;
    if (!material) return;

    const now = performance.now();
    material.uniforms.uAccent.value.copy(tickColorTransition(colors.accent, now));
    material.uniforms.uGlow.value.copy(tickColorTransition(colors.glow, now));
    material.uniforms.uBg.value.copy(tickColorTransition(colors.bg, now));
    material.uniforms.uBlobX.value = Math.sin(now * 0.00013);
  });

  // Belt-and-suspenders GPU cleanup, matching every prior scene's
  // precedent: r3f already disposes non-`primitive` three objects it
  // constructed when this tree unmounts, but this scene disposes
  // explicitly too rather than rely on that alone.
  useEffect(() => {
    const material = materialRef.current;
    return () => {
      material?.dispose();
    };
  }, []);

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useTheme } from "../theme/ThemeProvider.jsx";
import {
  readThemeColors,
  makeColorTransition,
  startColorTransition,
  tickColorTransition,
  isColorTransitionActive,
} from "./colorTransition.js";
import { blobPosition } from "./workBackdrop.js";

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
// scene's colour uniforms. The gradient is spatial (centre-to-edge), not
// time-animated: "slow" describes how gradual the falloff reads, not a
// clock-driven cycle, which is also what keeps `frameloop="demand"`
// meaningful here (see this file's own docblock) — nothing needs to repaint
// on its own, only when a colour or the blob's position actually changes.
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
    // see blobPosition in workBackdrop.js), vertically centred.
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
 * The projects carousel's backdrop: a full-bleed fragment shader behind
 * `Work.jsx`'s DOM carousel (never instead of it — see that file's own
 * docblock on why the cards themselves stay real DOM elements). Valid only
 * as a child of `<LazyCanvas>`, exactly like `HeroField`/`TechCore`/
 * `ServiceStage`.
 *
 * Reads the carousel's continuous (float) focus index as `indexRef` — a
 * ref, not a prop or state, and read directly inside `useFrame`, never
 * written from here. Same "hazard 4" discipline `TechCore.jsx` established
 * for its own externally-driven `progressRef`: `Work.jsx`'s own rAF loop
 * (Task 13) already owns writing that value every frame while dragging or
 * settling, so this scene has no business subscribing to it as React state
 * — that would mean a re-render (and a fresh shader-uniform write through
 * React) on every single animation frame of a drag.
 *
 * `frameloop="demand"`: unlike the other three scenes, nothing here needs
 * to repaint on a fixed clock — the gradient is static except for a colour
 * lerp on theme change, and the blob only moves when `indexRef` moves. So
 * `LazyCanvas`'s `frameloop="demand"` (Task 15's only caller of that mode)
 * means this canvas renders zero frames while the carousel sits idle. The
 * `useFrame` loop below is responsible for calling `invalidate()` itself
 * whenever colours are still lerping or the index is still moving, and for
 * NOT calling it once both have settled — that's what actually saves the
 * frames "demand" mode exists to save, rather than defeating the point by
 * invalidating unconditionally every tick.
 */
export default function WorkBackdrop({ indexRef, length, onInvalidateReady }) {
  const { theme } = useTheme();
  const invalidate = useThree((state) => state.invalidate);
  const size = useThree((state) => state.size);

  // Hand `invalidate` up to Work.jsx so its own rAF (which drives
  // `indexRef` during a drag/settle without re-rendering) can wake this
  // demand-mode canvas frame by frame — see Work.jsx's own comment on
  // `backdropInvalidateRef`. Cleared on unmount so the caller's `?.()`
  // becomes a no-op rather than poking a dead root.
  useEffect(() => {
    onInvalidateReady?.(invalidate);
    return () => onInvalidateReady?.(null);
  }, [onInvalidateReady, invalidate]);

  const materialRef = useRef(null);
  // Starts at 0 rather than `indexRef.current` — reading a ref's `.current`
  // during render is disallowed (react-hooks' `refs` rule; refs only exist
  // to be read outside render, in effects/callbacks). If the carousel isn't
  // actually at index 0 on mount, the very first `useFrame` tick below
  // simply sees a "moved" index and calls `invalidate()` once more than
  // strictly necessary — harmless, and it runs before that frame's pixels
  // are ever drawn.
  const lastIndexRef = useRef(0);

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
      // `frameloop="demand"` means nothing repaints on its own — kick the
      // loop so the lerp this just started is actually visible next frame,
      // and useFrame's own re-invalidate (below) carries it the rest of
      // the way while it's still in flight.
      invalidate();
    });
    return () => cancelAnimationFrame(raf);
  }, [theme, colors, invalidate]);

  // `uBlobX` starts at 0 rather than `blobPosition(indexRef.current, ...)`
  // for the same reason `lastIndexRef` does above: reading `indexRef.current`
  // during render is disallowed. The first `useFrame` tick corrects it
  // before that frame's pixels are ever drawn.
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

  // Canvas resize (a real prop/size change r3f itself tracks) already
  // triggers a frame on its own even in demand mode, but the resolution
  // uniform still has to be kept current for the next paint either way.
  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height);
  }, [size, uniforms]);

  // Per-theme mix/blob strength. Snapped, not lerped: the change is tiny
  // (0.16 <-> 0.34), the layer is at -z-10 and mostly occluded by cards,
  // and it lands inside the 400ms colour cross-fade the theme flip already
  // kicks off — a separate eased ramp for it would be imperceptible.
  // Written through the live material (a ref), not the memoised `uniforms`
  // object, so it's a mutation of an owned mutable, same as the resize
  // effect's `.value.set()` above.
  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;
    const tuning = BACKDROP_TUNING[theme] ?? BACKDROP_TUNING.dark;
    material.uniforms.uMix.value = tuning.mix;
    material.uniforms.uBlobAlpha.value = tuning.blobAlpha;
    invalidate();
  }, [theme, invalidate]);

  // The one per-frame loop — reads `indexRef.current` and the colour
  // transitions, writes uniforms, and decides whether to chain another
  // frame. Nothing here ever calls `setState`: `indexRef` is only ever
  // read (see this file's own docblock), and the colour lerps are advanced
  // by `tickColorTransition` mutating plain objects, exactly like
  // HeroField.jsx/TechCore.jsx/ServiceStage.jsx.
  useFrame(() => {
    const material = materialRef.current;
    if (!material) return;

    const now = performance.now();
    material.uniforms.uAccent.value.copy(tickColorTransition(colors.accent, now));
    material.uniforms.uGlow.value.copy(tickColorTransition(colors.glow, now));
    material.uniforms.uBg.value.copy(tickColorTransition(colors.bg, now));

    const currentIndex = indexRef.current ?? 0;
    material.uniforms.uBlobX.value = blobPosition(currentIndex, length);

    const indexMoving = Math.abs(currentIndex - lastIndexRef.current) > 1e-4;
    lastIndexRef.current = currentIndex;

    const colorsAnimating =
      isColorTransitionActive(colors.accent, now) ||
      isColorTransitionActive(colors.glow, now) ||
      isColorTransitionActive(colors.bg, now);

    // Chain the next frame only while something is genuinely still
    // changing — the whole reason this scene asked for `frameloop="demand"`
    // rather than "always" (see the component docblock).
    if (indexMoving || colorsAnimating) invalidate();
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

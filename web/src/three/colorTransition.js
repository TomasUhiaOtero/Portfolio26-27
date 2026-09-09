import * as THREE from "three";

/**
 * Colour lerping for WebGL scenes, factored out of `HeroField.jsx` so it
 * can be unit-tested without touching `@react-three/fiber` — a real
 * render loop needs a live browser frame, which a test environment (and,
 * as it turns out, some automated-browser harnesses) can't reliably
 * provide, but the interpolation math itself has no such dependency.
 *
 * Every scene that reads `--accent`/`--glow` and needs to lerp between
 * theme flips rather than snap can reuse these three functions.
 */

const COLOR_LERP_MS = 400;

export function readThemeColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    accent: new THREE.Color(styles.getPropertyValue("--accent").trim()),
    glow: new THREE.Color(styles.getPropertyValue("--glow").trim()),
  };
}

export function makeColorTransition(color) {
  return { current: color.clone(), from: color.clone(), target: color.clone(), start: 0 };
}

export function startColorTransition(transition, target, now) {
  transition.from.copy(transition.current);
  transition.target.copy(target);
  transition.start = now;
}

/** Advances `transition.current` toward `target` and returns it. Call once per frame. */
export function tickColorTransition(transition, now) {
  const t = transition.start === 0 ? 1 : Math.min(1, (now - transition.start) / COLOR_LERP_MS);
  transition.current.copy(transition.from).lerp(transition.target, t);
  return transition.current;
}

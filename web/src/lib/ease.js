import gsap from "gsap";
import CustomEase from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

// Matches the CSS `--ease-entrance` token (`cubic-bezier(0.16, 1, 0.3, 1)`)
// so GSAP tweens and CSS transitions share the exact same curve. GSAP does
// not parse a raw `cubic-bezier()` string as an `ease` value unless
// CustomEase is registered first — passing one directly fails silently and
// the tween falls back to a different, wrong curve instead of erroring.
CustomEase.create("entrance", "0.16, 1, 0.3, 1");

export const ENTRANCE_EASE = "entrance";

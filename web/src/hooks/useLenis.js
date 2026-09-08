import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import useReducedMotion from "./useReducedMotion.js";

gsap.registerPlugin(ScrollTrigger);

// Module-level ref so components can reach the live Lenis instance without
// prop-drilling it down from App. Set on create, cleared to null on cleanup
// — a stale instance surviving a hot reload or a provider remount would be a
// real bug (calling scrollTo on a destroyed instance), not a theoretical one.
let lenisRef = null;

// Returns null under reduced motion (no instance is ever created) and null
// before the effect below has run or after it has torn down. Every call
// site MUST handle null and fall back to native scrolling — this function
// does not wrap or defer, it only exposes the module-level ref as-is.
export function getLenis() {
  return lenisRef;
}

export default function useLenis() {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;

    const instance = new Lenis({ duration: 1.1, smoothWheel: true });
    lenisRef = instance;

    // ScrollTrigger reads scroll position from its own ticker. Without
    // these three lines Lenis and ScrollTrigger drift apart and pinned
    // sections jitter.
    instance.on("scroll", ScrollTrigger.update);
    const raf = (time) => instance.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      instance.destroy();
      lenisRef = null;
    };
  }, [reduced]);

  // Not reactive on purpose: this hook is called once, from App, which
  // does not need to re-render when the instance appears. Every other
  // component reaches the instance through `getLenis()` (Ruling R2)
  // imperatively — an event handler or effect calling `scrollTo(...)` —
  // never through a live render value, so there is nothing here that
  // needs the extra cascading render a reactive version would cost.
  return getLenis();
}

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import useReducedMotion from "../hooks/useReducedMotion.js";
import { ENTRANCE_EASE } from "../lib/ease.js";

gsap.registerPlugin(ScrollTrigger);

const FALLBACK_DELAY = 3000;
const DURATION = 0.7;

// Fades and lifts its children once on enter. Children are ALWAYS in the
// DOM — only opacity/translate are animated (via the `reveal` CSS utility
// plus this component's GSAP tween) — because a previous version of this
// portfolio left the projects section permanently invisible on mobile by
// gating content behind React state instead.
export default function Reveal({ as: Tag = "div", delay = 0, className = "", children, ...props }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reveal = () => {
      el.dataset.revealed = "true";
    };

    // Safety net: if the ScrollTrigger below never fires for any reason,
    // the content still appears instead of staying invisible forever.
    const fallback = setTimeout(reveal, FALLBACK_DELAY);

    if (reduced) {
      reveal();
      clearTimeout(fallback);
      return () => clearTimeout(fallback);
    }

    // Nothing to observe outside a real layout environment (jsdom reports
    // zero for every rect) — ScrollTrigger has no meaningful "top 85%" to
    // measure there, so skip creating one and rely on the fallback timer.
    const hasLayout = el.getClientRects().length > 0 || el.offsetParent !== null;
    if (!hasLayout) {
      return () => clearTimeout(fallback);
    }

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: () => {
        clearTimeout(fallback);
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: DURATION,
          delay,
          ease: ENTRANCE_EASE,
          onStart: reveal,
        });
      },
    });

    return () => {
      clearTimeout(fallback);
      trigger.kill();
    };
  }, [reduced, delay]);

  return (
    <Tag ref={ref} className={`reveal ${className}`} {...props}>
      {children}
    </Tag>
  );
}

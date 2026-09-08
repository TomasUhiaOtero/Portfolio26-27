import { useEffect, useRef } from "react";
import gsap from "gsap";
import useReducedMotion from "../hooks/useReducedMotion.js";

const DURATION = 1.2;

// Three explicitly separate branches below — collapsing any two of them
// produces a visible bug: a non-numeric value must pass straight through,
// reduced motion must show the final value with no animation, and a value
// that has not started yet must show zero (never the final value reset
// back to zero, which would flash).
export default function Counter({ value, start = false }) {
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const match = /^(\d+)(.*)$/.exec(value);
  const digits = match?.[1];
  const suffix = match?.[2] ?? "";

  useEffect(() => {
    if (!digits || reduced || !start) return;
    const el = ref.current;
    if (!el) return;

    const target = Number(digits);
    const counter = { val: 0 };
    const tween = gsap.to(counter, {
      val: target,
      duration: DURATION,
      ease: "power1.out",
      onUpdate: () => {
        el.textContent = `${Math.round(counter.val)}${suffix}`;
      },
    });

    return () => tween.kill();
  }, [digits, suffix, reduced, start]);

  if (!match) return <span>{value}</span>;
  if (reduced) return <span>{digits}{suffix}</span>;
  if (!start) return <span>0{suffix}</span>;
  return <span ref={ref}>0{suffix}</span>;
}

import { useEffect } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function useFocusTrap(ref, active) {
  useEffect(() => {
    if (!active || !ref.current) return;

    const root = ref.current;
    const previous = document.activeElement;
    const first = root.querySelector(FOCUSABLE);
    first?.focus();

    const onKeyDown = (event) => {
      if (event.key !== "Tab") return;
      const items = [...root.querySelectorAll(FOCUSABLE)];
      if (items.length === 0) return;
      const edge = event.shiftKey ? items[0] : items[items.length - 1];
      if (document.activeElement === edge) {
        event.preventDefault();
        (event.shiftKey ? items[items.length - 1] : items[0]).focus();
      }
    };

    root.addEventListener("keydown", onKeyDown);
    return () => {
      root.removeEventListener("keydown", onKeyDown);
      // Returning focus to the originating card is what makes the overlay
      // usable by keyboard: without it focus falls back to <body>.
      previous?.focus?.();
    };
  }, [ref, active]);
}

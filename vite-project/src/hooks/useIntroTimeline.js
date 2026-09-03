import { useLayoutEffect } from "react";
import gsap from "gsap";

/** Promesa que siempre resuelve: nunca deja el timeline colgado. */
function fontsReady(timeoutMs = 800) {
  const timeout = new Promise((resolve) => setTimeout(resolve, timeoutMs));
  if (typeof document === "undefined" || !document.fonts) return timeout;
  return Promise.race([document.fonts.ready.catch(() => null), timeout]);
}

/**
 * Timeline de entrada del hero: titular palabra a palabra y luego el resto del
 * bloque, en cascada.
 *
 * Con `prefers-reduced-motion` no se anima nada, pero sí se fija el estado
 * final visible: el CSS oculta `[data-intro]` en cuanto hay JavaScript, así que
 * saltarse esta rama dejaría el hero en blanco.
 */
export function useIntroTimeline(rootRef, reducedMotion) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const targets = root.querySelectorAll("[data-intro]");

    if (reducedMotion) {
      gsap.set(targets, { opacity: 1, yPercent: 0, y: 0 });
      return undefined;
    }

    let cancelled = false;
    const ctx = gsap.context(() => {
      // Estado inicial explícito: no confiar solo en el CSS, porque GSAP
      // necesita conocer el punto de partida de yPercent.
      gsap.set("[data-word]", { yPercent: 135, opacity: 0 });
      gsap.set("[data-intro]:not([data-word])", { opacity: 0, y: 20 });

      fontsReady().then(() => {
        if (cancelled) return;

        gsap
          .timeline({ defaults: { ease: "expo.out" } })
          .to("[data-word]", {
            yPercent: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.07,
          })
          .to(
            '[data-intro="subtitle"]',
            { opacity: 1, y: 0, duration: 0.8 },
            "-=0.65",
          )
          .to(
            '[data-intro="description"]',
            { opacity: 1, y: 0, duration: 0.8 },
            "-=0.6",
          )
          .to(
            '[data-intro="actions"]',
            { opacity: 1, y: 0, duration: 0.8 },
            "-=0.6",
          )
          .to(
            '[data-intro="hint"]',
            { opacity: 1, y: 0, duration: 0.8 },
            "-=0.5",
          );
      });
    }, root);

    return () => {
      cancelled = true;
      ctx.revert();
    };
  }, [rootRef, reducedMotion]);
}

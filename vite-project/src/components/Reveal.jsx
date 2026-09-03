import { useEffect, useRef, useState } from "react";

const STAGGER_MS = 60;
const MAX_STAGGER_STEPS = 6;

/**
 * Scroll-reveal editorial: translateY(12px) + opacity 0 → visible en 600 ms con
 * `--ease-out`.
 *
 * Detección con `IntersectionObserver` y desconexión en cuanto entra en pantalla
 * (equivalente a `once: true`); jamás un listener de scroll.
 *
 * La animación es una transición CSS sobre `transform` y `opacity`: corre fuera
 * del hilo principal, es interrumpible y no arrastra ningún runtime de
 * animación al bundle.
 *
 * Tres redes para que el contenido nunca desaparezca:
 *   1. el CSS solo oculta si existe `html.js`, es decir, si JavaScript corre;
 *   2. `prefers-reduced-motion` anula transform y opacidad con `!important`;
 *   3. si el observer no llegara a disparar, un temporizador muestra a los 3 s.
 */
export default function Reveal({
  as: Component = "div",
  index = 0,
  className = "",
  children,
  ...rest
}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0 },
    );

    observer.observe(element);
    const failsafe = window.setTimeout(() => setIsVisible(true), 3000);

    return () => {
      observer.disconnect();
      window.clearTimeout(failsafe);
    };
  }, []);

  // Máximo 6 escalones: a partir de ahí el último elemento tardaría demasiado.
  const delayMs = Math.min(index, MAX_STAGGER_STEPS - 1) * STAGGER_MS;

  return (
    <Component
      ref={ref}
      data-reveal=""
      data-visible={isVisible ? "true" : "false"}
      style={delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={`reveal ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
}

import { useEffect, useRef } from "react";

/**
 * Aparición al entrar en pantalla.
 *
 * Usa IntersectionObserver en vez de ScrollTrigger a propósito: el observer
 * dispara al observar aunque el usuario no haya hecho scroll todavía, no
 * depende de que se recalculen posiciones y no se desincroniza con scroll
 * suavizado. Es la causa raíz del bug que hoy deja la sección de proyectos
 * permanentemente en `opacity: 0` en móvil.
 *
 * Tres redes de seguridad, en capas:
 *   1. El CSS solo oculta si existe `html.js` (JavaScript está corriendo).
 *   2. El CSS no oculta nada si el usuario pidió menos movimiento.
 *   3. Si el observer no llega a disparar, un temporizador fuerza la
 *      visibilidad a los 3 s.
 *
 * En el peor de los casos el contenido se ve sin animación. Nunca desaparece.
 */
export default function Reveal({
  as: Component = "div",
  delay = 0,
  className = "",
  style,
  children,
  ...rest
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const show = () => el.setAttribute("data-visible", "true");

    if (typeof IntersectionObserver === "undefined") {
      show();
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            show();
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.01 },
    );

    observer.observe(el);
    const failsafe = window.setTimeout(show, 3000);

    return () => {
      observer.disconnect();
      window.clearTimeout(failsafe);
    };
  }, []);

  return (
    <Component
      ref={ref}
      className={`reveal ${className}`}
      style={delay ? { ...style, "--reveal-delay": `${delay}ms` } : style}
      {...rest}
    >
      {children}
    </Component>
  );
}

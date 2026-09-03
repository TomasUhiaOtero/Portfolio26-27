import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Desplazamiento vertical muy leve ligado al scroll, para dar profundidad a
 * las capturas de proyecto.
 *
 * Solo toca `yPercent`. Nunca la opacidad: si el ScrollTrigger no llega a
 * crearse o falla, la imagen sigue viéndose exactamente igual, solo que
 * quieta. Es la diferencia entre un efecto que se pierde y contenido que
 * desaparece.
 */
export function useParallax(ref, { disabled = false, amount = 6 } = {}) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || disabled) return undefined;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { yPercent: -amount },
        {
          yPercent: amount,
          ease: "none",
          scrollTrigger: {
            trigger: el.parentElement ?? el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [ref, disabled, amount]);
}

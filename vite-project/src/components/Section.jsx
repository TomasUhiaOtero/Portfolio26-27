import Container from "./Container";

/**
 * Banda de página con su ritmo vertical y su fondo.
 *
 * Toda la página es oscura: la alternancia editorial se hace entre `canvas`
 * (#0e0d0c) y `bone` (#141211), dos valores muy próximos. El corte se percibe
 * sobre todo por la línea de 1px, no por el contraste de fondo.
 */
const TONE = {
  canvas: "bg-canvas",
  bone: "bg-bone",
  surface: "bg-surface",
};

const SPACING = {
  none: "",
  tight: "py-20 md:py-24",
  default: "py-24 md:py-32",
};

export default function Section({
  tone = "canvas",
  spacing = "default",
  bleed = false,
  className = "",
  containerClassName = "",
  children,
  ...rest
}) {
  return (
    <section
      className={`${TONE[tone] ?? TONE.canvas} ${SPACING[spacing] ?? SPACING.default} ${className}`}
      {...rest}
    >
      {bleed ? children : <Container className={containerClassName}>{children}</Container>}
    </section>
  );
}

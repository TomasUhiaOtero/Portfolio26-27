/**
 * Botón/enlace con la forma de píldora de Apple.
 *
 * Deliberadamente no hay hover con `transform`: aparte de que Apple no mueve
 * sus botones, los elementos que anima el timeline de entrada quedan con un
 * `transform` inline puesto por GSAP que anularía cualquier `:hover` con
 * transform sin dar ningún error. Aquí el hover es solo color.
 */

const VARIANTS = {
  primary:
    "bg-accent text-white hover:bg-accent-hover active:bg-accent-hover/90",
  onDark:
    "bg-white/10 text-on-dark ring-1 ring-inset ring-white/20 hover:bg-white/20 backdrop-blur-sm",
  onLight:
    "bg-ink/5 text-ink ring-1 ring-inset ring-black/10 hover:bg-ink/10",
};

const SIZES = {
  md: "h-11 px-6 text-[15px]",
  lg: "h-12 px-7 text-[17px]",
};

export default function Button({
  as: Component = "a",
  variant = "primary",
  size = "lg",
  className = "",
  icon: Icon,
  children,
  ...rest
}) {
  return (
    <Component
      className={[
        "inline-flex items-center justify-center gap-2 rounded-full font-medium",
        "transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "whitespace-nowrap",
        VARIANTS[variant] ?? VARIANTS.primary,
        SIZES[size] ?? SIZES.lg,
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
      {Icon ? <Icon className="size-[18px]" /> : null}
    </Component>
  );
}

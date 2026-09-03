/**
 * Botón / enlace del sistema.
 *
 * Reglas de motion que hereda del sistema de diseño:
 *  - `rounded-sm` (6 px), nunca píldora;
 *  - se enumeran las propiedades de la transición, nunca `transition: all`;
 *  - `active:scale-[0.97]` con `--duration-press`;
 *  - el hover solo se aplica con puntero fino, vía la variante `hover:` de
 *    Tailwind v4, que ya compila a `@media (hover: hover)`.
 */
const VARIANTS = {
  primary:
    "border-ink bg-ink text-canvas hover:border-ink-muted hover:bg-ink-muted",
  secondary:
    "border-line-strong bg-transparent text-ink hover:border-ink-muted hover:bg-surface",
  ghost: "border-transparent bg-transparent text-ink hover:bg-surface",
  link: "h-auto border-transparent bg-transparent px-0 text-accent underline decoration-1 underline-offset-4 hover:text-accent-ink active:scale-100",
};

const SIZES = {
  sm: "h-10 px-4 text-xs tracking-[0.02em]",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-base",
};

export default function Button({
  as: Component = "a",
  variant = "primary",
  size = "md",
  className = "",
  icon: Icon,
  children,
  ...rest
}) {
  const isLink = variant === "link";

  return (
    <Component
      className={[
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-sm border font-medium whitespace-nowrap",
        "transition-[color,background-color,border-color,opacity,transform]",
        "duration-[var(--duration-fast)] ease-[var(--ease-out)]",
        "active:scale-[0.97] active:duration-[var(--duration-press)]",
        VARIANTS[variant] ?? VARIANTS.primary,
        isLink ? "" : (SIZES[size] ?? SIZES.md),
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
      {Icon ? <Icon className="size-4" /> : null}
    </Component>
  );
}

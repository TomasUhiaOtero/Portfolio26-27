/** Ancho máximo de marca (80rem) con el padding horizontal del sistema. */
export default function Container({
  as: Component = "div",
  className = "",
  children,
  ...rest
}) {
  return (
    <Component
      className={`mx-auto w-full max-w-7xl px-6 md:px-10 ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
}

/**
 * Tecnologías de un proyecto o de un puesto.
 *
 * Es la información que primero busca quien está valorando un perfil y que la
 * versión anterior del portfolio no daba en ninguna tarjeta.
 */
export default function StackChips({ items, tone = "light", className = "" }) {
  if (!items?.length) return null;

  const chip =
    tone === "dark"
      ? "border-white/15 text-on-dark-soft"
      : "border-black/10 text-ink-soft";

  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((item) => (
        <li
          key={item}
          className={`rounded-full border px-3 py-1 text-caption ${chip}`}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

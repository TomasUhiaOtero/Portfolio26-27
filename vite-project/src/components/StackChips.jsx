/**
 * Tecnologías de un proyecto o de un puesto.
 *
 * En mono y con radio de 4 px, no en píldoras: el sistema reserva
 * `rounded-full` para badges y puntos indicadores, nunca para contenedores.
 */
export default function StackChips({ items, className = "" }) {
  if (!items?.length) return null;

  return (
    <ul className={`flex flex-wrap gap-x-2 gap-y-2 ${className}`}>
      {items.map((item) => (
        <li
          key={item}
          className="meta rounded-xs border border-line px-2.5 py-1 text-ink-muted"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

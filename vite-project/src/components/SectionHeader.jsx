import Reveal from "./Reveal";

/**
 * Cabecera editorial reutilizable: eyebrow + titular serif + entradilla.
 *
 * Alineada a la izquierda y con el titular limitado a 20 caracteres de ancho:
 * el corte de línea corto es parte del registro editorial.
 */
export default function SectionHeader({
  eyebrow,
  title,
  intro,
  as: Heading = "h2",
  className = "",
}) {
  return (
    <Reveal className={`flex flex-col gap-5 ${className}`}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}

      <Heading className="max-w-[20ch] text-3xl text-ink md:text-4xl lg:text-5xl">
        {title}
      </Heading>

      {intro ? (
        <p className="max-w-[68ch] text-base text-ink-muted md:text-lg">
          {intro}
        </p>
      ) : null}
    </Reveal>
  );
}

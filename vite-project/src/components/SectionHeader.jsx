import Reveal from "./Reveal";

/**
 * Cabecera de sección: antetítulo pequeño, título grande, entradilla opcional.
 *
 * Alineada a la izquierda, no centrada: centrar los cinco títulos de la página
 * es lo que hacía que todas las secciones tuvieran el mismo ritmo y ninguna
 * destacara.
 */
export default function SectionHeader({ eyebrow, title, intro, tone = "light" }) {
  const isDark = tone === "dark";

  return (
    <header className="max-w-[46rem]">
      <Reveal>
        <p
          className={[
            "text-caption font-medium uppercase tracking-[0.14em]",
            isDark ? "text-on-dark-soft" : "text-ink-soft",
          ].join(" ")}
        >
          {eyebrow}
        </p>
      </Reveal>

      <Reveal delay={80}>
        <h2
          className={[
            "mt-4 text-title sm:text-[3rem]",
            isDark ? "text-on-dark" : "text-ink",
          ].join(" ")}
        >
          {title}
        </h2>
      </Reveal>

      {intro ? (
        <Reveal delay={160}>
          <p
            className={[
              "mt-5 text-body",
              isDark ? "text-on-dark-soft" : "text-ink-soft",
            ].join(" ")}
          >
            {intro}
          </p>
        </Reveal>
      ) : null}
    </header>
  );
}

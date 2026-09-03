import SectionHeader from "../components/SectionHeader";
import Reveal from "../components/Reveal";
import { useLanguage } from "../i18n/useLanguage";

/**
 * Sustituye a "Mis Servicios".
 *
 * Las cinco tarjetas de servicios con emoji ("Desarrollo Web", "Desarrollo
 * Móvil"…) describían una agencia genérica y no decían nada concreto de él.
 * Esto sí: qué tecnologías usa, agrupadas por capa.
 */
export default function Stack() {
  const { t } = useLanguage();

  return (
    <section
      id="stack"
      className="bg-surface-dark py-24 text-on-dark sm:py-32 lg:py-40"
    >
      <div className="mx-auto max-w-[70rem] px-5 sm:px-8">
        <SectionHeader
          eyebrow={t.stack.eyebrow}
          title={t.stack.title}
          intro={t.stack.intro}
          tone="dark"
        />

        <div className="mt-16 grid gap-x-10 gap-y-14 sm:mt-20 sm:grid-cols-2 lg:grid-cols-4">
          {t.stack.groups.map((group, index) => (
            <Reveal key={group.title} delay={index * 80}>
              <h3 className="border-b border-hairline-dark pb-4 text-caption uppercase tracking-[0.14em] text-on-dark-soft">
                {group.title}
              </h3>
              <ul className="mt-5 space-y-2.5">
                {group.items.map((item) => (
                  <li key={item} className="text-body text-on-dark">
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

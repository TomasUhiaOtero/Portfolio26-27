import Section from "../components/Section";
import Reveal from "../components/Reveal";
import { useLanguage } from "../i18n/useLanguage";

/**
 * Banda de cifras a ancho completo entre la portada y los proyectos.
 *
 * Contraste tipográfico fuerte: la cifra en serif a gran tamaño contra una
 * etiqueta mono diminuta en mayúsculas. Divisores verticales de 1 px en
 * escritorio, ninguno en móvil.
 */
export default function StatsBand() {
  const { t } = useLanguage();

  return (
    <Section tone="bone" spacing="tight" aria-label={t.stats.label}>
      <dl className="grid grid-cols-2 gap-y-12 lg:grid-cols-4 lg:divide-x lg:divide-line">
        {t.stats.items.map((stat, index) => (
          <Reveal
            key={stat.label}
            index={index}
            className="flex flex-col lg:px-10 lg:first:pl-0 lg:last:pr-0"
          >
            <dt className="order-2 text-xs tracking-[0.18em] text-ink-subtle uppercase">
              {stat.label}
            </dt>
            <dd className="order-1 mb-3 font-serif text-4xl text-ink md:text-5xl">
              {stat.value}
            </dd>
          </Reveal>
        ))}
      </dl>
    </Section>
  );
}

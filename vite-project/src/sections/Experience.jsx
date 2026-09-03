import SectionHeader from "../components/SectionHeader";
import Reveal from "../components/Reveal";
import StackChips from "../components/StackChips";
import { useLanguage } from "../i18n/useLanguage";

/**
 * Línea de tiempo. Es el componente que mejor funcionaba en la versión
 * anterior, así que se conserva la idea y se reescribe el acabado: línea fina,
 * sin chips de color, y una frase de impacto por puesto en vez de una simple
 * lista de tecnologías.
 */
export default function Experience() {
  const { t } = useLanguage();

  return (
    <section id="experiencia" className="bg-surface-alt py-24 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-[70rem] px-5 sm:px-8">
        <SectionHeader eyebrow={t.experience.eyebrow} title={t.experience.title} />

        <ol className="mt-16 sm:mt-20">
          {t.experience.items.map((item, index) => (
            <Reveal
              as="li"
              key={item.company}
              delay={index * 90}
              className="relative border-l border-hairline pb-14 pl-8 last:pb-0 sm:pl-12"
            >
              <span
                aria-hidden
                className="absolute -left-[4.5px] top-2 size-[9px] rounded-full bg-ink"
              />

              <p className="text-caption uppercase tracking-[0.14em] text-ink-soft">
                {item.period}
              </p>

              <h3 className="mt-3 text-heading sm:text-[1.75rem] sm:tracking-[-0.02em]">
                {item.role}
              </h3>

              <p className="mt-1 text-body font-medium text-ink">
                {item.company}
              </p>

              <p className="mt-4 max-w-[42rem] text-body text-ink-soft">
                {item.summary}
              </p>

              <p className="mt-2 max-w-[42rem] text-body text-ink-soft">
                {item.impact}
              </p>

              <StackChips items={item.stack} className="mt-6" />
            </Reveal>
          ))}
        </ol>

        <div className="mt-20 border-t border-hairline pt-14">
          <Reveal>
            <h3 className="text-heading">{t.experience.educationTitle}</h3>
          </Reveal>

          <dl className="mt-8 grid gap-8 sm:grid-cols-2">
            {t.experience.education.map((item, index) => (
              <Reveal key={item.title} delay={index * 80}>
                <dt className="text-caption uppercase tracking-[0.14em] text-ink-soft">
                  {item.period}
                </dt>
                <dd className="mt-2">
                  <span className="block text-body font-medium">
                    {item.title}
                  </span>
                  <span className="block text-body text-ink-soft">
                    {item.place}
                  </span>
                </dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

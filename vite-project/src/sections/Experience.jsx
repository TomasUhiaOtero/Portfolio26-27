import Section from "../components/Section";
import SectionHeader from "../components/SectionHeader";
import Reveal from "../components/Reveal";
import StackChips from "../components/StackChips";
import { useLanguage } from "../i18n/useLanguage";

/**
 * Trayectoria en formato editorial: cada puesto es una fila de 12 columnas con
 * el periodo en mono a la izquierda y el contenido a la derecha, separadas por
 * una regla de 1 px. Sin línea de tiempo con puntos: la retícula ya ordena.
 */
export default function Experience() {
  const { t } = useLanguage();

  return (
    <Section id="experiencia" tone="bone">
      <SectionHeader eyebrow={t.experience.eyebrow} title={t.experience.title} />

      <ol className="mt-14 md:mt-20">
        {t.experience.items.map((item, index) => (
          <Reveal
            as="li"
            key={item.company}
            index={index}
            className="grid gap-x-12 gap-y-4 border-t border-line py-10 md:py-12 lg:grid-cols-12"
          >
            <p className="meta text-ink-subtle uppercase lg:col-span-3">
              {item.period}
            </p>

            <div className="flex flex-col gap-4 lg:col-span-9">
              <div className="flex flex-col gap-1">
                <h3 className="text-2xl text-ink md:text-3xl">{item.role}</h3>
                <p className="text-base text-ink-muted">{item.company}</p>
              </div>

              <p className="max-w-[68ch] text-base text-ink-muted">
                {item.summary}
              </p>
              <p className="max-w-[68ch] text-base text-ink-muted">
                {item.impact}
              </p>

              <StackChips items={item.stack} className="mt-1" />
            </div>
          </Reveal>
        ))}
      </ol>

      <div className="mt-20">
        <Reveal>
          <h3 className="text-2xl text-ink md:text-3xl">
            {t.experience.educationTitle}
          </h3>
        </Reveal>

        <dl className="mt-8">
          {t.experience.education.map((item, index) => (
            <Reveal
              key={item.title}
              index={index}
              className="grid gap-x-12 gap-y-2 border-t border-line py-7 lg:grid-cols-12"
            >
              <dt className="meta text-ink-subtle uppercase lg:col-span-3">
                {item.period}
              </dt>
              <dd className="lg:col-span-9">
                <span className="block text-lg text-ink">{item.title}</span>
                <span className="block text-base text-ink-muted">
                  {item.place}
                </span>
              </dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </Section>
  );
}

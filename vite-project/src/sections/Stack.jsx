import Section from "../components/Section";
import SectionHeader from "../components/SectionHeader";
import Reveal from "../components/Reveal";
import { useLanguage } from "../i18n/useLanguage";

/**
 * Rejilla bento asimétrica: el ancho de cada bloque alterna 7/5 y 5/7 sobre 12
 * columnas, de modo que ninguna fila repite la anterior.
 *
 * Sustituye a las cinco tarjetas de "Servicios" con emoji, que describían una
 * agencia genérica y no decían nada concreto de él.
 */
const SPAN_PATTERN = [
  "lg:col-span-7",
  "lg:col-span-5",
  "lg:col-span-5",
  "lg:col-span-7",
];

export default function Stack() {
  const { t } = useLanguage();

  return (
    <Section id="stack" tone="canvas">
      <SectionHeader
        eyebrow={t.stack.eyebrow}
        title={t.stack.title}
        intro={t.stack.intro}
      />

      <ul className="mt-14 grid gap-4 md:mt-20 lg:grid-cols-12">
        {t.stack.groups.map((group, index) => (
          <Reveal
            as="li"
            key={group.title}
            index={index}
            className={`flex flex-col gap-5 rounded-md border border-line bg-bone p-6 md:p-10 ${SPAN_PATTERN[index % SPAN_PATTERN.length]}`}
          >
            <p className="eyebrow">{group.title}</p>

            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {group.items.map((item) => (
                <li key={item} className="text-lg text-ink md:text-xl">
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}

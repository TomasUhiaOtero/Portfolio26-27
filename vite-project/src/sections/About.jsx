import Section from "../components/Section";
import SectionHeader from "../components/SectionHeader";
import Reveal from "../components/Reveal";
import Button from "../components/Button";
import { Download } from "../components/icons";
import { useLanguage } from "../i18n/useLanguage";
import { profile } from "../data/content";

/**
 * Texto en primera persona, sin emoji y sin acordeones, a 68 caracteres de
 * ancho máximo.
 *
 * Sin retrato: antes había una imagen de stock de código que no aportaba nada.
 * Cuando exista una fotografía real, entra como columna izquierda de 5.
 */
export default function About() {
  const { t } = useLanguage();

  return (
    <Section id="sobre-mi" tone="bone">
      <div className="grid gap-x-12 gap-y-10 lg:grid-cols-12">
        <SectionHeader
          eyebrow={t.about.eyebrow}
          title={t.about.title}
          className="lg:col-span-4"
        />

        <div className="flex flex-col gap-6 lg:col-span-8">
          {t.about.paragraphs.map((paragraph, index) => (
            <Reveal key={paragraph.slice(0, 24)} index={index}>
              <p className="max-w-[68ch] text-lg text-ink-muted md:text-xl">
                {paragraph}
              </p>
            </Reveal>
          ))}

          <Reveal index={3} className="mt-4">
            <Button
              href={profile.resume}
              download
              variant="secondary"
              icon={Download}
            >
              {t.about.resumeCta}
            </Button>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

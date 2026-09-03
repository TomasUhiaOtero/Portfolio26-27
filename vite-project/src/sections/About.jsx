import SectionHeader from "../components/SectionHeader";
import Reveal from "../components/Reveal";
import Button from "../components/Button";
import { Download } from "../components/icons";
import { useLanguage } from "../i18n/useLanguage";
import { profile } from "../data/content";

/**
 * Texto en primera persona, sin emoji y sin acordeones.
 *
 * Sin foto: antes había una imagen de stock de código que no aportaba nada.
 * Mejor un hueco vacío que relleno. Cuando haya una foto real, entra aquí en
 * una columna a la izquierda.
 */
export default function About() {
  const { t } = useLanguage();

  return (
    <section id="sobre-mi" className="bg-surface py-24 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-[70rem] px-5 sm:px-8">
        <SectionHeader eyebrow={t.about.eyebrow} title={t.about.title} />

        <div className="mt-14 max-w-[42rem] space-y-6 sm:mt-16">
          {t.about.paragraphs.map((paragraph, index) => (
            <Reveal key={paragraph.slice(0, 24)} delay={index * 80}>
              <p className="text-body text-ink sm:text-[1.3125rem] sm:leading-[1.55]">
                {paragraph}
              </p>
            </Reveal>
          ))}

          <Reveal delay={240} className="pt-4">
            <Button
              href={profile.resume}
              download
              variant="onLight"
              icon={Download}
            >
              {t.about.resumeCta}
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

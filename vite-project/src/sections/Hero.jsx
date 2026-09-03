import Section from "../components/Section";
import Button from "../components/Button";
import { ArrowRight, Download } from "../components/icons";
import { useLanguage } from "../i18n/useLanguage";
import { profile } from "../data/content";

/**
 * Portada editorial: titular a escala display sobre 7 columnas y subtitular +
 * llamadas a la acción alineados al pie sobre las 5 restantes.
 *
 * Sin scroll-reveal a propósito: es el LCP de la página y animar su opacidad
 * retrasaría la primera lectura. La única textura es una veladura radial cálida
 * a opacidad 0.07, no un degradado de color.
 */
export default function Hero() {
  const { t } = useLanguage();

  return (
    <Section
      id="inicio"
      spacing="none"
      className="surface-wash pt-32 pb-20 md:pt-44 md:pb-28"
    >
      <div className="grid gap-x-12 gap-y-8 lg:grid-cols-12">
        <p className="eyebrow lg:col-span-12">{t.hero.eyebrow}</p>

        <h1 className="text-display text-ink lg:col-span-7">
          {t.hero.headline}
        </h1>

        <div className="flex flex-col gap-8 lg:col-span-5 lg:self-end lg:pb-3">
          <p className="max-w-[52ch] text-lg text-ink-muted">
            {t.hero.subheadline}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button href="#proyectos" size="lg" icon={ArrowRight}>
              {t.hero.primaryCta}
            </Button>
            <Button
              href={profile.resume}
              download
              variant="secondary"
              size="lg"
              icon={Download}
            >
              {t.hero.secondaryCta}
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}

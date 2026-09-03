import Section from "../components/Section";
import Reveal from "../components/Reveal";
import Button from "../components/Button";
import { ArrowRight, GitHub, LinkedIn } from "../components/icons";
import { useLanguage } from "../i18n/useLanguage";
import { profile } from "../data/content";

/**
 * Cierre de página: una declaración centrada a gran tamaño y un único camino
 * claro.
 *
 * Sin formulario a propósito: no hay backend, y un formulario que no envía a
 * ningún sitio es peor que no tenerlo. El contacto es informativo, por enlaces
 * `mailto:` y `tel:`, igual que en la landing inmobiliaria.
 */
export default function Contact() {
  const { t } = useLanguage();

  const methods = [
    {
      label: t.contact.emailLabel,
      value: profile.email,
      href: `mailto:${profile.email}`,
    },
    {
      label: t.contact.phoneLabel,
      value: profile.phone,
      href: `tel:${profile.phoneHref}`,
    },
    {
      label: t.contact.locationLabel,
      value: t.contact.location,
      href: null,
    },
  ];

  return (
    <Section id="contacto" tone="canvas" className="surface-wash">
      <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <p className="eyebrow">{t.contact.eyebrow}</p>

        <h2 className="text-3xl text-ink md:text-4xl lg:text-5xl">
          {t.contact.title}
        </h2>

        <p className="max-w-[56ch] text-lg text-ink-muted">{t.contact.intro}</p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Button href={`mailto:${profile.email}`} size="lg" icon={ArrowRight}>
            {profile.email}
          </Button>
        </div>
      </Reveal>

      <dl className="mt-20 grid gap-x-12 gap-y-10 border-t border-line pt-12 sm:grid-cols-3">
        {methods.map((method, index) => (
          <Reveal key={method.label} index={index} className="flex flex-col gap-2">
            <dt className="eyebrow">{method.label}</dt>
            <dd className="text-lg text-ink">
              {method.href ? (
                <a
                  href={method.href}
                  className="underline decoration-1 underline-offset-4 decoration-line-strong transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:text-accent"
                >
                  {method.value}
                </a>
              ) : (
                method.value
              )}
            </dd>
          </Reveal>
        ))}
      </dl>

      <Reveal className="mt-12 flex flex-wrap items-center gap-3">
        <Button
          href={profile.github}
          target="_blank"
          rel="noreferrer noopener"
          variant="secondary"
          icon={GitHub}
        >
          {t.contact.githubLabel}
        </Button>
        <Button
          href={profile.linkedin}
          target="_blank"
          rel="noreferrer noopener"
          variant="secondary"
          icon={LinkedIn}
        >
          {t.contact.linkedinLabel}
        </Button>
      </Reveal>
    </Section>
  );
}

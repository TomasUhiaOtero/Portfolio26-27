import Reveal from "../components/Reveal";
import { GitHub, LinkedIn, Mail, MapPin, Phone } from "../components/icons";
import { useLanguage } from "../i18n/useLanguage";
import { profile } from "../data/content";

/**
 * Cierre de la página.
 *
 * Sin formulario a propósito: no hay backend y un formulario que no envía a
 * ningún sitio es peor que no tenerlo. Si más adelante se decide añadirlo,
 * Netlify Forms es configuración pura sobre el hosting actual — queda anotado
 * en docs/PLAN.md §7.
 */
export default function Contact() {
  const { t } = useLanguage();

  const methods = [
    {
      icon: Mail,
      label: t.contact.emailLabel,
      value: profile.email,
      href: `mailto:${profile.email}`,
    },
    {
      icon: Phone,
      label: t.contact.phoneLabel,
      value: profile.phone,
      href: `tel:${profile.phoneHref}`,
    },
    {
      icon: MapPin,
      label: t.contact.locationLabel,
      value: t.contact.location,
      href: null,
    },
  ];

  return (
    <section
      id="contacto"
      className="bg-surface-dark py-24 text-on-dark sm:py-32 lg:py-40"
    >
      <div className="mx-auto max-w-[70rem] px-5 sm:px-8">
        <Reveal>
          <p className="text-caption uppercase tracking-[0.14em] text-on-dark-soft">
            {t.contact.eyebrow}
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="mt-5 max-w-[24ch] text-title text-balance sm:text-[3.5rem]">
            {t.contact.title}
          </h2>
        </Reveal>

        <Reveal delay={160}>
          <p className="mt-6 max-w-[34rem] text-body text-on-dark-soft">
            {t.contact.intro}
          </p>
        </Reveal>

        <Reveal delay={220}>
          <a
            href={`mailto:${profile.email}`}
            className="mt-10 inline-block text-heading text-accent underline-offset-[6px] transition-colors duration-300 hover:underline sm:text-[2rem] sm:tracking-[-0.02em]"
          >
            {profile.email}
          </a>
        </Reveal>

        <dl className="mt-16 grid gap-8 border-t border-hairline-dark pt-12 sm:grid-cols-3">
          {methods.map((method, index) => (
            <Reveal key={method.label} delay={index * 80}>
              <dt className="flex items-center gap-2 text-caption uppercase tracking-[0.14em] text-on-dark-soft">
                <method.icon className="size-4" />
                {method.label}
              </dt>
              <dd className="mt-3 text-body">
                {method.href ? (
                  <a
                    href={method.href}
                    className="underline-offset-4 transition-colors duration-300 hover:text-white hover:underline"
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

        <Reveal delay={240} className="mt-12 flex flex-wrap items-center gap-4">
          <a
            href={profile.github}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-white/10 px-5 text-[15px] ring-1 ring-inset ring-white/15 transition-colors duration-300 hover:bg-white/20"
          >
            <GitHub className="size-[18px]" />
            {t.contact.githubLabel}
          </a>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-white/10 px-5 text-[15px] ring-1 ring-inset ring-white/15 transition-colors duration-300 hover:bg-white/20"
          >
            <LinkedIn className="size-[18px]" />
            {t.contact.linkedinLabel}
          </a>
        </Reveal>
      </div>
    </section>
  );
}

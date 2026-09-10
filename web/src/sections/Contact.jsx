import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { profile } from "../data/content.js";
import Reveal from "../components/Reveal.jsx";

/**
 * The contact section: a full-viewport-height close to the page, centred
 * on `profile.email` as a display-size `mailto:` link.
 *
 * The hover underline is a decorative `<span>` scaled on the X axis
 * (`scale-x-0` → `group-hover:scale-x-100`, matching Button.jsx's own
 * fill-in pattern) rather than a `text-decoration` transition — browsers
 * cannot animate `text-decoration` smoothly, only `transform`/`opacity`
 * reliably tween. The span carries no other transform, so it is the sole
 * owner of its own `transform` property (Task 5's single-owner-of-
 * transform-at-a-time lesson) — nothing else (GSAP entrance included)
 * ever touches this particular element, only its `Reveal`-wrapped
 * ancestor.
 */
export default function Contact() {
  const { t } = useLanguage();
  const c = t.contact;

  const links = [
    { label: c.phoneLabel, value: profile.phone, href: `tel:${profile.phoneHref}` },
    { label: c.locationLabel, value: c.location, href: null },
    { label: c.githubLabel, value: "GitHub", href: profile.github },
    { label: c.linkedinLabel, value: "LinkedIn", href: profile.linkedin },
    { label: t.about.resumeCta, value: t.about.resumeCta, href: profile.resume },
  ];

  return (
    <section
      id="contacto"
      className="relative flex min-h-dvh flex-col justify-center py-24 sm:py-32"
    >
      <div className="mx-auto w-full max-w-[1400px] px-6 sm:px-10">
        <Reveal as="p" className="text-xs uppercase tracking-[0.3em] text-mute">
          {c.eyebrow}
        </Reveal>

        <Reveal
          as="h2"
          delay={0.05}
          className="mt-4 max-w-3xl text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.05] tracking-tight text-text"
        >
          {c.title}
        </Reveal>

        <Reveal as="p" delay={0.08} className="mt-6 max-w-xl text-lg text-mute">
          {c.intro}
        </Reveal>

        <Reveal as="div" delay={0.12} className="mt-12">
          <a
            href={`mailto:${profile.email}`}
            aria-label={c.emailLabel}
            className="group relative inline-block text-[clamp(1.75rem,6vw,4.5rem)] font-semibold leading-[1.1] tracking-tight text-text"
          >
            {profile.email}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 -bottom-1 h-[2px] origin-left scale-x-0 bg-accent transition-transform duration-300 ease-entrance group-hover:scale-x-100 motion-reduce:scale-x-100"
            />
          </a>
        </Reveal>

        <Reveal
          as="div"
          delay={0.16}
          className="mt-14 flex flex-wrap gap-x-10 gap-y-6"
        >
          {links.map((link) => (
            <div key={link.label} className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.3em] text-mute">{link.label}</span>
              {link.href ? (
                <a
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                  className="text-base text-text underline decoration-line underline-offset-4 transition-colors hover:decoration-accent"
                >
                  {link.value}
                </a>
              ) : (
                <span className="text-base text-text">{link.value}</span>
              )}
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

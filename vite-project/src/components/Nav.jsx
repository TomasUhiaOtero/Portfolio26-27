import { useEffect, useRef, useState } from "react";
import Container from "./Container";
import { useLanguage } from "../i18n/useLanguage";
import { profile } from "../data/content";
import { Close, Menu } from "./icons";

/**
 * Cabecera fija.
 *
 * Arranca transparente sobre la portada y, al hacer scroll, adopta fondo
 * translúcido con desenfoque y una línea inferior de 1 px. Es la única
 * excepción de blur que permite el sistema de diseño.
 *
 * El panel móvil, cuando está cerrado, lleva `inert`: sin eso sus enlaces
 * siguen siendo tabulables pese al `aria-hidden` y el foco del teclado viaja a
 * elementos invisibles fuera de pantalla.
 */
export default function Nav() {
  const { t, lang, otherLang, toggleLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    const sections = t.nav.links
      .map((link) => document.getElementById(link.id))
      .filter(Boolean);

    if (!sections.length || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [t.nav.links]);

  const closeMenu = () => setOpen(false);

  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-60 focus:rounded-sm focus:border focus:border-line-strong focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:text-ink"
      >
        {t.nav.skipToContent}
      </a>

      <header className="fixed inset-x-0 top-0 z-50">
        <nav
          aria-label={t.nav.brandAria}
          className={[
            "h-14 border-b transition-[background-color,border-color,backdrop-filter]",
            "duration-[var(--duration-base)] ease-[var(--ease-out)]",
            scrolled || open
              ? "border-line bg-canvas/85 backdrop-blur-md"
              : "border-transparent bg-transparent",
          ].join(" ")}
        >
          <Container as="div" className="flex h-full items-center justify-between">
            <a
              href="#inicio"
              onClick={closeMenu}
              className="font-serif text-lg text-ink"
            >
              {profile.name}
            </a>

            <ul className="hidden items-center gap-8 md:flex">
              {t.nav.links.map((link) => (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    aria-current={activeId === link.id ? "true" : undefined}
                    className={[
                      "text-sm transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)]",
                      activeId === link.id
                        ? "text-ink"
                        : "text-ink-muted hover:text-ink",
                    ].join(" ")}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleLanguage}
                aria-label={t.nav.languageLabel}
                className="meta flex h-11 min-w-11 items-center justify-center rounded-sm px-3 text-ink-muted transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:text-ink"
              >
                <span aria-hidden>{otherLang.toUpperCase()}</span>
              </button>

              <a
                href={profile.resume}
                download
                className="hidden h-10 items-center rounded-sm border border-line-strong px-4 text-sm text-ink transition-[color,border-color,background-color,transform] duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:border-ink-muted hover:bg-surface active:scale-[0.97] sm:inline-flex"
              >
                {t.nav.cv}
              </a>

              <button
                type="button"
                ref={toggleRef}
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-controls="menu-movil"
                aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
                className="flex size-11 items-center justify-center rounded-sm text-ink transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-surface md:hidden"
              >
                {open ? <Close /> : <Menu />}
              </button>
            </div>
          </Container>
        </nav>

        <div
          id="menu-movil"
          inert={!open}
          aria-hidden={!open}
          className={[
            "fixed inset-x-0 top-14 bottom-0 overflow-y-auto border-t border-line bg-canvas md:hidden",
            "transition-opacity duration-[var(--duration-base)] ease-[var(--ease-out)]",
            open ? "opacity-100" : "pointer-events-none opacity-0",
          ].join(" ")}
        >
          <Container className="py-8">
            <ul>
              {t.nav.links.map((link) => (
                <li key={link.id} className="border-b border-line">
                  <a
                    href={`#${link.id}`}
                    onClick={closeMenu}
                    className="block py-5 font-serif text-2xl text-ink"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            <a
              href={profile.resume}
              download
              onClick={closeMenu}
              className="mt-8 inline-flex h-11 items-center rounded-sm border border-line-strong px-6 text-sm text-ink"
            >
              {t.nav.cv}
            </a>
          </Container>
        </div>
      </header>

      <p className="sr-only" role="status">
        {lang === "es" ? "Español" : "English"}
      </p>
    </>
  );
}

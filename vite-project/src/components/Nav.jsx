import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/useLanguage";
import { profile } from "../data/content";
import { Close, Globe, Menu } from "./icons";

/**
 * Barra de navegación fija, translúcida con desenfoque — el patrón de la barra
 * de apple.com, que es oscura también sobre secciones claras.
 *
 * Diferencias con la versión anterior:
 *  - en escritorio los enlaces están siempre visibles; esconderlos tras un
 *    "Menu +" a 1440 px era fricción gratuita;
 *  - el panel móvil, cuando está cerrado, lleva `inert`. Antes seguía siendo
 *    tabulable pese a su `aria-hidden`, así que el foco del teclado viajaba a
 *    seis enlaces invisibles fuera de pantalla antes de llegar al primer CTA.
 */
export default function Nav() {
  const { t, lang, otherLang, toggleLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const panelRef = useRef(null);
  const toggleRef = useRef(null);

  // Cierra con Escape y devuelve el foco al botón que abrió el panel.
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

  // Marca el enlace de la sección visible.
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
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-caption focus:text-ink"
      >
        {t.nav.skipToContent}
      </a>

      <header className="fixed inset-x-0 top-0 z-50">
        <nav
          aria-label={t.nav.brandAria}
          className="h-14 border-b border-white/10 bg-black/80 text-on-dark backdrop-blur-2xl backdrop-saturate-150"
        >
          <div className="mx-auto flex h-full max-w-[70rem] items-center justify-between px-5 sm:px-8">
            <a
              href="#inicio"
              onClick={closeMenu}
              className="text-[15px] font-medium tracking-tight"
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
                      "text-[13px] transition-colors duration-300",
                      activeId === link.id
                        ? "text-on-dark"
                        : "text-on-dark-soft hover:text-on-dark",
                    ].join(" ")}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleLanguage}
                aria-label={t.nav.languageLabel}
                className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-on-dark-soft transition-colors duration-300 hover:bg-white/10 hover:text-on-dark"
              >
                <Globe className="size-4" />
                <span aria-hidden>{otherLang.toUpperCase()}</span>
              </button>

              <a
                href={profile.resume}
                download
                className="hidden h-9 items-center rounded-full bg-white/10 px-4 text-[13px] text-on-dark ring-1 ring-inset ring-white/15 transition-colors duration-300 hover:bg-white/20 sm:inline-flex"
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
                className="flex size-9 items-center justify-center rounded-full text-on-dark transition-colors duration-300 hover:bg-white/10 md:hidden"
              >
                {open ? <Close /> : <Menu />}
              </button>
            </div>
          </div>
        </nav>

        {/* Panel móvil. Cerrado: inert (no recibe foco) y aria-hidden. */}
        <div
          id="menu-movil"
          ref={panelRef}
          inert={!open}
          aria-hidden={!open}
          className={[
            "md:hidden fixed inset-x-0 top-14 bottom-0 overflow-y-auto",
            "border-t border-white/10 bg-black/95 backdrop-blur-2xl",
            "transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            open ? "opacity-100" : "pointer-events-none opacity-0",
          ].join(" ")}
        >
          <ul className="px-5 py-6">
            {t.nav.links.map((link) => (
              <li key={link.id} className="border-b border-white/10">
                <a
                  href={`#${link.id}`}
                  onClick={closeMenu}
                  className="flex items-center justify-between py-4 text-heading text-on-dark"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="pt-6">
              <a
                href={profile.resume}
                download
                onClick={closeMenu}
                className="inline-flex h-11 items-center rounded-full bg-white/10 px-5 text-[15px] text-on-dark ring-1 ring-inset ring-white/15"
              >
                {t.nav.cv}
              </a>
            </li>
          </ul>
        </div>
      </header>

      {/* Idioma activo, anunciado a lectores de pantalla al cambiar. */}
      <p className="sr-only" role="status">
        {lang === "es" ? "Español" : "English"}
      </p>
    </>
  );
}

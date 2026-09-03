import { ArrowUp, GitHub, LinkedIn } from "../components/icons";
import { useLanguage } from "../i18n/useLanguage";
import { profile } from "../data/content";

/**
 * Pie de página. Va fuera de <main>: los landmarks no se anidan.
 */
export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-hairline-dark bg-surface-dark text-on-dark-soft">
      <div className="mx-auto flex max-w-[70rem] flex-col gap-8 px-5 py-12 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[15px] font-medium text-on-dark">{profile.name}</p>
          <p className="mt-1 text-caption">
            © {year} {profile.fullName}. {t.footer.rights}
          </p>
          <p className="mt-1 text-caption">{t.footer.builtWith}</p>
        </div>

        <nav aria-label={t.footer.backToTop} className="flex items-center gap-5">
          <a
            href={profile.github}
            target="_blank"
            rel="noreferrer noopener"
            className="transition-colors duration-300 hover:text-on-dark"
          >
            <GitHub />
            <span className="sr-only">GitHub</span>
          </a>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noreferrer noopener"
            className="transition-colors duration-300 hover:text-on-dark"
          >
            <LinkedIn />
            <span className="sr-only">LinkedIn</span>
          </a>
          <a
            href="#inicio"
            className="inline-flex items-center gap-1.5 text-caption transition-colors duration-300 hover:text-on-dark"
          >
            {t.footer.backToTop}
            <ArrowUp className="size-4" />
          </a>
        </nav>
      </div>
    </footer>
  );
}

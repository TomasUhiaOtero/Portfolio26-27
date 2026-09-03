import Container from "../components/Container";
import { GitHub, LinkedIn } from "../components/icons";
import { useLanguage } from "../i18n/useLanguage";
import { profile } from "../data/content";

/** Pie de página. Va fuera de <main>: los landmarks no se anidan. */
export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-bone">
      <Container className="flex flex-col gap-8 py-12 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <p className="font-serif text-2xl text-ink">{profile.name}</p>
          <p className="meta text-ink-subtle">
            © {year} {profile.fullName}. {t.footer.rights}
          </p>
          <p className="meta text-ink-subtle">{t.footer.builtWith}</p>
        </div>

        <nav aria-label={t.footer.backToTop} className="flex items-center gap-6">
          <a
            href={profile.github}
            target="_blank"
            rel="noreferrer noopener"
            className="text-ink-muted transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:text-ink"
          >
            <GitHub />
            <span className="sr-only">GitHub</span>
          </a>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noreferrer noopener"
            className="text-ink-muted transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:text-ink"
          >
            <LinkedIn />
            <span className="sr-only">LinkedIn</span>
          </a>
          <a
            href="#inicio"
            className="meta text-ink-muted uppercase transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:text-ink"
          >
            {t.footer.backToTop}
          </a>
        </nav>
      </Container>
    </footer>
  );
}

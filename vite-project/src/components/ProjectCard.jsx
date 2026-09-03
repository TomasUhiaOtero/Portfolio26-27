import Reveal from "./Reveal";
import StackChips from "./StackChips";
import ProjectImage from "./ProjectImage";
import { ArrowUpRight } from "./icons";
import { localized } from "../data/projects";
import { useLanguage } from "../i18n/useLanguage";

/**
 * Tarjeta de la rejilla secundaria.
 *
 * Toda la tarjeta es un solo destino: el pseudo-elemento del enlace del título
 * extiende el área clicable a la tarjeta entera, así que no hay enlaces
 * anidados y solo se tabula una vez por proyecto.
 *
 * El hover solo cambia el borde y escala la imagen un 2 %. Tailwind v4 compila
 * la variante `hover:` a `@media (hover: hover)`, así que en táctil no aplica.
 */
export default function ProjectCard({ project, index = 0 }) {
  const { t, lang } = useLanguage();
  const href = project.demo ?? project.code;
  const title = localized(project.title, lang);

  return (
    <Reveal
      as="article"
      index={index}
      className="group relative flex w-full flex-col gap-5 rounded-md border border-line bg-bone p-5 transition-colors duration-[var(--duration-base)] ease-[var(--ease-out)] hover:border-line-strong md:p-6"
    >
      <div className="overflow-hidden rounded-sm border border-line bg-canvas">
        <div className="aspect-16/10">
          <ProjectImage
            base={project.image}
            alt={localized(project.imageAlt, lang)}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out)] group-hover:scale-[1.02]"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="meta text-ink-subtle uppercase">{project.year}</p>
        <h3 className="text-xl text-ink">
          <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="after:absolute after:inset-0 after:content-['']"
          >
            {title}
          </a>
        </h3>
        <p className="text-sm leading-relaxed text-ink-muted">
          {localized(project.tagline, lang)}
        </p>
      </div>

      <StackChips items={project.stack} className="mt-auto" />

      <p className="inline-flex items-center gap-1.5 text-sm text-accent">
        {project.demo ? t.projects.demo : t.projects.code}
        <ArrowUpRight className="size-4" />
      </p>
    </Reveal>
  );
}

import Reveal from "./Reveal";
import StackChips from "./StackChips";
import ProjectImage from "./ProjectImage";
import { ArrowUpRight } from "./icons";
import { localized } from "../data/projects";
import { useLanguage } from "../i18n/useLanguage";

/**
 * Tarjeta de la rejilla secundaria.
 *
 * Toda la tarjeta es un solo enlace, con la zona clicable extendida por el
 * pseudo-elemento del título: un único destino por tarjeta, sin enlaces
 * anidados y con un solo tabulador por proyecto.
 */
export default function ProjectCard({ project, delay = 0 }) {
  const { t, lang } = useLanguage();
  const href = project.demo ?? project.code;
  const title = localized(project.title, lang);

  return (
    <Reveal as="article" delay={delay} className="group relative">
      <div className="overflow-hidden rounded-[1.25rem] bg-surface-alt ring-1 ring-inset ring-black/5">
        <div className="aspect-16/10">
          <ProjectImage
            base={project.image}
            alt={localized(project.imageAlt, lang)}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="transition-[filter] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:brightness-[1.04]"
          />
        </div>
      </div>

      <h3 className="mt-5 text-[1.0625rem] font-semibold tracking-[-0.01em]">
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="after:absolute after:inset-0 after:content-['']"
        >
          {title}
        </a>
      </h3>

      <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">
        {localized(project.tagline, lang)}
      </p>

      <StackChips items={project.stack} className="mt-4" />

      <p className="mt-4 inline-flex items-center gap-1 text-[15px] text-accent">
        {project.demo ? t.projects.demo : t.projects.code}
        <ArrowUpRight className="size-4" />
      </p>
    </Reveal>
  );
}

import Reveal from "./Reveal";
import StackChips from "./StackChips";
import ProjectImage from "./ProjectImage";
import { ArrowUpRight, GitHub } from "./icons";
import { localized } from "../data/projects";
import { useLanguage } from "../i18n/useLanguage";

/**
 * Proyecto destacado: la captura ocupa 7 columnas y la ficha las 5 restantes,
 * alternando el lado en cada proyecto para que ninguna fila repita la anterior.
 *
 * La ficha da lo que hacía falta para poder valorar el trabajo: stack, rol, año
 * y dos enlaces claramente distintos, demo y código.
 */
export default function FeaturedProject({ project, index, priority = false }) {
  const { t, lang } = useLanguage();
  const reversed = index % 2 === 1;
  const title = localized(project.title, lang);

  return (
    <article className="grid items-center gap-x-12 gap-y-8 lg:grid-cols-12">
      <Reveal
        className={[
          "lg:col-span-7",
          reversed ? "lg:order-2 lg:col-start-6" : "",
        ].join(" ")}
      >
        <div className="overflow-hidden rounded-md border border-line bg-bone">
          <div className="aspect-16/10">
            <ProjectImage
              base={project.image}
              alt={localized(project.imageAlt, lang)}
              priority={priority}
              sizes="(min-width: 1024px) 58vw, 100vw"
            />
          </div>
        </div>
      </Reveal>

      <Reveal
        index={1}
        className={[
          "flex flex-col gap-5 lg:col-span-5",
          reversed ? "lg:order-1" : "",
        ].join(" ")}
      >
        <p className="meta text-ink-subtle uppercase">
          {project.year}
          {project.role ? ` · ${localized(project.role, lang)}` : ""}
        </p>

        <div className="flex flex-col gap-3">
          <h3 className="text-3xl text-ink md:text-4xl">{title}</h3>
          <p className="text-lg text-ink-muted">
            {localized(project.tagline, lang)}
          </p>
        </div>

        <p className="max-w-[52ch] text-base leading-relaxed text-ink-muted">
          {localized(project.description, lang)}
        </p>

        <StackChips items={project.stack} className="mt-1" />

        <div className="mt-2 flex flex-wrap items-center gap-x-7 gap-y-3">
          {project.demo ? (
            <a
              href={project.demo}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-sm text-accent underline decoration-1 underline-offset-4 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:text-accent-ink"
            >
              {t.projects.demo}
              <ArrowUpRight className="size-4" />
              <span className="sr-only">— {title}</span>
            </a>
          ) : null}

          {project.code ? (
            <a
              href={project.code}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 text-sm text-ink-muted transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:text-ink"
            >
              <GitHub className="size-4" />
              {t.projects.code}
              <span className="sr-only">— {title}</span>
            </a>
          ) : null}
        </div>
      </Reveal>
    </article>
  );
}

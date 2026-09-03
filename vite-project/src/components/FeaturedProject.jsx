import { useRef } from "react";
import Reveal from "./Reveal";
import StackChips from "./StackChips";
import ProjectImage from "./ProjectImage";
import { ArrowUpRight, GitHub } from "./icons";
import { localized } from "../data/projects";
import { useLanguage } from "../i18n/useLanguage";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useParallax } from "../hooks/useParallax";

/**
 * Proyecto destacado a ancho completo: captura grande a un lado y la
 * información al otro, alternando el orden en cada uno.
 *
 * Frente a las tarjetas anteriores añade lo que faltaba para poder valorar el
 * trabajo: stack, rol, año y dos enlaces claramente distintos (demo y código).
 */
export default function FeaturedProject({ project, index, priority = false }) {
  const { t, lang } = useLanguage();
  const reduced = useReducedMotion();
  const imageRef = useRef(null);
  useParallax(imageRef, { disabled: reduced });

  const reversed = index % 2 === 1;
  const title = localized(project.title, lang);

  return (
    <article className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
      <Reveal
        className={[
          "lg:col-span-7",
          reversed ? "lg:order-2 lg:col-start-6" : "",
        ].join(" ")}
      >
        <div className="overflow-hidden rounded-[1.5rem] bg-surface-alt ring-1 ring-inset ring-black/5 sm:rounded-[2rem]">
          <div ref={imageRef} className="aspect-16/10">
            <ProjectImage
              base={project.image}
              alt={localized(project.imageAlt, lang)}
              priority={priority}
              sizes="(min-width: 1024px) 58vw, 100vw"
            />
          </div>
        </div>
      </Reveal>

      <div className={["lg:col-span-5", reversed ? "lg:order-1" : ""].join(" ")}>
        <Reveal delay={80}>
          <p className="text-caption uppercase tracking-[0.14em] text-ink-soft">
            {project.year}
            {project.role ? ` · ${localized(project.role, lang)}` : ""}
          </p>
          <h3 className="mt-3 text-heading sm:text-[2rem] sm:leading-tight sm:tracking-[-0.02em]">
            {title}
          </h3>
          <p className="mt-2 text-body text-ink-soft">
            {localized(project.tagline, lang)}
          </p>
          <p className="mt-5 text-body text-ink">
            {localized(project.description, lang)}
          </p>

          <StackChips items={project.stack} className="mt-6" />

          <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3">
            {project.demo ? (
              <a
                href={project.demo}
                target="_blank"
                rel="noreferrer noopener"
                className="group inline-flex items-center gap-1.5 text-[15px] font-medium text-accent"
              >
                <span className="underline-offset-4 group-hover:underline">
                  {t.projects.demo}
                </span>
                <ArrowUpRight className="size-[18px]" />
                <span className="sr-only">— {title}</span>
              </a>
            ) : null}

            {project.code ? (
              <a
                href={project.code}
                target="_blank"
                rel="noreferrer noopener"
                className="group inline-flex items-center gap-1.5 text-[15px] text-ink-soft transition-colors duration-300 hover:text-ink"
              >
                <GitHub className="size-[18px]" />
                <span className="underline-offset-4 group-hover:underline">
                  {t.projects.code}
                </span>
                <span className="sr-only">— {title}</span>
              </a>
            ) : null}
          </div>
        </Reveal>
      </div>
    </article>
  );
}

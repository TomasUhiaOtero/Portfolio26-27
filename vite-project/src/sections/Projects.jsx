import SectionHeader from "../components/SectionHeader";
import FeaturedProject from "../components/FeaturedProject";
import ProjectCard from "../components/ProjectCard";
import Reveal from "../components/Reveal";
import { featuredProjects, otherProjects } from "../data/projects";
import { useLanguage } from "../i18n/useLanguage";

/**
 * Sección principal del sitio.
 *
 * Tres proyectos contados con detalle y el resto en una rejilla tranquila, en
 * lugar de nueve tarjetas con el mismo peso visual y un filtro que obligaba a
 * elegir antes de haber visto nada.
 */
export default function Projects() {
  const { t } = useLanguage();

  return (
    <section id="proyectos" className="bg-surface py-24 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-[70rem] px-5 sm:px-8">
        <SectionHeader
          eyebrow={t.projects.eyebrow}
          title={t.projects.title}
          intro={t.projects.intro}
        />

        <div className="mt-16 space-y-24 sm:mt-20 sm:space-y-32">
          {featuredProjects.map((project, index) => (
            <FeaturedProject
              key={project.id}
              project={project}
              index={index}
              priority={index === 0}
            />
          ))}
        </div>

        <Reveal className="mt-28 border-t border-hairline pt-14 sm:mt-36">
          <h3 className="text-heading">{t.projects.moreTitle}</h3>
        </Reveal>

        <div className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {otherProjects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              delay={(index % 3) * 80}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

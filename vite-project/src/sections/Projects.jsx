import Section from "../components/Section";
import SectionHeader from "../components/SectionHeader";
import FeaturedProject from "../components/FeaturedProject";
import ProjectCard from "../components/ProjectCard";
import Reveal from "../components/Reveal";
import { featuredProjects, otherProjects } from "../data/projects";
import { useLanguage } from "../i18n/useLanguage";

/** Sección principal: tres proyectos contados con detalle y el resto en rejilla. */
export default function Projects() {
  const { t } = useLanguage();

  return (
    <Section id="proyectos" tone="canvas">
      <SectionHeader
        eyebrow={t.projects.eyebrow}
        title={t.projects.title}
        intro={t.projects.intro}
      />

      <div className="mt-14 flex flex-col gap-20 md:mt-20 md:gap-28">
        {featuredProjects.map((project, index) => (
          <FeaturedProject
            key={project.id}
            project={project}
            index={index}
            priority={index === 0}
          />
        ))}
      </div>

      <Reveal className="mt-24 border-t border-line pt-14 md:mt-32">
        <h3 className="text-2xl text-ink md:text-3xl">{t.projects.moreTitle}</h3>
      </Reveal>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {otherProjects.map((project, index) => (
          <li key={project.id} className="flex">
            <ProjectCard project={project} index={index % 3} />
          </li>
        ))}
      </ul>
    </Section>
  );
}

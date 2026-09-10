import { lazy, useCallback, useMemo, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { PROJECT_FILTERS, projectsByFilter } from "../data/projects.js";
import Reveal from "../components/Reveal.jsx";
import ProjectCard from "../components/ProjectCard.jsx";
import ProjectOverlay from "../components/ProjectOverlay.jsx";
import LazyCanvas from "../three/LazyCanvas.jsx";

// Lazy, not a static import — keeps three/@react-three out of the initial
// bundle (see Hero.jsx's identical comment). The backdrop is an ambient
// glow behind the grid; it drifts on its own clock now that the section
// is a static grid rather than a carousel with an index to follow.
const WorkBackdrop = lazy(() => import("../three/WorkBackdrop.jsx"));

/**
 * The projects section: a filterable grid of "folder" cards (see
 * ProjectCard.jsx). The filter pills narrow the grid by area
 * (frontend / backend / IA); a card opens the detail overlay, animating
 * out of its own on-screen position.
 *
 * `originRef.current` is set to the clicked card element right before the
 * overlay opens, so ProjectOverlay's shared-element transition has an
 * origin rect to grow from.
 */
export default function Work() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState(null);
  const originRef = useRef(null);

  const shown = useMemo(() => projectsByFilter(filter), [filter]);

  const openProject = useCallback((project, element) => {
    originRef.current = element ?? null;
    setSelectedProject(project);
  }, []);

  return (
    <section
      id="proyectos"
      className="relative isolate border-t border-line py-24 sm:py-32"
      data-selected-project={selectedProject?.id}
    >
      <LazyCanvas
        poster={{ dark: "/img/work-poster.webp", light: "/img/work-poster-light.webp" }}
        dprVariant="backdrop"
        className="absolute inset-0 -z-10 overflow-hidden opacity-70"
      >
        <WorkBackdrop />
      </LazyCanvas>

      <div className="mx-auto w-full max-w-[1400px] px-6 sm:px-10">
        <Reveal as="p" className="text-xs uppercase tracking-[0.3em] text-mute">
          {t.projects.eyebrow}
        </Reveal>
        <Reveal
          as="h2"
          delay={0.05}
          className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-text md:text-5xl"
        >
          {t.projects.title}
        </Reveal>
        <Reveal as="p" delay={0.08} className="mt-3 max-w-xl text-lg text-mute">
          {t.projects.intro}
        </Reveal>

        <Reveal
          as="div"
          delay={0.12}
          role="group"
          aria-label={t.projects.filterLabel}
          className="mt-10 flex flex-wrap gap-2"
        >
          {PROJECT_FILTERS.map((key) => {
            const active = key === filter;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                aria-pressed={active}
                className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-accent ${
                  active
                    ? "border-accent bg-accent text-bg"
                    : "border-line text-mute hover:border-text/30 hover:text-text"
                }`}
              >
                {t.projects.filters[key]}
              </button>
            );
          })}
        </Reveal>

        <ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} onOpen={openProject} />
            </li>
          ))}
        </ul>
      </div>

      <ProjectOverlay
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        originRef={originRef}
      />
    </section>
  );
}

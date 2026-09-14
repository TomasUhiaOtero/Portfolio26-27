import { useCallback, useMemo, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { PROJECT_FILTERS, projectsByFilter } from "../data/projects.js";
import Reveal from "../components/Reveal.jsx";
import ProjectCard from "../components/ProjectCard.jsx";
import ProjectOverlay from "../components/ProjectOverlay.jsx";
import DiamondGrid from "../components/DiamondGrid.jsx";

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
      {/* Background: a seeded diagonal diamond grid with travelling light
          pulses (see components/DiamondGrid.jsx) — its own built-in mask
          already keeps the centre bright and the corners dim, so no
          separate vignette layer is needed here. */}
      <DiamondGrid className="absolute inset-0 -z-10" />

      {/* Legibility scrim for the heading + filter row (see
          `work-copy-scrim`): sits above the diamond grid, below the copy. */}
      <div
        aria-hidden="true"
        className="work-copy-scrim pointer-events-none absolute left-0 top-0 -z-[4] h-[600px] w-[760px] max-w-full"
      />

      <div className="mx-auto w-full max-w-[1400px] px-6 sm:px-10">
        <Reveal as="p" className="text-xs uppercase tracking-[0.3em] text-text/70">
          {t.projects.eyebrow}
        </Reveal>
        <Reveal
          as="h2"
          delay={0.05}
          className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-text md:text-5xl"
        >
          {t.projects.title}
        </Reveal>
        <Reveal as="p" delay={0.08} className="mt-3 max-w-xl text-lg text-text/85">
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
                className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-medium shadow-sm transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-accent ${
                  active
                    ? "border-accent bg-accent text-bg"
                    : "border-text/15 bg-surface text-text hover:border-accent/60 hover:text-accent"
                }`}
              >
                {t.projects.filters[key]}
              </button>
            );
          })}
        </Reveal>

        <ul className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
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

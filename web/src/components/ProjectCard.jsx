import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { localized } from "../data/projects.js";

const CATEGORY_ORDER = ["frontend", "backend", "ia"];

/**
 * One project as a 3D "folder" card, modelled on Framer's card-folder
 * component. Three stacked layers inside a `perspective` container:
 *
 *   1. the folder BACK sheet + a tab bump on its top-left,
 *   2. the PHOTO, tucked into the pocket so only a strip shows at rest,
 *   3. the folder FRONT flap, hinged on its bottom edge.
 *
 * On hover / keyboard focus the whole card lifts, the front flap swings
 * open (`rotateX`, transform-origin bottom, real perspective) and the
 * photo rises up and clear of it — the "WOW" reveal. Everything is
 * `transform`-only and fully frozen under `prefers-reduced-motion`.
 *
 * A real `<button>`: focusable, Enter/Space for free. Activating it opens
 * the detail overlay via `onOpen(project, element)`, where `element` is
 * the origin node for the overlay's shared-element transition.
 */
export default function ProjectCard({ project, onOpen }) {
  const { lang, t } = useLanguage();
  const title = localized(project.title, lang);
  const tagline = localized(project.tagline, lang);
  const imageAlt = localized(project.imageAlt, lang);

  const cats = CATEGORY_ORDER.filter((c) => project.categories?.includes(c))
    .map((c) => t.projects.filters[c])
    .join(" · ");

  return (
    <button
      type="button"
      onClick={(event) => onOpen?.(project, event.currentTarget)}
      aria-label={`${title} — ${t.projects.viewProject}`}
      className="folder-card group relative block aspect-[0.82] w-full cursor-pointer text-left outline-none transition-transform duration-500 ease-entrance hover:-translate-y-2 focus-visible:-translate-y-2 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bg motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0"
    >
      <span className="relative block h-full w-full [transform-style:preserve-3d]">
        {/* Folder tab: a small bump on the top-left of the back sheet. */}
        <span
          aria-hidden="true"
          className="absolute left-[7%] top-[9%] h-[9%] w-[40%] rounded-t-xl border border-b-0 border-line bg-surface-2"
        />

        {/* Folder back sheet. */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 top-[16%] rounded-[20px] border border-line bg-surface-2"
        />

        {/* Photo: tucked into the pocket at rest (only a strip shows above
            the flap); on hover it rises up and scales, clearing the flap
            entirely. `origin-bottom` keeps the growth anchored downward. */}
        <span className="absolute inset-x-[6%] top-[15%] z-10 block h-[58%] origin-bottom overflow-hidden rounded-2xl shadow-xl transition-transform duration-[600ms] ease-entrance group-hover:-translate-y-[46%] group-hover:scale-[1.04] group-focus-visible:-translate-y-[46%] group-focus-visible:scale-[1.04] motion-reduce:!translate-y-0 motion-reduce:!scale-100">
          <picture>
            <source srcSet={`${project.image}-1600.avif`} type="image/avif" />
            <source
              srcSet={`${project.image}-800.webp 800w, ${project.image}-1600.webp 1600w`}
              type="image/webp"
            />
            <img
              src={`${project.image}-1600.webp`}
              alt={imageAlt}
              loading="lazy"
              draggable="false"
              className="h-full w-full object-cover"
            />
          </picture>
        </span>

        {/* Folder front flap: hinged on its bottom edge. Sits proud of the
            back (`translateZ`) so at rest it fully covers the pocket, then
            swings open on hover. */}
        <span className="absolute inset-x-0 bottom-0 z-20 flex h-[60%] origin-bottom flex-col justify-between rounded-[20px] border border-line bg-surface p-5 shadow-[0_22px_54px_-18px_rgba(0,0,0,0.62)] transition-transform duration-[600ms] ease-entrance [transform:translateZ(0.1px)] [backface-visibility:hidden] group-hover:[transform:translateZ(0.1px)_rotateX(-30deg)] group-focus-visible:[transform:translateZ(0.1px)_rotateX(-30deg)] motion-reduce:!transform-none md:p-6">
          <span className="flex items-start justify-between gap-3">
            <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-mute">
              {project.year}
              {cats ? ` · ${cats}` : ""}
            </span>
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 shrink-0 text-mute transition-colors duration-300 group-hover:text-accent"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M7 17L17 7M17 7H8M17 7v9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="block">
            <span className="block text-lg font-semibold leading-tight text-text md:text-xl">
              {title}
            </span>
            <span className="mt-1.5 block text-sm leading-snug text-mute">{tagline}</span>
          </span>
        </span>
      </span>
    </button>
  );
}

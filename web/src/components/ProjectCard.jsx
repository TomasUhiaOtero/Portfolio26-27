import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { localized } from "../data/projects.js";

const CATEGORY_ORDER = ["frontend", "backend", "ia"];

/**
 * One project as a "folder" card: a photo tucked behind a solid body
 * panel whose top-right corner is cut into a file-folder tab (see
 * `.folder-clip` in styles/index.css). At rest only a strip of the photo
 * shows above the folder; on hover (or keyboard focus) the whole card
 * lifts and the photo slides up out of the folder. Activating it opens
 * the detail overlay via `onOpen(project, element)` — the element is the
 * origin for the overlay's shared-element transition.
 *
 * A real `<button>`: focusable, Enter/Space for free. All motion is
 * `transform`-only and disabled under `prefers-reduced-motion`.
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
      className="group relative block aspect-[0.86] w-full cursor-pointer text-left outline-none transition-transform duration-500 ease-entrance hover:-translate-y-2 focus-visible:-translate-y-2 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bg motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {/* Photo: tucked behind the folder at rest, rises clear of it (and
          in front of it, z-20) on hover so it is never clipped. */}
      <span className="absolute inset-x-3 top-0 z-0 block h-[56%] overflow-hidden rounded-2xl shadow-xl transition-transform duration-500 ease-entrance group-hover:z-20 group-hover:-translate-y-[52%] group-hover:scale-[1.05] group-focus-visible:z-20 group-focus-visible:-translate-y-[52%] motion-reduce:!translate-y-0 motion-reduce:!scale-100">
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

      {/* Folder body: solid panel, notched top-right (folder tab). */}
      <span className="folder-clip absolute inset-x-0 bottom-0 z-10 flex h-[72%] flex-col justify-between bg-surface-2 p-5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.65)] transition-transform duration-500 ease-entrance group-hover:translate-y-1 md:p-6">
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
    </button>
  );
}

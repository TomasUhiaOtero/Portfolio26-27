import { forwardRef } from "react";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { localized } from "../data/projects.js";
import { cardTransform } from "../lib/carousel.js";
import Chip from "./Chip.jsx";

/**
 * One card in the projects arc carousel. A thin wrapper around
 * `cardTransform` (the pure geometry in `lib/carousel.js`) — this
 * component's only job is turning that result into markup and style.
 *
 * A real `<button>`, not a `div` with an `onClick`: it is focusable,
 * activates on Enter/Space for free, and gives `role="option"` something
 * legitimate to sit on. The hover lift lives on the inner `<span>` so it
 * never fights the button's own `cardTransform`-driven 3D transform.
 *
 * Ruling R5 (see progress.md): cards outside the visible rings stay
 * mounted — `cardTransform`'s `hidden` flag means "not painted", not "not
 * rendered". `visibility: hidden` (not `display: none`/unmount) keeps
 * them in the DOM and out of the accessibility tree and tab order, so a
 * card never has to be created mid-flight as the spring carries it into
 * view, and `Work.test.jsx` can still find all eight.
 */
const ProjectCard = forwardRef(function ProjectCard(
  { project, offset, selected = false, onSelect, step = 26, radius = 560 },
  ref,
) {
  const { lang, t } = useLanguage();
  const title = localized(project.title, lang);
  const tagline = localized(project.tagline, lang);
  const imageAlt = localized(project.imageAlt, lang);
  const chips = project.stack.slice(0, 4);

  const { transform, opacity, blur, hidden } = cardTransform(offset, { step, radius });

  return (
    <button
      ref={ref}
      type="button"
      role="option"
      aria-selected={selected}
      aria-hidden={hidden || undefined}
      aria-label={`${title} — ${t.projects.viewProject}`}
      tabIndex={selected ? 0 : -1}
      onClick={() => onSelect?.(project)}
      className="absolute inset-0 m-auto h-[320px] w-[220px] cursor-pointer overflow-hidden rounded-[28px] border border-line bg-surface text-left outline-none [backface-visibility:hidden] focus-visible:ring-2 focus-visible:ring-accent md:h-[420px] md:w-[320px]"
      style={{
        transform,
        opacity,
        filter: blur ? `blur(${blur}px)` : "none",
        visibility: hidden ? "hidden" : "visible",
        pointerEvents: hidden ? "none" : "auto",
        transition: "opacity 0.3s ease, filter 0.3s ease",
      }}
    >
      <span className="flex h-full flex-col transition-transform duration-200 ease-out group-hover:-translate-y-1 hover:-translate-y-1">
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
            className="aspect-[16/10] w-full flex-shrink-0 object-cover"
          />
        </picture>
        <span className="flex flex-1 flex-col gap-2 p-4 md:p-5">
          <span className="text-xs uppercase tracking-[0.3em] text-mute">{project.year}</span>
          <span className="text-base font-semibold leading-tight text-text md:text-lg">{title}</span>
          <span className="text-sm text-mute">{tagline}</span>
          <span className="mt-auto flex flex-wrap gap-2 pt-2">
            {chips.map((item) => (
              <Chip key={item}>{item}</Chip>
            ))}
          </span>
        </span>
      </span>
    </button>
  );
});

export default ProjectCard;

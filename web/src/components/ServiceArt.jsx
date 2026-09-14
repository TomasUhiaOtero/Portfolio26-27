/**
 * Per-service photography — the replacement for the old WebGL particle
 * scene (`three/ServiceStage.jsx`, removed) and, before that, the
 * hand-drawn line icons this file used to export. One real photo per
 * `data/services.js` entry, keyed by its `id`, optimized the same way
 * `data/projects.js`'s photos are: `{id}-800.webp` / `{id}-1600.webp` /
 * `{id}-1600.avif` under `public/img/services/`.
 *
 * Every use of these is purely decorative — the real title/description
 * text for each service already renders alongside it (see Services.jsx),
 * so callers mark the wrapping box `aria-hidden` and this file never sets
 * meaningful `alt` text.
 */

/** One service's photo, `object-fit: cover`-ready — the caller sizes the box. */
export function ServicePhoto({ id, className = "" }) {
  const base = `/img/services/${id}`;
  return (
    <picture>
      <source srcSet={`${base}-1600.avif`} type="image/avif" />
      <source srcSet={`${base}-800.webp 800w, ${base}-1600.webp 1600w`} type="image/webp" />
      <img
        src={`${base}-1600.webp`}
        alt=""
        aria-hidden="true"
        loading="lazy"
        draggable="false"
        className={className}
      />
    </picture>
  );
}

/**
 * The sticky slot's visual: every service's photo stacked in the same
 * box on a shared `service-art-glow` backdrop (a themed wash that only
 * shows through while a photo is still loading), crossfaded by `active`
 * (0-3, matching `services` order) via `opacity`/`scale` only. Frozen (no
 * transition) under reduced motion. Purely decorative: the caller marks
 * its wrapper `aria-hidden`.
 */
export default function ServiceVisual({ services, active, className = "" }) {
  return (
    <div className={`service-art-glow relative h-full w-full ${className}`}>
      {services.map((service, index) => (
        <div
          key={service.id}
          className={`absolute inset-0 overflow-hidden transition-[opacity,scale] duration-500 ease-entrance motion-reduce:transition-none ${
            index === active ? "scale-100 opacity-100" : "scale-105 opacity-0"
          }`}
        >
          <ServicePhoto id={service.id} className="h-full w-full object-cover" />
        </div>
      ))}
    </div>
  );
}

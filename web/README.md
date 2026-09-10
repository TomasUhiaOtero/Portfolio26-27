# Portfolio — web

Personal portfolio of Tomás Uhía Otero. Single-page, bilingual (ES/EN),
light/dark, with four small WebGL scenes that lazy-load and unmount when
off-screen.

**Stack:** React 19 · Vite · Tailwind CSS v4 · GSAP 3 (ScrollTrigger) ·
Lenis · three.js / @react-three/fiber · Vitest.

## Running it

```bash
cd web
npm install
npm run dev      # http://localhost:5173
```

`ffmpeg` is only needed to regenerate the WebGL scene posters (see
below); it is not required to run, test or build the site.

### Scripts

| Script            | What it does                                             |
|-------------------|---------------------------------------------------------|
| `npm run dev`     | Vite dev server with HMR.                                |
| `npm run build`   | Production build to `dist/`.                             |
| `npm run preview` | Serve the built `dist/` locally (use for Lighthouse).   |
| `npm run lint`    | ESLint over the whole package (flat config, `eslint.config.js`). |
| `npm run test`    | Vitest in watch mode. Use `npm run test -- --run` for a single pass; add `--no-file-parallelism` if the jsdom worker pool produces spurious timeouts on the About / Experience / ThemeProvider suites. |

## Where the content lives

All user-facing copy and data is in `src/data/` — never hard-coded in
components, and always symmetric between `es` and `en` (a recursive
key-shape test in `src/data/data.test.js` fails the build if one language
gains or loses a nested key the other does not have).

| File                    | Contents                                                                 |
|-------------------------|-------------------------------------------------------------------------|
| `src/data/content.js`   | `profile` (name, email, phone, links, résumé path), and `content.{es,en}` — nav labels, hero, about, services intro copy, experience entries, contact, footer. |
| `src/data/projects.js`  | The Work carousel — one entry per project.                               |
| `src/data/services.js`  | The Services section — one entry per service.                            |

### Adding a project

1. Add an entry to the `projects` array in `src/data/projects.js`:

   ```js
   {
     id: "my-project",            // also the image basename
     featured: true,              // true = large treatment; false = secondary
     image: "/img/my-project",    // path prefix, no size/extension suffix
     imageAlt: { es: "…", en: "…" },
     year: "2025",
     role: { es: "…", en: "…" },
     title: "My Project",         // a plain string is fine when it doesn't translate
     tagline: { es: "…", en: "…" },
     description: { es: "…", en: "…" },
     stack: ["React", "…"],       // not translated
     demo: "https://…" ,          // or null
     code: "https://github.com/…" // or null
   }
   ```

2. Drop **three image files** in `public/img/`, all at **16:10** aspect
   ratio, named from the `id`:

   - `my-project-800.webp`   (carousel card, 1×)
   - `my-project-1600.webp`  (card 2× / overlay)
   - `my-project-1600.avif`  (preferred source, served first)

   The current images are stock mockups. Replacing them with **real
   screenshots of each app running** is the single highest-value content
   change left for this section.

### Editing services copy

Edit the `services` array in `src/data/services.js`. Each entry has a
bilingual `title`, `tagline`, `description`, a bilingual `includes` list
(**same length in both languages**), and a non-translated `stack` array.
`id` must stay stable — it is the React key and the morph-state index the
`ServiceStage` scene reads.

## Regenerating the WebGL scene posters

Every WebGL scene shows a still "poster" image until the real canvas
scrolls into view, and **permanently** under `prefers-reduced-motion`. So
each scene needs two posters — one per theme — in `public/img/`:

```
hero-poster.webp      hero-poster-light.webp
about-poster.webp     about-poster-light.webp
services-poster.webp  services-poster-light.webp
work-poster.webp      work-poster-light.webp
```

They are produced by **`web/scripts/gen-poster.mjs`** — a plain-Node
build tool (never imported from `src/`, never in the bundle). It writes a
PNG; `ffmpeg` then encodes the `.webp`. The exact, copy-pasteable
invocation for every one of the eight posters lives in the **top comment
of the script**; run them from `web/`.

The script has four render modes, one per scene shape:

| Mode           | Shape it draws                                                   | Used by |
|----------------|-----------------------------------------------------------------|---------|
| `network` (default) | Uniform scatter of points, thin lines between nearby pairs, faint dots, soft vignette. | Hero |
| `core-orbit`   | A faceted central polygon with internal chords, plus a loose halo of dots (a few with lines back to the centre). | About / TechCore |
| `grid-frame`   | An ordered dot grid inside a rectangular frame stroke, in browser-window proportions. | Services / ServiceStage |
| `radial-glow`  | A per-pixel reimplementation of the backdrop's fragment shader: radial `accent→glow` gradient over `bg`, plus a soft centre blob. | Work / WorkBackdrop |

Rules the script's comment explains in full and that must be kept:

- **Re-run both themes whenever `--accent` / `--glow` / `--bg` change in
  `src/styles/index.css`.**
- **The light poster needs markedly lower alpha than the dark one** —
  dark marks on a light ground read stronger than light marks on a dark
  ground at equal alpha. Tune the pair side-by-side until neither reads
  louder.
- **Light posters ship with `--vignette-alpha 0`.** A black vignette over
  a near-white ground reads as a crisp grey "spotlight" ellipse, which is
  worse than none.
- Keep the `radial-glow` invocations in sync with `BACKDROP_TUNING` in
  `src/three/WorkBackdrop.jsx` (light `{mix 0.16, blob 0.14}`, dark
  `{mix 0.34, blob 0.24}`) — the poster and the live shader must match.

## Decisions worth not undoing

- **Every author CSS rule lives inside `@layer` or `@utility`**
  (`src/styles/index.css`). An unlayered rule silently outranks *any*
  Tailwind utility — no error, no warning — so a utility just stops
  applying. The `reveal` "visible" state in particular is inside
  `@utility` on purpose: in `@layer base` it would lose to the utilities
  layer by layer order (not specificity) and every revealed element
  would stay at `opacity: 0` forever.

- **The `Reveal` primitive has a 3s force-visible safety net.** If
  ScrollTrigger never fires (measurement failure, JS error, an
  environment with every rect at 0), the element still becomes visible.
  Content must never be trapped behind an animation that didn't run.

- **GSAP hover effects must never touch `transform` / `translate` /
  `scale` / `rotate` on an element a timeline animates.** GSAP leaves an
  inline `transform` on anything it tweens, and an inline style always
  beats a stylesheet `:hover` rule — so the hover would silently never
  fire. The fix used throughout: put the hover effect on a decorative
  child `<span>` (see `Button.jsx`, `ProjectCard.jsx`, `Contact.jsx`'s
  underline), or let the timeline `clearProps` after itself
  (`useIntroTimeline.js`). Exactly one timeline owns any given element's
  transform.

- **The theme anti-flash script in `index.html`** is the first child of
  `<head>`, before any module loads. It reads `localStorage` (guarded)
  and sets `data-theme` on `<html>` synchronously so the first paint is
  already in the right theme. It duplicates the `"portfolio-theme"` key
  and the default — unavoidable, because it must run before any import.
  Do not move it, do not defer it.

- **WebGL canvases must unmount when off-screen.** `LazyCanvas` +
  `IntersectionObserver` mount a scene only while it is in (or near) the
  viewport and unmount it otherwise; r3f's unmount calls
  `forceContextLoss()` and disposes the scene graph. This keeps the live
  WebGL context count at ~1 (only the scene you're looking at) instead of
  accumulating four contexts and hitting the browser's context cap.
  Under `prefers-reduced-motion` no canvas ever mounts — the poster is
  the whole scene.

- **`three` / `@react-three/fiber` are pinned to their own build chunk**
  (`vite.config.js`, `codeSplitting.groups` with explicit `priority`) and
  each scene component is wrapped in `React.lazy` by its caller.
  `LazyCanvas` warns in dev if a child is not lazy. The hero must paint
  text before any 3D code is fetched; `three` must stay out of the
  initial module graph (`dist/index.html` has no reference to it).

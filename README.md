# Portfolio — Tomás Uhía Otero

Portfolio personal. Aplicación de una sola página, bilingüe (español / inglés),
con tema claro y oscuro.

**Stack:** React 19 · Vite · Tailwind CSS v4 · GSAP 3 (ScrollTrigger) · Lenis ·
three.js / @react-three/fiber · Vitest.

**En producción:** https://tomassportfolio.netlify.app/

---

## Puesta en marcha

La aplicación vive en [`web/`](web/). Toda la documentación de desarrollo
—scripts, dónde vive el contenido, cómo añadir un proyecto, cómo regenerar los
pósters de las escenas WebGL— está en [`web/README.md`](web/README.md).

```bash
cd web
npm install
npm run dev      # http://localhost:5173
```

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Build de producción en `web/dist/` |
| `npm run preview` | Sirve el build de producción en local (para Lighthouse) |
| `npm run lint` | ESLint sobre todo el paquete |
| `npm run test` | Vitest (`-- --run` para una sola pasada) |

Verifica siempre contra `npm run preview`, no solo contra el servidor de
desarrollo: el build aplica optimizaciones que pueden cambiar el comportamiento.

---

## Sistema visual

Estética fluida de inspiración Apple: tipografía grande y aireada, movimiento
continuo ligado al scroll, y cuatro escenas WebGL pequeñas que se cargan de
forma diferida y se desmontan al salir de la vista.

- **Hero** — un campo de partículas conectadas como fondo inmersivo.
- **Sobre mí / `TechCore`** — un núcleo de icosaedro con nodos en órbita que se
  reconfiguran por etapas según avanza el scroll, revelando el stack
  (frontend / backend / bases de datos / IA).
- **Servicios / `ServiceStage`** — una geometría que muta entre cuatro estados,
  uno por servicio, con el patrón de tarjetas apiladas tipo Resonance.
- **Proyectos** — un carrusel en arco 3D construido con CSS 3D (no WebGL, para
  que el texto y los enlaces sigan siendo nítidos y accesibles), con
  `WorkBackdrop` como capa WebGL detrás; cada tarjeta abre un overlay de detalle
  con transición de elemento compartido.

También: menú lateral con navegación por secciones, línea de experiencia que se
dibuja con el scroll, sección de contacto y footer, toggle de tema claro/oscuro
con script anti-flash, y respeto completo de `prefers-reduced-motion` (con las
escenas reducidas a su póster).

---

## Estructura

```
web/src/
  components/   Piezas reutilizables (Reveal, SplitText, Button, Chip, SideRail, ProjectCard, ProjectOverlay…)
  sections/     Una sección de la página = un archivo
  three/        Escenas WebGL, LazyCanvas, adaptive (presupuesto por dispositivo), colorTransition
  hooks/        useLenis, useReducedMotion, useTheme, useActiveSection, useFocusTrap
  lib/          Lógica pura y testeable (spring, carousel, stagger, ease…)
  i18n/         Proveedor de idioma y hook useLanguage
  data/         content.js (todo el copy, es/en), projects.js, services.js
  styles/       index.css — tokens de diseño y capas
web/scripts/
  gen-poster.mjs   Generador de los pósters de las escenas WebGL (herramienta Node, fuera del bundle)
```

**Todo el texto vive en `web/src/data/`** y es simétrico entre `es` y `en` (un
test de forma de claves recursivo rompe el build si un idioma gana o pierde una
clave anidada que el otro no tiene). Para cambiar un copy, añadir un proyecto o
retocar una traducción no hace falta tocar ningún componente.

---

## Decisiones que conviene no deshacer

Estas están explicadas a fondo en [`web/README.md`](web/README.md); en resumen:

**Toda regla CSS de autor va dentro de `@layer` o `@utility`.** En Tailwind v4
una regla suelta gana a cualquier utilidad por orden de capa, sin importar la
especificidad, y rompe cosas en silencio. El estado visible de `reveal` va
dentro de su `@utility` por esta razón exacta.

**El contenido nunca arranca oculto por CSS a secas.** Las animaciones de
entrada solo esconden elementos si existe la clase `js` en `<html>` y si el
usuario no ha pedido menos movimiento. `Reveal` fuerza la visibilidad a los 3 s
como red de seguridad si el `IntersectionObserver` no llegara a dispararse.

**Los efectos hover de GSAP nunca tocan `transform` en un elemento que anima una
timeline.** GSAP deja un `transform` inline, y un estilo inline gana a una regla
`:hover` de hoja de estilos — el hover simplemente no se dispararía. El efecto
va en un `<span>` decorativo hijo, o la timeline hace `clearProps` de lo suyo.

**El script anti-flash de tema en `index.html`** es el primer hijo de `<head>`,
antes de cualquier módulo. Lee `localStorage` y fija `data-theme` de forma
síncrona para que el primer pintado ya esté en el tema correcto. No moverlo, no
diferirlo.

**Las escenas WebGL se desmontan al salir de la vista.** `LazyCanvas` +
`IntersectionObserver` montan una escena solo mientras está cerca del viewport;
el desmontaje de r3f libera el contexto WebGL. Así el número de contextos vivos
se mantiene en ~1 en lugar de acumular cuatro. `three` vive en su propio chunk y
nunca entra en el grafo de módulos inicial.

**Reglas de motion:** solo se animan `transform` y `opacity`; nunca
`transition: all`; nunca `ease-in`; la interfaz por debajo de 300 ms y solo el
scroll-reveal llega a 600 ms; `active:scale(0.97)` en pulsables.

---

## Documentación

- [`web/README.md`](web/README.md) — guía de desarrollo del sitio
- [`docs/AUDITORIA.md`](docs/AUDITORIA.md) — auditoría de la versión anterior, con medidas
- [`docs/PLAN.md`](docs/PLAN.md) — sistema de diseño y fases del rediseño
- [`docs/superpowers/specs/2026-09-08-portfolio-v3-design.md`](docs/superpowers/specs/2026-09-08-portfolio-v3-design.md) — especificación de diseño de esta versión
- [`docs/superpowers/plans/2026-09-08-portfolio-v3.md`](docs/superpowers/plans/2026-09-08-portfolio-v3.md) — plan de implementación por tareas

---

## Contacto

- **Email:** tomasuhiaotero@gmail.com
- **GitHub:** [github.com/TomasUhiaOtero](https://github.com/TomasUhiaOtero)
- **LinkedIn:** [Tomás Uhía Otero](https://www.linkedin.com/in/tom%C3%A1s-uh%C3%ADa-otero-b10748345/)

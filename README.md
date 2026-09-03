# Portfolio — Tomás Uhía Otero

Portfolio personal. React + Vite + Tailwind CSS v4 + GSAP, bilingüe (español/inglés) y desplegado en Netlify.

**En producción:** https://tomassportfolio.netlify.app/

---

## Puesta en marcha

La aplicación vive en `vite-project/`.

```bash
cd vite-project
npm install
npm run dev
```

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build de producción en local |
| `npm run lint` | ESLint sobre todo el proyecto |

Verifica siempre contra `npm run preview`, no solo contra el servidor de desarrollo: el build aplica optimizaciones que pueden cambiar el comportamiento.

---

## Estructura

```
vite-project/src/
  components/   Piezas reutilizables (Nav, Reveal, ProjectCard, Button, icons…)
  sections/     Una sección de la página = un archivo
  hooks/        useIntroTimeline, useParallax, useReducedMotion
  i18n/         Proveedor de idioma y hook useLanguage
  data/         content.js (todo el copy, es/en) y projects.js
  styles/       index.css — tokens de diseño y capas base
```

**Todo el texto vive en `src/data/`.** Para cambiar un copy, añadir un proyecto o retocar la traducción no hace falta tocar ningún componente.

---

## Cómo añadir un proyecto

1. Genera las imágenes en `public/img/` con el nombre `<id>-800.webp`, `<id>-1600.webp` y `<id>-1600.avif`, todas recortadas a 16:10.
2. Añade la entrada en `src/data/projects.js`. Campos que puede tener en español e inglés: `title`, `tagline`, `description`, `role`, `imageAlt`.
3. `featured: true` lo coloca entre los destacados a ancho completo; `false`, en la rejilla de abajo.

---

## Decisiones que conviene no deshacer

**El contenido nunca arranca oculto por CSS a secas.** Las animaciones de entrada solo esconden elementos si existe la clase `js` en `<html>` (la pone `main.jsx`) y si el usuario no ha pedido menos movimiento. Además, `Reveal` fuerza la visibilidad a los 3 s si el `IntersectionObserver` no llegara a dispararse. La versión anterior del portfolio dejaba la sección de proyectos permanentemente invisible en móvil por no tener estas redes.

**Toda regla CSS de autor va dentro de `@layer`.** En Tailwind v4 una regla suelta gana a cualquier utilidad sin importar la especificidad, y rompe cosas en silencio.

**El panel del menú móvil lleva `inert` cuando está cerrado.** Sin eso sus enlaces siguen siendo tabulables pese al `aria-hidden`, y el foco del teclado viaja a elementos invisibles fuera de pantalla.

**Ningún `:hover` usa `transform`.** GSAP deja estilos inline en los elementos que anima al terminar un timeline, y esos estilos anulan cualquier `:hover` con `transform` sin dar error.

---

## Documentación

- [`docs/AUDITORIA.md`](docs/AUDITORIA.md) — auditoría de la versión anterior, con medidas
- [`docs/PLAN.md`](docs/PLAN.md) — sistema de diseño, estructura y fases del rediseño

---

## Contacto

- **Email:** tomasuhiaotero@gmail.com
- **GitHub:** [github.com/TomasUhiaOtero](https://github.com/TomasUhiaOtero)
- **LinkedIn:** [Tomás Uhía Otero](https://www.linkedin.com/in/tom%C3%A1s-uh%C3%ADa-otero-b10748345/)

/**
 * Proyectos.
 *
 * `featured: true` → se muestra a ancho completo en la parte alta de la
 * sección, con capturas grandes, chips de stack, rol y año.
 * El resto va en la rejilla secundaria de abajo.
 *
 * NOTA: las imágenes son las que ya había en `public/` (mockups y stock).
 * Sustituir por capturas reales de cada aplicación funcionando: es el cambio
 * de contenido que más va a mejorar esta sección.
 */

export const projects = [
  {
    id: "tomasdex",
    categories: ["frontend", "ia"],
    featured: true,
    image: "/img/tomasdex",
    imageAlt: {
      es: "Interfaz de TomasDex mostrando una rejilla de Pokémon",
      en: "TomasDex interface showing a grid of Pokémon",
    },
    year: "2025",
    role: { es: "Diseño y desarrollo", en: "Design and development" },
    title: "TomasDex",
    tagline: {
      es: "Pokédex completa sobre la PokéAPI",
      en: "A complete Pokédex built on the PokéAPI",
    },
    description: {
      es: "Buscador de Pokémon con fichas detalladas, estadísticas, cadenas de evolución y filtros por tipo y generación. Construido apoyándome en agentes y skills de IA para acelerar las partes repetitivas sin perder control del código.",
      en: "Pokémon browser with detailed entries, stats, evolution chains and filters by type and generation. Built leaning on AI agents and skills to speed up the repetitive parts without losing control of the code.",
    },
    stack: ["React", "JavaScript", "PokéAPI", "CSS"],
    demo: "https://tomasdex.netlify.app/",
    code: null,
  },
  {
    id: "resonance-guitars",
    categories: ["frontend"],
    featured: true,
    image: "/img/resonance-guitars",
    imageAlt: {
      es: "Primer plano de unas manos tocando el diapasón de una guitarra acústica",
      en: "Close-up of hands playing an acoustic guitar's fretboard",
    },
    year: "2026",
    role: { es: "Diseño y desarrollo", en: "Design and development" },
    title: "ResonanceGuitars",
    tagline: {
      es: "Landing animada para una lutería artesanal",
      en: "An animated landing page for a handmade-guitar workshop",
    },
    description: {
      es: "Web de venta de guitarras con catálogo, afinador y pruebas de sonido integrados.",
      en: "A guitar sales website with a catalog, built-in tuner and sound tests.",
    },
    stack: ["React", "Vite", "Tailwind CSS", "GSAP"],
    demo: "https://resonanceguitars.netlify.app/",
    code: null,
  },
  {
    id: "asistente-ia",
    categories: ["ia", "backend"],
    featured: true,
    image: "/img/asistente-ia",
    imageAlt: {
      es: "Asistente de estudio con IA generando preguntas de test",
      en: "AI study assistant generating quiz questions",
    },
    year: "2025",
    role: { es: "Full-stack", en: "Full-stack" },
    title: "Asistente de Estudio IA",
    tagline: {
      es: "Convierte apuntes en tests, flashcards y resúmenes",
      en: "Turns notes into quizzes, flashcards and summaries",
    },
    description: {
      es: "Herramienta que toma material de estudio y genera con un modelo de lenguaje tres formatos de repaso interactivo: preguntas tipo test, tarjetas de memoria y resúmenes.",
      en: "A tool that takes study material and uses a language model to generate three interactive revision formats: multiple-choice questions, flashcards and summaries.",
    },
    stack: ["JavaScript", "LLM API", "Node.js", "CSS"],
    demo: null,
    code: "https://github.com/TomasUhiaOtero/Asistente-IA",
  },
  {
    id: "kairos",
    categories: ["frontend", "backend"],
    featured: true,
    image: "/img/kairos",
    imageAlt: {
      es: "Calendario de Kairós con tareas y eventos",
      en: "Kairós calendar showing tasks and events",
    },
    year: "2025",
    role: { es: "Full-stack", en: "Full-stack" },
    title: "Kairós",
    tagline: {
      es: "Gestión de tareas y eventos en un solo calendario",
      en: "Tasks and events in a single calendar",
    },
    description: {
      es: "Aplicación de planificación que combina datos locales con APIs externas en una vista de calendario única, con creación y edición en línea y persistencia entre sesiones.",
      en: "Planning app that combines local data with external APIs in a single calendar view, with inline creation and editing and persistence between sessions.",
    },
    stack: ["JavaScript", "API REST", "CSS", "LocalStorage"],
    demo: null,
    code: "https://github.com/TomasUhiaOtero/Kairos",
  },

  /* --- Rejilla secundaria --- */
  {
    id: "topmusic",
    categories: ["frontend"],
    featured: false,
    image: "/img/topmusic",
    imageAlt: {
      es: "Página de TopMusic con listas por género",
      en: "TopMusic page showing charts by genre",
    },
    year: "2024",
    title: "TopMusic",
    tagline: {
      es: "Listas musicales y descubrimiento por género",
      en: "Music charts and discovery by genre",
    },
    stack: ["JavaScript", "API REST", "CSS"],
    demo: null,
    code: "https://github.com/TomasUhiaOtero/Proyecto-CSDAM",
  },
  {
    id: "starwars-api",
    categories: ["backend"],
    featured: false,
    image: "/img/starwars-api",
    imageAlt: {
      es: "Ilustración de una API REST",
      en: "Illustration of a REST API",
    },
    year: "2024",
    title: "API REST Star Wars",
    tagline: {
      es: "Base de datos, endpoints y pruebas con Postman",
      en: "Database, endpoints and Postman testing",
    },
    stack: ["Node.js", "API REST", "SQL", "Postman"],
    demo: null,
    code: "https://github.com/TomasUhiaOtero/API-REST-StarWars",
  },
  {
    id: "conversor",
    categories: ["frontend"],
    featured: false,
    image: "/img/conversor",
    imageAlt: {
      es: "Conversor de divisas en pantalla",
      en: "Currency converter on screen",
    },
    year: "2023",
    title: {
      es: "Conversor de monedas",
      en: "Currency converter",
    },
    tagline: {
      es: "Conversión en tiempo real con una API de divisas",
      en: "Real-time conversion using an exchange-rate API",
    },
    stack: ["JavaScript", "API REST", "CSS"],
    demo: null,
    code: "https://github.com/TomasUhiaOtero/Conversor-monedas",
  },
  {
    id: "springboot-libreria",
    categories: ["backend"],
    featured: false,
    image: "/img/springboot-libreria",
    imageAlt: {
      es: "Ilustración de una arquitectura de servicio",
      en: "Illustration of a service architecture",
    },
    year: "2024",
    title: {
      es: "Servicio Spring Boot — librería",
      en: "Spring Boot service — bookshop",
    },
    tagline: {
      es: "CRUD sobre arquitectura MVC con Spring Boot",
      en: "CRUD on an MVC architecture with Spring Boot",
    },
    stack: ["Java", "Spring Boot", "MVC", "SQL"],
    demo: null,
    code: "https://github.com/TomasUhiaOtero/SpringBoot/tree/master/libreria-springboot/libreria",
  },
  {
    id: "tres-en-raya",
    categories: ["frontend"],
    featured: false,
    image: "/img/tres-en-raya",
    imageAlt: {
      es: "Tablero de tres en raya",
      en: "Tic-tac-toe board",
    },
    year: "2023",
    title: {
      es: "Tres en raya",
      en: "Tic-tac-toe",
    },
    tagline: {
      es: "El clásico, con JavaScript y CSS",
      en: "The classic, in JavaScript and CSS",
    },
    stack: ["JavaScript", "CSS", "HTML"],
    demo: null,
    // TODO(Tomás): en la web actual este enlace apuntaba al repo de Spring Boot.
    // Confirmar cuál es el repositorio correcto del tres en raya.
    code: "https://github.com/TomasUhiaOtero/Practice",
  },
];


/** Filter keys for the Work section. `all` shows everything. */
export const PROJECT_FILTERS = ["all", "frontend", "backend", "ia"];

/** Projects whose `categories` include `filter` (every project for "all"). */
export function projectsByFilter(filter) {
  if (!filter || filter === "all") return projects;
  return projects.filter((p) => p.categories?.includes(filter));
}

export const featuredProjects = projects.filter((p) => p.featured);
export const otherProjects = projects.filter((p) => !p.featured);

/** Devuelve el valor traducido de un campo que puede ser string o {es, en}. */
export function localized(field, lang) {
  if (field == null) return "";
  return typeof field === "string" ? field : (field[lang] ?? field.es ?? "");
}

/**
 * Todo el copy del sitio, en español e inglés.
 *
 * Ningún literal de texto vive en el JSX: así se puede reescribir el contenido
 * o añadir un idioma sin tocar componentes, y los tests pueden importar este
 * módulo en vez de duplicar cadenas.
 */

export const LANGUAGES = ["es", "en"];
export const DEFAULT_LANGUAGE = "es";

/** Datos que no se traducen. */
export const profile = {
  name: "Tomás Uhía",
  fullName: "Tomás Uhía Otero",
  email: "tomasuhiaotero@gmail.com",
  phone: "+34 698 107 375",
  phoneHref: "+34698107375",
  github: "https://github.com/TomasUhiaOtero",
  linkedin: "https://www.linkedin.com/in/tom%C3%A1s-uh%C3%ADa-otero-b10748345/",
  // Two different files, not one shared PDF: the ES/EN CVs differ in more
  // than translation (e.g. one may list a role the other doesn't yet), so
  // each language must link its own.
  resume: {
    es: "/CV-TomasUhiaOtero-ES.pdf",
    en: "/CV-TomasUhiaOtero-EN.pdf",
  },
  // LazyCanvas resolves dark/light itself via useTheme() — see its
  // docblock — so every caller just hands over both stills once.
  heroPoster: {
    dark: "/img/hero-poster.webp",
    light: "/img/hero-poster-light.webp",
  },
};

export const content = {
  es: {
    htmlLang: "es",
    nav: {
      brandAria: "Tomás Uhía — inicio",
      railLabel: "Navegación de secciones",
      links: [
        { id: "inicio", label: "Inicio" },
        { id: "sobre-mi", label: "Sobre mí" },
        { id: "servicios", label: "Servicios" },
        { id: "experiencia", label: "Experiencia" },
        { id: "proyectos", label: "Proyectos" },
        { id: "contacto", label: "Contacto" },
      ],
      cv: "CV",
      openMenu: "Abrir menú",
      closeMenu: "Cerrar menú",
      languageLabel: "Cambiar idioma a inglés",
      skipToContent: "Saltar al contenido",
      themeLabelToDark: "Cambiar a tema oscuro",
      themeLabelToLight: "Cambiar a tema claro",
    },
    hero: {
      eyebrow: "Tomás Uhía Otero — Pontevedra, España",
      headline: "Desarrollador full-stack, del modelo de datos a la interfaz.",
      // The headline as three stacked lines; the middle one is rendered as
      // particle text (see HeroParticleText.jsx). `lead` may be empty.
      headlineParts: {
        lead: "Desarrollador",
        accent: "full-stack",
        tail: "del modelo de datos a la interfaz.",
      },
      subheadline:
        "Java y Spring en el servidor, React en el cliente. Ahora mismo automatizo procesos con IA en RE/MAX, en el sector inmobiliario.",
      primaryCta: "Ver proyectos",
      secondaryCta: "Descargar CV",
    },
    stats: {
      label: "Cifras del perfil",
      items: [
        { value: "2+", label: "Años desarrollando" },
        { value: "9", label: "Proyectos publicados" },
        { value: "Java · React · JavaScript · Python", label: "Stack principal" },
        { value: "ES · EN", label: "Idiomas de trabajo" },
      ],
    },
    projects: {
      eyebrow: "Trabajo",
      title: "Proyectos",
      intro:
        "Tres proyectos que resumen bien cómo trabajo. Debajo, el resto del repositorio.",
      demo: "Ver demo",
      code: "Código",
      role: "Rol",
      year: "Año",
      moreTitle: "Otros proyectos",
      viewProject: "Ver proyecto",
      close: "Cerrar",
      prev: "Proyecto anterior",
      next: "Proyecto siguiente",
      filterLabel: "Filtrar por área",
      filters: { all: "Todos", frontend: "Frontend", backend: "Backend", ia: "IA" },
    },
    experience: {
      eyebrow: "Trayectoria",
      title: "Experiencia",
      present: "Presente",
      items: [
        {
          period: "Jul 2026 — Presente",
          role: "Desarrollador full-stack — IA y Automatización",
          company: "RE/MAX",
          summary:
            "Automatización de procesos con IA en el sector inmobiliario: seguimiento y gestión de leads con la WhatsApp Cloud API, además de soporte y consultoría IT.",
          impact:
            "Bots de seguimiento que aumentan la capacidad de respuesta más de un 30 %; relleno automático de contratos con IA que ahorra más de la mitad del tiempo de entrada manual.",
          stack: ["WhatsApp Cloud API", "Python", "Automatización", "IA"],
        },
        {
          period: "Feb 2026 — Abr 2026",
          role: "Desarrollador full-stack",
          company: "IT Salnés",
          summary:
            "Aplicación web y móvil de gestión para hoteles y restaurantes: escáner de facturas con IA construido desde cero en Java, Spring y MongoDB, cliente Android y paneles web.",
          impact:
            "Integración de herramientas de IA (Mistral) para ganar productividad sin perder control ni escalabilidad sobre el producto en producción.",
          stack: ["Java", "Spring", "MongoDB", "Android Studio", "Mistral", "Postman"],
        },
        {
          period: "Sep 2024 — Dic 2024",
          role: "Prácticas — Desarrollador Front-End",
          company: "LoggForSport",
          summary:
            "Web corporativa de eventos deportivos, maquetada desde cero y responsive.",
          impact:
            "Primer contacto con un flujo de trabajo real: benchmarking del sector, control de versiones, revisiones y entregas con fecha.",
          stack: ["HTML", "CSS", "JavaScript", "React"],
        },
      ],
      educationTitle: "Formación",
      education: [
        {
          period: "2025",
          title: "Bootcamp Full-Stack",
          place: "4Geeks Academy",
        },
        {
          period: "2022 — 2024",
          title: "CFGS Desarrollo de Aplicaciones Multiplataforma",
          place: "Academia Tesdai",
        },
        {
          period: "03/2026",
          title: "Desarrollo con IA",
          place: "BIG School — Escuela de Marketing Digital, IA y Negocios",
        },
        {
          period: "2025",
          title: "Inteligencia artificial y productividad",
          place: "Santander Open Academy",
        },
      ],
    },
    stack: {
      eyebrow: "Tecnologías",
      title: "Stack",
      intro: "Con lo que trabajo a diario, y con lo que estoy más cómodo.",
      groups: [
        {
          title: "Frontend",
          items: [
            "React",
            "JavaScript",
            "HTML",
            "CSS",
            "Tailwind CSS",
            "Bootstrap",
            "Astro",
            "Vite",
          ],
        },
        {
          title: "Backend",
          items: ["Java", "Spring Boot", "Node.js", "Python", "Flask", "PHP", "API REST"],
        },
        { title: "Datos", items: ["MongoDB", "MySQL", "SQLAlchemy"] },
        {
          title: "Herramientas",
          items: ["Git", "GitHub", "IntelliJ", "Android Studio", "Postman", "Mistral"],
        },
      ],
    },
    about: {
      eyebrow: "Perfil",
      title: "Sobre mí",
      paragraphs: [
        "Soy desarrollador full-stack en Pontevedra. Llevo más de dos años construyendo aplicaciones web y móviles: primero en formación, después sobre producto real en IT Salnés y ahora automatizando procesos con IA en RE/MAX.",
        "Me interesa el recorrido completo de una funcionalidad: pensar el modelo de datos, exponer una API que tenga sentido y rematar la interfaz con la que alguien va a convivir todos los días. La parte que más disfruto es la última.",
        "Me formé en el CFGS de Desarrollo de Aplicaciones Multiplataforma y completé el bootcamp full-stack de 4Geeks Academy. Sigo aprendiendo, sobre todo en el terreno de las herramientas de IA aplicadas al desarrollo.",
      ],
      resumeCta: "Descargar CV",
    },
    contact: {
      eyebrow: "Contacto",
      title: "¿Tienes un proyecto? Hablemos.",
      intro:
        "La forma más rápida es el correo. Respondo en menos de 24 horas.",
      emailLabel: "Correo",
      resumeLabel: "CV",
      phoneLabel: "Teléfono",
      locationLabel: "Ubicación",
      location: "Pontevedra, España",
      githubLabel: "GitHub",
      linkedinLabel: "LinkedIn",
    },
    footer: {
      rights: "Todos los derechos reservados.",
      builtWith: "Hecho con React, Vite, Tailwind CSS, GSAP y three.js.",
      backToTop: "Volver arriba",
    },
  },

  en: {
    htmlLang: "en",
    nav: {
      brandAria: "Tomás Uhía — home",
      railLabel: "Section navigation",
      links: [
        { id: "inicio", label: "Home" },
        { id: "sobre-mi", label: "About" },
        { id: "servicios", label: "Services" },
        { id: "experiencia", label: "Experience" },
        { id: "proyectos", label: "Work" },
        { id: "contacto", label: "Contact" },
      ],
      cv: "Résumé",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      languageLabel: "Switch language to Spanish",
      skipToContent: "Skip to content",
      themeLabelToDark: "Switch to dark theme",
      themeLabelToLight: "Switch to light theme",
    },
    hero: {
      eyebrow: "Tomás Uhía Otero — Pontevedra, Spain",
      headline: "Full-stack developer, from the data model to the interface.",
      headlineParts: {
        lead: "",
        accent: "Full-stack",
        tail: "developer, from the data model to the interface.",
      },
      subheadline:
        "Java and Spring on the server, React on the client. Currently automating processes with AI at RE/MAX, in real estate.",
      primaryCta: "See work",
      secondaryCta: "Download résumé",
    },
    stats: {
      label: "Profile figures",
      items: [
        { value: "2+", label: "Years building" },
        { value: "9", label: "Shipped projects" },
        { value: "Java · React · JavaScript · Python", label: "Core stack" },
        { value: "ES · EN", label: "Working languages" },
      ],
    },
    projects: {
      eyebrow: "Work",
      title: "Projects",
      intro:
        "Three projects that show how I work. Everything else is below.",
      demo: "Live demo",
      code: "Source",
      role: "Role",
      year: "Year",
      moreTitle: "Other projects",
      viewProject: "View project",
      close: "Close",
      prev: "Previous project",
      next: "Next project",
      filterLabel: "Filter by area",
      filters: { all: "All", frontend: "Frontend", backend: "Backend", ia: "AI" },
    },
    experience: {
      eyebrow: "Background",
      title: "Experience",
      present: "Present",
      items: [
        {
          period: "Jul 2026 — Present",
          role: "Full-Stack Developer — AI & Automation",
          company: "RE/MAX",
          summary:
            "Process automation with AI in real estate: lead tracking and follow-up through the WhatsApp Cloud API, plus general IT support and consulting.",
          impact:
            "Follow-up bots lifted responsiveness by over 30%; AI-assisted contract data entry cut manual work by more than half.",
          stack: ["WhatsApp Cloud API", "Python", "Automation", "AI"],
        },
        {
          period: "Feb 2026 — Apr 2026",
          role: "Full-stack developer",
          company: "IT Salnés",
          summary:
            "Web and mobile management application for hotels and restaurants: an AI invoice scanner built from zero in Java, Spring and MongoDB, an Android client and web dashboards.",
          impact:
            "Integrated AI tooling (Mistral) to boost productivity without losing control or scalability over software running in production.",
          stack: ["Java", "Spring", "MongoDB", "Android Studio", "Mistral", "Postman"],
        },
        {
          period: "Sep 2024 — Dec 2024",
          role: "Internship — Front-End Developer",
          company: "LoggForSport",
          summary:
            "Corporate website for sports events, built responsive from scratch.",
          impact:
            "First exposure to a real workflow: sector benchmarking, version control, reviews and deadlines.",
          stack: ["HTML", "CSS", "JavaScript", "React"],
        },
      ],
      educationTitle: "Education",
      education: [
        { period: "2025", title: "Full-Stack Bootcamp", place: "4Geeks Academy" },
        {
          period: "2022 — 2024",
          title: "Higher Diploma in Cross-Platform Application Development",
          place: "Academia Tesdai",
        },
        {
          period: "03/2026",
          title: "AI Development",
          place: "BIG School — Digital Marketing, AI and Business Academy",
        },
        {
          period: "2025",
          title: "Artificial Intelligence and Productivity",
          place: "Santander Open Academy",
        },
      ],
    },
    stack: {
      eyebrow: "Technologies",
      title: "Stack",
      intro: "What I work with day to day, and what I am most comfortable in.",
      groups: [
        {
          title: "Frontend",
          items: [
            "React",
            "JavaScript",
            "HTML",
            "CSS",
            "Tailwind CSS",
            "Bootstrap",
            "Astro",
            "Vite",
          ],
        },
        {
          title: "Backend",
          items: ["Java", "Spring Boot", "Node.js", "Python", "Flask", "PHP", "REST APIs"],
        },
        { title: "Data", items: ["MongoDB", "MySQL", "SQLAlchemy"] },
        {
          title: "Tooling",
          items: ["Git", "GitHub", "IntelliJ", "Android Studio", "Postman", "Mistral"],
        },
      ],
    },
    about: {
      eyebrow: "Profile",
      title: "About",
      paragraphs: [
        "I am a full-stack developer based in Pontevedra, Spain. I have spent more than two years building web and mobile applications: first while studying, then on live product at IT Salnés, and now automating processes with AI at RE/MAX.",
        "What interests me is the whole path of a feature: designing the data model, exposing an API that makes sense, and finishing the interface someone will live with every day. That last part is the one I enjoy most.",
        "I hold a Higher Diploma in Cross-Platform Application Development and completed the 4Geeks Academy full-stack bootcamp. I keep learning, lately around AI tooling applied to development.",
      ],
      resumeCta: "Download résumé",
    },
    contact: {
      eyebrow: "Contact",
      title: "Got a project? Let's talk.",
      intro: "Email is the fastest way. I reply within 24 hours.",
      emailLabel: "Email",
      resumeLabel: "Résumé",
      phoneLabel: "Phone",
      locationLabel: "Location",
      location: "Pontevedra, Spain",
      githubLabel: "GitHub",
      linkedinLabel: "LinkedIn",
    },
    footer: {
      rights: "All rights reserved.",
      builtWith: "Built with React, Vite, Tailwind CSS, GSAP and three.js.",
      backToTop: "Back to top",
    },
  },
};

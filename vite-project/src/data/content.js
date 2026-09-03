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
  resume: "/TomasUhiaOteroResume.pdf",
};

export const content = {
  es: {
    htmlLang: "es",
    nav: {
      brandAria: "Tomás Uhía — inicio",
      links: [
        { id: "proyectos", label: "Proyectos" },
        { id: "experiencia", label: "Experiencia" },
        { id: "stack", label: "Stack" },
        { id: "sobre-mi", label: "Sobre mí" },
        { id: "contacto", label: "Contacto" },
      ],
      cv: "CV",
      openMenu: "Abrir menú",
      closeMenu: "Cerrar menú",
      languageLabel: "Cambiar idioma a inglés",
      skipToContent: "Saltar al contenido",
    },
    hero: {
      // Se anima palabra a palabra; el array evita partir la cadena en el JSX.
      title: ["Desarrollador", "full-stack."],
      subtitle: "Java y Spring en el backend, React en el frontend.",
      description:
        "Construyo aplicaciones web y móviles de principio a fin, desde el modelo de datos hasta la interfaz. Ahora mismo, en IT Salnés.",
      primaryCta: "Ver proyectos",
      secondaryCta: "Descargar CV",
      scrollHint: "Desliza",
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
    },
    experience: {
      eyebrow: "Trayectoria",
      title: "Experiencia",
      present: "Presente",
      items: [
        {
          period: "Feb 2025 — Presente",
          role: "Desarrollador full-stack",
          company: "IT Salnés",
          summary:
            "Aplicaciones de gestión para restaurantes y hoteles: back-end en Java y Spring, cliente Android y paneles web.",
          impact:
            "Trabajo sobre producto en producción, con integración de modelos de lenguaje para automatizar tareas internas.",
          stack: ["Java", "Spring", "Android Studio", "JavaScript", "MongoDB"],
        },
        {
          period: "Sep 2024 — Ene 2025",
          role: "Prácticas — Desarrollo multiplataforma",
          company: "LoggForSport",
          summary:
            "Web corporativa de eventos deportivos, maquetada desde cero y responsive.",
          impact:
            "Primer contacto con un flujo de trabajo real: control de versiones, revisiones y entregas con fecha.",
          stack: ["HTML", "CSS", "Bootstrap", "JavaScript"],
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
          place: "DAM",
        },
      ],
    },
    stack: {
      eyebrow: "Herramientas",
      title: "Stack",
      intro: "Con lo que trabajo a diario, y con lo que estoy más cómodo.",
      groups: [
        {
          title: "Frontend",
          items: ["React", "JavaScript", "HTML", "CSS", "Tailwind CSS", "Vite"],
        },
        {
          title: "Backend",
          items: ["Java", "Spring", "Node.js", "Python", "PHP", "API REST"],
        },
        { title: "Datos", items: ["MongoDB", "MySQL", "SQL Server", "Postman"] },
        {
          title: "Herramientas",
          items: ["Git", "GitHub", "IntelliJ", "Android Studio", "Figma"],
        },
      ],
    },
    about: {
      eyebrow: "Perfil",
      title: "Sobre mí",
      paragraphs: [
        "Soy desarrollador full-stack en Pontevedra. Llevo más de dos años construyendo aplicaciones web y móviles, primero en formación y ahora sobre producto real en IT Salnés.",
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
      phoneLabel: "Teléfono",
      locationLabel: "Ubicación",
      location: "Pontevedra, España",
      githubLabel: "GitHub",
      linkedinLabel: "LinkedIn",
    },
    footer: {
      rights: "Todos los derechos reservados.",
      builtWith: "Hecho con React, Tailwind CSS y GSAP.",
      backToTop: "Volver arriba",
    },
  },

  en: {
    htmlLang: "en",
    nav: {
      brandAria: "Tomás Uhía — home",
      links: [
        { id: "proyectos", label: "Work" },
        { id: "experiencia", label: "Experience" },
        { id: "stack", label: "Stack" },
        { id: "sobre-mi", label: "About" },
        { id: "contacto", label: "Contact" },
      ],
      cv: "Résumé",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      languageLabel: "Switch language to Spanish",
      skipToContent: "Skip to content",
    },
    hero: {
      title: ["Full-stack", "developer."],
      subtitle: "Java and Spring on the back end, React on the front end.",
      description:
        "I build web and mobile applications end to end, from the data model to the interface. Currently at IT Salnés.",
      primaryCta: "See work",
      secondaryCta: "Download résumé",
      scrollHint: "Scroll",
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
    },
    experience: {
      eyebrow: "Background",
      title: "Experience",
      present: "Present",
      items: [
        {
          period: "Feb 2025 — Present",
          role: "Full-stack developer",
          company: "IT Salnés",
          summary:
            "Management software for restaurants and hotels: Java and Spring on the back end, an Android client and web dashboards.",
          impact:
            "Working on live production software, including language-model integrations that automate internal tasks.",
          stack: ["Java", "Spring", "Android Studio", "JavaScript", "MongoDB"],
        },
        {
          period: "Sep 2024 — Jan 2025",
          role: "Internship — Cross-platform development",
          company: "LoggForSport",
          summary:
            "Corporate website for sports events, built responsive from scratch.",
          impact:
            "First exposure to a real workflow: version control, reviews and deadlines.",
          stack: ["HTML", "CSS", "Bootstrap", "JavaScript"],
        },
      ],
      educationTitle: "Education",
      education: [
        { period: "2025", title: "Full-Stack Bootcamp", place: "4Geeks Academy" },
        {
          period: "2022 — 2024",
          title: "Higher Diploma in Cross-Platform Application Development",
          place: "DAM",
        },
      ],
    },
    stack: {
      eyebrow: "Tools",
      title: "Stack",
      intro: "What I work with day to day, and what I am most comfortable in.",
      groups: [
        {
          title: "Frontend",
          items: ["React", "JavaScript", "HTML", "CSS", "Tailwind CSS", "Vite"],
        },
        {
          title: "Backend",
          items: ["Java", "Spring", "Node.js", "Python", "PHP", "REST APIs"],
        },
        { title: "Data", items: ["MongoDB", "MySQL", "SQL Server", "Postman"] },
        {
          title: "Tooling",
          items: ["Git", "GitHub", "IntelliJ", "Android Studio", "Figma"],
        },
      ],
    },
    about: {
      eyebrow: "Profile",
      title: "About",
      paragraphs: [
        "I am a full-stack developer based in Pontevedra, Spain. I have spent more than two years building web and mobile applications, first while studying and now on live product at IT Salnés.",
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
      phoneLabel: "Phone",
      locationLabel: "Location",
      location: "Pontevedra, Spain",
      githubLabel: "GitHub",
      linkedinLabel: "LinkedIn",
    },
    footer: {
      rights: "All rights reserved.",
      builtWith: "Built with React, Tailwind CSS and GSAP.",
      backToTop: "Back to top",
    },
  },
};

/**
 * Servicios ofrecidos.
 *
 * Copy revisado aquí, no en el componente ni en la spec: este archivo es la
 * fuente única para la sección de servicios. `title`/`tagline`/`description`
 * son bilingües; `includes` es una lista bilingüe de la misma longitud en
 * los dos idiomas; `stack` no se traduce (igual que
 * `content.experience.items[].stack`).
 */

export const services = [
  {
    id: "web-app",
    title: {
      es: "Aplicaciones web a medida",
      en: "Custom web applications",
    },
    tagline: {
      es: "Producto completo, del modelo de datos a la interfaz",
      en: "The full product, from data model to interface",
    },
    description: {
      es: "Construyo el producto completo: modelo de datos, lógica de negocio en el servidor e interfaz con la que alguien va a trabajar todos los días. React en el cliente, Java con Spring o Node en el servidor.",
      en: "I build the whole product: data model, server-side business logic, and an interface someone will actually work with every day. React on the client, Java with Spring or Node on the server.",
    },
    includes: {
      es: [
        "Diseño de la base de datos",
        "API REST documentada",
        "Interfaz responsive",
        "Despliegue",
      ],
      en: [
        "Database design",
        "Documented REST API",
        "Responsive interface",
        "Deployment",
      ],
    },
    stack: ["React", "Java", "Spring", "Node.js", "PostgreSQL"],
  },
  {
    id: "android",
    title: {
      es: "Aplicaciones Android",
      en: "Android applications",
    },
    tagline: {
      es: "Cliente nativo, misma lógica de negocio que la web",
      en: "A native client, the same business logic as the web",
    },
    description: {
      es: "Desarrollo un cliente Android nativo conectado a tu backend existente, compartiendo la misma lógica de negocio que la aplicación web para que ambos productos avancen en paralelo sin duplicar trabajo.",
      en: "I build a native Android client connected to your existing backend, sharing the same business logic as the web application so both products move forward in parallel without duplicated work.",
    },
    includes: {
      es: [
        "App en Kotlin o Java",
        "Sincronización con la API",
        "Publicación en Play Store",
      ],
      en: [
        "App in Kotlin or Java",
        "Sync with the API",
        "Play Store publishing",
      ],
    },
    stack: ["Kotlin", "Java", "Android Studio", "API REST"],
  },
  {
    id: "ia",
    title: {
      es: "Integración de IA",
      en: "AI integration",
    },
    tagline: {
      es: "Modelos de lenguaje resolviendo tareas concretas",
      en: "Language models solving concrete tasks",
    },
    description: {
      es: "Integro modelos de lenguaje dentro del producto para resolver tareas concretas: clasificar, resumir, generar contenido o automatizar trabajo interno. El diseño de prompts y el control de coste van desde el primer día.",
      en: "I integrate language models into the product to solve concrete tasks: classifying, summarizing, generating content or automating internal work. Prompt design and cost control are part of the build from day one.",
    },
    includes: {
      es: [
        "Diseño de los prompts",
        "Integración con la API del modelo",
        "Control de coste y latencia",
      ],
      en: [
        "Prompt design",
        "Integration with the model's API",
        "Cost and latency control",
      ],
    },
    stack: ["LLM API", "Node.js", "Python", "Prompt design"],
  },
  {
    id: "api-db",
    title: {
      es: "APIs y bases de datos",
      en: "APIs and databases",
    },
    tagline: {
      es: "La capa que sostiene todo lo demás",
      en: "The layer that holds everything else up",
    },
    description: {
      es: "Diseño esquemas que aguantan crecer y endpoints que no hay que adivinar. Es la capa que sostiene todo lo demás, así que cuido las migraciones y documento cada API con una colección lista para probar.",
      en: "I design schemas that hold up as they grow and endpoints nobody has to guess at. It is the layer everything else stands on, so migrations get real care and every API ships documented with a ready-to-use collection.",
    },
    includes: {
      es: [
        "Modelado de datos",
        "API REST",
        "Migraciones",
        "Colección de Postman",
      ],
      en: [
        "Data modelling",
        "REST API",
        "Migrations",
        "Postman collection",
      ],
    },
    stack: ["Spring", "Node.js", "MongoDB", "MySQL", "Postman"],
  },
];

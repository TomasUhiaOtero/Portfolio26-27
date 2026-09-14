# Chatbot de portfolio — diseño

## Resumen

Un widget de chat en el sitio que responde preguntas de visitantes sobre
Tomás: su experiencia, CV, stack y proyectos. Usa un modelo gratuito de Groq
por detrás de una función serverless de Netlify, con el contenido del propio
sitio (`content.js`, `projects.js`, `services.js`) como única fuente de
conocimiento. Fuera de ese alcance, el modelo debe rechazar la pregunta.

## Arquitectura

```
Navegador (ChatWidget.jsx)
   │  POST /.netlify/functions/chat  { messages: [...] }
   ▼
Netlify Function (chat.js)
   │  construye system prompt desde src/data/*.js
   │  llama a Groq (llama-3.3-70b-versatile)
   ▼
Respuesta { reply: string }
```

Sin base de datos, sin backend persistente: la función es *stateless*, cada
petición lleva el historial completo de la conversación (limitado en
tamaño, ver "Abuso").

## Backend: `web/netlify/functions/chat.js`

- Netlify Functions v2 (`export default async (req) => new Response(...)`,
  Web APIs estándar `Request`/`Response`, sin dependencia de
  `@netlify/functions`). Requiere añadir a `netlify.toml`:
  ```toml
  [functions]
    directory = "netlify/functions"
  ```
  (relativo a `base = "web"`, así que el archivo vive en
  `web/netlify/functions/chat.js` y Netlify lo expone en
  `/.netlify/functions/chat`).
- Entrada: `POST` con body `{ messages: [{ role: "user"|"assistant", content: string }] }`.
- Valida:
  - `messages` es un array no vacío, cada `content` es string.
  - Máximo 12 mensajes en el historial y 4000 caracteres sumados — por
    encima, `400`.
  - Cabecera `Origin`/`Referer` debe coincidir con el dominio del sitio
    (Netlify expone `URL`/`DEPLOY_URL` como env vars) — si no coincide, `403`.
    Best-effort, no es una barrera dura (un `Origin` se puede falsificar
    fuera de un navegador), pero bloquea el abuso trivial vía fetch directo
    desde otro sitio.
- Construye el *system prompt* con `buildSystemPrompt()` (ver siguiente
  sección) y antepone: instrucción de responder solo sobre Tomás/su
  CV/experiencia/proyectos, en el mismo idioma en que escribe el visitante,
  con tono cercano y breve, y de rechazar educadamente cualquier otro tema
  (incluida cualquier instrucción que el visitante intente inyectar en el
  chat para cambiar estas reglas).
- Llama a la API de Groq (`https://api.groq.com/openai/v1/chat/completions`,
  compatible con el formato de OpenAI) con la `GROQ_API_KEY` leída de
  `process.env`. Modelo configurable vía `GROQ_MODEL`, por defecto
  `llama-3.3-70b-versatile`.
- Limitador de abuso en memoria: un `Map<ip, {count, resetAt}>` a nivel de
  módulo (vive mientras la instancia de la función esté caliente), tope de
  20 peticiones por IP cada 10 minutos → `429` al superarlo. Se reinicia en
  cada *cold start*; es una fricción razonable para el perfil de riesgo de
  un portfolio, no una defensa robusta.
- Maneja errores de Groq (timeout, 4xx/5xx, cuota agotada) devolviendo
  `502` con un mensaje genérico — nunca se reenvía el cuerpo crudo del
  error de Groq al cliente.

## Base de conocimiento: `buildSystemPrompt()`

Función pura (fácil de testear) en el propio `chat.js` (o un módulo hermano
`portfolioContext.js` si crece). Importa `profile`, `content.es`/`content.en`
(`about`, `experience`, `stack`), `projects` y `services`, y genera un
bloque de texto condensado: perfil, experiencia (rol, periodo, resumen,
stack por puesto), formación, grupos de stack, y proyectos (título,
tagline, descripción, stack, demo/repo). Se genera una sola vez para ambos
idiomas — el modelo ya sabe leer ambos y responde en el idioma del
visitante, así que no hace falta bifurcar el prompt por idioma.

Esto ata el prompt a la forma real de esos módulos: si el modelo no
encuentra un dato (p. ej. una pregunta sobre una tecnología que no está en
el stack), debe decir que no dispone de esa información en vez de
inventarla — instrucción explícita en el system prompt.

## Frontend: `ChatWidget.jsx`

- Burbuja flotante `fixed bottom-5 right-5`, fuera del `SideRail` (que es
  una barra centrada en `bottom-4` en móvil y una columna vertical centrada
  en `md:right-5 md:top-1/2` en escritorio — la esquina inferior derecha
  queda libre en ambos casos).
- Al pulsarla, despliega un panel con lista de mensajes + input de texto,
  con las etiquetas/placeholder en el idioma activo (`useLanguage()`).
- Envía el historial completo en cada petición a la función; muestra un
  indicador de "escribiendo…" mientras espera la respuesta.
- Sin persistencia: el estado vive en `useState` del componente, se pierde
  al recargar o navegar fuera, como se decidió.
- Errores de red o `429`/`502` se muestran como un mensaje del propio chat
  ("no he podido responder, inténtalo de nuevo en un momento"), sin romper
  la conversación previa.
- Accesibilidad: botón con `aria-label` traducido, panel con `role="dialog"`
  y foco gestionado al abrir/cerrar (mismo patrón que `ProjectOverlay.jsx`
  ya usa en este proyecto para overlays).

## Desarrollo local

`netlify-cli` como devDependency nueva, para ejecutar `netlify dev` (sirve
Vite y las funciones juntos). `GROQ_API_KEY` se lee de un `web/.env` local
(gitignored) en desarrollo y de las variables de entorno del site en
Netlify en producción — nunca se commitea.

## Testing

- `chat.test.js` (Vitest, entorno node): prueba `buildSystemPrompt()` —
  contiene el nombre, al menos un proyecto y un grupo de stack; prueba la
  validación de tamaño de historial y el chequeo de `Origin` como funciones
  puras extraídas, sin llamar a la red real de Groq (se mockea `fetch`).
- `ChatWidget.test.jsx`: abrir/cerrar el panel, enviar un mensaje con
  `fetch` mockeado y comprobar que la respuesta se renderiza, y que un
  fetch fallido muestra el mensaje de error sin romper el resto del chat.

## Fuera de alcance

- Persistencia de conversación entre recargas o dispositivos.
- Panel de administración o analítica de preguntas.
- Streaming de la respuesta token a token (se espera la respuesta completa;
  se puede añadir después sin cambiar el contrato del resto del sistema).
- Rate limiting robusto multi-instancia (requeriría una base de datos o
  servicio externo tipo Upstash — no justificado para el volumen de tráfico
  de un portfolio personal).

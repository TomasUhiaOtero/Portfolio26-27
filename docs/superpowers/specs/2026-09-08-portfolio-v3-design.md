# Portfolio v3 — Diseño

Fecha: 2026-09-08
Autor: Tomás Uhía Otero (dirección) · Claude (redacción)
Estado: aprobado, pendiente de plan de implementación

---

## 1. Objetivo

Reconstruir el portfolio personal desde cero con una identidad visual de gama alta
—lenguaje Apple, movimiento fluido, tres escenas 3D reales— reutilizando el
contenido que ya existe en `vite-project/src/data/`.

El sitio actual (`vite-project/`) es minimalismo editorial en clave nocturna. La
versión nueva cambia de registro: superficie oscura, tipografía neo-grotesca muy
apretada, materiales de vidrio y movimiento continuo. El contenido se conserva casi
íntegro; lo que cambia es cómo se presenta.

### Qué se conserva del proyecto actual

- Todo el copy bilingüe de `src/data/content.js` (perfil, hero, cifras, experiencia,
  formación, stack, sobre mí, contacto, footer).
- Los ocho proyectos de `src/data/projects.js` con sus campos y enlaces.
- Las imágenes de `public/img/` y el CV en PDF.
- Las reglas de motion y las decisiones de CSS documentadas en el README.

### Qué es nuevo

- Sección de servicios (no existía; hay que escribir el contenido).
- Menú lateral de navegación.
- Tres escenas WebGL.
- Conmutador de tema claro/oscuro.

### Fuera de alcance

- Backend, CMS o base de datos. Todo el contenido vive en módulos JavaScript.
- Blog, formulario de contacto con envío, analítica.
- Sustituir las imágenes de proyecto por capturas reales. Se documenta el formato
  para que se puedan cambiar después sin tocar código.

---

## 2. Ubicación y despliegue

El proyecto nuevo vive en `web/`, hermano de `vite-project/`. El directorio
antiguo se conserva intacto durante toda la construcción como referencia visual y
como red de seguridad: el sitio en producción sigue sirviéndose desde él hasta que
`web/` esté terminado y verificado.

El corte a producción es un único cambio en `netlify.toml`: `base = "web"`. Se hace
en la última fase, no antes.

---

## 3. Arquitectura

### 3.1 Stack

| Pieza | Versión | Por qué |
|---|---|---|
| Vite | 7 | Build y HMR. Sin framework full-stack: es una sola página estática. |
| React | 19 | JSX, sin TypeScript, igual que el proyecto actual. |
| Tailwind CSS | 4 (`@tailwindcss/vite`) | Utilidades. Ver la trampa de cascade layers en §5.4. |
| GSAP + ScrollTrigger + Observer | 3 | Única herramienta que orquesta bien pinning, scrub, stagger y secuencias con solape. CSS puro no da ese control. |
| Lenis | última | Scroll suavizado, integrado en `gsap.ticker` para que ScrollTrigger no se desincronice. |
| three + @react-three/fiber + @react-three/drei | últimas | Las tres escenas 3D. Imports puntuales de drei, nunca el paquete entero. |

**No se usa Framer Motion.** Solapa con GSAP y duplica peso sin aportar nada que
GSAP no cubra.

### 3.2 Alternativas descartadas

**Next.js 15 App Router.** Aporta SSG y metadata por ruta. En un portfolio de una
sola página el routing no se usa, y a cambio suma configuración, peso y un cambio de
despliegue. Descartado.

**Astro con islas.** Daría el mejor LCP posible al enviar casi nada de JavaScript.
Pero prácticamente cada sección de esta página está animada, así que casi todo sería
una isla y se pierde la ventaja; además compartir la instancia de Lenis y el registro
de ScrollTrigger entre islas es frágil. Descartado.

### 3.3 Estructura de archivos

```
web/
  index.html                  script inline anti-parpadeo de tema
  netlify.toml                (se toca al final, en la raíz del repo)
  public/
    img/                      copiadas de vite-project/public/img/
    TomasUhiaOteroResume.pdf
    favicon.svg
    fonts/                    Inter Variable autoalojada
  src/
    main.jsx                  monta React, añade la clase `js` a <html>
    App.jsx                   composición de secciones y providers
    styles/
      index.css               tokens, capas base, utilidades de autor
    data/
      content.js              copy bilingüe (migrado)
      projects.js             proyectos (migrado)
      services.js             servicios (nuevo)
    i18n/
      context.js
      LanguageProvider.jsx
    theme/
      context.js
      ThemeProvider.jsx
    hooks/
      useLenis.js
      useReducedMotion.js
      useIntroTimeline.js
      useActiveSection.js
      useInViewport.js
    three/
      adaptive.js             DPR adaptativo, degradación, conteos por dispositivo
      LazyCanvas.jsx          monta/desmonta el canvas según viewport
      HeroField.jsx
      TechCore.jsx
      ServiceStage.jsx
    components/
      SideRail.jsx
      ThemeToggle.jsx
      LangToggle.jsx
      Reveal.jsx
      SplitText.jsx
      Counter.jsx
      Button.jsx
      Chip.jsx
      ProjectCard.jsx
      ProjectOverlay.jsx
      icons.jsx
    sections/
      Hero.jsx
      About.jsx
      Services.jsx
      Experience.jsx
      Work.jsx
      Contact.jsx
      Footer.jsx
```

Regla de frontera, heredada del proyecto actual: **ningún literal de texto vive en
el JSX**. Todo pasa por `src/data/`. Cambiar copy, añadir un proyecto o revisar una
traducción no debe requerir abrir un componente.

Cada sección es un archivo. Cuando un archivo de sección crece más allá de lo que se
puede leer de una sentada, se extrae el subcomponente que esté tirando del tamaño.

### 3.4 Contratos entre módulos

**`data/services.js`** exporta `services`, un array donde cada elemento tiene:

```js
{
  id: string,                         // slug estable, usado como key y ancla
  title: { es, en },
  tagline: { es, en },                // una línea
  description: { es, en },            // dos o tres frases
  includes: { es: string[], en: string[] },  // 3 o 4 entregables
  stack: string[],                    // no se traduce
}
```

**`ThemeProvider`** expone `{ theme, setTheme, toggle }` donde `theme` es `"dark"`
o `"light"`. Escribe `data-theme` en `<html>` y persiste en `localStorage` bajo la
clave `portfolio-theme`.

**`LanguageProvider`** conserva la API actual: `{ lang, setLang, t }`, con `t`
apuntando a `content[lang]`. Escribe el atributo `lang` en `<html>`.

**Escenas `three/`.** Cada una es un componente que recibe únicamente props
serializables (`progress`, `theme`, `reducedMotion`) y no lee contexto de React
directamente. Así se pueden probar y ajustar por separado, y el canvas se puede
desmontar sin arrastrar dependencias.

### 3.5 Migración de los datos existentes

`content.js` y `projects.js` se copian tal cual salvo dos ajustes:

**`content.nav.links` cambia.** El orden de secciones es nuevo y `stack` deja de ser
una sección propia. Las entradas pasan a ser, en ambos idiomas:

```
inicio · sobre-mi · servicios · experiencia · proyectos · contacto
```

Estos identificadores son los `id` de los elementos `<section>` y los que consume el
rail lateral para resaltar la sección activa.

**`content.stack` se conserva íntegro.** Ya no pinta una sección, pero es la fuente
de los cuatro grupos de tecnologías de "Sobre mí" (§6.3). No se toca su forma.

Las imágenes de `vite-project/public/img/` y el PDF del CV se copian a
`web/public/`. Siguen siendo mockups de stock: el formato para sustituirlas por
capturas reales queda documentado en el README de `web/` — tres archivos por
proyecto (`<id>-800.webp`, `<id>-1600.webp`, `<id>-1600.avif`), todos recortados a
16:10.

---

## 4. Sistema visual

### 4.1 Color

Se usan los valores reales del sistema de Apple, no una aproximación.

| Token | Oscuro (por defecto) | Claro |
|---|---|---|
| `--bg` | `#000000` | `#fbfbfd` |
| `--surface` | `#0d0d0f` | `#ffffff` |
| `--surface-2` | `#161618` | `#f5f5f7` |
| `--text` | `#f5f5f7` | `#1d1d1f` |
| `--mute` | `#86868b` | `#6e6e73` |
| `--line` | `rgb(255 255 255 / 0.10)` | `rgb(0 0 0 / 0.10)` |
| `--accent` | `#0a84ff` | `#0071e3` |
| `--glow` | `#5e5ce6` | `#5856d6` |

Los tokens se declaran como custom properties en `:root` dentro de `@layer base`,
y se redefinen bajo `[data-theme="light"]`. Ninguna utilidad de Tailwind lleva un
color literal: todas leen el token.

### 4.2 Tipografía

**Inter Variable**, autoalojada en `public/fonts/` con `font-display: swap`. No se
usa Google Fonts: evita una petición a un tercero y un tiempo de bloqueo.

SF Pro no se puede licenciar para web, e Inter es su sustituto correcto. Pero lo que
produce la sensación Apple no es la familia, es el *tracking*: los titulares grandes
van muy apretados y el cuerpo no.

| Rol | Tamaño | Tracking | Peso |
|---|---|---|---|
| Display (hero) | `clamp(3rem, 9vw, 8rem)` | `-0.045em` | 600 |
| Titular de sección | `clamp(2.25rem, 5vw, 4.5rem)` | `-0.035em` | 600 |
| Subtitular | `clamp(1.25rem, 2vw, 1.75rem)` | `-0.02em` | 500 |
| Cuerpo | `1.0625rem` / `1.65` | `0` | 400 |
| Eyebrow | `0.75rem` mayúsculas | `0.3em` | 500 |

### 4.3 Superficies y forma

Vidrio: `backdrop-blur(20px)` sobre `--surface` al 60% de opacidad, con un borde de
`1px` en `--line`. Es el material de macOS y del rail lateral.

Radios de 12 a 28 px. **Nada de `rounded-full` en contenedores, tarjetas ni
botones** — regla heredada del sistema anterior que se mantiene. La píldora se
reserva para chips y puntos indicadores.

Sombras: casi ninguna. Sobre negro la sombra no separa; lo que separa es un borde
sutil y un cambio de luminancia. En tema claro se permite una sombra suave y muy
difusa en las tarjetas elevadas.

### 4.4 Tema claro/oscuro

Arranca en oscuro. El conmutador vive al pie del rail lateral.

**Sin parpadeo al recargar.** `index.html` lleva un script inline, antes de
cualquier CSS, que lee `localStorage` y escribe `data-theme` en `<html>`. Si no hay
valor guardado, pone `dark`. Si se resolviera desde React el usuario vería un
destello del tema equivocado en cada carga.

El icono **morfea** entre sol y luna interpolando la trayectoria SVG; no se
intercambian dos iconos distintos.

Las escenas WebGL leen el tema e **interpolan** sus colores en unos 400 ms. Un salto
instantáneo de color en un canvas se ve como un fallo, no como un cambio de tema.

---

## 5. Sistema de movimiento

### 5.1 Reglas duras

- Solo se animan `transform` y `opacity`. Nunca otra propiedad.
- Nunca `transition: all`. Nunca `ease-in`.
- Interfaz por debajo de 300 ms. Reveals de scroll entre 600 y 800 ms.
- Easing de entrada: `cubic-bezier(0.16, 1, 0.3, 1)`.
- Lo que responde a un gesto continuo —arrastrar el carrusel— usa **spring**, no
  duración fija: el movimiento tiene que seguir al dedo y conservar la inercia al
  soltar.
- Stagger de 60 ms, máximo 6 escalones. Más escalones y la última tarjeta llega
  tarde.
- `active:scale(0.97)` en todo lo pulsable.

### 5.2 El contenido nunca arranca oculto por CSS a secas

Las animaciones de entrada solo esconden un elemento si se cumplen dos condiciones:
existe la clase `js` en `<html>` (la pone `main.jsx`) y el usuario no ha pedido menos
movimiento. Además `Reveal` fuerza la visibilidad a los 3 s si el
`IntersectionObserver` no llegara a dispararse.

Esta red existe porque una versión anterior del portfolio dejó la sección de
proyectos permanentemente invisible en móvil por no tenerla.

### 5.3 GSAP y los hovers con transform

GSAP deja un `transform` inline fijado en los elementos que animó al terminar un
timeline. Un estilo inline gana siempre a cualquier regla `:hover` de hoja de
estilos, así que **un hover con transform sobre un elemento que GSAP tocó en la
intro no se verá nunca** — sin error y sin aviso.

Solución: si un elemento entra en un timeline y además necesita hover con transform,
el efecto de hover va en un `<span>` hijo decorativo que GSAP no toca. El padre solo
recibe `opacity` en el timeline.

Para depurar esto: leer `getComputedStyle(el).translate` y `.scale`, no `.transform`
—que puede devolver `"none"` aunque el efecto sí esté aplicado.

### 5.4 Tailwind v4 y las cascade layers

Tailwind v4 mete sus utilidades en `@layer utilities`. **Cualquier regla CSS de autor
sin capa asignada gana automáticamente a cualquier utilidad con capa, sin importar la
especificidad.** Un `h1, h2 { margin: 0 }` suelto pisa un `mx-auto` en silencio.

Regla: toda regla de autor en `index.css` va dentro de `@layer base`, `components` o
`utilities`. Ninguna suelta.

El estado visible de un reveal se declara **dentro de la propia `@utility`**. Si se
declarase en `@layer base`, la capa `utilities` ganaría por orden de capa y el
elemento se quedaría en `opacity: 0` para siempre.

### 5.5 Promesas de carga

Ninguna promesa de carga sin timeout de reserva. `document.fonts.ready` se envuelve
en `Promise.race` con un temporizador. Para las imágenes del hero se espera solo a la
primera con unos 2000 ms de tope; el resto se decodifica en paralelo. Si no, una
imagen lenta cuelga la cortina de carga entera.

### 5.6 `prefers-reduced-motion`

- Cortina: no bloquea, se retira de inmediato.
- Escenas WebGL: no se montan. En su lugar, un póster estático.
- Reveals: sin animación, pero **con el contenido final visible**.
- Carrusel: sin inercia ni spring; salta al proyecto seleccionado.
- Contadores: valor final directo, sin contar.

Punto de cuidado en los contadores: hay que separar explícitamente la rama reducida
(valor final, sin animar) de la rama "aún no ha entrado en pantalla" (mostrar 0) de
la rama animando. Mostrar el valor final y luego reiniciarlo a 0 es un fallo visible.

---

## 6. Secciones

El orden de la página es: Hero · Sobre mí · Servicios · Experiencia · Portfolio ·
Contacto · Footer. El rail lateral es fijo y no forma parte del flujo.

### 6.1 Hero

Alto completo de viewport.

**Fondo:** escena WebGL `HeroField` — un campo de partículas conectadas por líneas
cuando la distancia entre ellas baja de un umbral, con deriva lenta y parallax suave
siguiendo al ratón. La lectura es "red neuronal" sin ser literal. Los colores salen
de `--accent` y `--glow`, e interpolan al cambiar de tema. Peso de descarga cero: es
geometría generada, no un vídeo ni una textura.

**Carga:** un `<div data-curtain>` fijo a pantalla completa cubre todo mientras
cargan fuente y escena. Después, un timeline con solapes anima en orden: cortina
(fade y escala), eyebrow, titular **palabra a palabra**, subtítulo, los dos CTA y el
indicador de scroll. Todo arranca desde `opacity-0` en el JSX.

Dos detalles del titular por palabra: el espacio entre palabras va como nodo hermano
del `<span>`, fuera de él, o `white-space` no podrá romper línea; y el contenedor con
`overflow-hidden` necesita `pb-[0.2em] -mb-[0.2em]` y `yPercent: 135` para no recortar
los descendentes de la "p", la "g" y la "j".

**Contenido:** eyebrow, titular, subtítulo y los dos CTA de `content.hero`. Debajo,
una tira fina con las cuatro cifras de `content.stats`, con contadores que animan al
entrar en pantalla.

### 6.2 Rail lateral

Fijo al borde derecho, centrado verticalmente. Una barrita horizontal por sección.

- La sección activa se alarga y toma `--accent`.
- Al pasar el ratón o al recibir foco, se despliega un panel de vidrio con los
  nombres de todas las secciones.
- Al pie del rail: conmutador de tema y conmutador ES/EN.
- En móvil se convierte en un dock inferior con las mismas barritas.

**Accesibilidad:** cada barrita es un `<button>` real dentro de un `<nav>` con
etiqueta. `focus-visible` visible. El panel desplegado lleva `inert` cuando está
cerrado —sin eso sus enlaces siguen siendo tabulables pese al `aria-hidden`, y el
foco viaja a elementos invisibles fuera de pantalla.

La sección activa se calcula con `IntersectionObserver` sobre las secciones, no
midiendo `scrollY` a mano.

### 6.3 Sobre mí

Sección con pin: se queda fija mientras el scroll avanza a través de cuatro estados.

**Columna izquierda:** los párrafos de `content.about`, revelándose línea a línea
conforme avanza el progreso.

**Columna derecha:** escena WebGL `TechCore` — un núcleo icosaédrico en wireframe con
nodos orbitando. En cada uno de los cuatro estados los nodos se reagrupan y entra en
stagger el grupo de tecnologías correspondiente de `content.stack.groups`:

1. Frontend — React, JavaScript, HTML, CSS, Tailwind CSS, Vite
2. Backend — Java, Spring, Node.js, Python, PHP, API REST
3. Datos — MongoDB, MySQL, SQL Server, Postman
4. Herramientas — Git, GitHub, IntelliJ, Android Studio, Figma

El objeto es siempre el mismo; lo que cambia es su configuración. Un objeto, cuatro
lecturas.

El progreso llega a `TechCore` como un `progress` de 0 a 1 vía scrub de ScrollTrigger.
La escena no conoce el scroll: solo recibe un número.

### 6.4 Servicios

Patrón tomado de la sección de guitarras de Resonance: columna sticky a un lado
(`position: sticky`, relación 4/5, radio grande) y paneles de texto scrolleando al
otro. Al entrar cada panel, la visual sticky hace crossfade al recurso de ese
servicio.

La visual sticky es la escena `ServiceStage`, que morfea entre cuatro estados
geométricos, uno por servicio.

En pantallas por debajo de `lg` el sticky desaparece: cada panel lleva su propia
visual encima, en línea. Es el mismo desdoblamiento que hace Resonance.

**Los cuatro servicios** (borrador para `data/services.js`; el copy definitivo se
revisa sobre el archivo, no sobre este documento):

1. **Aplicaciones web a medida** — Producto completo, del modelo de datos a la
   interfaz. React en el cliente, Java y Spring o Node en el servidor.
   *Incluye:* diseño de la base de datos · API REST documentada · interfaz
   responsive · despliegue.
2. **Aplicaciones Android** — Cliente nativo conectado a tu backend, con la misma
   lógica de negocio que la web.
   *Incluye:* app en Kotlin o Java · sincronización con la API · publicación en
   Play Store.
3. **Integración de IA** — Modelos de lenguaje dentro del producto, resolviendo
   tareas concretas: clasificar, resumir, generar, automatizar trabajo interno.
   *Incluye:* diseño de los prompts · integración con la API del modelo · control
   de coste y latencia.
4. **APIs y bases de datos** — La capa que sostiene todo lo demás. Esquemas que
   aguantan crecer y endpoints que no hay que adivinar.
   *Incluye:* modelado de datos · API REST · migraciones · colección de Postman.

### 6.5 Experiencia

Timeline vertical.

- La línea se **dibuja** con `scaleY` ligado al scroll mediante scrub, no con una
  animación de duración fija. El dibujo tiene que seguir al scroll, incluso hacia
  atrás.
- Los nodos hacen pop al ser alcanzados por la línea.
- Las tarjetas entran alternando lado en escritorio; en móvil, todas desde el mismo
  lado, con la línea a la izquierda.
- Contenido: los dos puestos de `content.experience.items` (con periodo, rol,
  empresa, resumen, impacto y chips de stack) y, al final, la formación de
  `content.experience.education`.

### 6.6 Portfolio

La sección principal de la página.

**Carrusel en arco.** Las tarjetas se colocan sobre una circunferencia en el espacio
3D. La central queda enfocada, recta y a plena opacidad; las laterales rotan hacia
dentro, se alejan y pierden nitidez y luz. Al girar, las tarjetas describen un arco,
no un desplazamiento lateral plano.

**Geometría en CSS 3D, no en WebGL.** Es una desviación deliberada del "WebGL a
tope", acordada durante el diseño. El motivo: en WebGL las tarjetas serían texturas,
lo que implica texto borroso, enlaces que dejan de ser `<a>` reales y pérdida de
navegación por teclado — precisamente en la sección más importante del sitio. Con
`perspective` y `rotateY` sobre elementos reales el aspecto es el mismo, y el
contenido sigue siendo nítido, seleccionable y accesible.

Detrás del carrusel sí hay una capa WebGL: profundidad, un degradado en movimiento y
una luz que sigue a la tarjeta enfocada.

**Interacción:** arrastrar (ratón y táctil, con inercia por spring al soltar), rueda
horizontal, flechas izquierda y derecha del teclado, y clic en una tarjeta lateral
para traerla al centro.

**Detalle del proyecto.** Al clicar la tarjeta enfocada, esta **crece** hasta ocupar
la pantalla con una transición de elemento compartido —el gesto de iOS: el objeto no
se sustituye, se transforma. El overlay muestra imagen grande, título, año, rol,
descripción, chips de tecnologías y los botones a demo y repositorio.

Un proyecto puede no tener demo (`demo: null`) o no tener repositorio (`code: null`).
El botón que falte no se renderiza; nunca se muestra deshabilitado.

**Accesibilidad del overlay:** rol de diálogo, foco atrapado dentro mientras está
abierto, cierre con Esc y con clic fuera, y el foco vuelve a la tarjeta de origen al
cerrar. El fondo recibe `inert`.

**Contenido:** los ocho proyectos de `projects.js`. La distinción `featured` deja de
usarse para separar dos rejillas —en un carrusel todos ocupan la misma posición— pero
se conserva en los datos y se usa para el orden inicial: los tres destacados primero.

### 6.7 Contacto

Cierre a pantalla completa. Titular grande de `content.contact`, el correo como
enlace de tamaño display, y debajo teléfono, ubicación, GitHub, LinkedIn y descarga
de CV.

### 6.8 Footer

Bajo y contenido: nombre, año, "hecho con", y volver arriba. Fuera de `<main>`, igual
que `<header>`: los landmarks no se anidan.

---

## 7. Rendimiento

Con tres canvas WebGL en una misma página esto no es opcional.

- **Montaje diferido.** Cada canvas se monta mediante `IntersectionObserver` cuando
  se acerca al viewport y **se desmonta** cuando se aleja lo suficiente. El
  componente `LazyCanvas` centraliza esta lógica; ninguna escena la reimplementa.
- **Pausa.** El bucle de render se detiene con `document.hidden` y cuando el canvas
  sale de pantalla.
- **DPR adaptativo.** `PerformanceMonitor` de drei baja la resolución de render antes
  de permitir que caigan los fotogramas. Degradar nitidez es preferible a tironear.
- **Presupuestos por dispositivo.** En móvil, menos partículas y DPR con tope de 1.5.
  Los conteos viven en `three/adaptive.js`, no repartidos por las escenas.
- **Code splitting.** `three`, `@react-three/fiber` y `@react-three/drei` van en un
  chunk aparte cargado con `React.lazy`. No entran en el bundle inicial, así que el
  hero pinta texto antes de que llegue nada de 3D.
- **Contexto WebGL.** Un navegador limita el número de contextos simultáneos. Como
  las escenas se desmontan al alejarse, en la práctica nunca hay más de dos vivos.
  Al desmontar hay que liberar geometrías, materiales y texturas explícitamente.

**Objetivos:** LCP por debajo de 2,5 s en 4G simulada, CLS 0, 60 fps durante el
scroll en un portátil sin GPU dedicada.

---

## 8. Accesibilidad

- Skip link al contenido principal.
- Landmarks correctos y sin anidar: `<header>`, `<main>`, `<footer>`.
- `focus-visible` visible en todo elemento interactivo, con contraste suficiente en
  ambos temas.
- `inert` en todo panel u overlay cerrado. `aria-hidden` por sí solo no saca los
  elementos del orden de tabulación.
- Contraste AA en ambos temas, incluido el texto sobre las escenas WebGL: donde el
  texto se apoye en el canvas, va sobre un velo que garantice la ratio.
- El carrusel es navegable íntegramente por teclado.
- `prefers-reduced-motion` respetado en todas las secciones, según §5.6.

---

## 9. Verificación

Cada fase se cierra comprobando en navegador real, **contra `npm run preview`, no
solo contra el servidor de desarrollo**: el build aplica optimizaciones que pueden
cambiar el comportamiento.

Notas de método:

- Para confirmar hovers y efectos sutiles, comparar estilos computados. Una captura
  de pantalla puede no mostrar diferencia perceptible a esa resolución.
- Antes de un hover de prueba, mover el cursor a un punto neutro y luego al objetivo,
  para forzar un `mouseenter` limpio.
- El buffer de consola devuelve el historial completo de la pestaña. Un error de HMR
  transitorio puede seguir apareciendo mucho después de resuelto: mirar qué hay
  *después* del error, no solo que el error exista.

### Checklist de cierre

- [ ] Toda regla CSS de autor está dentro de `@layer`.
- [ ] Ningún hover con transform sobre un elemento animado por un timeline de GSAP.
- [ ] `prefers-reduced-motion` respetado en las siete secciones.
- [ ] Ninguna promesa de carga sin timeout de reserva.
- [ ] `<header>` y `<footer>` fuera de `<main>`.
- [ ] Los canvas se desmontan y liberan recursos al salir de pantalla.
- [ ] Sin parpadeo de tema al recargar, en ambos temas.
- [ ] Carrusel navegable con teclado; el foco vuelve al origen al cerrar el overlay.
- [ ] Verificado sobre build de producción, no solo en desarrollo.

---

## 10. Fases

| # | Fase | Entrega |
|---|---|---|
| 0 | Andamiaje | `web/` en marcha: Vite, Tailwind v4, tokens, tema sin parpadeo, i18n, Lenis, datos migrados |
| 1 | Hero | Cortina, timeline de entrada, `HeroField`, cifras con contadores |
| 2 | Rail lateral | Navegación, sección activa, conmutadores de tema e idioma, dock móvil |
| 3 | Sobre mí | Sección con pin, `TechCore`, los cuatro grupos de tecnologías |
| 4 | Servicios | `data/services.js`, columna sticky, `ServiceStage`, desdoblamiento móvil |
| 5 | Experiencia | Timeline con línea ligada al scroll |
| 6 | Portfolio | Carrusel en arco, gestos, overlay de detalle |
| 7 | Cierre | Contacto, footer, accesibilidad, rendimiento, checklist, corte de `netlify.toml` a `web/` |

El corte a producción es lo último. Hasta entonces `vite-project/` sigue siendo el
sitio publicado.

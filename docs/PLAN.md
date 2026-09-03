# Plan de rediseño — portfolio con estética Apple

Documento de trabajo. Acompaña a `AUDITORIA.md`, que justifica cada decisión de aquí con medidas reales tomadas sobre el sitio actual.

---

## 1. Principio rector

El portfolio actual intenta impresionar con efectos. Una página de producto de Apple hace lo contrario: **quita todo hasta que solo queda el producto, y lo presenta con muchísimo aire**. Aquí el producto eres tú y tus proyectos.

Traducción concreta:

| Hoy | Objetivo |
|---|---|
| Cian neón sobre negro | Neutros; el color lo aportan solo las capturas de tus proyectos |
| Poppins Bold 700 en todo | Un solo tipo, pesos 400/500/600, tracking negativo en titulares |
| Emoji como iconografía | Sin iconos decorativos; si hacen falta, trazo fino uniforme |
| Fondo WebGL animado | Fondo plano; la profundidad la da el espaciado, no el degradado |
| 5 secciones con el mismo ritmo | Cada sección con composición propia y alternancia claro/oscuro |
| "Contrátame !" | "Hablemos." |
| Rebote (easing `back`) | Desaceleración limpia, `power3.out` / `expo.out` |

**Regla de oro:** si un efecto no ayuda a entender el contenido, se elimina. Una animación menos es una animación que no se rompe en móvil.

---

## 2. Sistema de diseño

### Color

Sistema neutro con alternancia de secciones claras y oscuras, como las páginas de producto de Apple.

```
--bg-primary      #ffffff     Secciones claras (base)
--bg-secondary    #f5f5f7     Bandas de descanso — el gris de Apple
--bg-dark         #000000     Secciones oscuras (hero, cierre)
--text-primary    #1d1d1f     Texto sobre claro — no negro puro
--text-secondary  #6e6e73     Texto secundario
--text-on-dark    #f5f5f7
--separator       rgba(0,0,0,.10)
--accent          #0071e3     Solo enlaces y CTA. Nunca en titulares.
```

El cian neón desaparece. El acento azul ocupa menos del 2 % de los píxeles de la página.

### Tipografía

Una sola familia: **Inter** (variable, subset latino) o la pila de sistema `-apple-system, BlinkMacSystemFont, "Segoe UI", Inter`. La pila de sistema es gratis, se ve nativa en Mac y elimina una petición de red.

```
Display   80px / 1.05 / weight 600 / tracking -0.03em    (hero)
H2        48px / 1.08 / weight 600 / tracking -0.02em
H3        24px / 1.25 / weight 600 / tracking -0.01em
Body      19px / 1.5  / weight 400
Caption   14px / 1.4  / weight 400 / color secundario
```

Claves anti-2016: peso máximo 600 (nunca 700+), tracking negativo en tamaños grandes, cuerpo de 19 px en vez de 16 px, longitud de línea limitada a unos 65 caracteres.

### Espaciado y ritmo

Escala de 8 px. Padding vertical de sección **160 px en desktop / 96 px en móvil** (hoy es aproximadamente la mitad). Ancho de contenido máximo 1120 px. El aire es lo que hace que algo parezca caro.

### Movimiento

- Duración: 400–700 ms. Nada por debajo de 250 ms, nada por encima de 900 ms.
- Un único easing: `cubic-bezier(0.16, 1, 0.3, 1)` (equivalente a `expo.out`). **Cero rebote.**
- Reveals: `opacity 0→1` + `translateY 24px→0`, `once: true`, disparo en `top 80%`.
- **El contenido parte siempre visible en el HTML; la animación lo oculta solo si JavaScript ya está corriendo.** Así el fallo 1.1 de la auditoría no puede repetirse: si la animación no arranca, el contenido se ve igual.

---

## 3. Estructura de la página

### 3.1 Hero — fondo oscuro

Nombre y una frase, con mucho aire. Sin foto de portátil de stock.

```
Tomás Uhía
Desarrollador full-stack.
Java y Spring en el backend, React en el frontend.

[Ver proyectos]   [Descargar CV]
```

Entrada orquestada con un único `gsap.timeline()`: titular palabra a palabra, luego subtítulo, luego CTAs. Es el patrón 1 de la skill `referencia_para_lp`, incluyendo el detalle del espacio entre palabras como nodo hermano del `<span>` y el `pb-[0.2em] -mb-[0.2em]` para no recortar las descendentes de "Desarrollador".

Sin cortina de carga: no hay imágenes pesadas que esperar y añadiría riesgo de pantalla en blanco.

### 3.2 Proyectos — fondo claro, **es la sección principal**

El cambio de fondo a `#ffffff` justo después del hero oscuro es exactamente el gesto de las páginas de producto de Apple.

Formato: **tres proyectos destacados a ancho completo**, uno debajo de otro, alternando imagen izquierda/derecha, cada uno con:

- Captura real del proyecto en un marco de dispositivo, con `scale` sutil ligado al scroll
- Título y una frase sobre qué problema resuelve
- **Chips de stack** (React · Spring Boot · MongoDB) — hoy no existen, y es la primera información que busca quien contrata
- Tu rol y el año
- Dos enlaces diferenciados: **Ver demo** (primario) y **Código** (secundario)

Debajo, el resto de proyectos en una rejilla compacta y silenciosa. "Este portfolio" sale de la lista.

> **Criterio:** tres proyectos bien contados convencen más que nueve tarjetas iguales. Los otros seis siguen ahí, pero no compiten por la atención.

### 3.3 Experiencia — fondo `#f5f5f7`

Se conserva la timeline (es lo mejor de la web actual), rediseñada: línea fina, sin chips cian, tipografía con la nueva escala. Se añade una línea de impacto por puesto — qué construiste y qué mejoró — en vez de solo listar tecnologías.

### 3.4 Stack — fondo oscuro

Sustituye a "Servicios". Los cinco servicios genéricos con emoji ("Desarrollo Web", "Desarrollo Móvil"…) suenan a agencia y no dicen nada de ti; se van.

En su lugar, tus tecnologías agrupadas en Frontend / Backend / Datos / Herramientas, como texto en una rejilla generosa. Si se quiere movimiento, una cinta infinita de logos siguiendo el patrón 3 de la skill (N = 6 copias, `xPercent: -100/N`, pausa en hover, `aria-hidden` en las copias duplicadas).

### 3.5 Sobre mí — fondo claro

Dos o tres párrafos en primera persona, sin emoji y sin acordeones. Foto tuya real si la hay; si no, sin foto — mejor nada que una imagen de stock de código.

### 3.6 Contacto — fondo oscuro, cierre

Una frase grande ("¿Tienes un proyecto? Hablemos.") y los medios de contacto como enlaces reales (`mailto:`, `tel:`, LinkedIn, GitHub), sin emoji de icono. Formulario solo si decides tener backend (ver §7).

### 3.7 Navegación

Barra fija con `backdrop-filter: blur(20px)` y fondo semitransparente — el patrón exacto de la barra de apple.com. Enlaces siempre visibles en desktop; hoy están escondidos tras "Menu +" incluso a 1440 px de ancho, que es fricción gratuita. El menú desplegable se reserva para menos de 768 px y, **cerrado, lleva `inert`** para arreglar el bug 1.2 de la auditoría.

---

## 4. Stack técnico

Se mantiene lo que ya usas: no hay motivo para cambiar de herramienta.

- **Vite + React** — igual que ahora
- **Tailwind CSS v4** — igual que ahora, con los tokens del §2 declarados en `@theme`
- **GSAP 3 + ScrollTrigger** — igual que ahora, pero con menos animaciones y mejor orquestadas
- **Lenis** — a evaluar: aporta el scroll suave característico, pero es peso extra. Decidir tras la fase 1.

Se elimina: el fondo WebGL de ReactBits, el `StaggeredMenu`, el texto scramble y Motion (redundante con GSAP; la skill lo advierte explícitamente).

Estructura de carpetas, según la skill de landing:

```
src/
  components/    Reveal, StackChips, ProjectCard, Nav, Marquee
  sections/      Hero, Projects, Experience, Stack, About, Contact
  hooks/         useIntroTimeline, useReducedMotion, useLenis
  data/          site.js, projects.js   ← todo el copy aquí, cero strings en JSX
  styles/        index.css
```

Sacar el contenido a `data/` permite retocar textos y añadir proyectos sin tocar componentes, y hace que el agente de tests pueda importar los datos directamente en vez de duplicar literales.

**Aviso de la skill que aplica aquí:** en Tailwind v4 toda regla CSS de autor debe ir dentro de `@layer base { }`. Una regla suelta del tipo `h1, h2 { margin: 0 }` gana silenciosamente a cualquier utilidad de Tailwind y produce bugs de layout que no se ven en una captura de pantalla.

---

## 5. Fases

### Fase 0 — Parches en producción (1–2 h) ⚠️ hacer ya, sobre el sitio actual

Independiente del rediseño. Hoy tu portfolio está roto en móvil y sin metadatos:

1. Arreglar los proyectos invisibles en móvil (contenido visible por defecto).
2. `inert` en el panel del menú cuando está cerrado.
3. `<html lang="es">`, `<meta description>`, Open Graph y Twitter Card, favicon propio.
4. Comprimir `kairosmk2w.webp` (3,3 MB) y `florian-olivo.jpg` (1,7 MB); añadir `loading="lazy"` y `width`/`height`.

> Son cuatro cambios de horas y arreglan lo que de verdad te está costando oportunidades ahora mismo.

### Fase 1 — Fundamentos (medio día)

Proyecto nuevo, tokens de color y tipografía, escala de espaciado, componente `Reveal`, hook `useReducedMotion`, `Nav` con blur, esqueleto de las seis secciones con contenido real y **sin animaciones**. Al final de esta fase la web ya debe verse Apple, estática.

### Fase 2 — Sección de proyectos (1 día)

La pieza de más valor. Tres destacados a ancho completo con chips de stack, rejilla secundaria, capturas nuevas optimizadas (AVIF + WebP + `srcset`).

### Fase 3 — Movimiento (medio día)

Timeline de entrada del hero, reveals al scroll, parallax sutil en las capturas, hover de los CTA. Aplicando el patrón de la skill: **el hover con transform va en un `<span>` hijo**, nunca sobre un elemento que GSAP animó en la intro — si no, el estilo inline que GSAP deja al terminar anula el `:hover` sin dar ningún error.

### Fase 4 — Pulido y verificación (medio día)

`prefers-reduced-motion` en toda la app, foco visible, contraste, `<main>` y `<nav>`, metadatos, Lighthouse sobre build de producción (no sobre el dev server), pruebas reales a 390 / 768 / 1440 px.

### Fase 5 — Contenido

El copy nuevo (§6) y las capturas de proyecto. **Esto lo aportas tú y es lo que más va a mover la aguja**: el diseño solo enmarca lo que haya dentro.

---

## 6. Copy — reescritura

| Ahora | Propuesta | Por qué |
|---|---|---|
| "Desarrollador FullStack Junior" | "Desarrollador full-stack." | "Junior" en el h1 te devalúa antes de que lean nada. Tu experiencia ya se ve en la timeline. |
| "Disfruto transformar ideas en soluciones digitales que realmente aporten valor." | "Java y Spring en el backend, React en el frontend." | Concreto y verificable, en vez de una frase que podría firmar cualquiera. |
| "Contrátame !" / "Contáctame!" | "Hablemos." | Sin espacio antes del signo y sin exclamación. Tono tranquilo. |
| "Mis Servicios" (5 tarjetas genéricas) | "Stack" | No vendes servicios de agencia, buscas empleo. |
| "👋 Hola, soy Tomás" | "Sobre mí" | Los emoji se renderizan distinto en cada sistema y restan seriedad. |

---

## 7. Huecos que hay que resolver antes de implementar

Como frontend no invento contratos; los dejo señalados:

1. **Formulario de contacto** — hoy no existe (`document.querySelectorAll('form').length === 0`), solo hay datos estáticos. Si se quiere formulario hace falta un endpoint. Opciones sin backend propio: Netlify Forms (ya estás en Netlify, es configuración pura) o Formspree. **Decisión pendiente.** Sin ella, el contacto se queda en enlaces `mailto:` y `tel:`, que es una opción perfectamente válida.

2. **Capturas de proyecto** — las actuales son mockups y renders de stock. Los tres destacados necesitan capturas reales de la aplicación funcionando. Sin esto la fase 2 no se puede cerrar bien.

3. **Qué tres proyectos destacar** — mi propuesta: TomasDex (tiene demo en vivo), Kairós y Asistente-Estudio-IA. Necesito tu confirmación.

4. **CV** — `TomasUhiaOteroResume.pdf` está en inglés y el resto de la web en español. ¿Se mantiene así o se ofrecen las dos versiones?

5. **¿Bilingüe?** — si el objetivo incluye ofertas internacionales, el sitio debería tener versión en inglés. Es una decisión de arquitectura (rutas, i18n) que hay que tomar **antes** de la fase 1, no después.

6. **Repositorio de destino** — el actual es `TomasUhiaOtero/portfolio25-26`. ¿Rediseño sobre una rama de ese repo, o proyecto nuevo en `portfolio-actualizado/`? Afecta al despliegue en Netlify.

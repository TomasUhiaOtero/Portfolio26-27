# Auditoría del portfolio actual

**Sitio:** https://tomassportfolio.netlify.app/
**Fecha:** 2026-09-03
**Método:** Chromium headless (Playwright + Edge). Capturas por sección a 1440×900 y 390×844, volcado del DOM, estilos computados, cabeceras de red y recorrido de tabulación real.

**Stack detectado:** React + Vite (SPA), Tailwind CSS v4, tokens de shadcn/ui, GSAP + ScrollTrigger, Motion, componentes de ReactBits (menú `StaggeredMenu`, fondo WebGL, texto "scramble"). Bundle único `index-*.js` de 597 KB sin comprimir.

---

## 1. Bugs críticos (rompen la web, no son cuestión de gusto)

### 1.1 En móvil la sección Portfolio nunca se muestra — BLOQUEANTE
Con viewport 390×844, tras recorrer la página entera scrolleando de 400 en 400 px, las tarjetas de proyecto siguen en `opacity: 0`:

```
[{"t":"TomasDex","op":"0"},{"t":"Asistente-Estu","op":"0"},{"t":"Kairós","op":"0"},{"t":"TopMusic","op":"0"}]
```

La captura de esa zona es una pantalla negra vacía. El reveal por scroll no dispara en móvil, y el contenido arranca oculto en vez de arrancar visible y animarse encima. Resultado: **desde un teléfono, tu portfolio no tiene proyectos**. Es la sección que decide si te llaman.

### 1.2 El menú cerrado captura el foco del teclado
El panel `#staggered-menu-panel` está fuera de pantalla (`transform: translateX(420px)`, `x: 1440`) y marcado `aria-hidden="true"`, pero sus 6 enlaces siguen siendo tabulables:

```
Tab 1 → BUTTON "Menu"
Tab 2 → A "INICIO"      (dentro del panel oculto, x=1052 fuera de vista)
Tab 3 → A "SOBRE MÍ"    (idem)
... 6 paradas invisibles antes de llegar al primer CTA del hero
```

Es una violación directa de WCAG (contenido `aria-hidden` que sigue siendo focusable): un lector de pantalla no anuncia esos enlaces pero el foco del teclado sí viaja a ellos. Falta `inert` (o `visibility: hidden` / `tabindex="-1"`) mientras el menú esté cerrado.

### 1.3 Layout roto en móvil en el hero
En 390×844 el `<h1>` se solapa con el logotipo "Tomás Uhía" de la cabecera, el segundo párrafo desaparece y quedan ~400 px de vacío antes de los botones. El hero es lo primero que ve un reclutador desde el móvil.

### 1.4 Animación de texto que se queda a medias
"aprendiendo." (desktop) y "valor." (móvil) se quedan renderizadas borrosas/ilegibles: el efecto scramble no completa. Palabras del copy principal ilegibles de forma permanente.

### 1.5 `prefers-reduced-motion` ignorado
Con `reducedMotion: reduce` el `<canvas>` WebGL de fondo sigue presente y animando. No hay rama estática.

---

## 2. Rendimiento

**~6.9 MB de imágenes en la carga inicial**, todas eager, ninguna con `loading="lazy"`, `srcset` ni `sizes`:

| Archivo | Peso | Tamaño real | Tamaño mostrado |
|---|---|---|---|
| `kairosmk2w.webp` | **3.30 MB** | 1920×1440 | 411×250 |
| `florian-olivo-...unsplash.jpg` | **1.72 MB** | 6000×4000 | 620×413 |
| `tomasdex.png` | 622 KB | 1280×894 | 411×250 |
| `mockup_conversor.png` | 616 KB | 960×720 | 411×250 |

Se están sirviendo 24 megapíxeles para pintar una caja de 620×413. Con `srcset` + `lazy` + AVIF/WebP a la resolución correcta esto baja a menos de 400 KB — una reducción de ~94 %.

Otros puntos:
- 11 de 12 imágenes sin `width`/`height` → riesgo de CLS.
- Bundle JS de 597 KB en un solo chunk, sin code splitting.
- Fondo WebGL a pantalla completa siempre activo: consume GPU y batería en móvil para un degradado azul.

---

## 3. SEO y metadatos

| Elemento | Estado |
|---|---|
| `<html lang>` | **`en`** — el contenido es íntegramente español |
| `<meta name="description">` | ausente |
| Open Graph / Twitter Card | ausentes → al compartir el enlace en LinkedIn sale una tarjeta vacía |
| `<link rel="canonical">` | ausente |
| Favicon | `vite.svg` (el logo por defecto de Vite) |
| `<title>` | "Portfolio Tomás" |
| `<main>` / `<nav>` | no existen; solo hay `<header>` |

Para un portfolio cuyo caso de uso principal es *pegar el enlace en LinkedIn y en candidaturas*, no tener Open Graph es de las cosas más caras que hay aquí.

---

## 4. Diseño — por qué se percibe anticuado

Lo que hay hoy (medido sobre estilos computados):

- **Paleta:** negro puro `#000` + cian neón `#00d4ff` como único acento. Es el cliché "dev portfolio 2016". El cian se usa a la vez para el título del hero, el apellido del logo, los chips de fecha y el filtro activo: acento sobreexpuesto, cero jerarquía.
- **Tipografía:** Poppins + Montserrat, todo en `font-weight: 700`, `letter-spacing: normal`. El h1 son 56 px de Poppins Bold en cian. Poppins es una geométrica con mucha personalidad que en bold y en tamaño grande satura.
- **Emoji como iconografía:** 💻 🤳 🤖 ⚛️ ⚙️ en Servicios, 👋 🧠 💻 📖 en Sobre mí, 📍 📧 📱 en Contacto. Es la señal más rápida de "hecho a mano rápido". Además se renderizan distinto en cada sistema operativo.
- **Ritmo idéntico en las cinco secciones:** título centrado bold + línea degradada + rejilla de tarjetas oscuras con borde. No hay contraste de escala ni de composición entre secciones, así que nada destaca.
- **Fondo WebGL azul debajo de todo:** compite con el contenido en vez de separarlo, y hace que el texto flote sin base.
- **Copy:** "Contrátame !", "Contáctame!", espacio antes del signo, exclamaciones. Suena ansioso; el tono Apple es afirmativo y tranquilo.
- **Easing:** `cubic-bezier(.175,.885,.32,1.275)` — un *back/bounce*. Apple nunca rebota; usa curvas de desaceleración limpias.
- **Imágenes de relleno:** portátil de Unsplash en el hero, foto genérica de código en Sobre mí, render de stock "API" en un proyecto. No enseñan tu trabajo.

Y lo más importante a nivel de contenido: **las tarjetas de proyecto no dicen con qué está hecho cada cosa**. No hay chips de stack, ni rol, ni resultado, ni distinción entre "demo en vivo" y "repo". Nueve proyectos con el mismo peso visual, incluido "Este portfolio" — que hoy juega en tu contra.

---

## 5. Lo que sí funciona y hay que conservar

- Los proyectos enlazan a demo real o repo (`tomasdex.netlify.app`, GitHub) — bien.
- Estructura de secciones y anclas (`#home`, `#about`, `#services`, `#experience`, `#portfolio`, `#contact`) coherente.
- Un solo `<h1>`, jerarquía h2/h3 correcta.
- Sin scroll horizontal en móvil (`scrollWidth === innerWidth`).
- Timeline de experiencia: es el componente mejor resuelto de la página.
- Todas las imágenes tienen atributo `alt`.
- Ya estás en Tailwind v4 + GSAP: el stack de destino no requiere cambiar de herramientas.

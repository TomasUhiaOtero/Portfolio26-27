# Portfolio v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the personal portfolio from scratch in a new `web/` directory with an Apple-derived visual language, three WebGL scenes, a side navigation rail, a light/dark theme toggle, and a 3D arc carousel for the projects section.

**Architecture:** A single-page Vite + React 19 application. Content lives entirely in `src/data/` as bilingual JavaScript modules; no component contains a text literal. GSAP + ScrollTrigger drives all scroll orchestration on top of a Lenis smooth-scroll instance wired into `gsap.ticker`. Three independent react-three-fiber scenes mount and unmount through a shared `LazyCanvas` wrapper as they enter and leave the viewport. The existing `vite-project/` is untouched and keeps serving production until the final task.

**Tech Stack:** Vite 7, React 19 (JSX, no TypeScript), Tailwind CSS v4 via `@tailwindcss/vite`, GSAP 3 (ScrollTrigger + Observer), Lenis, three + @react-three/fiber + @react-three/drei, Vitest + @testing-library/react + jsdom.

**Spec:** [`docs/superpowers/specs/2026-09-08-portfolio-v3-design.md`](../specs/2026-09-08-portfolio-v3-design.md)

## Global Constraints

Every task's requirements implicitly include this section.

- **Directory:** all new code lives under `web/`. Never modify `vite-project/` except where a task says so explicitly. The only file touched outside `web/` before Task 18 is the plan/spec docs.
- **No text literals in JSX.** Every user-visible string comes from `src/data/`. A hardcoded string is a review rejection.
- **All author CSS inside `@layer`.** Tailwind v4 puts its utilities in `@layer utilities`; an unlayered author rule beats any layered utility regardless of specificity, silently. No bare rules in `index.css`.
- **The visible state of a reveal is declared inside its own `@utility` block**, never in `@layer base` — the `utilities` layer wins by layer order and the element would stay at `opacity: 0` forever.
- **Animate only `transform` and `opacity`.** Never `transition: all`. Never `ease-in`.
- **Timings:** UI under 300ms; scroll reveals 600–800ms; entrance easing `cubic-bezier(0.16, 1, 0.3, 1)`; stagger 60ms with a maximum of 6 steps; `active:scale(0.97)` on every pressable element.
- **No `rounded-full` on containers, cards or buttons.** Radii 12–28px. The pill is reserved for chips and indicator dots.
- **Content never starts hidden by CSS alone.** Entrance animations hide an element only when `document.documentElement` has the class `js` AND the user has not requested reduced motion. `Reveal` force-shows its children after 3s as a safety net.
- **No transform hover on an element a GSAP timeline animates.** GSAP leaves an inline `transform` that beats any stylesheet `:hover` rule. Put the hover effect on a decorative child `<span>` GSAP never touches.
- **No load promise without a fallback timeout.** `document.fonts.ready` and every `img.decode()` go through `Promise.race` with a timer.
- **Colors come from tokens.** No hex literal in a component. Tokens are defined once in `index.css`.
- **Every task ends green:** `npm run test -- --run` and `npm run lint` both pass before the commit step.

---

## File Structure

| Path | Responsibility |
|---|---|
| `web/index.html` | Document shell + the inline anti-flash theme script |
| `web/src/main.jsx` | Mounts React, adds the `js` class to `<html>` |
| `web/src/App.jsx` | Providers + section composition, nothing else |
| `web/src/styles/index.css` | Tokens, `@theme`, base layer, author utilities |
| `web/src/data/content.js` | All bilingual copy (migrated) |
| `web/src/data/projects.js` | The eight projects (migrated) |
| `web/src/data/services.js` | The four services (new) |
| `web/src/i18n/context.js` · `LanguageProvider.jsx` | Language state, `t` accessor, `<html lang>` |
| `web/src/theme/context.js` · `ThemeProvider.jsx` | Theme state, `<html data-theme>`, localStorage |
| `web/src/hooks/useReducedMotion.js` | Live `prefers-reduced-motion` boolean |
| `web/src/hooks/useLenis.js` | One Lenis instance wired into `gsap.ticker` |
| `web/src/hooks/useIntroTimeline.js` | The hero curtain + entrance timeline |
| `web/src/hooks/useActiveSection.js` | Which section id is currently in view |
| `web/src/hooks/useInViewport.js` | Generic IntersectionObserver boolean |
| `web/src/lib/spring.js` | Framework-free critically-damped spring integrator |
| `web/src/three/adaptive.js` | Per-device particle budgets and DPR caps |
| `web/src/three/LazyCanvas.jsx` | Mount/unmount + pause logic shared by all scenes |
| `web/src/three/HeroField.jsx` | Hero particle-network scene |
| `web/src/three/TechCore.jsx` | About-section icosahedron + orbiting nodes |
| `web/src/three/ServiceStage.jsx` | Services sticky visual, morphs across four states |
| `web/src/three/WorkBackdrop.jsx` | Depth/light layer behind the carousel |
| `web/src/components/*.jsx` | SideRail, ThemeToggle, LangToggle, Reveal, SplitText, Counter, Button, Chip, ProjectCard, ProjectOverlay, icons |
| `web/src/sections/*.jsx` | Hero, About, Services, Experience, Work, Contact, Footer |

**Testing boundary.** Unit tests cover logic that has a right answer: data contracts, theme persistence, language switching, reduced-motion branches, the spring integrator, carousel index arithmetic, and focus-trap behaviour. Visual and motion quality is verified in a real browser against the production build (`npm run preview`), never against the dev server alone. Do not write assertions about GSAP tween internals — they test the library, not the site.

---

## Task 1: Scaffold `web/` and migrate the data

**Files:**
- Create: `web/package.json`, `web/vite.config.js`, `web/index.html`, `web/src/main.jsx`, `web/src/App.jsx`, `web/src/styles/index.css`, `web/eslint.config.js`, `web/.gitignore`, `web/vitest.setup.js`
- Create: `web/src/data/content.js`, `web/src/data/projects.js`
- Create: `web/public/` (copied assets)
- Test: `web/src/data/data.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `content` (object keyed `es`/`en`), `profile`, `LANGUAGES`, `DEFAULT_LANGUAGE` from `data/content.js`; `projects`, `localized(field, lang)` from `data/projects.js`. `localized` returns `""` for `null`/`undefined`, the string itself for a plain string, and `field[lang] ?? field.es` for an object.

- [ ] **Step 1: Create the project and install dependencies**

```bash
cd web && npm create vite@latest . -- --template react
npm install
npm install gsap lenis three @react-three/fiber @react-three/drei
npm install -D @tailwindcss/vite tailwindcss vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Configure Vite, Tailwind and Vitest**

`web/vite.config.js`:

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // three + r3f never enter the initial bundle: the hero must paint
        // text before any 3D code arrives.
        manualChunks(id) {
          if (id.includes("node_modules/three")) return "three";
          if (id.includes("@react-three")) return "three";
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.js"],
    css: false,
  },
});
```

`web/vitest.setup.js`:

```js
import "@testing-library/jest-dom/vitest";

// jsdom implements neither of these; several components read them.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  });
}

if (!window.IntersectionObserver) {
  window.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
```

Add to `web/package.json` scripts: `"test": "vitest"`.

- [ ] **Step 3: Copy the assets and the two data modules**

Run these from the **repository root**, not from `web/`:

```bash
cp -r vite-project/public/img web/public/img
cp vite-project/public/TomasUhiaOteroResume.pdf vite-project/public/favicon.svg vite-project/public/og.png web/public/
cp vite-project/src/data/content.js vite-project/src/data/projects.js web/src/data/
```

- [ ] **Step 4: Rewrite `content.nav.links` in both languages**

In `web/src/data/content.js`, replace the `nav.links` array in `es` with:

```js
links: [
  { id: "inicio", label: "Inicio" },
  { id: "sobre-mi", label: "Sobre mí" },
  { id: "servicios", label: "Servicios" },
  { id: "experiencia", label: "Experiencia" },
  { id: "proyectos", label: "Proyectos" },
  { id: "contacto", label: "Contacto" },
],
```

and in `en`:

```js
links: [
  { id: "inicio", label: "Home" },
  { id: "sobre-mi", label: "About" },
  { id: "servicios", label: "Services" },
  { id: "experiencia", label: "Experience" },
  { id: "proyectos", label: "Work" },
  { id: "contacto", label: "Contact" },
],
```

Add `themeLabelToDark` / `themeLabelToLight` to `nav` in both languages (`"Cambiar a tema oscuro"` / `"Cambiar a tema claro"`, `"Switch to dark theme"` / `"Switch to light theme"`).

Leave `content.stack` exactly as it is — it stops rendering its own section but becomes the data source for the About section's four technology groups.

- [ ] **Step 5: Write the failing data-contract test**

`web/src/data/data.test.js`:

```js
import { describe, it, expect } from "vitest";
import { content, profile, LANGUAGES } from "./content.js";
import { projects, localized } from "./projects.js";

describe("content", () => {
  it("exposes the same section keys in every language", () => {
    const [first, ...rest] = LANGUAGES;
    const reference = Object.keys(content[first]).sort();
    for (const lang of rest) {
      expect(Object.keys(content[lang]).sort()).toEqual(reference);
    }
  });

  it("uses the same nav link ids in every language", () => {
    const ids = (lang) => content[lang].nav.links.map((l) => l.id);
    expect(ids("en")).toEqual(ids("es"));
  });

  it("navigates to section ids that the rail can anchor to", () => {
    expect(content.es.nav.links.map((l) => l.id)).toEqual([
      "inicio",
      "sobre-mi",
      "servicios",
      "experiencia",
      "proyectos",
      "contacto",
    ]);
  });

  it("has a complete profile", () => {
    for (const key of ["name", "email", "github", "linkedin", "resume"]) {
      expect(profile[key]).toBeTruthy();
    }
  });
});

describe("projects", () => {
  it("gives every project a unique id", () => {
    const ids = projects.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every project an image, a year and a non-empty stack", () => {
    for (const p of projects) {
      expect(p.image).toMatch(/^\/img\//);
      expect(p.year).toMatch(/^\d{4}$/);
      expect(p.stack.length).toBeGreaterThan(0);
    }
  });

  it("gives every project at least one link to follow", () => {
    for (const p of projects) {
      expect(p.demo || p.code).toBeTruthy();
    }
  });
});

describe("localized", () => {
  it("returns an empty string for a missing field", () => {
    expect(localized(null, "es")).toBe("");
    expect(localized(undefined, "en")).toBe("");
  });

  it("passes a plain string straight through", () => {
    expect(localized("TomasDex", "en")).toBe("TomasDex");
  });

  it("picks the requested language", () => {
    expect(localized({ es: "Hola", en: "Hi" }, "en")).toBe("Hi");
  });

  it("falls back to Spanish when the language is missing", () => {
    expect(localized({ es: "Hola" }, "en")).toBe("Hola");
  });
});
```

- [ ] **Step 6: Run the tests and confirm they fail for the right reason**

Run: `cd web && npm run test -- --run src/data/data.test.js`
Expected: the nav-id test fails until Step 4 is applied; everything else passes against the migrated data. If any other test fails, the migration is wrong — fix the data, not the test.

- [ ] **Step 7: Make them pass and write the minimal shell**

`web/index.html` — `<html lang="es">`, the favicon, a `<div id="root">`, and nothing else yet (the theme script arrives in Task 2).

`web/src/main.jsx`:

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/index.css";

// Marks that JavaScript is running. Entrance animations may only hide
// content when this class is present — without it a failed bundle would
// leave the page permanently blank.
document.documentElement.classList.add("js");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`web/src/App.jsx` renders a single `<main>` with a placeholder heading read from `content.es.hero.headline`. It is replaced in Task 5.

`web/src/styles/index.css` contains only `@import "tailwindcss";` for now.

- [ ] **Step 8: Verify the toolchain end to end**

Run: `cd web && npm run test -- --run && npm run lint && npm run build && npm run preview`
Expected: tests pass, lint clean, build succeeds, the preview serves the placeholder heading.

- [ ] **Step 9: Commit**

```bash
git add web
git commit -m "feat(web): scaffold the v3 project and migrate content and projects data"
```

---

## Task 2: Design tokens and the theme system

**Files:**
- Modify: `web/src/styles/index.css`, `web/index.html`
- Create: `web/src/theme/context.js`, `web/src/theme/ThemeProvider.jsx`, `web/src/components/ThemeToggle.jsx`, `web/src/components/icons.jsx`
- Test: `web/src/theme/ThemeProvider.test.jsx`

**Interfaces:**
- Consumes: `content[lang].nav.themeLabelToDark` / `themeLabelToLight` from Task 1.
- Produces: `ThemeProvider` (component), `useTheme()` returning `{ theme, setTheme, toggle }` where `theme` is `"dark" | "light"`; the storage key constant `THEME_KEY = "portfolio-theme"`; `ThemeToggle` (component, no props).

- [ ] **Step 1: Write the failing theme test**

`web/src/theme/ThemeProvider.test.jsx`:

```jsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme, THEME_KEY } from "./ThemeProvider.jsx";

function Probe() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} data-testid="probe">
      {theme}
    </button>
  );
}

const renderProbe = () =>
  render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  );

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it("defaults to dark when nothing is stored", () => {
    renderProbe();
    expect(screen.getByTestId("probe")).toHaveTextContent("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("restores a stored theme", () => {
    localStorage.setItem(THEME_KEY, "light");
    renderProbe();
    expect(screen.getByTestId("probe")).toHaveTextContent("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("ignores a corrupt stored value instead of applying it", () => {
    localStorage.setItem(THEME_KEY, "neon");
    renderProbe();
    expect(screen.getByTestId("probe")).toHaveTextContent("dark");
  });

  it("toggles, writes the attribute and persists", async () => {
    const user = userEvent.setup();
    renderProbe();
    await user.click(screen.getByTestId("probe"));
    expect(screen.getByTestId("probe")).toHaveTextContent("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem(THEME_KEY)).toBe("light");
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd web && npm run test -- --run src/theme`
Expected: FAIL — `Failed to resolve import "./ThemeProvider.jsx"`.

- [ ] **Step 3: Implement the provider**

`web/src/theme/context.js` exports `const ThemeContext = createContext(null);` — kept in its own module so the provider file only exports components and React Fast Refresh stays happy.

`web/src/theme/ThemeProvider.jsx`:

```jsx
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./context.js";

export const THEME_KEY = "portfolio-theme";
const THEMES = ["dark", "light"];

function readStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return THEMES.includes(stored) ? stored : "dark";
  } catch {
    // Private browsing can throw on access, not just return null.
    return "dark";
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readStoredTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Persistence is a convenience; failing to store must not break the UI.
    }
  }, [theme]);

  const toggle = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    [],
  );

  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme, toggle]);
  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `cd web && npm run test -- --run src/theme`
Expected: PASS, 4 tests.

- [ ] **Step 5: Add the anti-flash script to `index.html`**

Immediately inside `<head>`, **before any stylesheet link**:

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem("portfolio-theme");
      document.documentElement.dataset.theme = t === "light" ? "light" : "dark";
    } catch (e) {
      document.documentElement.dataset.theme = "dark";
    }
  })();
</script>
```

Resolving the theme from React instead would show a flash of the wrong theme on every reload.

- [ ] **Step 6: Write the tokens**

`web/src/styles/index.css`:

```css
@import "tailwindcss";

@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

@layer base {
  :root {
    --bg: #000000;
    --surface: #0d0d0f;
    --surface-2: #161618;
    --text: #f5f5f7;
    --mute: #86868b;
    --line: rgb(255 255 255 / 0.10);
    --accent: #0a84ff;
    --glow: #5e5ce6;
  }

  [data-theme="light"] {
    --bg: #fbfbfd;
    --surface: #ffffff;
    --surface-2: #f5f5f7;
    --text: #1d1d1f;
    --mute: #6e6e73;
    --line: rgb(0 0 0 / 0.10);
    --accent: #0071e3;
    --glow: #5856d6;
  }

  html {
    background-color: var(--bg);
    color: var(--text);
    /* Lenis drives scrolling; native smooth scroll would fight it. */
    scroll-behavior: auto;
  }

  body {
    font-family: "Inter var", ui-sans-serif, system-ui, sans-serif;
    font-feature-settings: "cv11", "ss01";
    -webkit-font-smoothing: antialiased;
  }

  :focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
  }
}

/* `inline` makes the generated utilities resolve `var(--bg)` at use time,
   so `bg-bg` follows the theme without regenerating any CSS. */
@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-text: var(--text);
  --color-mute: var(--mute);
  --color-line: var(--line);
  --color-accent: var(--accent);
  --color-glow: var(--glow);
  --ease-entrance: cubic-bezier(0.16, 1, 0.3, 1);
}
```

Every token is consumed as a Tailwind utility (`bg-bg`, `text-mute`, `border-line`). No component may contain a hex literal.

- [ ] **Step 7: Self-host Inter Variable**

Download `InterVariable.woff2` and `InterVariable-Italic.woff2` into `web/public/fonts/`, then declare them in `@layer base` with `font-family: "Inter var"`, `font-weight: 100 900`, `font-display: swap`. Self-hosting removes a third-party request and its blocking time.

- [ ] **Step 8: Build the toggle**

`web/src/components/icons.jsx` holds every inline SVG in the project as a named export. `web/src/components/ThemeToggle.jsx` renders a `<button>` whose `aria-label` comes from `content[lang].nav` (`themeLabelToDark` when the current theme is light, and the reverse). The icon is a single `<path>` whose `d` attribute is tweened between the sun and moon shapes — the same path morphing, not two icons swapped. Both shapes must have the same number and type of segments or the morph will jump.

- [ ] **Step 9: Verify in the browser**

Wrap `App` in `ThemeProvider`, render the toggle, run `npm run build && npm run preview`. Confirm: the toggle flips both themes; reloading in light mode shows **no** dark flash; `getComputedStyle(document.body).backgroundColor` matches the expected token in each theme.

- [ ] **Step 10: Commit**

```bash
git add web
git commit -m "feat(web): add design tokens and the light/dark theme system"
```

---

## Task 3: Language provider and toggle

**Files:**
- Create: `web/src/i18n/context.js`, `web/src/i18n/LanguageProvider.jsx`, `web/src/components/LangToggle.jsx`
- Modify: `web/src/App.jsx`
- Test: `web/src/i18n/LanguageProvider.test.jsx`

**Interfaces:**
- Consumes: `content`, `LANGUAGES`, `DEFAULT_LANGUAGE` from `data/content.js`.
- Produces: `LanguageProvider` (component), `useLanguage()` returning `{ lang, setLang, t }` where `t === content[lang]`; `LANG_KEY = "portfolio-lang"`; `LangToggle` (component, no props).

- [ ] **Step 1: Write the failing test**

`web/src/i18n/LanguageProvider.test.jsx`:

```jsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider, useLanguage, LANG_KEY } from "./LanguageProvider.jsx";

function Probe() {
  const { lang, t, setLang } = useLanguage();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="headline">{t.hero.headline}</span>
      <button onClick={() => setLang(lang === "es" ? "en" : "es")}>swap</button>
    </div>
  );
}

const renderProbe = () =>
  render(
    <LanguageProvider>
      <Probe />
    </LanguageProvider>,
  );

describe("LanguageProvider", () => {
  beforeEach(() => localStorage.clear());

  it("starts in Spanish and sets the document language", () => {
    renderProbe();
    expect(screen.getByTestId("lang")).toHaveTextContent("es");
    expect(document.documentElement.lang).toBe("es");
  });

  it("swaps the copy and the document language together", async () => {
    const user = userEvent.setup();
    renderProbe();
    await user.click(screen.getByRole("button", { name: "swap" }));
    expect(screen.getByTestId("headline")).toHaveTextContent(
      "Full-stack developer",
    );
    expect(document.documentElement.lang).toBe("en");
    expect(localStorage.getItem(LANG_KEY)).toBe("en");
  });

  it("ignores an unknown stored language", () => {
    localStorage.setItem(LANG_KEY, "fr");
    renderProbe();
    expect(screen.getByTestId("lang")).toHaveTextContent("es");
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd web && npm run test -- --run src/i18n`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement it**

Mirror `ThemeProvider` exactly: context in its own module, a guarded `readStoredLang` that falls back to `DEFAULT_LANGUAGE` when the stored value is not in `LANGUAGES`, an effect that writes `document.documentElement.lang` and persists, and a `useMemo`'d value of `{ lang, setLang, t: content[lang] }`.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `cd web && npm run test -- --run src/i18n`
Expected: PASS, 3 tests.

- [ ] **Step 5: Build `LangToggle`**

A **single** `<button>` — not two segments — so the rail's button count stays predictable and the control is one Tab stop. It shows the current language code (`ES` or `EN`) and swaps to the other on activation. Its `aria-label` comes from `t.nav.languageLabel`, which already reads "switch to the other language". The code slides out and the new one slides in over 200ms, `transform` and `opacity` only, inside an `overflow-hidden` wrapper.

- [ ] **Step 6: Compose the providers**

`App.jsx` wraps everything in `<ThemeProvider><LanguageProvider>…`. Theme is outermost: it has no dependency on language, and language labels read from theme-independent copy.

- [ ] **Step 7: Verify and commit**

Run: `cd web && npm run test -- --run && npm run lint`

```bash
git add web
git commit -m "feat(web): add the bilingual language provider and toggle"
```

---

## Task 4: Motion foundation — Lenis, reduced motion, and the reveal primitives

**Files:**
- Create: `web/src/hooks/useReducedMotion.js`, `web/src/hooks/useLenis.js`, `web/src/hooks/useInViewport.js`, `web/src/components/Reveal.jsx`, `web/src/components/SplitText.jsx`, `web/src/components/Counter.jsx`, `web/src/components/Button.jsx`, `web/src/components/Chip.jsx`
- Modify: `web/src/styles/index.css`, `web/src/App.jsx`
- Test: `web/src/hooks/useReducedMotion.test.jsx`, `web/src/components/Counter.test.jsx`, `web/src/components/Reveal.test.jsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `useReducedMotion(): boolean` — live, re-renders on media-query change.
  - `useLenis(): void` — call once, from `App`.
  - `useInViewport(ref, { rootMargin, once }): boolean`.
  - `<Reveal as="div" delay={0} className>` — fades and lifts its children once on enter.
  - `<SplitText text="…" as="h1" />` — wraps each word in `<span data-word>`, spaces as sibling nodes.
  - `<Counter value="2+" start={boolean} />` — animates a numeric prefix, passes non-numeric values straight through.
  - `<Button href variant="primary|ghost">`, `<Chip>`.

- [ ] **Step 1: Write the failing tests**

`web/src/components/Counter.test.jsx`:

```jsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Counter from "./Counter.jsx";

describe("Counter", () => {
  it("shows zero before it is told to start", () => {
    render(<Counter value="8" start={false} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("passes a non-numeric value straight through", () => {
    render(<Counter value="Java · React" start={false} />);
    expect(screen.getByText("Java · React")).toBeInTheDocument();
  });

  it("keeps the suffix of a numeric value", () => {
    render(<Counter value="2+" start={false} />);
    expect(screen.getByText("0+")).toBeInTheDocument();
  });
});
```

`web/src/components/Reveal.test.jsx`:

```jsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Reveal from "./Reveal.jsx";

describe("Reveal", () => {
  it("always renders its children into the document", () => {
    render(
      <Reveal>
        <p>Contenido</p>
      </Reveal>,
    );
    expect(screen.getByText("Contenido")).toBeInTheDocument();
  });
});
```

`Reveal` must never gate its children behind state — the content is always in the DOM and only its opacity is animated. The previous portfolio left the projects section permanently invisible on mobile by getting this wrong.

- [ ] **Step 2: Run them and confirm they fail**

Run: `cd web && npm run test -- --run src/components`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `useReducedMotion`**

```js
import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

export default function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia?.(QUERY).matches ?? false,
  );

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = (event) => setReduced(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
```

- [ ] **Step 4: Implement `useLenis`**

```js
import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import useReducedMotion from "./useReducedMotion.js";

gsap.registerPlugin(ScrollTrigger);

export default function useLenis() {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });

    // ScrollTrigger reads scroll position from its own ticker. Without
    // these three lines Lenis and ScrollTrigger drift apart and pinned
    // sections jitter.
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, [reduced]);
}
```

- [ ] **Step 5: Implement `useInViewport`**

```js
import { useEffect, useState } from "react";

export default function useInViewport(ref, { rootMargin = "0px", once = false } = {}) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) observer.disconnect();
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin, once]);

  return inView;
}
```

With `once: false` this reports leaving as well as entering — `LazyCanvas` (Task 6) depends on the leaving edge to unmount its canvas.

- [ ] **Step 6: Implement the reveal utility in CSS**

In `index.css`:

```css
/* The visible state lives inside the @utility block on purpose. Declared in
   @layer base it would lose to the utilities layer by layer order — not by
   specificity — and the element would stay at opacity 0 forever. */
@utility reveal {
  opacity: 1;
  translate: 0 0;

  .js &:not([data-revealed]) {
    opacity: 0;
    translate: 0 1.5rem;
  }

  @media (prefers-reduced-motion: reduce) {
    .js &:not([data-revealed]) {
      opacity: 1;
      translate: 0 0;
    }
  }
}
```

- [ ] **Step 7: Implement `Reveal`**

Creates a `ScrollTrigger` with `start: "top 85%"` and `once: true` that sets `data-revealed` and runs a 700ms GSAP tween on `opacity` and `y` with the entrance easing and the given delay. On mount it also arms a 3000ms `setTimeout` that sets `data-revealed` unconditionally — if the observer never fires for any reason, the content still appears. Clear the timeout on reveal and on unmount.

- [ ] **Step 8: Implement `SplitText` and `Counter`**

`SplitText` splits on spaces and emits, per word, a `<Fragment>` containing `<span data-word>{word}</span>` and — for every word but the last — a literal `" "` **outside** the span. Inside the span, `white-space` cannot break the line and the headline renders as one unbreakable run.

The wrapper carries `overflow-hidden` plus `pb-[0.2em] -mb-[0.2em]`, and the intro tween uses `yPercent: 135` rather than 100. Without both, the descenders of "p", "g" and "j" are clipped.

`Counter` has three explicitly separate branches — collapsing any two of them produces a visible bug:

```jsx
const match = /^(\d+)(.*)$/.exec(value);
if (!match) return <span>{value}</span>;          // non-numeric: pass through
const [, digits, suffix] = match;
if (reduced) return <span>{digits}{suffix}</span>; // reduced: final value, no animation
if (!start) return <span>0{suffix}</span>;         // not yet in view: zero
// otherwise: tween a ref from 0 to Number(digits) over 1.2s
```

- [ ] **Step 9: Implement `Button` and `Chip`**

`Button` is a pill-shaped `<a>` following the fill-on-hover pattern, so the hover survives any GSAP timeline that animates the parent:

```jsx
<a
  href={href}
  className="group relative inline-flex items-center overflow-hidden rounded-xl px-6 py-3 active:scale-[0.97] transition-transform duration-200"
>
  <span aria-hidden className="absolute inset-0 bg-surface-2" />
  <span
    aria-hidden
    className="absolute inset-0 origin-left scale-x-0 bg-accent transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
  />
  <span className="relative">{children}</span>
</a>
```

The transform hover lives on the decorative child, never on the `<a>` — GSAP leaves an inline `transform` on anything it animated, and an inline style always beats a stylesheet `:hover`.

`Chip` is a small pill with `border-line`, `text-mute` and 12px text — the one place `rounded-full` is allowed.

- [ ] **Step 10: Run the tests and confirm they pass**

Run: `cd web && npm run test -- --run && npm run lint`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add web
git commit -m "feat(web): add the motion foundation and reveal primitives"
```

---

## Task 5: Hero section (without WebGL)

**Files:**
- Create: `web/src/sections/Hero.jsx`, `web/src/hooks/useIntroTimeline.js`
- Modify: `web/src/App.jsx`

**Interfaces:**
- Consumes: `SplitText`, `Counter`, `Button`, `useReducedMotion`, `useLanguage`.
- Produces: `<Hero />` rendering `<section id="inicio">`; `useIntroTimeline(rootRef, { enabled })` which builds and plays the entrance timeline and returns nothing.

The hero ships fully working with a CSS gradient background first. Task 6 swaps that background for the WebGL scene. Splitting it this way means a failure in the 3D scene can never leave the hero broken.

- [ ] **Step 1: Build the markup**

`<section id="inicio">` at `min-h-screen`, contents centred in a `max-w-[1400px]` container. In order: `t.hero.eyebrow` (eyebrow style), `t.hero.headline` through `SplitText` at display size, `t.hero.subheadline` capped at `max-w-2xl` in `text-mute`, the two `Button`s (`t.hero.primaryCta` → `#proyectos`, `t.hero.secondaryCta` → `profile.resume`), and a scroll cue. Below, a strip of the four `t.stats.items` rendered through `Counter`.

Every animated element starts with `opacity-0` in the JSX **and** the class `js-hidden`, whose rule in `@layer base` resets opacity to 1 when `html` lacks `.js`.

The curtain is `<div data-curtain>` — `fixed inset-0 z-50 bg-bg`.

- [ ] **Step 2: Build the intro timeline**

`useIntroTimeline` waits for fonts with a fallback, then plays:

```js
const ready = Promise.race([
  document.fonts.ready,
  new Promise((resolve) => setTimeout(resolve, 1500)),
]);
```

Never await `document.fonts.ready` bare — if the promise never settles, the curtain never lifts.

The timeline, inside a `gsap.context` scoped to `rootRef`:

| target | from | duration | position |
|---|---|---|---|
| `[data-curtain]` | `opacity: 1, scale: 1` → `opacity: 0, scale: 1.04` | 0.9 | 0 |
| `[data-eyebrow]` | `opacity: 0, y: 20` | 0.6 | `-=0.5` |
| `[data-word]` | `opacity: 0, yPercent: 135` | 0.9 | `-=0.4`, stagger 0.06 |
| `[data-sub]` | `opacity: 0, y: 24` | 0.7 | `-=0.5` |
| `[data-cta]` | `opacity: 0, y: 20` | 0.5 | `-=0.4`, stagger 0.06 |
| `[data-stats]` | `opacity: 0, y: 20` | 0.6 | `-=0.3` |
| `[data-cue]` | `opacity: 0` | 0.5 | `-=0.2` |

Set `pointer-events: none` on the curtain as soon as its tween starts, so it cannot swallow a click during the fade. Return `ctx.revert()` from the effect cleanup.

When reduced motion is on, skip the timeline entirely: hide the curtain immediately and leave every element at its final state.

- [ ] **Step 3: Verify in the browser**

Run `npm run build && npm run preview`. Confirm the curtain lifts, the headline reveals word by word with no clipped descenders, the counters run once, and nothing is left invisible. Then set the browser to emulate reduced motion, reload, and confirm the full hero is visible and static.

- [ ] **Step 4: Commit**

```bash
git add web
git commit -m "feat(web): add the hero section and its entrance timeline"
```

---

## Task 6: `HeroField` WebGL scene and the shared canvas wrapper

**Files:**
- Create: `web/src/three/adaptive.js`, `web/src/three/LazyCanvas.jsx`, `web/src/three/HeroField.jsx`
- Modify: `web/src/sections/Hero.jsx`
- Test: `web/src/three/adaptive.test.js`

**Interfaces:**
- Consumes: `useInViewport`, `useReducedMotion`, `useTheme`.
- Produces:
  - `getBudget({ width, deviceMemory, reduced }): { particles, dpr: [min, max], enabled }`.
  - `<LazyCanvas poster={string} className rootMargin>` — renders the poster image until the wrapper is near the viewport, then lazily mounts a `<Canvas>` with the children; unmounts it when it leaves by more than `rootMargin`; pauses rendering on `document.hidden`.
  - `<HeroField />` — a scene component, valid only inside `LazyCanvas`.

- [ ] **Step 1: Write the failing budget test**

```js
import { describe, it, expect } from "vitest";
import { getBudget } from "./adaptive.js";

describe("getBudget", () => {
  it("disables 3D entirely under reduced motion", () => {
    expect(getBudget({ width: 1920, reduced: true }).enabled).toBe(false);
  });

  it("caps device pixel ratio at 1.5 on phones", () => {
    expect(getBudget({ width: 390, reduced: false }).dpr[1]).toBe(1.5);
  });

  it("uses fewer particles on a phone than on a desktop", () => {
    const phone = getBudget({ width: 390, reduced: false }).particles;
    const desktop = getBudget({ width: 1920, reduced: false }).particles;
    expect(phone).toBeLessThan(desktop);
  });

  it("steps down on a low-memory device", () => {
    const low = getBudget({ width: 1920, deviceMemory: 2, reduced: false });
    const normal = getBudget({ width: 1920, deviceMemory: 8, reduced: false });
    expect(low.particles).toBeLessThan(normal.particles);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd web && npm run test -- --run src/three`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `adaptive.js`**

Pure function, no DOM reads inside — the caller passes `window.innerWidth` and `navigator.deviceMemory`. Breakpoints: under 768px → 90 particles, DPR `[1, 1.5]`; under 1280px → 160 particles, DPR `[1, 1.75]`; above → 260 particles, DPR `[1, 2]`. `deviceMemory <= 4` halves the particle count. `reduced: true` returns `{ enabled: false }` with a zero budget.

Every count lives here. No scene may hardcode its own.

- [ ] **Step 4: Implement `LazyCanvas`**

- `useInViewport(ref, { rootMargin: "200px" })` decides whether the `<Canvas>` is mounted at all.
- While unmounted, render the `poster` image at the same dimensions so there is no layout shift on swap.
- `<Canvas dpr={budget.dpr} gl={{ antialias: false, powerPreference: "high-performance" }} frameloop={paused ? "never" : "always"}>`.
- Wrap `<PerformanceMonitor onDecline={…}>` from drei to step DPR down when frames drop. Degrading sharpness is always preferable to stuttering.
- A `visibilitychange` listener sets `paused` from `document.hidden`.
- When `budget.enabled` is false, render only the poster and never import the canvas.
- Import the canvas module through `React.lazy` inside a `<Suspense fallback={poster}>` so `three` stays out of the initial bundle.

Unmounting is the whole point: browsers cap simultaneous WebGL contexts, and this site has four scenes. On unmount, dispose geometries, materials and textures explicitly — React unmounting the component does not free GPU memory by itself.

- [ ] **Step 5: Implement `HeroField`**

A `THREE.Points` cloud of `budget.particles` points in a slab, plus a `THREE.LineSegments` mesh rebuilt each frame connecting pairs closer than a threshold. Point and line colours come from `--accent` and `--glow`, read once via `getComputedStyle` and **lerped over ~400ms** when the theme changes; an instant colour jump in a canvas reads as a glitch.

Pointer parallax: `useFrame` lerps the group rotation toward the normalised pointer at about 0.02 per frame, so the motion trails the cursor instead of sticking to it.

Cap the neighbour search cost: with 260 points a naive pairwise loop is 33k distance checks per frame. Compare squared distances and skip the `Math.sqrt`, and only rebuild the line geometry every other frame.

- [ ] **Step 6: Wire it into the hero and generate the poster**

Place `<LazyCanvas>` absolutely behind the hero content at `-z-10`. Capture a still of the scene, save it as `web/public/img/hero-poster.webp`, and pass it as `poster`. Add a `bg-gradient-to-b from-transparent to-bg` veil between canvas and text so the copy keeps its AA contrast over any frame of the animation.

- [ ] **Step 7: Verify in the browser**

Run `npm run build && npm run preview` and confirm:
- `three` is in its own chunk and is **not** requested until the hero is near view (check the network panel).
- 60fps while scrolling the hero.
- Switching theme fades the particle colours rather than snapping them.
- With reduced motion emulated, no canvas is created and the poster shows.
- Scrolling far past the hero and back re-creates the canvas without a console warning about lost contexts.

- [ ] **Step 8: Commit**

```bash
git add web
git commit -m "feat(web): add the hero particle field and the adaptive lazy canvas"
```

---

## Task 7: Side rail navigation

**Files:**
- Create: `web/src/components/SideRail.jsx`, `web/src/hooks/useActiveSection.js`
- Modify: `web/src/App.jsx`
- Test: `web/src/hooks/useActiveSection.test.jsx`, `web/src/components/SideRail.test.jsx`

**Interfaces:**
- Consumes: `t.nav.links` (Task 1), `ThemeToggle` (Task 2), `LangToggle` (Task 3).
- Produces: `useActiveSection(ids: string[]): string` — the id of the section currently in view, defaulting to `ids[0]`; `<SideRail />`.

- [ ] **Step 1: Write the failing tests**

`SideRail.test.jsx` asserts structure, which is what actually breaks:

```jsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderWithProviders } from "../test/renderWithProviders.jsx";
import SideRail from "./SideRail.jsx";

describe("SideRail", () => {
  it("renders one button per navigation link", () => {
    renderWithProviders(<SideRail />);
    expect(screen.getAllByRole("button")).toHaveLength(8); // 6 links + theme + lang
  });

  it("labels every link button with its section name", () => {
    renderWithProviders(<SideRail />);
    for (const label of ["Inicio", "Sobre mí", "Servicios", "Experiencia", "Proyectos", "Contacto"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("marks the first section as current by default", () => {
    renderWithProviders(<SideRail />);
    expect(screen.getByRole("button", { name: "Inicio" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("exposes the rail as a labelled navigation landmark", () => {
    renderWithProviders(<SideRail />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});
```

Create `web/src/test/renderWithProviders.jsx` in this task — a helper that wraps a subtree in `ThemeProvider` and `LanguageProvider` and re-exports `render`. Every later component test uses it.

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd web && npm run test -- --run src/components/SideRail.test.jsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `useActiveSection`**

One `IntersectionObserver` over all section elements with `rootMargin: "-45% 0px -45% 0px"`, which reduces the detection zone to a horizontal band across the middle of the viewport. Track entries in a `Map` and pick the topmost intersecting one; never derive the answer from `scrollY` arithmetic, which breaks with sections of differing height.

- [ ] **Step 4: Implement `SideRail`**

- `<nav>` fixed at `right-6 top-1/2 -translate-y-1/2 z-40`, hidden below `md`.
- One `<button>` per link. Collapsed it shows a 24px bar; active is 40px and `bg-accent`; inactive is `bg-line`. Width animates over 250ms — `transform` only, never `width`.
- Hovering or focusing the rail expands a glass panel (`backdrop-blur-xl bg-surface/60 border border-line rounded-2xl`) with the labels, staggered in at 40ms. It carries `inert` while collapsed; `aria-hidden` alone leaves the links tabbable and sends keyboard focus to invisible offscreen elements.
- Each button's accessible name is its label; the active one gets `aria-current="true"`.
- Clicking scrolls to the section. With Lenis active use `lenis.scrollTo(el)`; otherwise `el.scrollIntoView()`. Expose the instance from `useLenis` through a module-level ref so the rail can reach it.
- `ThemeToggle` and `LangToggle` sit at the foot of the rail, separated by a hairline.
- Below `md`, the same component renders as a bottom dock: horizontally centred, `bottom-4`, glass pill, same bars laid out in a row.

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `cd web && npm run test -- --run && npm run lint`

- [ ] **Step 6: Verify in the browser**

Confirm: the active bar tracks the section while scrolling; Tab reaches every button with a visible focus ring; the collapsed panel is not tabbable; clicking scrolls smoothly to the right section; the dock appears below 768px.

- [ ] **Step 7: Commit**

```bash
git add web
git commit -m "feat(web): add the side rail navigation with theme and language toggles"
```

---

## Task 8: About section — pinned scroll with four technology stages

**Files:**
- Create: `web/src/sections/About.jsx`
- Modify: `web/src/App.jsx`

**Interfaces:**
- Consumes: `t.about.paragraphs`, `t.about.title`, `t.about.eyebrow`, `t.stack.groups` (four groups, in order: Frontend, Backend, Data, Tooling), `Reveal`, `Chip`.
- Produces: `<About />` rendering `<section id="sobre-mi">`; internally computes `stage` (0–3) and `progress` (0–1) and passes both down — Task 9 consumes them.

Built without the 3D scene first. The right column holds a labelled placeholder box until Task 9.

- [ ] **Step 1: Build the pinned structure**

A tall outer `<section>` (roughly `300vh`) containing an inner wrapper pinned by ScrollTrigger for its duration. Two columns at `lg`; stacked below, where the section is **not** pinned — pinning on a phone traps the user in a scroll region and feels broken.

- [ ] **Step 2: Drive the stages from scroll**

One `ScrollTrigger` with `scrub: 0.6` writing `progress` into a ref and a throttled state. `stage = Math.min(3, Math.floor(progress * 4))`. Keep `progress` in a ref for the 3D scene (per-frame, no re-render) and `stage` in state for the DOM (changes four times, cheap).

- [ ] **Step 3: Render the left column**

Eyebrow, title, then the three `t.about.paragraphs` revealing progressively as `progress` advances — each paragraph fades and lifts in over its own slice of the range.

- [ ] **Step 4: Render the technology groups**

Below the paragraphs, the group matching `stage` is shown: its `title` as a heading and its `items` as `Chip`s entering in a 60ms stagger, capped at 6 steps. Switching stage cross-fades the outgoing group out over 200ms before the incoming one enters — never animate both in place at once, the labels collide mid-flight.

- [ ] **Step 5: Verify in the browser**

Confirm: the pin engages and releases without a jump; the four groups appear in order and in the right ranges; scrolling back up reverses cleanly; below `lg` the section is a normal stacked flow with everything visible; under reduced motion all three paragraphs and the first group render statically with no pin.

- [ ] **Step 6: Commit**

```bash
git add web
git commit -m "feat(web): add the pinned about section with staged technology groups"
```

---

## Task 9: `TechCore` WebGL scene

**Files:**
- Create: `web/src/three/TechCore.jsx`
- Modify: `web/src/sections/About.jsx`

**Interfaces:**
- Consumes: `progress` (0–1, a ref read per frame), `stage` (0–3), `theme`, `getBudget`, `LazyCanvas`.
- Produces: `<TechCore progressRef stage />` — a scene component, valid only inside `LazyCanvas`.

- [ ] **Step 1: Build the core**

An icosahedron at detail 1 rendered as wireframe, rotating slowly and continuously on its Y axis. Its material colour is `--accent`, lerped on theme change like `HeroField`.

- [ ] **Step 2: Build the orbiting nodes**

One `InstancedMesh` of small spheres — never one mesh per node; instancing is the difference between one draw call and forty. Node count per stage comes from the length of the matching `t.stack.groups[stage].items`, so the object always matches the copy.

- [ ] **Step 3: Animate the stage transition**

Each stage has its own orbital configuration (radius, inclination, angular speed). On a stage change, tween the instance matrices between configurations over 800ms with the entrance easing. Drive it from a single `gsap.to` on a plain state object read inside `useFrame` — never call `setState` per frame.

- [ ] **Step 4: Couple it to scroll**

Read `progressRef.current` inside `useFrame` and map it to a slow camera dolly (z from 6 to 4.2) so the object approaches as the section advances. Reading a ref keeps this off React's render path entirely.

- [ ] **Step 5: Mount it and produce the poster**

Replace the placeholder with `<LazyCanvas poster="/img/about-poster.webp">`. Capture the poster from the running scene.

- [ ] **Step 6: Verify in the browser**

Confirm: 60fps through the whole pinned range; stage changes reconfigure the nodes smoothly; theme change fades the colours; the canvas unmounts on leaving the section (`WebGLRenderingContext` count returns to its prior value); reduced motion shows only the poster.

- [ ] **Step 7: Commit**

```bash
git add web
git commit -m "feat(web): add the TechCore scene to the about section"
```

---

## Task 10: Services data and section

**Files:**
- Create: `web/src/data/services.js`, `web/src/sections/Services.jsx`
- Modify: `web/src/App.jsx`
- Test: `web/src/data/services.test.js`

**Interfaces:**
- Consumes: `Chip`, `Reveal`, `useLanguage`, `localized`.
- Produces: `services` — an array of four objects shaped `{ id, title: {es,en}, tagline: {es,en}, description: {es,en}, includes: {es: string[], en: string[]}, stack: string[] }`; `<Services />` rendering `<section id="servicios">`, and exposing `activeService` (0–3) for Task 11.

- [ ] **Step 1: Write the failing contract test**

```js
import { describe, it, expect } from "vitest";
import { services } from "./services.js";

describe("services", () => {
  it("has exactly four services with unique ids", () => {
    expect(services).toHaveLength(4);
    expect(new Set(services.map((s) => s.id)).size).toBe(4);
  });

  it("translates every translatable field into both languages", () => {
    for (const s of services) {
      for (const field of ["title", "tagline", "description"]) {
        expect(s[field].es).toBeTruthy();
        expect(s[field].en).toBeTruthy();
      }
    }
  });

  it("lists the same number of deliverables in both languages", () => {
    for (const s of services) {
      expect(s.includes.en).toHaveLength(s.includes.es.length);
      expect(s.includes.es.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("names a stack for every service", () => {
    for (const s of services) {
      expect(s.stack.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd web && npm run test -- --run src/data/services.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the four services**

Follow the draft copy in spec §6.4 exactly, in both languages:

| id | title (es) | stack |
|---|---|---|
| `web-app` | Aplicaciones web a medida | React, Java, Spring, Node.js, PostgreSQL |
| `android` | Aplicaciones Android | Kotlin, Java, Android Studio, API REST |
| `ia` | Integración de IA | LLM API, Node.js, Python, Prompt design |
| `api-db` | APIs y bases de datos | Spring, Node.js, MongoDB, MySQL, Postman |

Each carries a one-line `tagline`, a two-to-three sentence `description`, and three or four `includes` entries. This file is where the copy gets revised — no component may hold any of it.

- [ ] **Step 4: Build the section**

The Resonance pattern:

- A two-column grid at `lg`. The left (or right) column holds a `sticky top-24 aspect-[4/5] overflow-hidden rounded-3xl bg-surface` container.
- The other column holds four `<article>` panels, each `border-b border-line py-14 first:pt-0 last:border-0`, containing eyebrow (index, `01`–`04`), title at `text-4xl md:text-5xl`, tagline, description in `text-mute`, the `includes` list, and the `stack` as `Chip`s.
- One `ScrollTrigger` per panel with `start: "top 60%"` sets `activeService`; the sticky visual cross-fades to that service's state.
- Below `lg` the sticky column is `hidden` and each panel renders its own visual inline above its text — exactly the split Resonance uses.

- [ ] **Step 5: Verify and commit**

Confirm the active visual matches the panel in view on the way down *and* on the way up, and that the mobile layout has no sticky element and no empty space.

```bash
git add web
git commit -m "feat(web): add the services data and the sticky services section"
```

---

## Task 11: `ServiceStage` WebGL scene

**Files:**
- Create: `web/src/three/ServiceStage.jsx`
- Modify: `web/src/sections/Services.jsx`

**Interfaces:**
- Consumes: `activeService` (0–3), `theme`, `LazyCanvas`, `getBudget`.
- Produces: `<ServiceStage active />`.

- [ ] **Step 1: Define the four states**

One geometry morphing between four configurations, one per service — not four separate objects. Suggested reading:

| service | form |
|---|---|
| `web-app` | a grid plane folding into a browser-like frame |
| `android` | the same grid narrowing into a phone proportion |
| `ia` | the grid dissolving into a scattered point cloud |
| `api-db` | the points settling into stacked concentric rings |

Use a single `BufferGeometry` with two position attributes — current and target — and lerp between them in the vertex shader by a `uProgress` uniform. Rebuilding geometry on every switch allocates and stutters; lerping two attributes does not.

- [ ] **Step 2: Animate the transition**

On `active` change, write the new target positions and tween `uProgress` from 0 to 1 over 900ms with the entrance easing. Colours from `--accent` and `--glow`, lerped on theme change.

- [ ] **Step 3: Mount, poster, verify, commit**

Same `LazyCanvas` treatment and the same browser checks as Task 9.

```bash
git add web
git commit -m "feat(web): add the morphing ServiceStage scene"
```

---

## Task 12: Experience timeline

**Files:**
- Create: `web/src/sections/Experience.jsx`
- Modify: `web/src/App.jsx`

**Interfaces:**
- Consumes: `t.experience.items`, `t.experience.education`, `t.experience.educationTitle`, `Chip`, `Reveal`.
- Produces: `<Experience />` rendering `<section id="experiencia">`.

- [ ] **Step 1: Build the structure**

A vertical rail of `1px` in `border-line` running the height of the section. On it, one node per entry: the two `experience.items` first, then a divider carrying `educationTitle`, then the two `education` entries.

- [ ] **Step 2: Draw the line with the scroll**

An accent-coloured overlay line at `scaleY: 0` with `transformOrigin: "top"`, tweened to `scaleY: 1` by a `ScrollTrigger` with `scrub: 0.5` spanning the section. It must be scrubbed, not a fixed-duration tween — the drawing has to follow the scroll in both directions.

- [ ] **Step 3: Pop the nodes**

Each node gets its own `ScrollTrigger` at `start: "top 65%"`, scaling from 0.4 to 1 over 400ms with a slight overshoot. `once: true` — a node that re-pops on every pass is noise.

- [ ] **Step 4: Bring in the cards**

At `lg` and above cards alternate sides, entering from their own side by 40px. Below `lg` the rail sits at the left and every card enters from the right. Each card holds period, role, company, summary, impact and its `stack` as `Chip`s. The education cards use period, title and place.

- [ ] **Step 5: Verify and commit**

Confirm the line tracks the scroll in both directions, nodes pop once, nothing overlaps at 1280px or 390px, and reduced motion shows the line fully drawn with all cards visible.

```bash
git add web
git commit -m "feat(web): add the scroll-drawn experience timeline"
```

---

## Task 13: Projects arc carousel

**Files:**
- Create: `web/src/lib/spring.js`, `web/src/lib/carousel.js`, `web/src/components/ProjectCard.jsx`, `web/src/sections/Work.jsx`
- Modify: `web/src/App.jsx`
- Test: `web/src/lib/spring.test.js`, `web/src/lib/carousel.test.js`, `web/src/sections/Work.test.jsx`

**Interfaces:**
- Consumes: `projects`, `localized`, `Chip`.
- Produces:
  - `createSpring({ stiffness, damping, mass }): { set, target, step(dt): number, isSettled(): boolean }`.
  - `cardTransform(offset, { step, radius }): { transform, opacity, blur, hidden }` — pure, unit tested.
  - `wrapIndex(index, length): number` — always returns a value in `[0, length)`, for negative inputs too.
  - `<ProjectCard project offset onSelect />`.
  - `<Work onOpen(projectId) />` rendering `<section id="proyectos">`.

The geometry is CSS 3D, not WebGL. In WebGL the cards would be textures: blurry text, no real `<a>` elements, no keyboard navigation — in the most important section of the site. With `perspective` and `rotateY` on real elements the look is the same and the content stays sharp and accessible. The WebGL layer behind it arrives in Task 15.

- [ ] **Step 1: Write the failing maths tests**

`web/src/lib/carousel.test.js`:

```js
import { describe, it, expect } from "vitest";
import { wrapIndex, cardTransform } from "./carousel.js";

describe("wrapIndex", () => {
  it("leaves an in-range index alone", () => {
    expect(wrapIndex(3, 8)).toBe(3);
  });

  it("wraps past the end", () => {
    expect(wrapIndex(9, 8)).toBe(1);
  });

  it("wraps below zero instead of returning a negative", () => {
    expect(wrapIndex(-1, 8)).toBe(7);
    expect(wrapIndex(-9, 8)).toBe(7);
  });
});

describe("cardTransform", () => {
  const opts = { step: 26, radius: 560 };

  it("leaves the focused card unrotated and fully opaque", () => {
    const t = cardTransform(0, opts);
    expect(t.opacity).toBe(1);
    expect(t.blur).toBe(0);
    expect(t.transform).toContain("rotateY(0deg)");
  });

  it("rotates and dims a neighbour", () => {
    const t = cardTransform(1, opts);
    expect(t.transform).toContain("rotateY(26deg)");
    expect(t.opacity).toBeLessThan(1);
    expect(t.blur).toBeGreaterThan(0);
  });

  it("is symmetric in opacity for equal distances", () => {
    expect(cardTransform(-2, opts).opacity).toBe(cardTransform(2, opts).opacity);
  });

  it("hides cards beyond the third ring so they are never painted", () => {
    expect(cardTransform(3, opts).hidden).toBe(true);
    expect(cardTransform(-3, opts).hidden).toBe(true);
    expect(cardTransform(2, opts).hidden).toBe(false);
  });
});
```

`web/src/lib/spring.test.js`:

```js
import { describe, it, expect } from "vitest";
import { createSpring } from "./spring.js";

const settle = (s) => {
  for (let i = 0; i < 600 && !s.isSettled(); i += 1) s.step(1 / 60);
  return s;
};

describe("createSpring", () => {
  it("converges on its target", () => {
    const s = createSpring({ stiffness: 120, damping: 20, mass: 1 });
    s.set(0);
    s.target(4);
    settle(s);
    expect(s.step(1 / 60)).toBeCloseTo(4, 2);
  });

  it("reports settled only once it has arrived", () => {
    const s = createSpring({ stiffness: 120, damping: 20, mass: 1 });
    s.set(0);
    s.target(4);
    expect(s.isSettled()).toBe(false);
    settle(s);
    expect(s.isSettled()).toBe(true);
  });

  it("does not oscillate when critically damped", () => {
    const s = createSpring({ stiffness: 100, damping: 20, mass: 1 });
    s.set(0);
    s.target(1);
    let previous = 0;
    for (let i = 0; i < 200; i += 1) {
      const v = s.step(1 / 60);
      expect(v).toBeGreaterThanOrEqual(previous - 1e-6);
      previous = v;
    }
  });

  it("clamps an absurd frame delta instead of exploding", () => {
    const s = createSpring({ stiffness: 120, damping: 20, mass: 1 });
    s.set(0);
    s.target(1);
    expect(Number.isFinite(s.step(5))).toBe(true);
  });
});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `cd web && npm run test -- --run src/lib`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `spring.js`**

```js
const MAX_DT = 1 / 30; // A tab returning from the background can hand us a
                       // multi-second delta; integrating it explodes the spring.

export function createSpring({ stiffness = 120, damping = 20, mass = 1 } = {}) {
  let value = 0;
  let velocity = 0;
  let goal = 0;

  return {
    set(next) {
      value = next;
      velocity = 0;
      goal = next;
    },
    target(next) {
      goal = next;
    },
    step(dt) {
      const t = Math.min(dt, MAX_DT);
      const force = -stiffness * (value - goal);
      const drag = -damping * velocity;
      velocity += ((force + drag) / mass) * t;
      value += velocity * t;
      return value;
    },
    isSettled() {
      return Math.abs(goal - value) < 0.001 && Math.abs(velocity) < 0.001;
    },
    get current() {
      return value;
    },
  };
}
```

A hand-rolled spring rather than GSAP's inertia: it is fifteen lines, deterministic, and unit testable — and it keeps the carousel free of any paid plugin.

- [ ] **Step 4: Implement `carousel.js`**

```js
export function wrapIndex(index, length) {
  return ((index % length) + length) % length;
}

const RINGS = [
  { opacity: 1, blur: 0 },
  { opacity: 0.55, blur: 2 },
  { opacity: 0.25, blur: 4 },
];

export function cardTransform(offset, { step, radius }) {
  const ring = Math.abs(offset);
  if (ring >= RINGS.length) {
    return { transform: "", opacity: 0, blur: 0, hidden: true };
  }
  const { opacity, blur } = RINGS[ring];
  return {
    transform: `rotateY(${offset * step}deg) translateZ(${radius}px)`,
    opacity,
    blur,
    hidden: false,
  };
}
```

Cards beyond the third ring are removed from paint entirely — otherwise eight blurred layers composite every frame for nothing.

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `cd web && npm run test -- --run src/lib`
Expected: PASS, 8 tests.

- [ ] **Step 6: Build `ProjectCard`**

A `<button>` (not a `<div>`) so it is focusable and activates on Enter and Space. Contains the project image via `<picture>` with the avif/webp sources at 16:10, the title, the year, the tagline and up to four `Chip`s. `aria-label` reads `${title} — ${t.projects.viewProject}`. The card carries the transform from `cardTransform`; its hover lift lives on an inner `<span>`.

- [ ] **Step 7: Build the carousel**

- Outer stage: `perspective: 1400px`, `perspective-origin: 50% 50%`.
- Inner track: `transform-style: preserve-3d`, rotated `rotateY(-index * step)` where `index` is the spring's continuous value — a float, so the motion is smooth between snap points.
- One `requestAnimationFrame` loop steps the spring and writes the track transform directly to the DOM node. Never route per-frame values through React state.
- Ordering: the three `featured` projects first, then the rest, matching spec §6.6.
- Gestures:
  - **Drag** — `pointerdown`/`pointermove`/`pointerup` with pointer capture. Horizontal travel maps to index change at roughly 220px per card. On release, target the nearest integer index, biased by release velocity so a flick advances more than one card.
  - **Wheel** — accumulate `deltaX` (and `deltaY` when `shiftKey` is held); debounce to one card per gesture so a trackpad does not spin the carousel.
  - **Keyboard** — Left and Right arrows move one card; Home and End jump to first and last. The track has `role="listbox"`, cards have `role="option"` and `aria-selected`.
- Under reduced motion, replace the spring with a direct index assignment: no inertia, no interpolation.

- [ ] **Step 8: Write the section test**

`Work.test.jsx` renders `<Work />` through `renderWithProviders` and asserts: all eight projects are in the DOM; every card is a `button`; pressing ArrowRight changes which card has `aria-selected="true"`; the first card is selected initially.

- [ ] **Step 9: Verify in the browser**

Confirm: dragging follows the pointer with no lag and settles without oscillating; a flick advances several cards; arrow keys move focus and selection together; text on the focused card is fully sharp; 60fps while dragging; below `md` the card width and radius shrink so a card is never wider than the viewport.

- [ ] **Step 10: Commit**

```bash
git add web
git commit -m "feat(web): add the 3D arc carousel for projects"
```

---

## Task 14: Project detail overlay

**Files:**
- Create: `web/src/components/ProjectOverlay.jsx`, `web/src/hooks/useFocusTrap.js`
- Modify: `web/src/sections/Work.jsx`
- Test: `web/src/components/ProjectOverlay.test.jsx`

**Interfaces:**
- Consumes: `projects`, `localized`, `Chip`, `Button`, `t.projects` labels.
- Produces: `useFocusTrap(ref, active)`; `<ProjectOverlay project onClose />` — renders nothing when `project` is null.

- [ ] **Step 1: Write the failing tests**

```jsx
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/renderWithProviders.jsx";
import ProjectOverlay from "./ProjectOverlay.jsx";
import { projects } from "../data/projects.js";

const withDemoOnly = projects.find((p) => p.demo && !p.code);
const withCodeOnly = projects.find((p) => p.code && !p.demo);

describe("ProjectOverlay", () => {
  it("renders nothing without a project", () => {
    const { container } = renderWithProviders(
      <ProjectOverlay project={null} onClose={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("exposes itself as a modal dialog with the project title as its name", () => {
    renderWithProviders(
      <ProjectOverlay project={projects[0]} onClose={() => {}} />,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName(/TomasDex/);
  });

  it("omits the source button when a project has no repository", () => {
    renderWithProviders(
      <ProjectOverlay project={withDemoOnly} onClose={() => {}} />,
    );
    expect(screen.queryByRole("link", { name: /Código/ })).toBeNull();
  });

  it("omits the demo button when a project has no demo", () => {
    renderWithProviders(
      <ProjectOverlay project={withCodeOnly} onClose={() => {}} />,
    );
    expect(screen.queryByRole("link", { name: /demo/i })).toBeNull();
  });

  it("lists every technology in the stack", () => {
    renderWithProviders(
      <ProjectOverlay project={projects[0]} onClose={() => {}} />,
    );
    for (const tech of projects[0].stack) {
      expect(screen.getByText(tech)).toBeInTheDocument();
    }
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <ProjectOverlay project={projects[0]} onClose={onClose} />,
    );
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("keeps Tab inside the dialog", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ProjectOverlay project={projects[0]} onClose={() => {}} />,
    );
    const dialog = screen.getByRole("dialog");
    for (let i = 0; i < 12; i += 1) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement);
    }
  });
});
```

A disabled button is never rendered for a missing link — the element is absent.

- [ ] **Step 2: Run them and confirm they fail**

Run: `cd web && npm run test -- --run src/components/ProjectOverlay.test.jsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `useFocusTrap`**

```js
import { useEffect } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function useFocusTrap(ref, active) {
  useEffect(() => {
    if (!active || !ref.current) return;

    const root = ref.current;
    const previous = document.activeElement;
    const first = root.querySelector(FOCUSABLE);
    first?.focus();

    const onKeyDown = (event) => {
      if (event.key !== "Tab") return;
      const items = [...root.querySelectorAll(FOCUSABLE)];
      if (items.length === 0) return;
      const edge = event.shiftKey ? items[0] : items[items.length - 1];
      if (document.activeElement === edge) {
        event.preventDefault();
        (event.shiftKey ? items[items.length - 1] : items[0]).focus();
      }
    };

    root.addEventListener("keydown", onKeyDown);
    return () => {
      root.removeEventListener("keydown", onKeyDown);
      // Returning focus to the originating card is what makes the overlay
      // usable by keyboard: without it focus falls back to <body>.
      previous?.focus?.();
    };
  }, [ref, active]);
}
```

Query the focusable list on every Tab, not once on mount — the buttons present depend on which links the project has.

- [ ] **Step 4: Implement the overlay**

- Rendered through `createPortal` into `document.body`.
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the title.
- Content: the project image at full width, title, year, role, description, the full `stack` as `Chip`s, and `Button`s for demo (`t.projects.demo`) and source (`t.projects.code`) — each rendered only if its URL is non-null, with `target="_blank"` and `rel="noreferrer noopener"`.
- Escape closes; a click on the backdrop closes; a click inside does not.
- `document.body` gets `overflow: hidden` while open, restored on close. Lenis is stopped and started alongside it.
- The rest of the page gets `inert` while the overlay is open.

- [ ] **Step 5: Implement the shared-element transition**

On open, measure the source card with `getBoundingClientRect()`, mount the overlay at that exact rect, then tween it to its final rect over 500ms with the entrance easing — `transform` and `opacity` only, never `width`/`height`/`top`/`left`, which trigger layout on every frame. Reverse it on close. The card is not replaced by a new object; it becomes the overlay. That is the whole point of the gesture.

Under reduced motion, skip the transition: show the overlay at its final rect immediately.

- [ ] **Step 6: Run the tests and confirm they pass**

Run: `cd web && npm run test -- --run && npm run lint`
Expected: PASS, 7 overlay tests.

- [ ] **Step 7: Verify in the browser**

Confirm: the card grows into the overlay without a flash of the final layout; Escape and backdrop clicks close it; focus returns to the originating card; the page behind does not scroll while it is open; Tab never escapes the dialog.

- [ ] **Step 8: Commit**

```bash
git add web
git commit -m "feat(web): add the project detail overlay with a shared-element transition"
```

---

## Task 15: `WorkBackdrop` WebGL layer

**Files:**
- Create: `web/src/three/WorkBackdrop.jsx`
- Modify: `web/src/sections/Work.jsx`

**Interfaces:**
- Consumes: the carousel's continuous index (a ref), `theme`, `LazyCanvas`.
- Produces: `<WorkBackdrop indexRef />`.

- [ ] **Step 1: Build the layer**

A full-bleed plane behind the carousel running a fragment shader: a slow radial gradient between `--accent` and `--glow` over `--bg`, plus a soft light blob whose horizontal position follows the carousel's continuous index. Because the index is a float, the light glides with the cards rather than jumping between them.

- [ ] **Step 2: Keep it cheap**

Fragment-only work, no geometry beyond two triangles, `frameloop="demand"` with an invalidate on index change, and DPR capped one step below the hero's — this is a backdrop, and softness here costs nothing visually.

- [ ] **Step 3: Mount it at `-z-10` behind the carousel, poster, verify, commit**

Confirm the carousel still holds 60fps while dragging with the backdrop live; if it does not, halve the DPR cap before touching anything else.

```bash
git add web
git commit -m "feat(web): add the WebGL backdrop behind the projects carousel"
```

---

## Task 16: Contact section and footer

**Files:**
- Create: `web/src/sections/Contact.jsx`, `web/src/sections/Footer.jsx`
- Modify: `web/src/App.jsx`

**Interfaces:**
- Consumes: `t.contact`, `t.footer`, `profile`, `Reveal`, `Button`.
- Produces: `<Contact />` rendering `<section id="contacto">`; `<Footer />` rendering `<footer>` **outside** `<main>`.

- [ ] **Step 1: Build the contact section**

Full viewport height. `t.contact.eyebrow`, `t.contact.title` at section-headline size, `t.contact.intro`, then `profile.email` as a display-size `mailto:` link with an underline that draws in on hover (a decorative `<span>` scaling on the X axis — not a `text-decoration` transition, which cannot be animated smoothly). Below, a row with phone, location, GitHub, LinkedIn and the résumé download, each labelled from `t.contact`.

- [ ] **Step 2: Build the footer**

Name, current year, `t.footer.rights`, `t.footer.builtWith`, and a `t.footer.backToTop` button that calls `lenis.scrollTo(0)`. Update `builtWith` in `content.js` to name the real stack: React, Vite, Tailwind CSS, GSAP and three.js.

`<footer>` sits as a sibling of `<main>`, never inside it — landmarks must not nest.

- [ ] **Step 3: Add the skip link**

First focusable element in `App`: an anchor to `#main` that is visually hidden until focused, labelled from `t.nav.skipToContent`.

- [ ] **Step 4: Verify and commit**

```bash
git add web
git commit -m "feat(web): add the contact section and the footer"
```

---

## Task 17: Accessibility, performance and polish pass

**Files:**
- Modify: across `web/src/`
- Create: `web/README.md`

This task changes no features. It runs the spec's closing checklist and fixes what fails.

- [ ] **Step 1: Audit every author CSS rule**

Read `index.css` top to bottom. Every rule must be inside `@layer` or `@utility`. An unlayered rule beats any Tailwind utility silently, with no error and no warning. If a utility is not applying, compare `getComputedStyle` values rather than judging by eye.

- [ ] **Step 2: Audit the GSAP hover interaction**

For every element a timeline animates, confirm no `:hover` rule on it uses `transform`, `translate`, `scale` or `rotate`. Verify in the browser by reading `getComputedStyle(el).translate` and `.scale` — not `.transform`, which can report `"none"` while the effect is applied.

- [ ] **Step 3: Run the reduced-motion pass**

Emulate `prefers-reduced-motion: reduce` and walk all seven sections. Every one must show its complete final content, with no canvas mounted, no pinning, and no counter stuck at zero.

- [ ] **Step 4: Run the keyboard pass**

Tab through the entire page. Confirm: the skip link comes first; focus is always visible; the collapsed rail panel is not reachable; the carousel responds to arrows; the overlay traps focus and returns it; nothing offscreen ever receives focus.

- [ ] **Step 5: Check contrast in both themes**

Sample text over the darkest and lightest frames of each WebGL scene. Anything below 4.5:1 gets a stronger veil behind the text. `text-mute` on `bg` must clear AA in both themes.

- [ ] **Step 6: Measure the production build**

Run `npm run build`, then serve with `npm run preview` and measure on a throttled 4G profile:
- LCP under 2.5s
- CLS at 0
- 60fps during scroll
- `three` absent from the initial chunk

Confirm canvases unmount by scrolling the full page and watching the live WebGL context count return to baseline.

- [ ] **Step 7: Write `web/README.md`**

Cover: how to run, the script table, where content lives, how to add a project (including the three image files per project at 16:10 — `<id>-800.webp`, `<id>-1600.webp`, `<id>-1600.avif` — which are still stock mockups and should be replaced with real screenshots), how to edit the services copy, and the decisions worth not undoing (the `@layer` rule, the reveal safety net, the GSAP hover rule, the theme anti-flash script, the WebGL unmount requirement).

- [ ] **Step 8: Commit**

```bash
git add web
git commit -m "chore(web): accessibility, performance and documentation pass"
```

---

## Task 18: Cut production over to `web/`

**Files:**
- Modify: `netlify.toml`, `README.md`
- Delete: `vite-project/`

Only after Task 17 passes cleanly.

- [ ] **Step 1: Point Netlify at the new app**

In `netlify.toml`, change `base = "vite-project"` to `base = "web"`. Leave the redirect and the cache headers as they are — `/assets/*` and `/img/*` keep the same shape.

- [ ] **Step 2: Verify the deploy preview**

Push the branch and open the Netlify deploy preview. Walk all seven sections, both themes and both languages on a real phone and a desktop. Do not merge on a green build alone: a build succeeding says nothing about whether the carousel drags.

- [ ] **Step 3: Remove the old app**

```bash
git rm -r vite-project
```

The history keeps it; the working tree does not need two portfolios.

- [ ] **Step 4: Update the root `README.md`**

Point every path at `web/`, describe the new visual system and the three scenes, and keep the "decisions worth not undoing" section — it still applies.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: cut production over to the v3 portfolio"
```

---

## Self-review notes

**Spec coverage.** §2 → Tasks 1 and 18. §3.1–3.3 → Task 1. §3.4 → the Interfaces blocks. §3.5 → Task 1 steps 3–4. §4.1 → Task 2 step 6. §4.2 → Task 2 steps 6–7. §4.3 → Tasks 2 and 4. §4.4 → Task 2. §5.1 → Global Constraints. §5.2 → Task 4 steps 5–6. §5.3 → Tasks 4 and 17. §5.4 → Task 4 step 5, Task 17 step 1. §5.5 → Task 5 step 2. §5.6 → every section task, audited in Task 17 step 3. §6.1 → Tasks 5–6. §6.2 → Task 7. §6.3 → Tasks 8–9. §6.4 → Tasks 10–11. §6.5 → Task 12. §6.6 → Tasks 13–15. §6.7 → Task 16. §6.8 → Task 16. §7 → Task 6 (adaptive, LazyCanvas) and Task 17 step 6. §8 → Task 17 steps 3–5. §9 → the browser-verification step in every task.

**Naming consistency.** `getBudget` (Task 6) is consumed under that name in Tasks 9, 11 and 15. `LazyCanvas` takes a `poster` prop in every scene task. `localized(field, lang)` keeps the signature from Task 1 in Tasks 10, 13 and 14. `useTheme()` returns `{ theme, setTheme, toggle }` in Tasks 2, 6, 9, 11 and 15. `cardTransform` and `wrapIndex` are defined in Task 13 and used nowhere earlier. `renderWithProviders` is created in Task 7 and reused in Tasks 13 and 14.

**Deliberate deviation from the spec's stated preference.** §6.6 builds the carousel geometry in CSS 3D rather than WebGL, with a WebGL backdrop behind it. The reasoning is recorded in the spec and repeated in Task 13.

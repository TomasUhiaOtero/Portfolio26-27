/* eslint-disable react-refresh/only-export-components --
   This is a test helper, not application source — react-refresh's
   "only export components" rule exists for files Vite hot-reloads in the
   running app, which never applies here. */
import { render } from "@testing-library/react";
import { ThemeProvider } from "../theme/ThemeProvider.jsx";
import { LanguageProvider } from "../i18n/LanguageProvider.jsx";

/**
 * Shared test wrapper: every component that reads `useTheme()` or
 * `useLanguage()` needs both providers mounted above it, so this is the
 * one place that composition lives instead of every test file
 * duplicating it. Task 7 introduces it for `SideRail.test.jsx`; Tasks 13
 * and 14 reuse it as-is.
 */
function AllProviders({ children }) {
  return (
    <ThemeProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </ThemeProvider>
  );
}

export function renderWithProviders(ui, options = {}) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from Testing Library (including `render`) so a
// call site can import both the wrapper and the rest of the library from
// this one module.
export * from "@testing-library/react";

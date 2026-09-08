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

// This hook lives beside ThemeProvider because that is the interface this
// project requires (`useTheme` imported from ThemeProvider.jsx). The
// react-refresh rule can't tell a hook export from any other function
// export, so it flags this as a false positive.
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}

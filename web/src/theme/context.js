import { createContext } from "react";

// Kept in its own module so ThemeProvider.jsx exports only components —
// that keeps React Fast Refresh working.
export const ThemeContext = createContext(null);

import { createContext } from "react";

// Kept in its own module so LanguageProvider.jsx exports only components —
// that keeps React Fast Refresh working.
export const LanguageContext = createContext(null);

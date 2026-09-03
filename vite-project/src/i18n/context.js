import { createContext } from "react";

/**
 * Contexto de idioma. Se define en su propio módulo (sin componentes) para que
 * Fast Refresh siga funcionando en el provider y en el hook.
 */
export const LanguageContext = createContext(null);

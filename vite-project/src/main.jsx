import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.jsx";

/**
 * Marca que JavaScript está corriendo.
 *
 * El CSS solo oculta los elementos animados si existe esta clase, así que si
 * el bundle falla o tarda, el contenido se ve entero sin animaciones en vez de
 * quedarse en blanco. Se pone antes de montar React para que no haya un
 * fotograma con el contenido ya visible que luego desaparece.
 */
document.documentElement.classList.add("js");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

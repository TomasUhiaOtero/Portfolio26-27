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

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

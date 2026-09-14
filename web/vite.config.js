import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // three + r3f never enter the initial bundle: the hero must paint
        // text before any 3D code arrives.
        //
        // This uses Rolldown's native `codeSplitting.groups` rather than the
        // classic Rollup-compat `manualChunks(id)` function. With
        // `manualChunks`, Rolldown's own CJS interop for react/react-dom (a
        // dependency of @react-three/fiber too) got non-deterministically
        // attributed to whichever manual chunk claimed it last, so the
        // "three" chunk ended up carrying react's runtime and — because the
        // main entry also needs that runtime — a static import from the
        // entry chunk into "three" appeared, defeating the whole point of
        // this wrapper (verified by inspecting the unminified build output).
        // `codeSplitting.groups`' explicit `priority` resolves the conflict
        // deterministically: the higher-priority group claims its modules
        // first and removes them from lower-priority groups' candidate
        // pools, so react can never end up inside the "three" chunk.
        codeSplitting: {
          groups: [
            {
              name: "vendor-react",
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 2,
            },
            {
              name: "three",
              test: /node_modules[\\/](three|@react-three)[\\/]/,
              priority: 1,
            },
          ],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.js"],
    css: false,
    // `.netlify` is netlify-cli's local cache: `netlify dev` bundles a
    // whole copy of any *.test.js file it finds directly under
    // netlify/functions/ (it doesn't apply the production bundler's
    // test-file exclusion), and vitest's default excludes don't cover it.
    exclude: [...configDefaults.exclude, "**/.netlify/**"],
  },
});

import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  // `.netlify` is netlify-cli's own local cache — `netlify dev` bundles
  // *.test.js files it finds directly under netlify/functions/ into there
  // too (it doesn't apply the same test-file exclusion the production
  // bundler does), inlining their whole dependency tree. Never lint
  // generated output.
  globalIgnores(["dist", ".netlify"]),
  {
    files: ["**/*.{js,jsx}"],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    rules: {},
  },
]);

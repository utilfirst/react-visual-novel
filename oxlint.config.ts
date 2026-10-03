import { oxlintBaseConfig } from "@utilfirst/eslint-plugin/oxlint";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [oxlintBaseConfig],
  ignorePatterns: [
    ".local/**",
    ".pnpm-store/**",
    ".tmp/**",
    "demo/.next/**",
    "demo/node_modules/**",
    "demo/next-env.d.ts",
    "demo/out/**",
    "node_modules/**",
    "packages/react-visual-novel/contexts/internal/vendor/**",
    "packages/react-visual-novel/dist/**",
    "packages/react-visual-novel/node_modules/**",
    "pnpm-lock.yaml",
  ],
  plugins: ["nextjs", "node"],
});

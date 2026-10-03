import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["index.ts"],
  platform: "browser",
  format: "esm",
  target: "es2022",
  dts: true,
  clean: true,
  deps: { neverBundle: true },
  outExtensions: () => ({ js: ".js" }),
});

import type { Config } from "prettier";
import type { PluginOptions } from "prettier-plugin-tailwindcss";

const config: Config & PluginOptions = {
  proseWrap: "never",
  quoteProps: "consistent",
  plugins: [
    "@utilfirst/prettier-plugin",
    "prettier-plugin-organize-imports",
    "prettier-plugin-packagejson",
    "prettier-plugin-sh",
    "prettier-plugin-sort-json",
    "prettier-plugin-tailwindcss",
  ],
  tailwindFunctions: ["twMerge"],
};

export default config;

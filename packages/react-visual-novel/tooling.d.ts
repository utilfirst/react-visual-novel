declare module "tailwindcss-scrims" {
  import type { Config } from "tailwindcss";

  type ScrimOptions = {
    colors: Record<string, string[]>;
  };

  // NOTE: The plugin has no declarations. Its installed factory accepts
  // color stops and returns a Tailwind plugin.
  export default function createScrims(
    options: ScrimOptions,
  ): NonNullable<Config["plugins"]>[number];
}

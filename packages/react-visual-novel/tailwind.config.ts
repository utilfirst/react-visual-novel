import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./{commands,components,contexts}/**/*.{ts,tsx}"],
};

export default config;

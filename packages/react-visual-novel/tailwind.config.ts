import type { Config } from "tailwindcss";
import scrims from "tailwindcss-scrims";

const config: Config = {
  content: ["./{commands,components,contexts}/**/*.{ts,tsx}"],
  plugins: [
    scrims({
      colors: {
        default: ["rgba(0, 0, 0, 0.5)", "rgba(0, 0, 0, 0)"],
        light: ["rgba(255, 255, 255, 0.5)", "rgba(255, 255, 255, 0)"],
      },
    }),
  ],
};

export default config;

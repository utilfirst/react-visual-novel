import typography from "@tailwindcss/typography";
import daisyui from "daisyui";
import type { Config } from "tailwindcss";
import scrims from "tailwindcss-scrims";

type DaisyUIOptions = {
  styled: boolean;
  logs: boolean;
  themes: string[];
  darkTheme: string;
};

const config: Config & { daisyui: DaisyUIOptions } = {
  content: [
    "./{game,pages}/**/*.{ts,tsx}",
    "./node_modules/react-visual-novel/dist/index.js",
  ],
  theme: {
    extend: {
      fontFamily: { script: ["Comic Sans MS"] },
      keyframes: {
        "bounce-gentle": {
          "0%, 100%": { transform: "translateY(-5%)" },
          "50%": { transform: "translateY(0)" },
        },
      },
      animation: { "bounce-gentle": "bounce-gentle 1s infinite ease-in-out" },
    },
  },
  plugins: [
    typography,
    daisyui,
    scrims({
      colors: {
        default: ["rgba(0, 0, 0, 0.5)", "rgba(0, 0, 0, 0)"],
        light: ["rgba(255, 255, 255, 0.5)", "rgba(255, 255, 255, 0)"],
      },
    }),
  ],
  daisyui: {
    styled: true,
    logs: false,
    themes: ["lofi"],
    darkTheme: "lofi",
  },
};

export default config;

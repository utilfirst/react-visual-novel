import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./{game,pages}/**/*.{ts,tsx}",
    "./node_modules/react-visual-novel/dist/index.js",
  ],
  theme: {
    extend: {
      colors: {
        "surface": "#ffffff",
        "surface-hover": "#f2f2f2",
        "error": "#de1c8d",
        "error-content": "#ffffff",
      },
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
};

export default config;

/**
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: [
    './{game,pages}/**/*.{ts,tsx}',
    './node_modules/react-visual-novel/dist/index.js',
  ],
  theme: {
    extend: {
      fontFamily: {
        script: ['Comic Sans MS'],
      },
      keyframes: {
        'bounce-gentle': {
          '0%, 100%': {transform: 'translateY(-5%)'},
          '50%': {transform: 'translateY(0)'},
        },
      },
      animation: {
        'bounce-gentle': 'bounce-gentle 1s infinite ease-in-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('daisyui'),
    // @ts-ignore
    require('tailwindcss-scrims')({
      colors: {
        default: ['rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0)'],
        light: ['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)'],
      },
    }),
  ],
  daisyui: {
    styled: true,
    logs: false,
    themes: ['lofi'],
    darkTheme: 'lofi',
  },
}

const colors = require('tailwindcss/colors')

/**
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: [
    './{game,pages}/**/*.{ts,tsx}',
    '../packages/react-visual-novel/{commands,components,contexts}/**/*.{ts,tsx}',
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
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
  daisyui: {
    styled: true,
    logs: false,
    themes: ['lofi'],
    darkTheme: 'lofi',
  },
}

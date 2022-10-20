/**
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./{commands,components,contexts}/**/*.{ts,tsx}'],
  plugins: [
    // @ts-ignore
    require('tailwindcss-scrims')({
      colors: {
        default: ['rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0)'],
        light: ['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)'],
      },
    }),
  ],
}

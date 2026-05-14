// tailwind.config.js
const defaultTheme = require('tailwindcss/defaultTheme');
const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans], // Set Inter as the default sans-serif
      },
      // Example of adding custom theme colors (optional)
      colors: {
        'theme-primary': colors.sky, // Use the whole sky palette as 'theme-primary'
        'theme-secondary': colors.amber,
        'theme-neutral': colors.slate,
      }
    },
  },
  plugins: [require('@tailwindcss/typography'),],
}
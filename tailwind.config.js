/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'ropasans': ['"Ropa Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
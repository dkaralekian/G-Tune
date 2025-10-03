/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // This is the crucial line that enables class-based dark mode
  theme: {
    extend: {
      fontFamily: {
        'eurostile': ['Eurostile', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
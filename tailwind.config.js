// tailwind.config.js

const defaultTheme = require('tailwindcss/defaultTheme'); // <-- ADD THIS LINE

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // This makes 'Rosa Sans' available as the `font-rosa-sans` class
        'rosa-sans': ['Rosa Sans', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
}
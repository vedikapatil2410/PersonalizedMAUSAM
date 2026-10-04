/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#b9ddfd",
          300: "#7cc0fb",
          400: "#369ef6",
          500: "#0c82ea",
          600: "#0266c8",
          700: "#0352a1",
          800: "#074685",
          900: "#0b3c6f",
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // Custom navy palette — used throughout the site for the navy + black colour scheme
      colors: {
        navy: {
          50:  "#eef0f8",
          100: "#d5daf0",
          200: "#aab5e1",
          300: "#7a8fd0",
          400: "#4f6abf",
          500: "#3550ab",
          600: "#263f92",
          700: "#1c3177",  // primary action colour (buttons, links)
          800: "#152565",  // hover state
          900: "#0d1847",  // dark section backgrounds
          950: "#070e2b",  // near-black navy (navbar, footer, hero)
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.{ejs,html,js}",
    "./views/partials/**/*.{ejs,html,js}",
    "./node_modules/flowbite/**/*.js",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          "deep-space": "#0a0a0f",
          "neon-pink": "#ff3de8",
          "neon-blue": "#00fff7",
          "neon-purple": "#c42fff",
          "neon-cyan": "#00ffff",
          "neon-green": "#39ff14",
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
      },
      backgroundImage: {
        "custom-gradient": "linear-gradient(45deg, #443022, #10191e)",
      },
    },
  },
  plugins: [require("flowbite/plugin")({ charts: true })],
};

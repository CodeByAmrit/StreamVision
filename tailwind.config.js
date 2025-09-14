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
        dark: {
          100: "#1E293B", // slightly lighter panel background
          200: "#172033", // dark panel background
          300: "#0F172A", // near-black sections
          400: "#0A0F1C", // true dark background
        },
        accent: {
          blue: "#3B82F6",
          cyan: "#06B6D4",
          purple: "#8B5CF6",
        },
      },
      backgroundImage: {
        "custom-gradient": "linear-gradient(45deg, #050d1a, #0a192f, #0f213f)",
        "cyber-grid":
          "linear-gradient(to right, rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(59,130,246,0.05) 1px, transparent 1px)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      dropShadow: {
        neon: "0 0 10px rgba(56,189,248,0.7)",
        "neon-strong": "0 0 20px rgba(56,189,248,1)",
      },
    },
  },
  plugins: [require("flowbite/plugin")({ charts: true })],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#0e1116",
        panel: "#131823",
        gold: "#c9a64a",
        goldSoft: "#e3c36b",
        slate: "#a7b0be",
      },
    },
  },
  plugins: [],
};

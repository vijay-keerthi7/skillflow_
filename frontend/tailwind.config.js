/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // This scans your React files
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          bg: "var(--bg-primary)",
          accent: "var(--accent-primary)",
          secondary: "var(--accent-secondary)",
          vibrant: "var(--accent-vibrant)",
          text: "var(--text-main)",
        }
      }
    },
  },
  plugins: [],
}
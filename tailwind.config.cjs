/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        // 👈 Menambahkan bayangan solid hitam pekat khas Neo-Brutalism
        'neo': '4px 4px 0px 0px rgba(0, 0, 0, 1)', 
        'neo-md': '6px 6px 0px 0px rgba(0, 0, 0, 1)',
        'neo-lg': '8px 8px 0px 0px rgba(0, 0, 0, 1)',
      }
    },
  },
  plugins: [],
}
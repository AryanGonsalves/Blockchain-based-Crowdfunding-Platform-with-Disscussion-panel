/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        epilogue: ['Epilogue', 'sans-serif'],
      },
      boxShadow: {
        secondary: '10px 10px 20px rgba(2, 2, 2, 0.25)',
      },
      colors: {
        'bg': '#f1f2f6',
        'col-1': '#aeb8fe',
        'col-2': '#758bfd',
        'col-3': '#27187e',
        'accent': '#83c5be'
      }
    },
  },
  plugins: [],
}

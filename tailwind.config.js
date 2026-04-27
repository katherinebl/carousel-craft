/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0faf9',
          100: '#ccefec',
          200: '#99dfda',
          300: '#5cc9c1',
          400: '#2eb0a7',
          500: '#12978b',
          600: '#0E8C80',
          700: '#0a6b62',
          800: '#074d47',
          900: '#04302c',
        },
      },
    },
  },
  plugins: [],
}

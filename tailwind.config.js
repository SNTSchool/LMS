/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f3faf7',
          100: '#def7ec',
          200: '#bcf0d9',
          300: '#7ee2b8',
          400: '#38d39a',
          500: '#16a34a', // green primary
          600: '#15803d',
          700: '#166534',
          800: '#14532d',
          900: '#0f3e20',
        }
      }
    }
  },
  plugins: [],
}

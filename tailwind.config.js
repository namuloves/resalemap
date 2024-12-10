/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Univers', 'inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Univers', 'sans-serif'],
        body: ['Univers', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
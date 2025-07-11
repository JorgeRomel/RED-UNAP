/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        unap: {
          primary: '#DE443B',
          secondary: '#006BB4',
          dark: '#162325',
        }
      }
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        csu: {
          green: '#006A4E',
          'dark-forest': '#00523B',
          'light-gray': '#F4F6F5',
          white: '#FFFFFF',
          emerald: '#10B981',
          amber: '#F59E0B',
          crimson: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

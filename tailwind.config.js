/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Facility type colors
    'bg-indigo-50', 'text-indigo-700', 'border-indigo-200',
    'bg-teal-50', 'text-teal-700', 'border-teal-200',
    // Permit colors
    'bg-emerald-50', 'text-emerald-700', 'border-emerald-200',
    'bg-gray-50', 'text-gray-700', 'border-gray-200',
    'bg-amber-50', 'text-amber-700', 'border-amber-200',
    'bg-violet-50', 'text-violet-700', 'border-violet-200',
    'bg-red-50', 'text-red-700', 'border-red-200',
    'bg-blue-50', 'text-blue-700', 'border-blue-200',
    // Status badge variants
    'bg-emerald-100', 'text-emerald-700', 'border-emerald-200',
    'bg-amber-100', 'text-amber-700', 'border-amber-200',
    'bg-red-100', 'text-red-700', 'border-red-200',
    'bg-gray-100', 'text-gray-700', 'border-gray-200',
    // Progress colors
    'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-gray-400',
    // Pin colors
    'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-gray-400',
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
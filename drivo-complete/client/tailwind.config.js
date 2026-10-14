/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Manrope', 'system-ui', 'sans-serif'] },
      colors: {
        ink: '#0e0e10',
        accent: { DEFAULT: '#2f5bff', dark: '#1e42d6', soft: '#e8edff' },
      },
      boxShadow: { card: '0 1px 2px rgba(14,14,16,.06), 0 8px 24px -12px rgba(14,14,16,.18)' },
    },
  },
  plugins: [],
};

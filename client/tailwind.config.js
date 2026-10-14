/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Manrope', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        graphite: '#111318',
        charcoal: '#1B2028',
        titanium: '#C6CDD5',
        'ice-white': '#F5F7FA',
        electric: {
          DEFAULT: '#75CFFF',
          hover: '#95DBFF',
          dark: '#3CA5DE',
          muted: 'rgba(117, 207, 255, 0.12)',
          border: 'rgba(117, 207, 255, 0.28)',
        },
        ink: '#111318',
        accent: {
          DEFAULT: '#75CFFF',
          dark: '#3CA5DE',
          soft: 'rgba(117, 207, 255, 0.12)',
        },
        surface: {
          DEFAULT: '#1B2028',
          card: '#161A22',
          panel: 'rgba(27, 32, 40, 0.78)',
          elevated: '#212732',
          border: 'rgba(198, 205, 213, 0.12)',
        },
      },
      boxShadow: {
        card: '0 4px 24px -2px rgba(0, 0, 0, 0.4), 0 1px 3px 0 rgba(0, 0, 0, 0.3)',
        'card-hover': '0 12px 36px -4px rgba(0, 0, 0, 0.6), 0 0 20px -2px rgba(117, 207, 255, 0.15)',
        electric: '0 0 20px -2px rgba(117, 207, 255, 0.3)',
      },
    },
  },
  plugins: [],
};

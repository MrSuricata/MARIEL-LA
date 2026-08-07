/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './index.tsx', './App.tsx', './components/**/*.{ts,tsx}', './services/**/*.ts'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Merriweather', 'serif'],
        sans: ['Lato', 'sans-serif'],
      },
      colors: {
        // La paleta "leather" se resuelve por variables CSS para poder cambiar
        // el tema del sitio en runtime (ver :root y [data-theme=...] en index.css)
        leather: {
          50: 'rgb(var(--leather-50) / <alpha-value>)',
          100: 'rgb(var(--leather-100) / <alpha-value>)',
          200: 'rgb(var(--leather-200) / <alpha-value>)',
          300: 'rgb(var(--leather-300) / <alpha-value>)',
          400: 'rgb(var(--leather-400) / <alpha-value>)',
          500: 'rgb(var(--leather-500) / <alpha-value>)',
          600: 'rgb(var(--leather-600) / <alpha-value>)',
          700: 'rgb(var(--leather-700) / <alpha-value>)',
          800: 'rgb(var(--leather-800) / <alpha-value>)',
          900: 'rgb(var(--leather-900) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

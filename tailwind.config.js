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
        leather: {
          50: '#fbf7f0', // Cream background
          100: '#f5ead6',
          200: '#ebd4ac',
          300: '#dfba7e',
          400: '#d09b52',
          500: '#c68131', // Base leather
          600: '#ba6626', // Accent
          700: '#9b4d23', // Secondary
          800: '#7f3e23',
          900: '#67331e', // Primary Text
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

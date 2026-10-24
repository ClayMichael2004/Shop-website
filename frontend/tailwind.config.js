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
          dark: '#121212',
          surface: '#1c1c1e',
          accent: '#e67e22',
          gold: '#c59b27',
          warmBg: '#f8f6f0',
          sand: '#e8e2d5',
          border: '#e2ded5',
          muted: '#71717a'
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      screens: {
        'duo': {'raw': '(screen-spanning: single-fold-vertical), (min-width: 540px) and (max-width: 720px)'},
        'fold': {'raw': '(max-width: 320px)'}
      }
    },
  },
  plugins: [],
}

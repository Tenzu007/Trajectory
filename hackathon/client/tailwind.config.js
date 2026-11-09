/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dairy: {
          ivory: '#FAF8F2',
          cream: '#F5F1E8',
          beige: '#E8E2D6',
          blush: '#D9BEB0',
          sage: '#AFC4AD',
          forest: '#526B58',
          olive: '#354C3C',
          charcoal: '#353A35',
          gold: '#D4A373',
          terracotta: '#C97A63',
          amber: '#E09F3E',
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Merriweather', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}


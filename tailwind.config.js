/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fifa: {
          navy: '#0A0E1A',
          'dark-navy': '#111827',
          card: '#1C2333',
          gold: '#F5A623',
          red: '#E63946',
          blue: '#1D4ED8',
          border: '#2D3748',
          'text-secondary': '#94A3B8',
          green: '#10B981',
        },
      },
      backgroundImage: {
        'fifa-gradient': 'linear-gradient(135deg, #0A0E1A 0%, #0F172A 50%, #1A1040 100%)',
        'fifa-gold': 'linear-gradient(135deg, #F5A623, #EBB30D)',
        'fifa-gold-red': 'linear-gradient(135deg, #F5A623, #E63946)',
      },
    },
  },
  plugins: [],
}

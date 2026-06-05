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
          blue: '#1B3FB5',
          blueDark: '#0F2A8A',
          blueLight: '#3E5FD9',
          red: '#E63946',
          green: '#06B894',
          gold: '#FFB800',
          white: '#FFFFFF',
          cardBg: '#1A3399',
          cardBorder: '#3E5FD9',
          textPrimary: '#FFFFFF',
          textSecondary: '#B8C5F0',
        },
      },
      backgroundImage: {
        'fifa-gradient': 'linear-gradient(135deg, #0F2A8A 0%, #1B3FB5 50%, #0A0E1A 100%)',
        'fifa-gold': 'linear-gradient(135deg, #FFB800, #E6A000)',
        'fifa-gold-red': 'linear-gradient(135deg, #FFB800, #E63946)',
      },
    },
  },
  plugins: [],
}

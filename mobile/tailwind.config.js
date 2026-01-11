/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          green: '#10B981',
          dark: '#047857',
          light: 'rgba(16, 185, 129, 0.1)',
        },
        surface: {
          DEFAULT: '#1E293B',
          dark: '#0F172A',
          light: '#334155',
        },
        accent: {
          blue: '#3B82F6',
          purple: '#8B5CF6',
          red: '#EF4444',
          yellow: '#F59E0B',
        },
      },
    },
  },
  plugins: [],
};

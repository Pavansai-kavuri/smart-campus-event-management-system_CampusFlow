/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        emerald: {
          DEFAULT: 'var(--cf-emerald)',
          light: 'var(--cf-emerald-light)',
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#178855',
          600: '#136F45',
          700: '#0F5736',
        },
        champagne: {
          DEFAULT: 'var(--cf-champagne)',
          light: 'var(--cf-champagne-light)',
          gold: '#B08A01',
          soft: '#F1E7C5',
        },
        rose: {
          dusty: 'var(--cf-dusty-rose)',
          light: '#FCE5DB',
          mauve: 'var(--cf-mauve)',
          soft: '#FDF0F4',
        },
        surface: {
          bg: 'var(--cf-bg)',
          card: 'var(--cf-surface)',
          elevated: 'var(--cf-elevated)',
          border: 'var(--cf-border)',
        },
        content: {
          primary: 'var(--cf-text-primary)',
          secondary: 'var(--cf-text-secondary)',
        },
        semantic: {
          success: '#27D56E',
          warning: '#DAB739',
          error: '#E15B5B',
          info: '#5B8DEF',
        }
      },
      boxShadow: {
        'cf-card': '0 4px 20px -2px rgba(32, 37, 34, 0.06), 0 1px 4px -1px rgba(32, 37, 34, 0.04)',
        'cf-elevated': '0 12px 32px -4px rgba(32, 37, 34, 0.12), 0 4px 12px -2px rgba(197, 161, 104, 0.12)',
      }
    },
  },
  plugins: [],
};

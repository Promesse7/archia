import { designTokens } from './src/design/design-tokens.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: designTokens.colors.charcoal[950],
        surface: designTokens.colors.charcoal[900],
        surface2: designTokens.colors.charcoal[850],
        border: designTokens.colors.slate[700],
        muted: designTokens.colors.slate[500],
        accent: designTokens.colors.ochre[500],
        accentHover: designTokens.colors.ochre[400],
        clay: designTokens.colors.clay[500],
        bronze: designTokens.colors.bronze[500],
        ink: designTokens.colors.ink[800],
        inkLight: designTokens.colors.ink[700],
        // Keep legacy fragment colors for compatibility
        fragment: {
          rim: '#4caf50',
          body: '#2196f3',
          base: '#ff9800',
          unknown: '#71717a',
        }
      },
      fontFamily: designTokens.typography.fontFamily,
      fontSize: designTokens.typography.fontSize,
      spacing: designTokens.spacing,
      borderRadius: designTokens.radius,
      boxShadow: designTokens.shadows,
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  darkMode: "class",

  theme: {
    extend: {
      // Archaeological color palette
      colors: {
        // Primary surfaces - deep charcoal
        charcoal: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          850: "#161a23",
          900: "#11131a",
          950: "#0b0c10",
        },

        // Clay - pottery inspired
        clay: {
          50: "#fef7f0",
          100: "#fdeee1",
          200: "#f8dcc4",
          300: "#f3c5a0",
          400: "#e8a678",
          500: "#d08b6e",
          600: "#b86f56",
          700: "#a25e49",
          800: "#8a4f3d",
          900: "#724232",
        },

        // Bronze - archaeological findings
        bronze: {
          50: "#fdfaf0",
          100: "#f7f2e3",
          200: "#ede4c9",
          300: "#e0bd77",
          400: "#c9973e",
          500: "#aa7b27",
          600: "#926a22",
          700: "#7c5a1e",
          800: "#684c1a",
          900: "#563f16",
        },

        // Ochre - discovery highlights
        ochre: {
          50: "#fefdf8",
          100: "#fef9ec",
          200: "#fef1d3",
          300: "#f0c27a",
          400: "#e39a3a",
          500: "#cf7a11",
          600: "#b7650a",
          700: "#a35a08",
          800: "#8c4d07",
          900: "#754206",
        },

        // Zinc fallback for compatibility
        zinc: {
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b",
          700: "#3f3f46",
          800: "#27272a",
          900: "#18181b",
          950: "#09090b",
        },

        // Amber fallback for compatibility
        amber: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        }
      },

      // Typography system
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },

      fontSize: {
        xs: ["12px", { lineHeight: "1.5", fontWeight: "400" }],
        sm: ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        base: ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        lg: ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        xl: ["20px", { lineHeight: "1.5", fontWeight: "600" }],
        "2xl": ["24px", { lineHeight: "1.4", fontWeight: "600" }],
        "3xl": ["30px", { lineHeight: "1.3", fontWeight: "600" }],
        "4xl": ["36px", { lineHeight: "1.2", fontWeight: "700" }],
      },

      // Archaeological spacing rhythm
      spacing: {
        0: "0",
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "24px",
        6: "32px",
        7: "48px",
        8: "64px",
        10: "80px",
        12: "96px",
      },

      // Subtle border radius
      borderRadius: {
        none: "0",
        sm: "6px",
        base: "8px",
        md: "10px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        full: "9999px",
        card: "10px",
        surface: "16px",
        button: "8px",
      },

      // Soft depth shadows
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        base: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        md: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        lg: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        xl: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        soft: "0 8px 24px rgba(12, 14, 20, 0.35)",
        lift: "0 12px 32px rgba(12, 14, 20, 0.45)",
      },

      // Animation system
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "shimmer": "shimmer 3s ease-in-out infinite",
        "pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ping": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        ping: {
          "75%, 100%": {
            transform: "scale(2)",
            opacity: "0",
          },
        },
      },
    },
  },

  plugins: [],
};

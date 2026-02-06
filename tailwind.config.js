/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  darkMode: "class",

  theme: {
    extend: {
      colors: {
        // Charcoal palette – main surfaces
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

        // Slate palette – secondary surfaces
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },

        // Clay – primary accent
        clay: {
          300: "#e3b09a",
          400: "#d08b6e",
          500: "#b86f56",
          600: "#a25e49",
          700: "#8a4f3d",
        },

        // Bronze – highlight accent
        bronze: {
          300: "#e0bd77",
          400: "#c9973e",
          500: "#aa7b27",
          600: "#926a22",
          700: "#7c5a1e",
        },

        // Ochre – warning / discovery accent
        ochre: {
          300: "#f0c27a",
          400: "#e39a3a",
          500: "#cf7a11",
          600: "#b7650a",
          700: "#a35a08",
        },

        // Ink – text system
        ink: {
          500: "#6f7d95",
          600: "#8d99ad",
          700: "#aeb8c7",
          800: "#cdd4df",
          900: "#e6e9ef",
        },

        // Legacy fragment compatibility
        fragment: {
          rim: "#4caf50",
          body: "#2196f3",
          base: "#ff9800",
          unknown: "#71717a",
        }
      },

      // Typography – single family, clear hierarchy
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      },

      fontSize: {
        title: ["32px", { lineHeight: "1.2", fontWeight: "600" }],
        h1: ["24px", { lineHeight: "1.3", fontWeight: "600" }],
        h2: ["20px", { lineHeight: "1.4", fontWeight: "600" }],
        body: ["15px", { lineHeight: "1.6" }],
        label: ["13px", { lineHeight: "1.5" }]
      },

      // Archaeological rhythm 4/8/12/16/24/32/48
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "24px",
        6: "32px",
        7: "48px"
      },

      // Subtle radius
      borderRadius: {
        card: "10px",
        surface: "16px",
        button: "8px"
      },

      // Soft depth only
      boxShadow: {
        sm: "0 4px 12px rgba(0,0,0,0.18)",
        md: "0 8px 20px rgba(0,0,0,0.22)"
      },

      // Motion system
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "shimmer": "shimmer 3s ease-in-out infinite",
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

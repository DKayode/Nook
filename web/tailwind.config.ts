import type { Config } from "tailwindcss";

// Ultra-clean monochrome system. One theme only — pure black bg + white ink.
// Cards are flat with a 1px #262626/#333 border instead of drop shadows.
// `accent` is reserved for chart data and balance highlights (emerald #10B981);
// nothing else should reach for it.

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        "border-2": "rgb(var(--border-2) / <alpha-value>)",

        mono: {
          DEFAULT: "#000000",
          50: "#ffffff",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#333333",
          800: "#262626",
          900: "#121212",
          950: "#000000",
        },

        // Backwards-compatibility aliases — old class names still resolve onto the mono ramp.
        forest: {
          DEFAULT: "#000000",
          50: "#f5f5f5", 100: "#e5e5e5", 200: "#d4d4d4", 300: "#a3a3a3",
          400: "#737373", 500: "#525252", 600: "#333333", 700: "#262626",
          800: "#121212", 900: "#000000", 950: "#000000",
        },
        sand: {
          DEFAULT: "#ffffff",
          50: "#ffffff", 100: "#f5f5f5", 200: "#e5e5e5", 300: "#d4d4d4",
          400: "#a3a3a3", 500: "#737373",
        },
        gold: {
          DEFAULT: "#ffffff",
          50: "#f5f5f5", 100: "#e5e5e5", 200: "#d4d4d4", 300: "#a3a3a3",
          400: "#ffffff", 500: "#ffffff", 600: "#ffffff",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-comfortaa)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        // App-wide geometric standard: 16px (lg/xl/2xl) for cards, 20px for hero containers.
        "2xl": "16px",
        "3xl": "20px",
      },
      animation: {
        "fade-in": "fadeIn 200ms ease-out both",
        "slide-up": "slideUp 240ms cubic-bezier(.2,.8,.2,1) both",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
} satisfies Config;

import type { Config } from "tailwindcss";

// Design tokens — monochrome (Black / White)
//
// Semantic tokens (bg / surface / ink / muted / accent / border) are CSS variables defined in
// globals.css and flipped by the `.dark` class on <html>. The `mono` scale is the raw
// black→white ramp components can reach into when an explicit shade is needed.
// Brand aliases (forest / sand / gold) are preserved and mapped onto the mono ramp so the
// rest of the app keeps working without a sweeping rename.

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Semantic — auto-flip via CSS variables
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",

        mono: {
          DEFAULT: "#000000",
          50: "#ffffff",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#262626",
          800: "#171717",
          900: "#0a0a0a",
          950: "#000000",
        },

        // Brand aliases mapped onto the monochrome ramp so existing class names still resolve.
        forest: {
          DEFAULT: "#0a0a0a",
          50: "#f5f5f5",
          100: "#e5e5e5",
          200: "#d4d4d4",
          300: "#a3a3a3",
          400: "#737373",
          500: "#525252",
          600: "#262626",
          700: "#171717",
          800: "#0a0a0a",
          900: "#000000",
          950: "#000000",
        },
        sand: {
          DEFAULT: "#ffffff",
          50: "#ffffff",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
        },
        gold: {
          DEFAULT: "#0a0a0a",
          50: "#f5f5f5",
          100: "#e5e5e5",
          200: "#d4d4d4",
          300: "#a3a3a3",
          400: "#262626",
          500: "#171717",
          600: "#0a0a0a",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-comfortaa)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgba(0,0,0,0.04), 0 4px 16px -2px rgba(0,0,0,0.08)",
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

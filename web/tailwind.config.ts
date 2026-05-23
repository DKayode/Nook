import type { Config } from "tailwindcss";

// Design tokens
//   Forest Green #1a2b2c   primary surface (dark)
//   Sand Beige   #fcfbf7   primary surface (light)
//   Gold         #c5a880   accent
//
// Semantic tokens (bg / surface / ink / muted / accent) are CSS variables defined in
// globals.css and flipped by the `.dark` class on <html>. Brand scales (forest / sand /
// gold) are also available when a component wants an explicit shade.

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

        // Brand scales — explicit
        forest: {
          DEFAULT: "#1a2b2c",
          50: "#f1f4f4",
          100: "#dde4e4",
          200: "#b5c3c4",
          300: "#869b9d",
          400: "#5e7a7c",
          500: "#3e5c5e",
          600: "#2c4546",
          700: "#1f3536",
          800: "#1a2b2c",
          900: "#0e1a1b",
          950: "#070d0d",
        },
        sand: {
          DEFAULT: "#fcfbf7",
          50: "#fcfbf7",
          100: "#f5f3e9",
          200: "#ebe7d2",
          300: "#dcd5b5",
          400: "#c9be93",
          500: "#b7a978",
        },
        gold: {
          DEFAULT: "#c5a880",
          50: "#fbf6ec",
          100: "#f4e9cf",
          200: "#e8d2a3",
          300: "#dabb78",
          400: "#c5a880",
          500: "#b08f60",
          600: "#946f4d",
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

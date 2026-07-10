import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          // Latin UI face…
          "var(--font-inter)",
          // …then the Devanagari face for Hindi glyphs (per-glyph fallback).
          "var(--font-noto-devanagari)",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "sans-serif",
        ],
      },
      colors: {
        // Semantic colors from the design system
        healthy: {
          DEFAULT: "#16a34a",
          bg: "#f0fdf4",
          border: "#bbf7d0",
          text: "#15803d",
        },
        warning: {
          DEFAULT: "#f59e0b",
          bg: "#fffbeb",
          border: "#fde68a",
          text: "#b45309",
        },
        critical: {
          DEFAULT: "#dc2626",
          bg: "#fef2f2",
          border: "#fecaca",
          text: "#b91c1c",
        },
        info: {
          DEFAULT: "#2563eb",
          bg: "#eff6ff",
          border: "#bfdbfe",
          text: "#1d4ed8",
        },
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        ink: {
          DEFAULT: "#0f172a",
          soft: "#334155",
          muted: "#64748b",
          faint: "#94a3b8",
        },
        surface: {
          DEFAULT: "#ffffff",
          soft: "#f8fafc",
          sunken: "#f1f5f9",
        },
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(15,23,42,0.04), 0 1px 3px 0 rgba(15,23,42,0.06)",
        "card-hover":
          "0 4px 12px -2px rgba(15,23,42,0.08), 0 2px 6px -2px rgba(15,23,42,0.06)",
        pop: "0 10px 30px -8px rgba(15,23,42,0.18)",
      },
    },
  },
  plugins: [],
};

export default config;

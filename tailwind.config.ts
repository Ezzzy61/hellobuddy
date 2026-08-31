import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        cream: {
          50: "#fdfcfa",
          100: "#faf7f2",
          200: "#f3ecdf",
          300: "#e9dfc9",
        },
        clay: {
          50: "#fbf5f1",
          100: "#f4e7de",
          200: "#e8cdba",
          300: "#d9ab8d",
          400: "#c7885f",
          500: "#b06a3f",
          600: "#935431",
          700: "#75422a",
          800: "#5c3626",
          900: "#4a2d21",
        },
        sage: {
          50: "#f3f6f2",
          100: "#e3ebe0",
          200: "#c7d7c1",
          300: "#a3bd9a",
          400: "#7d9f72",
          500: "#5f8253",
          600: "#4a6841",
          700: "#3c5335",
          800: "#31432c",
          900: "#293825",
        },
        ink: {
          50: "#f6f6f7",
          100: "#e2e3e6",
          200: "#c5c7cd",
          300: "#9fa2ac",
          400: "#787c89",
          500: "#5c606d",
          600: "#484b56",
          700: "#3a3c45",
          800: "#26272d",
          900: "#17181c",
          950: "#0c0d0f",
        },
      },
      boxShadow: {
        soft: "0 2px 20px -4px rgba(23, 24, 28, 0.08)",
        floating: "0 12px 40px -8px rgba(23, 24, 28, 0.18)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out",
        "pulse-soft": "pulse-soft 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

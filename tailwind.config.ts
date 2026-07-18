import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0E0E10",
        muted: "#6B7280",
        hairline: "#E7E4DE",
        canvas: "#FFFFFF",
        surface: "#FAFAF8",
        accent: {
          DEFAULT: "#B49A6C",
          soft: "#EFE8D9",
          dark: "#8C6F44",
        },
      },
      fontFamily: {
        sans: ["Inter Variable", "Inter", "system-ui", "sans-serif"],
        display: ["Inter Variable", "Inter", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        pill: "999px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(14,14,16,0.04), 0 8px 24px -12px rgba(14,14,16,0.10)",
        card: "0 1px 2px rgba(14,14,16,0.03), 0 12px 32px -16px rgba(14,14,16,0.12)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateY(0%)" },
          "100%": { transform: "translateY(-50%)" },
        },
        "marquee-x": {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        "marquee-reverse": "marquee 40s linear infinite reverse",
        "marquee-x": "marquee-x 40s linear infinite",
        shimmer: "shimmer 1.6s infinite linear",
        "fade-in": "fade-in 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;

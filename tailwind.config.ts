import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: { center: true, padding: "1rem" },
    extend: {
      colors: {
        // shadcn aliases (mapped to Hako tokens via globals.css)
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        // direct Hako tokens
        bone: "hsl(var(--bone) / <alpha-value>)",
        rice: "hsl(var(--rice) / <alpha-value>)",
        paper: "hsl(var(--paper) / <alpha-value>)",
        sumi: "hsl(var(--sumi) / <alpha-value>)",
        moss: "hsl(var(--moss) / <alpha-value>)",
        "moss-2": "hsl(var(--moss-2) / <alpha-value>)",
        rule: "hsl(var(--rule) / <alpha-value>)",
        vermillion: {
          DEFAULT: "hsl(var(--vermillion) / <alpha-value>)",
          deep: "hsl(var(--vermillion-deep) / <alpha-value>)",
        },
        hazard: "hsl(var(--hazard) / <alpha-value>)",
        seal: "hsl(var(--seal) / <alpha-value>)",
      },
      fontFamily: {
        mincho: ["var(--font-mincho)", "serif"],
        jakarta: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        cormorant: ["var(--font-cormorant)", "serif"],
      },
      borderRadius: {
        lg: "0px",
        md: "0px",
        sm: "0px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;

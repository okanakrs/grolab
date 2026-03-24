import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        accent: "var(--accent)",
        "secondary-accent": "var(--secondary-accent)",
      },
      boxShadow: {
        soft: "0 16px 45px -24px rgba(0,0,0,0.9)",
      },
    },
  },
  plugins: [],
} satisfies Config;

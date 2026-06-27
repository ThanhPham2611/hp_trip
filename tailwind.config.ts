import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F7FAF8",
        surface: "#FFFFFF",
        "surface-low": "#F1F4F3",
        "surface-container": "#EBEFED",
        ink: "#181C1C",
        mist: "#3E4947",
        border: "#BDC9C6",
        teal: "#005C55",
        "teal-container": "#0F766E",
        "teal-fixed": "#9CF2E8",
        harbor: "#2563EB",
        coral: "#E76F51",
        sunflower: "#F4B942"
      },
      fontFamily: {
        display: ["Source Sans 3", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["Source Sans 3", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      boxShadow: {
        soft: "0 4px 12px rgba(23, 32, 38, 0.02)",
        hover: "0 4px 12px rgba(23, 32, 38, 0.05)",
        panel: "0 18px 60px rgba(23, 32, 38, 0.10)",
        lift: "0 8px 22px rgba(15, 118, 110, 0.12)"
      }
    }
  },
  plugins: []
} satisfies Config;

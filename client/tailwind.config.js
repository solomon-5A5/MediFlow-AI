/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Added for the new design
        display: ["Inter", "sans-serif"],
        "headline": ["Space Grotesk", "sans-serif"],
        "body": ["Inter", "sans-serif"],
      },
      colors: {
        "surface-bright": "#f9f9fb",
        "on-secondary": "#ffffff",
        "on-primary": "#ffffff",
        "inverse-on-surface": "#f0f0f2",
        "primary-container": "#5747e6",
        "on-surface": "#1a1c1d",
        "surface-variant": "#e2e2e4",
        "on-surface-variant": "#474555",
        "tertiary": "#00563a",
        "error": "#ba1a1a",
        "surface-container-high": "#e8e8ea",
        "tertiary-container": "#00714d",
        "on-tertiary-container": "#6bf8bb",
        // --- Added for Stitch Design ---
        "background-light": "#f8fafc", /* slate-50 */
        "background-dark": "#0f172a", /* slate-900 */

        // --- Existing Shadcn/UI Colors (Modified Primary) ---
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          // I updated this to the specific "Stitch Purple" so the design pops!
          DEFAULT: "#5747e6",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        'scan': 'scan 3s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        }
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
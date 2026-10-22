import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
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
        // SIAKAD Brand Tokens:
        siakad: {
          primary: "#0F766E",
          light: "#14B8A6",
          soft: "#F0FDFA",
          surface: "#FFFFFF",
          bg: "#F8FAFC",
          text: "#0F172A",
          muted: "#64748B",
          border: "#E2E8F0",
        },
        navy: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
        },
        status: {
          hadir: {
            DEFAULT: "hsl(var(--status-hadir))",
            foreground: "hsl(var(--status-hadir-fg))",
            bg: "hsl(var(--status-hadir-bg))",
            border: "hsl(var(--status-hadir-border))",
          },
          terlambat: {
            DEFAULT: "hsl(var(--status-terlambat))",
            foreground: "hsl(var(--status-terlambat-fg))",
            bg: "hsl(var(--status-terlambat-bg))",
            border: "hsl(var(--status-terlambat-border))",
          },
          izin: {
            DEFAULT: "hsl(var(--status-izin))",
            foreground: "hsl(var(--status-izin-fg))",
            bg: "hsl(var(--status-izin-bg))",
            border: "hsl(var(--status-izin-border))",
          },
          sakit: {
            DEFAULT: "hsl(var(--status-sakit))",
            foreground: "hsl(var(--status-sakit-fg))",
            bg: "hsl(var(--status-sakit-bg))",
            border: "hsl(var(--status-sakit-border))",
          },
          alpa: {
            DEFAULT: "hsl(var(--status-alpa))",
            foreground: "hsl(var(--status-alpa-fg))",
            bg: "hsl(var(--status-alpa-bg))",
            border: "hsl(var(--status-alpa-border))",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(15, 118, 110, 0.05), 0 1px 2px -1px rgba(15, 118, 110, 0.05)",
        card: "0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)",
        elevated: "0 10px 15px -3px rgba(15, 118, 110, 0.1), 0 4px 6px -4px rgba(15, 118, 110, 0.05)",
        "teal-btn": "0 8px 18px -4px rgba(15, 118, 110, 0.42)",
        "card-soft": "0 2px 12px -2px rgba(15, 23, 42, 0.05)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Poppins", "system-ui", "sans-serif"],
        poppins: ["var(--font-sans)", "Poppins", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        pulseSlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-slow": "pulseSlow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;

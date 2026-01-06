import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        things: {
          blue: "hsl(var(--things-blue))",
          yellow: "hsl(var(--things-yellow))",
          green: "hsl(var(--things-green))",
          purple: "hsl(var(--things-purple))",
          red: "hsl(var(--things-red))",
          orange: "hsl(var(--things-orange))",
          gray: "hsl(var(--things-gray))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "checkmark-pop": {
          "0%": { transform: "scale(0.9)" },
          "40%": { transform: "scale(1.15)" },
          "70%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        },
        "task-row-bounce": {
          "0%": { transform: "scale(0.98)" },
          "40%": { transform: "scale(1.01)" },
          "70%": { transform: "scale(0.995)" },
          "100%": { transform: "scale(1)" },
        },
        "checkmark-draw": {
          "0%": { strokeDasharray: "0 100" },
          "100%": { strokeDasharray: "100 0" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.05)", opacity: "0.7" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "success-ripple": {
          "0%": { transform: "scale(0)", opacity: "0.6" },
          "100%": { transform: "scale(2.5)", opacity: "0" },
        },
        "success-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--things-green) / 0)" },
          "50%": { boxShadow: "0 0 16px 6px hsl(var(--things-green) / 0.5)" },
        },
        "strikethrough": {
          "0%": { width: "0%", left: "0" },
          "100%": { width: "100%", left: "0" },
        },
        "task-complete-fade": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0.4", transform: "translateY(8px)" },
        },
        "confetti-burst": {
          "0%": { 
            opacity: "1",
            transform: "translate(-50%, -50%) scale(1)"
          },
          "100%": { 
            opacity: "0",
            transform: "translate(var(--confetti-x), var(--confetti-y)) scale(0)"
          },
        },
        "fab-idle": {
          "0%, 100%": { 
            transform: "translateY(0)" 
          },
          "50%": { 
            transform: "translateY(-4px)" 
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.3s ease-out",
        "slide-in-left": "slide-in-left 0.25s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "checkmark-pop": "checkmark-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "task-row-bounce": "task-row-bounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "checkmark-draw": "checkmark-draw 0.3s ease-out forwards",
        "pulse-ring": "pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "success-ripple": "success-ripple 0.5s ease-out forwards",
        "success-glow": "success-glow 0.8s ease-out",
        "strikethrough": "strikethrough 0.5s ease-out forwards",
        "task-complete-fade": "task-complete-fade 0.5s ease-out forwards",
        "confetti-burst": "confetti-burst 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
        "fab-idle": "fab-idle 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

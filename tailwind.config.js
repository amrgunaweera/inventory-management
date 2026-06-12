/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'xs': ['10px', '14px'],
        'sm': ['11px', '16px'],
        'base': ['12px', '18px'],
        'lg': ['14px', '20px'],
        'xl': ['16px', '24px'],
        '2xl': ['18px', '28px'],
        '3xl': ['20px', '30px'],
        '4xl': ['24px', '36px'],
        '5xl': ['32px', '48px'],
      },
      colors: {
        background: "#ffffff",
        foreground: "#0f172a",
        card: {
          DEFAULT: "#ffffff",
          foreground: "#0f172a",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#0f172a",
        },
        primary: {
          DEFAULT: "#6366f1",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#f1f5f9",
          foreground: "#0f172a",
        },
        muted: {
          DEFAULT: "#f8fafc",
          foreground: "#64748b",
        },
        accent: {
          DEFAULT: "#f1f5f9",
          foreground: "#0f172a",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        border: "#e2e8f0",
        input: "#e2e8f0",
        ring: "#6366f1",
        sidebar: {
          DEFAULT: '#0f172a',
          hover: '#1e293b',
          active: '#1e293b',
          border: '#1e293b',
        },
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
      boxShadow: {
        'framer': '0px 8px 32px rgba(0, 0, 0, 0.08), 0px 4px 16px rgba(0, 0, 0, 0.04), 0px 1px 4px rgba(0, 0, 0, 0.02)',
        'framer-sm': '0px 4px 16px rgba(0, 0, 0, 0.06), 0px 1px 4px rgba(0, 0, 0, 0.02)',
        'framer-hover': '0px 12px 48px rgba(0, 0, 0, 0.12), 0px 4px 16px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'sm': '0.125rem',
        DEFAULT: '0.125rem',
        'md': '0.25rem',
        'lg': '0.25rem',
        'xl': '0.375rem',
        '2xl': '0.375rem',
        '3xl': '0.5rem',
        '4xl': '0.5rem',
      }
    },
  },
  plugins: [],
}

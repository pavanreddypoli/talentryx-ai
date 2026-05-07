import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./node_modules/@shadcn/ui/dist/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#4F46E5",
          light: "#6366F1",
          dark: "#4338CA",
          navy:          '#0a0e27',
          'navy-mid':    '#1e1b4b',
          'navy-deep':   '#312e81',
          canvas:        '#fafaf7',
          amber:         '#f59e0b',
          'amber-light': '#fcd34d',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up':    'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
        'float':      'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer':    'shimmer 1.5s linear infinite',
      },
      boxShadow: {
        'cta-sm':    '0 4px 24px rgba(251,191,36,0.35)',
        'cta':       '0 8px 32px rgba(251,191,36,0.30)',
        'cta-lg':    '0 8px 32px rgba(251,191,36,0.40)',
        'cta-hover': '0 12px 40px rgba(251,191,36,0.50)',
        'logo':      '0 0 20px rgba(251,191,36,0.40)',
        'card':      '0 25px 50px rgba(0,0,0,0.40)',
      },
    },
  },
  plugins: [],
};

export default config;

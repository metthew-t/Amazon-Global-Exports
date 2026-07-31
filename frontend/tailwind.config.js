/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sky: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        brand: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        ink: {
          DEFAULT: '#111827',
          muted:   '#6B7280',
          faint:   '#9CA3AF',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          page:    '#F5F5F0',
          input:   '#F9FAFB',
          border:  '#E5E7EB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-sky': 'pulseSky 2s ease-in-out infinite',
        'pulse-brand': 'pulseBrand 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideUp: { from: { opacity: 0, transform: 'translateY(24px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseSky: { '0%,100%': { boxShadow: '0 0 0 0 rgba(14,165,233,0.4)' }, '50%': { boxShadow: '0 0 0 12px rgba(14,165,233,0)' } },
        pulseBrand: { '0%,100%': { boxShadow: '0 0 0 0 rgba(5,150,105,0.4)' }, '50%': { boxShadow: '0 0 0 12px rgba(5,150,105,0)' } },
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        storeflow: {
          blue: '#059669',
          orange: '#F58220',
          support: '#0D9488',
          navy: '#1F2937',
          deep: '#111827',
          teal: '#059669',
        },
        primary: {
          DEFAULT: '#059669',
          hover: '#047857',
          light: '#ECFDF5',
        },
        emerald: {
          DEFAULT: '#059669',
          hover: '#047857',
          light: '#ECFDF5',
        },
        charcoal: {
          DEFAULT: '#1F2937',
          dark: '#111827',
          light: '#374151',
        },
        amber: {
          DEFAULT: '#D97706',
          light: '#FFFBEB',
        },
        bg: {
          page: '#F8FAFC',
          card: '#FFFFFF',
        },
        text: {
          main: '#111827',
          secondary: '#4B5563',
          muted: '#9CA3AF',
        },
        border: {
          DEFAULT: '#E5E7EB',
          light: '#F3F4F6',
        },
        status: {
          success: '#059669',
          warning: '#D97706',
          error: '#DC2626',
          reviewed: '#2563EB',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(17, 24, 39, 0.06), 0 1px 2px -1px rgba(17, 24, 39, 0.04)',
        modal: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}

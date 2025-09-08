/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}', './index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Noto Sans Malayalam',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        malayalam: ['Noto Sans Malayalam', 'sans-serif'],
        heading: ['Manjari', 'Noto Sans Malayalam', 'sans-serif'],
      },
      fontSize: {
        // Minimum 16px for accessibility with Malayalam line-height 1.6
        sm: ['14px', '22px'],
        base: ['16px', '26px'], // 16px * 1.6 = 25.6px ≈ 26px
        lg: ['18px', '29px'], // 18px * 1.6 = 28.8px ≈ 29px
        xl: ['20px', '32px'], // 20px * 1.6 = 32px
        '2xl': ['24px', '38px'], // 24px * 1.6 = 38.4px ≈ 38px
        '3xl': ['30px', '48px'], // 30px * 1.6 = 48px
        // Font size options for accessibility
        'font-small': ['16px', '26px'],
        'font-medium': ['18px', '29px'],
        'font-large': ['20px', '32px'],
      },
      spacing: {
        // 44px minimum touch target size
        touch: '44px',
        'thumb-zone': '72px',
      },
      colors: {
        // High contrast colors for accessibility
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
      },
      screens: {
        xs: '375px',
        thumb: '480px', // Thumb-zone optimized breakpoint
      },
    },
  },
  plugins: [
    // Custom accessibility utilities
    function ({ addUtilities }) {
      const accessibilityUtilities = {
        '.touch-target': {
          minHeight: '44px',
          minWidth: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        '.thumb-zone': {
          minHeight: '72px',
          minWidth: '72px',
        },
        '.focus-visible': {
          '&:focus-visible': {
            outline: '2px solid #3b82f6',
            outlineOffset: '2px',
          },
        },
        '.sr-only': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0',
        },
        '.high-contrast': {
          filter: 'contrast(1.2)',
        },
        '.font-malayalam': {
          fontFamily: "'Noto Sans Malayalam', sans-serif",
          lineHeight: '1.6',
        },
        '.font-heading': {
          fontFamily: "'Manjari', 'Noto Sans Malayalam', sans-serif",
          fontWeight: '600',
        },
      };
      addUtilities(accessibilityUtilities);
    },
  ],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}', './index.html'],
  darkMode: 'class',
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
        inter: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        poppins: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
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
          100: '#e0f2fe',
          200: '#bae6fd',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
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
        // Custom accent colors for 40+ users
        accent: {
          green: '#5A8866',
          'green-light': '#6B9B73',
          'green-dark': '#4A7356',
          blue: '#1A3A6B',
          'blue-light': '#2B4A7B',
          'blue-dark': '#0F2A5B',
          gold: '#C49E4B',
          'gold-light': '#D4AE5B',
          'gold-dark': '#B48E3B',
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
            outline: '3px solid #3b82f6',
            outlineOffset: '2px',
            borderRadius: '4px',
          },
        },
        '.focus-enhanced': {
          '&:focus-visible': {
            outline: '3px solid #3b82f6',
            outlineOffset: '3px',
            boxShadow: '0 0 0 6px rgba(59, 130, 246, 0.2)',
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
        '.not-sr-only': {
          position: 'static',
          width: 'auto',
          height: 'auto',
          padding: 'inherit',
          margin: 'inherit',
          overflow: 'visible',
          clip: 'auto',
          whiteSpace: 'normal',
        },
        '.high-contrast': {
          filter: 'contrast(1.5) brightness(1.1)',
        },
        '.reduce-motion': {
          '& *': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
            scrollBehavior: 'auto !important',
          },
        },
        '.font-malayalam': {
          fontFamily: "'Noto Sans Malayalam', sans-serif",
          lineHeight: '1.6',
        },
        '.font-heading': {
          fontFamily: "'Manjari', 'Noto Sans Malayalam', sans-serif",
          fontWeight: '600',
        },
        '.skip-link': {
          position: 'absolute',
          top: '-40px',
          left: '6px',
          background: '#3b82f6',
          color: 'white',
          padding: '8px 16px',
          textDecoration: 'none',
          borderRadius: '4px',
          fontWeight: '600',
          zIndex: '1000',
          transition: 'top 0.3s',
          '&:focus': {
            top: '6px',
          },
        },
        '.keyboard-focus': {
          '&:focus': {
            outline: '2px solid transparent',
            boxShadow: '0 0 0 2px #3b82f6',
          },
        },
        '.keyboard-focus-button': {
          '&:focus': {
            boxShadow: '0 0 0 3px #3b82f6',
          },
        },
        '.keyboard-focus-input': {
          '&:focus': {
            boxShadow: '0 0 0 2px #3b82f6',
            borderColor: '#3b82f6',
          },
        },
      };
      addUtilities(accessibilityUtilities);
    },
  ],
};

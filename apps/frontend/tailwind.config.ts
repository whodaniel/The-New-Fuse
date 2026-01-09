/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    screens: {
      xs: '320px', // Mobile Small
      sm: '375px', // Mobile Medium
      md: '768px', // Tablet
      lg: '1024px', // Laptop
      xl: '1440px', // Desktop
      '2xl': '1920px', // Large Desktop
    },
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        heading: ['"Outfit"', 'sans-serif'],
      },
      spacing: {
        // Using numeric naming to avoid conflicts with Tailwind's built-in size tokens (sm, md, lg, xl)
        // which are used for max-w-*, width, and other utilities
        '1': '4px',
        '2': '8px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
      },
      fontSize: {
        // World-class typography scale
        xs: ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
        sm: ['14px', { lineHeight: '20px', letterSpacing: '0em', fontWeight: '500' }],
        base: ['16px', { lineHeight: '24px', letterSpacing: '0em', fontWeight: '400' }],
        lg: ['18px', { lineHeight: '28px', letterSpacing: '-0.01em', fontWeight: '500' }],
        xl: ['20px', { lineHeight: '28px', letterSpacing: '-0.01em', fontWeight: '600' }],
        '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '700' }],
        '3xl': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }],
        '4xl': ['36px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '800' }],
        '5xl': ['48px', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '800' }],
        '6xl': ['60px', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '900' }],
        '7xl': ['72px', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '900' }],
        '8xl': ['96px', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '900' }],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        surface: {
          DEFAULT: 'hsl(var(--surface))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
        },
      },
      borderRadius: {
        lg: '1rem',
        xl: '1.5rem',
        '2xl': '2rem',
      },
      minHeight: {
        touch: '44px',
        input: '48px',
        button: '44px',
      },
      minWidth: {
        touch: '44px',
        button: '120px',
      },
      boxShadow: {
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in-up': 'slideInUp 0.5s ease-out',
        'slide-in-down': 'slideInDown 0.5s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        glow: 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

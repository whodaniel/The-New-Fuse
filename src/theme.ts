// Migrated from Chakra UI theme to plain TypeScript configuration
// Use this with Tailwind CSS or your preferred styling solution

export const themeConfig = {
  initialColorMode: 'light' as const,
  useSystemColorMode: false,
};

export const colors = {
  brand: {
    50: '#E5F2FF',
    100: '#B8D9FF',
    200: '#8ABFFF',
    300: '#5CA6FF',
    400: '#2E8CFF',
    500: '#0073FF',
    600: '#005ACC',
    700: '#004299',
    800: '#002966',
    900: '#001133',
  },
};

// Button styles - can be used with className or CSS-in-JS
export const buttonStyles = {
  solid: {
    background: colors.brand[500],
    color: 'white',
    hover: {
      background: colors.brand[600],
    },
  },
};

const theme = {
  config: themeConfig,
  colors,
  components: {
    button: buttonStyles,
  },
};

export default theme;

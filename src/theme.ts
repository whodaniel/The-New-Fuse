import { defineStyle, defineStyleConfig, theme as baseTheme } from '@chakra-ui/react';

const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const colors = {
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

const Button = defineStyleConfig({
  variants: {
    solid: defineStyle({
      bg: 'brand.500',
      color: 'white',
      _hover: {
        bg: 'brand.600',
      },
    }),
  },
});

const theme = {
  ...baseTheme,
  config,
  colors,
  components: {
    Button,
  },
};

export default theme;
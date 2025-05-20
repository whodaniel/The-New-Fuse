import { defineStyleConfig, extendTheme } from '@chakra-ui/react';

const Button = defineStyleConfig({
  baseStyle: {
    fontWeight: 'semibold',
    borderRadius: 'lg',
  },
  variants: {
    solid: {
      bg: 'brand.500',
      color: 'white',
      _hover: {
        bg: 'brand.600',
      },
    },
    ghost: {
      color: 'gray.600',
      _hover: {
        bg: 'gray.100',
      },
    },
    link: {
      color: 'brand.500',
      _hover: {
        textDecoration: 'underline',
      },
    },
  },
  defaultProps: {
    variant: 'solid',
  },
});

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: true,
  },
  colors: {
    brand: {
      50: '#E6F6FF',
      100: '#BAE3FF',
      200: '#7CC4FA',
      300: '#47A3F3',
      400: '#2186EB',
      500: '#0967D2',
      600: '#0552B5',
      700: '#03449E',
      800: '#01337D',
      900: '#002159',
    },
  },
  components: {
    Button,
    Stack: {
      defaultProps: {
        spacing: 4,
      },
    },
    VStack: {
      defaultProps: {
        spacing: 4,
      },
    },
    HStack: {
      defaultProps: {
        spacing: 4,
      },
    },
    SimpleGrid: {
      defaultProps: {
        spacing: 4,
      },
    },
  },
});

export default theme;

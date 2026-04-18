import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { AppLayout } from './components/AppLayout.js';
import { store } from './store/store.js';

// Custom theme for the desktop app
const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      50: '#E6F3FF',
      100: '#CCE7FF',
      200: '#99CFFF',
      300: '#66B7FF',
      400: '#339FFF',
      500: '#0087FF',
      600: '#006BCC',
      700: '#004F99',
      800: '#003366',
      900: '#001733',
    },
  },
  styles: {
    global: {
      body: {
        bg: 'transparent',
        color: 'white',
      },
    },
  },
  components: {
    Card: {
      baseStyle: {
        container: {
          bg: 'whiteAlpha.100',
          backdropFilter: 'blur(10px)',
          border: '1px solid',
          borderColor: 'whiteAlpha.200',
        },
      },
    },
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
            transform: 'translateY(-1px)',
            boxShadow: 'lg',
          },
          _active: {
            bg: 'brand.700',
            transform: 'translateY(0)',
          },
          transition: 'all 0.2s',
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ChakraProvider theme={theme}>
        <AppLayout />
      </ChakraProvider>
    </Provider>
  </React.StrictMode>
);

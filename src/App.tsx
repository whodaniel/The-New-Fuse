import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes/index.tsx';
import theme from './theme.js';

const router = createBrowserRouter(routes);

export default function App() {
  return (
    <ChakraProvider theme={theme}>
      <RouterProvider router={router} />
    </ChakraProvider>
  );
}

import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { routes } from './routes/index.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';

const router = createBrowserRouter(routes);

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

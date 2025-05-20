import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext.js';
import { AuthProvider } from './hooks/useAuth.js';
import { Box } from './components/chakra-ui.js';

// Import routes
import AppRoutes from './routes.js';

export function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Suspense fallback={<Box>Loading...</Box>}>
            <AppRoutes />
          </Suspense>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;

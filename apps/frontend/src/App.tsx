import React from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ThemeProvider } from './providers/ThemeProvider';
import { LayoutProvider } from './contexts/LayoutContext';
import ErrorBoundary from './components/core/ErrorBoundary';
// import { DevTools } from './components/dev/DevTools'; // Keep commented for now
import ComprehensiveRouter from './ComprehensiveRouter';

const queryClient = new QueryClient();

export function App() {
  // Updated to force Railway deployment with new Dockerfile using npm
  console.log('The New Fuse App starting with npm build system');
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LayoutProvider>
          <ErrorBoundary>
            <ComprehensiveRouter />
            {/* {process.env.NODE_ENV === 'development' && <DevTools />} */}
          </ErrorBoundary>
        </LayoutProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

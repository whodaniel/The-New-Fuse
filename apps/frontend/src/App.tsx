import React from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ThemeProvider } from './providers/ThemeProvider.tsx';
import { LayoutProvider } from './contexts/LayoutContext.tsx';
import ErrorBoundary from './components/core/ErrorBoundary.tsx';
// import { DevTools } from './components/dev/DevTools.tsx'; // Keep commented for now
import ComprehensiveRouter from './ComprehensiveRouter.tsx';
import { Toaster } from './components/ui/toast.tsx';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LayoutProvider>
          <ErrorBoundary>
            <ComprehensiveRouter />
            <Toaster />
            {/* {process.env.NODE_ENV === 'development' && <DevTools />} */}
          </ErrorBoundary>
        </LayoutProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

import * as React from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ThemeProvider } from './providers/ThemeProvider.js';
import { LayoutProvider } from './contexts/LayoutContext.js';
import ErrorBoundary from './components/core/ErrorBoundary.js';
// import { DevTools } from './components/dev/DevTools.js'; // Keep commented for now
import Router from './Router.js';
import { Toaster } from './components/ui/toast.js';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LayoutProvider>
          <SessionProvider>
            <ErrorBoundary>
              <Router />
              <Toaster />
              {/* {process.env.NODE_ENV === 'development' && <DevTools />} */}
            </ErrorBoundary>
          </SessionProvider>
        </LayoutProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

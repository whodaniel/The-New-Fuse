import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ErrorBoundary from './components/core/ErrorBoundary';
import PerformanceMonitor, {
  usePerformanceMonitor,
} from './components/performance/PerformanceMonitor';
import { RouteProvider } from './components/route-context';
import { LayoutProvider } from './contexts/LayoutContext';
import { ThemeProvider } from './providers/ThemeProvider';

import { ShortcutsHelp } from './components/layout/ShortcutsHelp';
import SubdomainRouter from './routers/SubdomainRouter';

const queryClient = new QueryClient();

// App performance wrapper
const AppContent: React.FC = () => {
  const { showMonitor } = usePerformanceMonitor();

  return (
    <>
      <SubdomainRouter />
      <ShortcutsHelp />
      {showMonitor && <PerformanceMonitor position="bottom-right" compact={true} />}
    </>
  );
};

export function App() {
  // Performance monitoring in development
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Performance-optimized The New Fuse App starting...');
      console.log('📊 Bundle analysis: Run "pnpm build:analyze" to view detailed bundle analysis');
      console.log('🎯 Performance monitor: Press Ctrl+Shift+P to toggle performance monitor');

      // Log initial performance metrics
      setTimeout(() => {
        console.log('📈 Initial Performance Report:');
        console.log(
          '- Memory usage:',
          (performance as any).memory?.usedJSHeapSize
            ? `${((performance as any).memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`
            : 'N/A'
        );
        console.log(
          '- Navigation timing:',
          (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)
            ?.loadEventEnd
            ? `${((performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming).loadEventEnd / 1000).toFixed(2)}s`
            : 'N/A'
        );
      }, 2000);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LayoutProvider>
          <RouteProvider>
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
          </RouteProvider>
        </LayoutProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

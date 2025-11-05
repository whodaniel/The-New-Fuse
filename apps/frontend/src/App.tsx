import React from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ThemeProvider } from './providers/ThemeProvider';
import { LayoutProvider } from './contexts/LayoutContext';
import ErrorBoundary from './components/core/ErrorBoundary';
import { usePerformanceMonitor } from './components/performance/PerformanceMonitor';
import PerformanceMonitor from './components/performance/PerformanceMonitor';

// Using ComprehensiveRouter (stable implementation)
import ComprehensiveRouter from './ComprehensiveRouter';

const queryClient = new QueryClient();

// App performance wrapper
const AppContent: React.FC = () => {
  const { showMonitor } = usePerformanceMonitor();
  
  return (
    <>
      <ComprehensiveRouter />
      {showMonitor && (
        <PerformanceMonitor
          position="bottom-right"
          compact={true}
        />
      )}
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
        console.log('- Memory usage:', (performance as any).memory?.usedJSHeapSize ? 
          `${((performance as any).memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB` : 'N/A');
        console.log('- Navigation timing:', performance.getEntriesByType('navigation')[0]?.loadEventEnd ? 
          `${(performance.getEntriesByType('navigation')[0].loadEventEnd / 1000).toFixed(2)}s` : 'N/A');
      }, 2000);
    }
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LayoutProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </LayoutProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

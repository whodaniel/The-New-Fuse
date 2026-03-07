// @ts-nocheck
import React, { Suspense, useEffect, useState } from 'react';

// Enhanced loading component with skeleton UI
const AdvancedLoadingFallback = ({
  name,
  height = '400px',
  showProgress = false,
}: {
  name: string;
  height?: string;
  showProgress?: boolean;
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (showProgress) {
      const interval = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? 90 : prev + Math.random() * 10));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [showProgress]);

  return (
    <div
      className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900"
      style={{ height }}
    >
      {/* Skeleton UI */}
      <div className="w-16 h-16 mb-4 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse rounded-full"></div>
        <div className="absolute inset-2 bg-blue-500 rounded-full animate-spin">
          <div className="w-full h-full border-2 border-transparent border-t-white rounded-full"></div>
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{name}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Loading high-performance components...
        </p>

        {showProgress && (
          <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* Skeleton content lines */}
      <div className="mt-6 w-3/4 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/6"></div>
      </div>
    </div>
  );
};

// Higher-order component for lazy loading with error boundary
const withLazyLoading = <P extends object>(
  importFunc: () => Promise<{ default: React.ComponentType<P> }>,
  fallbackName: string,
  showProgress = false
) => {
  return React.lazy(() =>
    importFunc().then((module) => {
      // Preload any heavy dependencies if needed
      if (module.default?.preload) {
        module.default.preload();
      }
      return module;
    })
  );
};

// Component for conditional lazy loading based on viewport/conditions
const ConditionalLazyComponent = <P extends object>({
  importFunc,
  fallbackName,
  condition,
  showProgress = false,
  ...props
}: {
  importFunc: () => Promise<{ default: React.ComponentType<P> }>;
  fallbackName: string;
  condition: boolean;
  showProgress?: boolean;
  [key: string]: any;
}) => {
  if (!condition) {
    return null; // Don't render if condition is not met
  }

  const LazyComponent = withLazyLoading(importFunc, fallbackName, showProgress);

  return (
    <Suspense
      fallback={<AdvancedLoadingFallback name={fallbackName} showProgress={showProgress} />}
    >
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Preload utilities for critical components
const preloadCriticalComponent = (importFunc: () => Promise<any>) => {
  // Start preloading in background
  importFunc().catch(console.error);
};

// Error boundary for lazy loaded components
class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallbackName: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Component Loading Error</h2>
          <p className="text-gray-600 mb-4">
            Failed to load {this.props.fallbackName}. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Enhanced lazy component with better error handling
const AdvancedLazyComponent = <P extends object>({
  importFunc,
  fallbackName,
  errorFallback,
  showProgress = false,
  onLoad,
  ...props
}: {
  importFunc: () => Promise<{ default: React.ComponentType<P> }>;
  fallbackName: string;
  errorFallback?: React.ComponentType<{ error: Error }>;
  showProgress?: boolean;
  onLoad?: () => void;
  [key: string]: any;
}) => {
  const LazyComponent = withLazyLoading(importFunc, fallbackName, showProgress);

  useEffect(() => {
    // Track load time for performance monitoring
    const startTime = performance.now();

    return () => {
      if (onLoad) {
        const endTime = performance.now();
        onLoad();
      }
    };
  }, [onLoad]);

  return (
    <LazyErrorBoundary fallbackName={fallbackName}>
      <Suspense
        fallback={<AdvancedLoadingFallback name={fallbackName} showProgress={showProgress} />}
      >
        <LazyComponent {...props} />
      </Suspense>
    </LazyErrorBoundary>
  );
};

export {
  AdvancedLoadingFallback,
  ConditionalLazyComponent,
  AdvancedLazyComponent as Lazy,
  preloadCriticalComponent,
  withLazyLoading,
};

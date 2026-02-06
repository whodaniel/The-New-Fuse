interface PerformanceMetrics {
  componentLoadTime: Record<string, number>;
  bundleSize: Record<string, number>;
  routeLoadTime: Record<string, number>;
  memoryUsage: number;
  timestamp: number;
}

interface BundleStats {
  name: string;
  size: number;
  gzipSize?: number;
  loadingTime: number;
  chunkType: 'route' | 'component' | 'vendor' | 'utility';
}

// Performance monitoring utilities
class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    componentLoadTime: {},
    bundleSize: {},
    routeLoadTime: {},
    memoryUsage: 0,
    timestamp: Date.now(),
  };

  private bundleStats: BundleStats[] = [];
  private observer?: PerformanceObserver;

  constructor() {
    this.initializeObserver();
  }

  private initializeObserver() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.metrics.memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
          } else if (entry.entryType === 'resource') {
            // Track resource loading times (for bundle analysis)
            if (entry.name.includes('.js') || entry.name.includes('.css')) {
              const size = (entry as any).transferSize || 0;
              const loadTime = entry.duration;
              const fileName = entry.name.split('/').pop() || 'unknown';

              this.bundleStats.push({
                name: fileName,
                size,
                loadingTime: loadTime,
                chunkType: this.determineChunkType(fileName),
              });
            }
          }
        });
      });

      try {
        this.observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
      } catch (error) {
        console.warn('Performance Observer not fully supported:', error);
      }
    }
  }

  private determineChunkType(fileName: string): BundleStats['chunkType'] {
    if (fileName.includes('chunk-') || fileName.includes('assets/')) {
      if (fileName.includes('react-vendor') || fileName.includes('vendor')) {
        return 'vendor';
      } else if (fileName.includes('page') || fileName.includes('route')) {
        return 'route';
      } else {
        return 'component';
      }
    }
    return 'utility';
  }

  // Track component load time
  startComponentLoad(componentName: string): () => void {
    const startTime = performance.now();
    return () => {
      const loadTime = performance.now() - startTime;
      this.metrics.componentLoadTime[componentName] = loadTime;
      console.log(`Component ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
    };
  }

  // Track route load time
  startRouteLoad(routeName: string): () => void {
    const startTime = performance.now();
    return () => {
      const loadTime = performance.now() - startTime;
      this.metrics.routeLoadTime[routeName] = loadTime;
      console.log(`Route ${routeName} loaded in ${loadTime.toFixed(2)}ms`);
    };
  }

  // Track bundle size
  recordBundleSize(bundleName: string, size: number, gzipSize?: number) {
    this.metrics.bundleSize[bundleName] = size;
    this.bundleStats.push({
      name: bundleName,
      size,
      gzipSize,
      loadingTime: 0, // Will be updated during actual load
      chunkType: this.determineChunkType(bundleName),
    });
  }

  // Generate performance report
  generateReport(): PerformanceMetrics & { bundleStats: BundleStats[] } {
    return {
      ...this.metrics,
      bundleStats: [...this.bundleStats],
    };
  }

  // Get top heavy components by load time
  getHeavyComponents(limit = 5): Array<{ name: string; time: number }> {
    return Object.entries(this.metrics.componentLoadTime)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([name, time]) => ({ name, time }));
  }

  // Get bundle size breakdown
  getBundleBreakdown(): Record<BundleStats['chunkType'], number> {
    const breakdown: Record<BundleStats['chunkType'], number> = {
      route: 0,
      component: 0,
      vendor: 0,
      utility: 0,
    };

    this.bundleStats.forEach((stat) => {
      breakdown[stat.chunkType] += stat.size;
    });

    return breakdown;
  }

  // Get performance recommendations
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const heavyComponents = this.getHeavyComponents();
    const bundleBreakdown = this.getBundleBreakdown();

    // Check for heavy components
    heavyComponents.forEach(({ name, time }) => {
      if (time > 1000) {
        recommendations.push(
          `Component "${name}" loads in ${time.toFixed(0)}ms - consider lazy loading or code splitting`
        );
      }
    });

    // Check bundle sizes
    Object.entries(bundleBreakdown).forEach(([type, size]) => {
      if (size > 1024 * 1024) {
        // 1MB
        recommendations.push(
          `${type} bundle is ${(size / 1024 / 1024).toFixed(1)}MB - consider further splitting`
        );
      }
    });

    // Memory usage recommendations
    if (this.metrics.memoryUsage > 50 * 1024 * 1024) {
      // 50MB
      recommendations.push(
        `Memory usage is ${(this.metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB - consider memory optimization`
      );
    }

    return recommendations;
  }

  // Log performance summary
  logSummary() {
    const report = this.generateReport();
    const recommendations = this.getRecommendations();

    console.group('📊 Performance Summary');
    console.log('Component Load Times:', report.componentLoadTime);
    console.log('Route Load Times:', report.routeLoadTime);
    console.log('Bundle Sizes:', report.bundleSize);
    console.log('Memory Usage:', `${(report.memoryUsage / 1024 / 1024).toFixed(1)}MB`);
    console.log('Bundle Breakdown:', this.getBundleBreakdown());

    if (recommendations.length > 0) {
      console.group('💡 Recommendations');
      recommendations.forEach((rec) => console.log('•', rec));
      console.groupEnd();
    }

    console.groupEnd();
  }

  // Cleanup
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Create global instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
  React.useEffect(() => {
    const endTimer = performanceMonitor.startComponentLoad(componentName);
    return endTimer;
  }, [componentName]);

  const trackRoute = React.useCallback((routeName: string) => {
    return performanceMonitor.startRouteLoad(routeName);
  }, []);

  return { trackRoute };
};

// Auto-monitoring in development
if (process.env.NODE_ENV === 'development') {
  // Log performance summary after page load
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      setTimeout(() => {
        performanceMonitor.logSummary();
      }, 2000);
    });
  }
}

export type { BundleStats, PerformanceMetrics };

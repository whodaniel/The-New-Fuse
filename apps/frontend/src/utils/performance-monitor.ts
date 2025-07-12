// Enhanced Performance Monitoring System
// Preserves all functionality while adding comprehensive performance tracking

import { Logger } from './logger';

const logger = new Logger('PerformanceMonitor');

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  context?: Record<string, any>;
}

export interface ComponentPerformance {
  component: string;
  renderTime: number;
  mountTime?: number;
  updateCount: number;
  lastUpdate: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private componentMetrics: Map<string, ComponentPerformance> = new Map();
  private startTimes: Map<string, number> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers(): void {
    if (typeof window === 'undefined') return;

    try {
      // Web Vitals observer
      const vitalsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric(`web-vitals-${entry.name}`, entry.value, {
            entryType: entry.entryType,
            startTime: entry.startTime,
          });
        }
      });

      vitalsObserver.observe({ entryTypes: ['navigation', 'measure', 'mark'] });
      this.observers.push(vitalsObserver);

      // Long Task observer
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          logger.warn('Long task detected', {
            duration: entry.duration,
            startTime: entry.startTime,
          });
          
          this.recordMetric('long-task', entry.duration, {
            startTime: entry.startTime,
          });
        }
      });

      if ('longtask' in window) {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      }
    } catch (error) {
      logger.debug('Performance observers not available', { error });
    }
  }

  // Track arbitrary performance metrics
  recordMetric(name: string, value: number, context?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      context,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name)!;
    metrics.push(metric);

    // Keep only last 100 metrics per type
    if (metrics.length > 100) {
      metrics.shift();
    }

    logger.debug(`Performance metric recorded: ${name}`, { value, context });
  }

  // Start timing an operation
  startTiming(operation: string): void {
    this.startTimes.set(operation, performance.now());
  }

  // End timing and record the result
  endTiming(operation: string, context?: Record<string, any>): number {
    const startTime = this.startTimes.get(operation);
    if (!startTime) {
      logger.warn(`No start time found for operation: ${operation}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.startTimes.delete(operation);
    this.recordMetric(operation, duration, context);
    
    return duration;
  }

  // Component-specific performance tracking
  trackComponentRender(componentName: string, renderTime: number): void {
    const existing = this.componentMetrics.get(componentName);
    
    if (existing) {
      existing.renderTime = renderTime;
      existing.updateCount += 1;
      existing.lastUpdate = Date.now();
    } else {
      this.componentMetrics.set(componentName, {
        component: componentName,
        renderTime,
        updateCount: 1,
        lastUpdate: Date.now(),
      });
    }

    // Log slow renders
    if (renderTime > 16) { // More than one frame at 60fps
      logger.warn(`Slow render detected: ${componentName}`, { renderTime });
    }
  }

  // Get performance summary
  getMetricsSummary(metricName?: string): Record<string, any> {
    if (metricName) {
      const metrics = this.metrics.get(metricName) || [];
      return {
        name: metricName,
        count: metrics.length,
        average: metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length || 0,
        min: Math.min(...metrics.map(m => m.value)),
        max: Math.max(...metrics.map(m => m.value)),
        latest: metrics[metrics.length - 1],
      };
    }

    const summary: Record<string, any> = {};
    for (const [name] of this.metrics) {
      summary[name] = this.getMetricsSummary(name);
    }

    return summary;
  }

  // Get component performance summary
  getComponentMetrics(): ComponentPerformance[] {
    return Array.from(this.componentMetrics.values());
  }

  // Memory usage tracking
  getMemoryUsage(): Record<string, number> | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }
    return null;
  }

  // Clean up observers
  dispose(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for component performance tracking
export function usePerformanceTracker(componentName: string) {
  const startTime = performance.now();
  
  return {
    recordRender: () => {
      const renderTime = performance.now() - startTime;
      performanceMonitor.trackComponentRender(componentName, renderTime);
    },
    startTiming: (operation: string) => performanceMonitor.startTiming(`${componentName}-${operation}`),
    endTiming: (operation: string, context?: Record<string, any>) => 
      performanceMonitor.endTiming(`${componentName}-${operation}`, context),
  };
}

// Decorator for timing functions
export function timed(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  
  descriptor.value = function (...args: any[]) {
    const operation = `${target.constructor.name}.${propertyName}`;
    performanceMonitor.startTiming(operation);
    
    try {
      const result = method.apply(this, args);
      
      if (result instanceof Promise) {
        return result.finally(() => {
          performanceMonitor.endTiming(operation);
        });
      }
      
      performanceMonitor.endTiming(operation);
      return result;
    } catch (error) {
      performanceMonitor.endTiming(operation, { error: true });
      throw error;
    }
  };
}

// Initialize global monitoring if in browser
if (typeof window !== 'undefined') {
  (window as any).performanceMonitor = performanceMonitor;
}
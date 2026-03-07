// @ts-nocheck
import { useEffect, useRef } from 'react';

export interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
}

export const usePagePerformance = (pageName: string) => {
  const metricsReported = useRef(false);

  useEffect(() => {
    // Only report metrics once
    if (metricsReported.current) return;

    const reportMetrics = () => {
      if (typeof window === 'undefined' || !window.performance) return;

      const metrics: Partial<PerformanceMetrics> = {};

      // Navigation Timing API
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
        metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
      }

      // Paint Timing API
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
      if (fcp) {
        metrics.firstContentfulPaint = fcp.startTime;
      }

      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        if (lastEntry) {
          metrics.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;
        }
      });

      try {
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        // LCP not supported
      }

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        metrics.cumulativeLayoutShift = clsValue;
      });

      try {
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        // CLS not supported
      }

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          metrics.firstInputDelay = (entry as any).processingStart - entry.startTime;
        }
      });

      try {
        fidObserver.observe({ type: 'first-input', buffered: true });
      } catch (e) {
        // FID not supported
      }

      // Log metrics after page load
      setTimeout(() => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`📊 Performance Metrics for ${pageName}:`, {
            'Load Time': metrics.loadTime ? `${(metrics.loadTime / 1000).toFixed(2)}s` : 'N/A',
            'DOM Content Loaded': metrics.domContentLoaded
              ? `${(metrics.domContentLoaded / 1000).toFixed(2)}s`
              : 'N/A',
            'First Contentful Paint': metrics.firstContentfulPaint
              ? `${(metrics.firstContentfulPaint / 1000).toFixed(2)}s`
              : 'N/A',
            'Largest Contentful Paint': metrics.largestContentfulPaint
              ? `${(metrics.largestContentfulPaint / 1000).toFixed(2)}s`
              : 'N/A',
            'Cumulative Layout Shift': metrics.cumulativeLayoutShift?.toFixed(3) || 'N/A',
            'First Input Delay': metrics.firstInputDelay
              ? `${metrics.firstInputDelay.toFixed(2)}ms`
              : 'N/A',
          });

          // Performance recommendations
          if (metrics.firstContentfulPaint && metrics.firstContentfulPaint > 2500) {
            console.warn(
              `⚠️ FCP is slow (${(metrics.firstContentfulPaint / 1000).toFixed(2)}s). Consider optimizing above-the-fold content.`
            );
          }
          if (metrics.largestContentfulPaint && metrics.largestContentfulPaint > 2500) {
            console.warn(
              `⚠️ LCP is slow (${(metrics.largestContentfulPaint / 1000).toFixed(2)}s). Consider optimizing largest contentful element.`
            );
          }
          if (metrics.cumulativeLayoutShift && metrics.cumulativeLayoutShift > 0.1) {
            console.warn(
              `⚠️ CLS is high (${metrics.cumulativeLayoutShift.toFixed(3)}). Consider adding size attributes to images and reserving space for dynamic content.`
            );
          }
          if (metrics.firstInputDelay && metrics.firstInputDelay > 100) {
            console.warn(
              `⚠️ FID is slow (${metrics.firstInputDelay.toFixed(2)}ms). Consider reducing JavaScript execution time.`
            );
          }
        }

        // Send metrics to analytics service (if available)
        if (window.gtag) {
          window.gtag('event', 'page_performance', {
            event_category: 'Performance',
            event_label: pageName,
            value: Math.round(metrics.loadTime || 0),
            custom_metrics: metrics,
          });
        }

        metricsReported.current = true;
      }, 3000); // Wait 3 seconds to capture all metrics
    };

    // Wait for page to be fully loaded
    if (document.readyState === 'complete') {
      reportMetrics();
    } else {
      window.addEventListener('load', reportMetrics);
      return () => window.removeEventListener('load', reportMetrics);
    }
  }, [pageName]);

  return null;
};

// Web Vitals thresholds (Google recommendations)
export const PERFORMANCE_THRESHOLDS = {
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  FID: { good: 100, needsImprovement: 300 }, // First Input Delay
  CLS: { good: 0.1, needsImprovement: 0.25 }, // Cumulative Layout Shift
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte
};

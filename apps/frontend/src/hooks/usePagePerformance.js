import { useEffect, useRef } from 'react';
export var usePagePerformance = function (pageName) {
    var metricsReported = useRef(false);
    useEffect(function () {
        // Only report metrics once
        if (metricsReported.current)
            return;
        var reportMetrics = function () {
            if (typeof window === 'undefined' || !window.performance)
                return;
            var metrics = {};
            // Navigation Timing API
            var navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
                metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
            }
            // Paint Timing API
            var paintEntries = performance.getEntriesByType('paint');
            var fcp = paintEntries.find(function (entry) { return entry.name === 'first-contentful-paint'; });
            if (fcp) {
                metrics.firstContentfulPaint = fcp.startTime;
            }
            // Largest Contentful Paint (LCP)
            var lcpObserver = new PerformanceObserver(function (list) {
                var entries = list.getEntries();
                var lastEntry = entries[entries.length - 1];
                if (lastEntry) {
                    metrics.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;
                }
            });
            try {
                lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
            }
            catch (e) {
                // LCP not supported
            }
            // Cumulative Layout Shift (CLS)
            var clsValue = 0;
            var clsObserver = new PerformanceObserver(function (list) {
                for (var _i = 0, _a = list.getEntries(); _i < _a.length; _i++) {
                    var entry = _a[_i];
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                metrics.cumulativeLayoutShift = clsValue;
            });
            try {
                clsObserver.observe({ type: 'layout-shift', buffered: true });
            }
            catch (e) {
                // CLS not supported
            }
            // First Input Delay (FID)
            var fidObserver = new PerformanceObserver(function (list) {
                for (var _i = 0, _a = list.getEntries(); _i < _a.length; _i++) {
                    var entry = _a[_i];
                    metrics.firstInputDelay = entry.processingStart - entry.startTime;
                }
            });
            try {
                fidObserver.observe({ type: 'first-input', buffered: true });
            }
            catch (e) {
                // FID not supported
            }
            // Log metrics after page load
            setTimeout(function () {
                var _a;
                if (process.env.NODE_ENV === 'development') {
                    console.log("\uD83D\uDCCA Performance Metrics for ".concat(pageName, ":"), {
                        'Load Time': metrics.loadTime ? "".concat((metrics.loadTime / 1000).toFixed(2), "s") : 'N/A',
                        'DOM Content Loaded': metrics.domContentLoaded ? "".concat((metrics.domContentLoaded / 1000).toFixed(2), "s") : 'N/A',
                        'First Contentful Paint': metrics.firstContentfulPaint ? "".concat((metrics.firstContentfulPaint / 1000).toFixed(2), "s") : 'N/A',
                        'Largest Contentful Paint': metrics.largestContentfulPaint ? "".concat((metrics.largestContentfulPaint / 1000).toFixed(2), "s") : 'N/A',
                        'Cumulative Layout Shift': ((_a = metrics.cumulativeLayoutShift) === null || _a === void 0 ? void 0 : _a.toFixed(3)) || 'N/A',
                        'First Input Delay': metrics.firstInputDelay ? "".concat(metrics.firstInputDelay.toFixed(2), "ms") : 'N/A',
                    });
                    // Performance recommendations
                    if (metrics.firstContentfulPaint && metrics.firstContentfulPaint > 2500) {
                        console.warn("\u26A0\uFE0F FCP is slow (".concat((metrics.firstContentfulPaint / 1000).toFixed(2), "s). Consider optimizing above-the-fold content."));
                    }
                    if (metrics.largestContentfulPaint && metrics.largestContentfulPaint > 2500) {
                        console.warn("\u26A0\uFE0F LCP is slow (".concat((metrics.largestContentfulPaint / 1000).toFixed(2), "s). Consider optimizing largest contentful element."));
                    }
                    if (metrics.cumulativeLayoutShift && metrics.cumulativeLayoutShift > 0.1) {
                        console.warn("\u26A0\uFE0F CLS is high (".concat(metrics.cumulativeLayoutShift.toFixed(3), "). Consider adding size attributes to images and reserving space for dynamic content."));
                    }
                    if (metrics.firstInputDelay && metrics.firstInputDelay > 100) {
                        console.warn("\u26A0\uFE0F FID is slow (".concat(metrics.firstInputDelay.toFixed(2), "ms). Consider reducing JavaScript execution time."));
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
        }
        else {
            window.addEventListener('load', reportMetrics);
            return function () { return window.removeEventListener('load', reportMetrics); };
        }
    }, [pageName]);
    return null;
};
// Web Vitals thresholds (Google recommendations)
export var PERFORMANCE_THRESHOLDS = {
    FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
    LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
    FID: { good: 100, needsImprovement: 300 }, // First Input Delay
    CLS: { good: 0.1, needsImprovement: 0.25 }, // Cumulative Layout Shift
    TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte
};

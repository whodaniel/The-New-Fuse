// Enhanced Performance Monitoring System
// Preserves all functionality while adding comprehensive performance tracking
import { Logger } from './logger';
var logger = new Logger('PerformanceMonitor');
var PerformanceMonitor = /** @class */ (function () {
    function PerformanceMonitor() {
        this.metrics = new Map();
        this.componentMetrics = new Map();
        this.startTimes = new Map();
        this.observers = [];
        this.initializeObservers();
    }
    PerformanceMonitor.prototype.initializeObservers = function () {
        var _this = this;
        if (typeof window === 'undefined')
            return;
        try {
            // Web Vitals observer
            var vitalsObserver = new PerformanceObserver(function (list) {
                for (var _i = 0, _a = list.getEntries(); _i < _a.length; _i++) {
                    var entry = _a[_i];
                    _this.recordMetric("web-vitals-".concat(entry.name), entry.value, {
                        entryType: entry.entryType,
                        startTime: entry.startTime,
                    });
                }
            });
            vitalsObserver.observe({ entryTypes: ['navigation', 'measure', 'mark'] });
            this.observers.push(vitalsObserver);
            // Long Task observer
            var longTaskObserver = new PerformanceObserver(function (list) {
                for (var _i = 0, _a = list.getEntries(); _i < _a.length; _i++) {
                    var entry = _a[_i];
                    logger.warn('Long task detected', {
                        duration: entry.duration,
                        startTime: entry.startTime,
                    });
                    _this.recordMetric('long-task', entry.duration, {
                        startTime: entry.startTime,
                    });
                }
            });
            if ('longtask' in window) {
                longTaskObserver.observe({ entryTypes: ['longtask'] });
                this.observers.push(longTaskObserver);
            }
        }
        catch (error) {
            logger.debug('Performance observers not available', { error: error });
        }
    };
    // Track arbitrary performance metrics
    PerformanceMonitor.prototype.recordMetric = function (name, value, context) {
        var metric = {
            name: name,
            value: value,
            timestamp: Date.now(),
            context: context,
        };
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        var metrics = this.metrics.get(name);
        metrics.push(metric);
        // Keep only last 100 metrics per type
        if (metrics.length > 100) {
            metrics.shift();
        }
        logger.debug("Performance metric recorded: ".concat(name), { value: value, context: context });
    };
    // Start timing an operation
    PerformanceMonitor.prototype.startTiming = function (operation) {
        this.startTimes.set(operation, performance.now());
    };
    // End timing and record the result
    PerformanceMonitor.prototype.endTiming = function (operation, context) {
        var startTime = this.startTimes.get(operation);
        if (!startTime) {
            logger.warn("No start time found for operation: ".concat(operation));
            return 0;
        }
        var duration = performance.now() - startTime;
        this.startTimes.delete(operation);
        this.recordMetric(operation, duration, context);
        return duration;
    };
    // Component-specific performance tracking
    PerformanceMonitor.prototype.trackComponentRender = function (componentName, renderTime) {
        var existing = this.componentMetrics.get(componentName);
        if (existing) {
            existing.renderTime = renderTime;
            existing.updateCount += 1;
            existing.lastUpdate = Date.now();
        }
        else {
            this.componentMetrics.set(componentName, {
                component: componentName,
                renderTime: renderTime,
                updateCount: 1,
                lastUpdate: Date.now(),
            });
        }
        // Log slow renders
        if (renderTime > 16) { // More than one frame at 60fps
            logger.warn("Slow render detected: ".concat(componentName), { renderTime: renderTime });
        }
    };
    // Get performance summary
    PerformanceMonitor.prototype.getMetricsSummary = function (metricName) {
        if (metricName) {
            var metrics = this.metrics.get(metricName) || [];
            return {
                name: metricName,
                count: metrics.length,
                average: metrics.reduce(function (sum, m) { return sum + m.value; }, 0) / metrics.length || 0,
                min: Math.min.apply(Math, metrics.map(function (m) { return m.value; })),
                max: Math.max.apply(Math, metrics.map(function (m) { return m.value; })),
                latest: metrics[metrics.length - 1],
            };
        }
        var summary = {};
        for (var _i = 0, _a = this.metrics; _i < _a.length; _i++) {
            var name_1 = _a[_i][0];
            summary[name_1] = this.getMetricsSummary(name_1);
        }
        return summary;
    };
    // Get component performance summary
    PerformanceMonitor.prototype.getComponentMetrics = function () {
        return Array.from(this.componentMetrics.values());
    };
    // Memory usage tracking
    PerformanceMonitor.prototype.getMemoryUsage = function () {
        if ('memory' in performance) {
            var memory = performance.memory;
            return {
                usedJSHeapSize: memory.usedJSHeapSize,
                totalJSHeapSize: memory.totalJSHeapSize,
                jsHeapSizeLimit: memory.jsHeapSizeLimit,
            };
        }
        return null;
    };
    // Clean up observers
    PerformanceMonitor.prototype.dispose = function () {
        this.observers.forEach(function (observer) { return observer.disconnect(); });
        this.observers = [];
    };
    return PerformanceMonitor;
}());
// Global instance
export var performanceMonitor = new PerformanceMonitor();
// React hook for component performance tracking
export function usePerformanceTracker(componentName) {
    var startTime = performance.now();
    return {
        recordRender: function () {
            var renderTime = performance.now() - startTime;
            performanceMonitor.trackComponentRender(componentName, renderTime);
        },
        startTiming: function (operation) { return performanceMonitor.startTiming("".concat(componentName, "-").concat(operation)); },
        endTiming: function (operation, context) {
            return performanceMonitor.endTiming("".concat(componentName, "-").concat(operation), context);
        },
    };
}
// Decorator for timing functions
export function timed(target, propertyName, descriptor) {
    var method = descriptor.value;
    descriptor.value = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var operation = "".concat(target.constructor.name, ".").concat(propertyName);
        performanceMonitor.startTiming(operation);
        try {
            var result = method.apply(this, args);
            if (result instanceof Promise) {
                return result.finally(function () {
                    performanceMonitor.endTiming(operation);
                });
            }
            performanceMonitor.endTiming(operation);
            return result;
        }
        catch (error) {
            performanceMonitor.endTiming(operation, { error: true });
            throw error;
        }
    };
}
// Initialize global monitoring if in browser
if (typeof window !== 'undefined') {
    window.performanceMonitor = performanceMonitor;
}

var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
// Performance monitoring utilities
var PerformanceMonitor = /** @class */ (function () {
    function PerformanceMonitor() {
        this.metrics = {
            componentLoadTime: {},
            bundleSize: {},
            routeLoadTime: {},
            memoryUsage: 0,
            timestamp: Date.now()
        };
        this.bundleStats = [];
        this.initializeObserver();
    }
    PerformanceMonitor.prototype.initializeObserver = function () {
        var _this = this;
        if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
            this.observer = new PerformanceObserver(function (list) {
                var entries = list.getEntries();
                entries.forEach(function (entry) {
                    var _a;
                    if (entry.entryType === 'navigation') {
                        _this.metrics.memoryUsage = ((_a = performance.memory) === null || _a === void 0 ? void 0 : _a.usedJSHeapSize) || 0;
                    }
                    else if (entry.entryType === 'resource') {
                        // Track resource loading times (for bundle analysis)
                        if (entry.name.includes('.js') || entry.name.includes('.css')) {
                            var size = entry.transferSize || 0;
                            var loadTime = entry.duration;
                            var fileName = entry.name.split('/').pop() || 'unknown';
                            _this.bundleStats.push({
                                name: fileName,
                                size: size,
                                loadingTime: loadTime,
                                chunkType: _this.determineChunkType(fileName)
                            });
                        }
                    }
                });
            });
            try {
                this.observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
            }
            catch (error) {
                console.warn('Performance Observer not fully supported:', error);
            }
        }
    };
    PerformanceMonitor.prototype.determineChunkType = function (fileName) {
        if (fileName.includes('chunk-') || fileName.includes('assets/')) {
            if (fileName.includes('react-vendor') || fileName.includes('vendor')) {
                return 'vendor';
            }
            else if (fileName.includes('page') || fileName.includes('route')) {
                return 'route';
            }
            else {
                return 'component';
            }
        }
        return 'utility';
    };
    // Track component load time
    PerformanceMonitor.prototype.startComponentLoad = function (componentName) {
        var _this = this;
        var startTime = performance.now();
        return function () {
            var loadTime = performance.now() - startTime;
            _this.metrics.componentLoadTime[componentName] = loadTime;
            console.log("Component ".concat(componentName, " loaded in ").concat(loadTime.toFixed(2), "ms"));
        };
    };
    // Track route load time
    PerformanceMonitor.prototype.startRouteLoad = function (routeName) {
        var _this = this;
        var startTime = performance.now();
        return function () {
            var loadTime = performance.now() - startTime;
            _this.metrics.routeLoadTime[routeName] = loadTime;
            console.log("Route ".concat(routeName, " loaded in ").concat(loadTime.toFixed(2), "ms"));
        };
    };
    // Track bundle size
    PerformanceMonitor.prototype.recordBundleSize = function (bundleName, size, gzipSize) {
        this.metrics.bundleSize[bundleName] = size;
        this.bundleStats.push({
            name: bundleName,
            size: size,
            gzipSize: gzipSize,
            loadingTime: 0, // Will be updated during actual load
            chunkType: this.determineChunkType(bundleName)
        });
    };
    // Generate performance report
    PerformanceMonitor.prototype.generateReport = function () {
        return __assign(__assign({}, this.metrics), { bundleStats: __spreadArray([], this.bundleStats, true) });
    };
    // Get top heavy components by load time
    PerformanceMonitor.prototype.getHeavyComponents = function (limit) {
        if (limit === void 0) { limit = 5; }
        return Object.entries(this.metrics.componentLoadTime)
            .sort(function (_a, _b) {
            var a = _a[1];
            var b = _b[1];
            return b - a;
        })
            .slice(0, limit)
            .map(function (_a) {
            var name = _a[0], time = _a[1];
            return ({ name: name, time: time });
        });
    };
    // Get bundle size breakdown
    PerformanceMonitor.prototype.getBundleBreakdown = function () {
        var breakdown = {
            route: 0,
            component: 0,
            vendor: 0,
            utility: 0
        };
        this.bundleStats.forEach(function (stat) {
            breakdown[stat.chunkType] += stat.size;
        });
        return breakdown;
    };
    // Get performance recommendations
    PerformanceMonitor.prototype.getRecommendations = function () {
        var recommendations = [];
        var heavyComponents = this.getHeavyComponents();
        var bundleBreakdown = this.getBundleBreakdown();
        // Check for heavy components
        heavyComponents.forEach(function (_a) {
            var name = _a.name, time = _a.time;
            if (time > 1000) {
                recommendations.push("Component \"".concat(name, "\" loads in ").concat(time.toFixed(0), "ms - consider lazy loading or code splitting"));
            }
        });
        // Check bundle sizes
        Object.entries(bundleBreakdown).forEach(function (_a) {
            var type = _a[0], size = _a[1];
            if (size > 1024 * 1024) { // 1MB
                recommendations.push("".concat(type, " bundle is ").concat((size / 1024 / 1024).toFixed(1), "MB - consider further splitting"));
            }
        });
        // Memory usage recommendations
        if (this.metrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
            recommendations.push("Memory usage is ".concat((this.metrics.memoryUsage / 1024 / 1024).toFixed(1), "MB - consider memory optimization"));
        }
        return recommendations;
    };
    // Log performance summary
    PerformanceMonitor.prototype.logSummary = function () {
        var report = this.generateReport();
        var recommendations = this.getRecommendations();
        console.group('📊 Performance Summary');
        console.log('Component Load Times:', report.componentLoadTime);
        console.log('Route Load Times:', report.routeLoadTime);
        console.log('Bundle Sizes:', report.bundleSize);
        console.log('Memory Usage:', "".concat((report.memoryUsage / 1024 / 1024).toFixed(1), "MB"));
        console.log('Bundle Breakdown:', this.getBundleBreakdown());
        if (recommendations.length > 0) {
            console.group('💡 Recommendations');
            recommendations.forEach(function (rec) { return console.log('•', rec); });
            console.groupEnd();
        }
        console.groupEnd();
    };
    // Cleanup
    PerformanceMonitor.prototype.destroy = function () {
        if (this.observer) {
            this.observer.disconnect();
        }
    };
    return PerformanceMonitor;
}());
// Create global instance
export var performanceMonitor = new PerformanceMonitor();
// React hook for performance monitoring
export var usePerformanceMonitor = function (componentName) {
    React.useEffect(function () {
        var endTimer = performanceMonitor.startComponentLoad(componentName);
        return endTimer;
    }, [componentName]);
    var trackRoute = React.useCallback(function (routeName) {
        return performanceMonitor.startRouteLoad(routeName);
    }, []);
    return { trackRoute: trackRoute };
};
// Auto-monitoring in development
if (process.env.NODE_ENV === 'development') {
    // Log performance summary after page load
    if (typeof window !== 'undefined') {
        window.addEventListener('load', function () {
            setTimeout(function () {
                performanceMonitor.logSummary();
            }, 2000);
        });
    }
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { performanceMonitor } from '../../utils/performanceMonitor';
var PerformanceMonitor = function (_a) {
    var _b = _a.isVisible, isVisible = _b === void 0 ? false : _b, _c = _a.position, position = _c === void 0 ? 'bottom-right' : _c, _d = _a.compact, compact = _d === void 0 ? false : _d;
    var _e = useState({
        componentLoadTimes: {},
        routeLoadTimes: {},
        memoryUsage: 0,
        bundleSizes: {},
        recommendations: []
    }), data = _e[0], setData = _e[1];
    var _f = useState(false), isExpanded = _f[0], setIsExpanded = _f[1];
    var _g = useState(0), updateCount = _g[0], setUpdateCount = _g[1];
    // Update performance data periodically
    useEffect(function () {
        var interval = setInterval(function () {
            var report = performanceMonitor.generateReport();
            var recommendations = performanceMonitor.getRecommendations();
            setData({
                componentLoadTimes: report.componentLoadTime,
                routeLoadTimes: report.routeLoadTime,
                memoryUsage: report.memoryUsage,
                bundleSizes: report.bundleSize,
                recommendations: recommendations
            });
            setUpdateCount(function (prev) { return prev + 1; });
        }, 2000);
        return function () { return clearInterval(interval); };
    }, []);
    // Position styles
    var positionStyles = {
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4'
    };
    // Format utility functions
    var formatBytes = function (bytes) {
        if (bytes === 0)
            return '0 B';
        var k = 1024;
        var sizes = ['B', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };
    var formatTime = function (ms) {
        if (ms < 1000)
            return "".concat(ms.toFixed(0), "ms");
        return "".concat((ms / 1000).toFixed(1), "s");
    };
    // Performance score calculation
    var getPerformanceScore = function () {
        var scores = {
            loadTime: Math.max(0, 100 - (Object.values(data.routeLoadTimes).reduce(function (avg, time) { return avg + time; }, 0) / Object.keys(data.routeLoadTimes).length || 0) / 10),
            memory: Math.max(0, 100 - (data.memoryUsage / 1024 / 1024 / 100)), // Penalize for memory usage
            bundle: Math.max(0, 100 - Object.values(data.bundleSizes).reduce(function (total, size) { return total + size; }, 0) / 1024 / 100)
        };
        var average = (scores.loadTime + scores.memory + scores.bundle) / 3;
        return Math.round(average);
    };
    var performanceScore = getPerformanceScore();
    if (!isVisible)
        return null;
    return (_jsxs("div", { className: "fixed ".concat(positionStyles[position], " z-50 ").concat(compact ? 'w-16 h-16' : 'w-80'), children: [compact && !isExpanded && (_jsx("div", { className: "bg-black/80 text-white rounded-full p-3 cursor-pointer hover:bg-black/90 transition-colors", onClick: function () { return setIsExpanded(true); }, children: _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("div", { className: "w-3 h-3 rounded-full ".concat(performanceScore >= 80 ? 'bg-green-500' :
                                performanceScore >= 60 ? 'bg-yellow-500' : 'bg-red-500') }), _jsx("span", { className: "text-xs font-bold", children: performanceScore })] }) })), (isExpanded || !compact) && (_jsxs("div", { className: "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden", children: [_jsx("div", { className: "px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-3 h-3 rounded-full ".concat(performanceScore >= 80 ? 'bg-green-500' :
                                                performanceScore >= 60 ? 'bg-yellow-500' : 'bg-red-500') }), _jsx("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: "Performance Monitor" }), updateCount > 0 && (_jsxs("span", { className: "text-xs text-gray-500", children: ["(", updateCount, " updates)"] }))] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("span", { className: "text-sm font-bold text-gray-900 dark:text-white", children: [performanceScore, "/100"] }), compact && (_jsx("button", { onClick: function () { return setIsExpanded(false); }, className: "text-gray-400 hover:text-gray-600", children: "\u00D7" }))] })] }) }), _jsxs("div", { className: "max-h-96 overflow-y-auto", children: [_jsx("div", { className: "px-4 py-3 border-b border-gray-200 dark:border-gray-700", children: _jsxs("div", { className: "grid grid-cols-3 gap-2 text-xs", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-gray-500", children: "Load" }), _jsx("div", { className: "font-bold", children: Math.max(0, 100 - (Object.values(data.routeLoadTimes).reduce(function (avg, time) { return avg + time; }, 0) / Object.keys(data.routeLoadTimes).length || 0) / 10) })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-gray-500", children: "Memory" }), _jsx("div", { className: "font-bold", children: Math.max(0, 100 - (data.memoryUsage / 1024 / 1024 / 100)) })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-gray-500", children: "Bundle" }), _jsx("div", { className: "font-bold", children: Math.max(0, 100 - Object.values(data.bundleSizes).reduce(function (total, size) { return total + size; }, 0) / 1024 / 100) })] })] }) }), _jsxs("div", { className: "px-4 py-2 border-b border-gray-200 dark:border-gray-700", children: [_jsxs("div", { className: "flex justify-between items-center text-sm", children: [_jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "Memory Usage" }), _jsx("span", { className: "font-medium", children: formatBytes(data.memoryUsage) })] }), _jsx("div", { className: "mt-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2", children: _jsx("div", { className: "h-2 rounded-full transition-all duration-300 ".concat(data.memoryUsage < 30 * 1024 * 1024 ? 'bg-green-500' :
                                                data.memoryUsage < 60 * 1024 * 1024 ? 'bg-yellow-500' : 'bg-red-500'), style: {
                                                width: "".concat(Math.min(100, (data.memoryUsage / 100 * 1024 * 1024) * 100), "%")
                                            } }) })] }), Object.keys(data.componentLoadTimes).length > 0 && (_jsxs("div", { className: "px-4 py-2 border-b border-gray-200 dark:border-gray-700", children: [_jsx("h4", { className: "text-sm font-medium text-gray-900 dark:text-white mb-2", children: "Recent Components" }), _jsx("div", { className: "space-y-1", children: Object.entries(data.componentLoadTimes)
                                            .slice(-3)
                                            .map(function (_a) {
                                            var name = _a[0], time = _a[1];
                                            return (_jsxs("div", { className: "flex justify-between text-xs", children: [_jsx("span", { className: "text-gray-600 dark:text-gray-400 truncate", children: name.replace('Route: ', '') }), _jsx("span", { className: "font-medium ".concat(time < 200 ? 'text-green-600' :
                                                            time < 500 ? 'text-yellow-600' : 'text-red-600'), children: formatTime(time) })] }, name));
                                        }) })] })), Object.keys(data.bundleSizes).length > 0 && (_jsxs("div", { className: "px-4 py-2 border-b border-gray-200 dark:border-gray-700", children: [_jsx("h4", { className: "text-sm font-medium text-gray-900 dark:text-white mb-2", children: "Bundle Sizes" }), _jsx("div", { className: "space-y-1", children: Object.entries(data.bundleSizes)
                                            .slice(-3)
                                            .map(function (_a) {
                                            var name = _a[0], size = _a[1];
                                            return (_jsxs("div", { className: "flex justify-between text-xs", children: [_jsx("span", { className: "text-gray-600 dark:text-gray-400 truncate", children: name }), _jsx("span", { className: "font-medium ".concat(size < 100 * 1024 ? 'text-green-600' :
                                                            size < 500 * 1024 ? 'text-yellow-600' : 'text-red-600'), children: formatBytes(size) })] }, name));
                                        }) })] })), data.recommendations.length > 0 && (_jsxs("div", { className: "px-4 py-2", children: [_jsx("h4", { className: "text-sm font-medium text-gray-900 dark:text-white mb-2", children: "\uD83D\uDCA1 Recommendations" }), _jsxs("div", { className: "space-y-1", children: [data.recommendations.slice(0, 2).map(function (rec, index) { return (_jsxs("div", { className: "text-xs text-yellow-600 dark:text-yellow-400", children: ["\u2022 ", rec] }, index)); }), data.recommendations.length > 2 && (_jsxs("div", { className: "text-xs text-gray-500", children: ["+", data.recommendations.length - 2, " more..."] }))] })] }))] }), _jsx("div", { className: "px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("button", { onClick: function () {
                                        performanceMonitor.logSummary();
                                        setUpdateCount(0);
                                    }, className: "text-xs text-blue-600 hover:text-blue-700", children: "Log Details" }), _jsx("button", { onClick: function () {
                                        performanceMonitor.clearCache();
                                        setData({
                                            componentLoadTimes: {},
                                            routeLoadTimes: {},
                                            memoryUsage: 0,
                                            bundleSizes: {},
                                            recommendations: []
                                        });
                                    }, className: "text-xs text-gray-500 hover:text-gray-700", children: "Clear Cache" })] }) })] }))] }));
};
// Hook for easy integration
export var usePerformanceMonitor = function () {
    var _a = useState(false), showMonitor = _a[0], setShowMonitor = _a[1];
    useEffect(function () {
        // Show monitor in development
        if (process.env.NODE_ENV === 'development') {
            setShowMonitor(true);
        }
        // Keyboard shortcut to toggle monitor (Ctrl+Shift+P)
        var handleKeyDown = function (e) {
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                setShowMonitor(function (prev) { return !prev; });
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return function () { return document.removeEventListener('keydown', handleKeyDown); };
    }, []);
    return { showMonitor: showMonitor, setShowMonitor: setShowMonitor };
};
export default PerformanceMonitor;

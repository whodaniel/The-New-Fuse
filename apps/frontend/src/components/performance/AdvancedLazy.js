var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { Suspense, useState, useEffect } from 'react';
// Enhanced loading component with skeleton UI
var AdvancedLoadingFallback = function (_a) {
    var name = _a.name, _b = _a.height, height = _b === void 0 ? '400px' : _b, _c = _a.showProgress, showProgress = _c === void 0 ? false : _c;
    var _d = useState(0), progress = _d[0], setProgress = _d[1];
    useEffect(function () {
        if (showProgress) {
            var interval_1 = setInterval(function () {
                setProgress(function (prev) { return (prev >= 90 ? 90 : prev + Math.random() * 10); });
            }, 100);
            return function () { return clearInterval(interval_1); };
        }
    }, [showProgress]);
    return (_jsxs("div", { className: "flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900", style: { height: height }, children: [_jsxs("div", { className: "w-16 h-16 mb-4 relative", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse rounded-full" }), _jsx("div", { className: "absolute inset-2 bg-blue-500 rounded-full animate-spin", children: _jsx("div", { className: "w-full h-full border-2 border-transparent border-t-white rounded-full" }) })] }), _jsxs("div", { className: "text-center space-y-2", children: [_jsx("p", { className: "text-lg font-medium text-gray-700 dark:text-gray-300", children: name }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: "Loading high-performance components..." }), showProgress && (_jsx("div", { className: "w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3", children: _jsx("div", { className: "bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out", style: { width: "".concat(progress, "%") } }) }))] }), _jsxs("div", { className: "mt-6 w-3/4 space-y-3", children: [_jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }), _jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6" }), _jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/6" })] })] }));
};
// Higher-order component for lazy loading with error boundary
var withLazyLoading = function (importFunc, fallbackName, showProgress) {
    if (showProgress === void 0) { showProgress = false; }
    return React.lazy(function () {
        return importFunc().then(function (module) {
            var _a;
            // Preload any heavy dependencies if needed
            if ((_a = module.default) === null || _a === void 0 ? void 0 : _a.preload) {
                module.default.preload();
            }
            return module;
        });
    });
};
// Component for conditional lazy loading based on viewport/conditions
var ConditionalLazyComponent = function (_a) {
    var importFunc = _a.importFunc, fallbackName = _a.fallbackName, condition = _a.condition, _b = _a.showProgress, showProgress = _b === void 0 ? false : _b, props = __rest(_a, ["importFunc", "fallbackName", "condition", "showProgress"]);
    if (!condition) {
        return null; // Don't render if condition is not met
    }
    var LazyComponent = withLazyLoading(importFunc, fallbackName, showProgress);
    return (_jsx(Suspense, { fallback: _jsx(AdvancedLoadingFallback, { name: fallbackName, showProgress: showProgress }), children: _jsx(LazyComponent, __assign({}, props)) }));
};
// Preload utilities for critical components
var preloadCriticalComponent = function (importFunc) {
    // Start preloading in background
    importFunc().catch(console.error);
};
// Error boundary for lazy loaded components
var LazyErrorBoundary = /** @class */ (function (_super) {
    __extends(LazyErrorBoundary, _super);
    function LazyErrorBoundary(props) {
        var _this = _super.call(this, props) || this;
        _this.state = { hasError: false };
        return _this;
    }
    LazyErrorBoundary.getDerivedStateFromError = function (error) {
        return { hasError: true, error: error };
    };
    LazyErrorBoundary.prototype.componentDidCatch = function (error, errorInfo) {
        console.error('Lazy loading error:', error, errorInfo);
    };
    LazyErrorBoundary.prototype.render = function () {
        if (this.state.hasError) {
            return (_jsxs("div", { className: "p-8 text-center", children: [_jsx("h2", { className: "text-xl font-bold text-red-600 mb-2", children: "Component Loading Error" }), _jsxs("p", { className: "text-gray-600 mb-4", children: ["Failed to load ", this.props.fallbackName, ". Please refresh the page."] }), _jsx("button", { onClick: function () { return window.location.reload(); }, className: "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700", children: "Reload Page" })] }));
        }
        return this.props.children;
    };
    return LazyErrorBoundary;
}(React.Component));
// Enhanced lazy component with better error handling
var AdvancedLazyComponent = function (_a) {
    var importFunc = _a.importFunc, fallbackName = _a.fallbackName, errorFallback = _a.errorFallback, _b = _a.showProgress, showProgress = _b === void 0 ? false : _b, onLoad = _a.onLoad, props = __rest(_a, ["importFunc", "fallbackName", "errorFallback", "showProgress", "onLoad"]);
    var LazyComponent = withLazyLoading(importFunc, fallbackName, showProgress);
    useEffect(function () {
        // Track load time for performance monitoring
        var startTime = performance.now();
        return function () {
            if (onLoad) {
                var endTime = performance.now();
                onLoad();
            }
        };
    }, [onLoad]);
    return (_jsx(LazyErrorBoundary, { fallbackName: fallbackName, children: _jsx(Suspense, { fallback: _jsx(AdvancedLoadingFallback, { name: fallbackName, showProgress: showProgress }), children: _jsx(LazyComponent, __assign({}, props)) }) }));
};
export { AdvancedLazyComponent as Lazy, withLazyLoading, ConditionalLazyComponent, AdvancedLoadingFallback, preloadCriticalComponent, };

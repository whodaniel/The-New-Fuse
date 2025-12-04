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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
import { Logger } from '../../utils/logger';
import { performanceMonitor } from '../../utils/performance-monitor';
var logger = new Logger('ErrorBoundary');
var ErrorBoundary = /** @class */ (function (_super) {
    __extends(ErrorBoundary, _super);
    function ErrorBoundary(props) {
        var _this = _super.call(this, props) || this;
        _this.retryCount = 0;
        _this.maxRetries = 3;
        _this.handleRetry = function () {
            if (_this.retryCount < _this.maxRetries) {
                _this.retryCount++;
                logger.info("Retrying component render (attempt ".concat(_this.retryCount, "/").concat(_this.maxRetries, ")"), {
                    errorId: _this.state.errorId,
                });
                _this.setState({
                    hasError: false,
                    error: null,
                    errorInfo: null,
                    errorId: null
                });
            }
            else {
                logger.warn('Max retry attempts reached', { errorId: _this.state.errorId });
            }
        };
        _this.handleReload = function () {
            logger.info('User requested page reload', { errorId: _this.state.errorId });
            window.location.reload();
        };
        _this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: null
        };
        return _this;
    }
    ErrorBoundary.getDerivedStateFromError = function (error) {
        var errorId = "error-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9));
        return {
            hasError: true,
            error: error,
            errorId: errorId
        };
    };
    ErrorBoundary.prototype.componentDidCatch = function (error, errorInfo) {
        var _a, _b, _c;
        var errorData = {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
            errorInfo: {
                componentStack: errorInfo.componentStack,
            },
            errorId: this.state.errorId,
            retryCount: this.retryCount,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
        };
        // Log with enhanced structured logging
        logger.error('Component error caught', errorData);
        // Record performance impact
        performanceMonitor.recordMetric('error-boundary-catch', 1, {
            errorType: error.name,
            component: (_a = errorInfo.componentStack.split('\n')[1]) === null || _a === void 0 ? void 0 : _a.trim(),
        });
        // Call custom error handler if provided
        (_c = (_b = this.props).onError) === null || _c === void 0 ? void 0 : _c.call(_b, error, errorInfo);
        // Send to monitoring service
        if (typeof window !== 'undefined' && window.monitoring) {
            window.monitoring.captureException(error, errorData);
        }
        this.setState({ errorInfo: errorInfo });
    };
    ErrorBoundary.prototype.render = function () {
        var _a, _b;
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }
            var canRetry = this.retryCount < this.maxRetries;
            var isDevelopment = import.meta.env.DEV;
            return (_jsx("div", { className: "error-boundary min-h-[200px] p-8 bg-red-50 border border-red-200 rounded-lg", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-red-600 mb-4", children: _jsx("svg", { className: "w-12 h-12 mx-auto mb-4", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z", clipRule: "evenodd" }) }) }), _jsx("h2", { className: "text-xl font-semibold text-red-800 mb-2", children: "Something went wrong" }), _jsx("p", { className: "text-red-700 mb-4", children: ((_a = this.state.error) === null || _a === void 0 ? void 0 : _a.message) || 'An unexpected error occurred' }), isDevelopment && this.state.errorId && (_jsxs("p", { className: "text-sm text-red-600 mb-4 font-mono", children: ["Error ID: ", this.state.errorId] })), _jsxs("div", { className: "flex gap-3 justify-center", children: [canRetry && (_jsxs("button", { onClick: this.handleRetry, className: "px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors", children: ["Try Again (", this.maxRetries - this.retryCount, " attempts left)"] })), _jsx("button", { onClick: this.handleReload, className: "px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors", children: "Reload Page" })] }), isDevelopment && this.state.errorInfo && (_jsxs("details", { className: "mt-6 text-left", children: [_jsx("summary", { className: "cursor-pointer text-red-700 font-medium", children: "Technical Details (Development)" }), _jsxs("pre", { className: "mt-2 p-4 bg-red-100 rounded text-sm overflow-auto max-h-40", children: [(_b = this.state.error) === null || _b === void 0 ? void 0 : _b.stack, '\n\nComponent Stack:', this.state.errorInfo.componentStack] })] }))] }) }));
        }
        return this.props.children;
    };
    return ErrorBoundary;
}(Component));
export default ErrorBoundary;

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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Error Boundary Component
 *
 * @description
 * Catches JavaScript errors in component tree, logs them to error reporting service,
 * and displays a fallback UI instead of crashing the entire React application.
 *
 * This component provides comprehensive error handling with:
 * - Automatic error recovery
 * - Detailed error logging
 * - Customizable fallback UI
 * - Error reporting integration
 * - DevTools support for debugging
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={CustomErrorFallback}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 *
 * @since 1.0.0
 * @author Frontend Team
 * @see {@link https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary}
 */
import React, { Component, isValidElement } from 'react';
import { reportError } from '../services/error-tracking.service';
import { logger } from '../utils/logger';
import { Button } from './ui/Button';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';
// ============================================================================
// Error Boundary Component
// ============================================================================
/**
 * Default error fallback component
 */
export var DefaultErrorFallback = function (_a) {
    var error = _a.error, errorInfo = _a.errorInfo, resetError = _a.resetError, goHome = _a.goHome, reportError = _a.reportError, _b = _a.showDetails, showDetails = _b === void 0 ? false : _b;
    var _c = React.useState(false), isExpanded = _c[0], setIsExpanded = _c[1];
    var _d = React.useState(false), isReporting = _d[0], setIsReporting = _d[1];
    var handleReportError = function () { return __awaiter(void 0, void 0, void 0, function () {
        var reportError_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    setIsReporting(true);
                    return [4 /*yield*/, reportError(error, {
                            componentStack: errorInfo === null || errorInfo === void 0 ? void 0 : errorInfo.componentStack,
                            errorBoundary: true,
                        })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2:
                    reportError_1 = _a.sent();
                    console.error('Failed to report error:', reportError_1);
                    return [3 /*break*/, 4];
                case 3:
                    setIsReporting(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (_jsx("div", { className: "error-fallback", "data-testid": "error-fallback", children: _jsxs("div", { className: "error-fallback__content", children: [_jsx("div", { className: "error-fallback__icon", children: _jsx(AlertCircle, { size: 48, color: "var(--color-error)" }) }), _jsxs("div", { className: "error-fallback__header", children: [_jsx("h1", { className: "error-fallback__title", children: "Oops! Something went wrong" }), _jsx("p", { className: "error-fallback__subtitle", children: "We're sorry, but something unexpected happened. Please try refreshing the page." })] }), _jsxs("div", { className: "error-fallback__actions", children: [_jsxs(Button, { variant: "primary", onClick: resetError, className: "error-fallback__action", children: [_jsx(RefreshCw, { size: 16 }), "Try Again"] }), _jsxs(Button, { variant: "secondary", onClick: goHome, className: "error-fallback__action", children: [_jsx(Home, { size: 16 }), "Go Home"] }), _jsxs(Button, { variant: "tertiary", onClick: handleReportError, disabled: isReporting, className: "error-fallback__action", children: [_jsx(Bug, { size: 16 }), isReporting ? 'Reporting...' : 'Report Issue'] })] }), showDetails && process.env.NODE_ENV === 'development' && (_jsxs("div", { className: "error-fallback__details", children: [_jsxs("button", { onClick: function () { return setIsExpanded(!isExpanded); }, className: "error-fallback__toggle", children: [isExpanded ? 'Hide' : 'Show', " Error Details"] }), isExpanded && (_jsxs("div", { className: "error-fallback__stack", children: [_jsxs("div", { className: "error-fallback__error", children: [_jsx("h3", { children: "Error Message:" }), _jsx("pre", { children: error.message })] }), error.stack && (_jsxs("div", { className: "error-fallback__stack-trace", children: [_jsx("h3", { children: "Stack Trace:" }), _jsx("pre", { children: error.stack })] })), (errorInfo === null || errorInfo === void 0 ? void 0 : errorInfo.componentStack) && (_jsxs("div", { className: "error-fallback__component-stack", children: [_jsx("h3", { children: "Component Stack:" }), _jsx("pre", { children: errorInfo.componentStack })] }))] }))] }))] }) }));
};
// ============================================================================
// Main Error Boundary Component
// ============================================================================
/**
 * Comprehensive error boundary for React components
 *
 * @description
 * Provides robust error handling for React component trees with automatic
 * error reporting, customizable fallbacks, and development tooling support.
 *
 * @features
 * - Automatic error catching and handling
 * - Error reporting integration
 * - Customizable fallback UI
 * - Error recovery mechanisms
 * - Development debugging support
 * - Accessibility considerations
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * // With custom fallback
 * <ErrorBoundary
 *   fallback={CustomErrorComponent}
 *   errorReporting={{ enabled: true, level: 'error' }}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
var ErrorBoundary = /** @class */ (function (_super) {
    __extends(ErrorBoundary, _super);
    /**
     * Constructor
     *
     * @param props - Component props
     */
    function ErrorBoundary(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            hasError: false,
        };
        // Bind methods
        _this.handleResetError = _this.handleResetError.bind(_this);
        _this.handleGoHome = _this.handleGoHome.bind(_this);
        _this.handleReportError = _this.handleReportError.bind(_this);
        return _this;
    }
    /**
     * Update state when an error occurs
     *
     * @description
     * Static method called by React when an error occurs. Creates a new error ID
     * for tracking and logs the error for debugging purposes.
     *
     * @param error - The error that occurred
     * @returns New state with error information
     */
    ErrorBoundary.getDerivedStateFromError = function (error) {
        // Generate unique error ID for tracking
        var errorId = "error-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9));
        logger.error('Error Boundary caught an error', {
            errorId: errorId,
            message: error.message,
            stack: error.stack,
        });
        return {
            hasError: true,
            error: error,
            errorTime: new Date(),
            errorId: errorId,
        };
    };
    /**
     * Log error details to external services
     *
     * @description
     * Called by React when an error occurs and after getDerivedStateFromError.
     * Provides access to error information and component stack for debugging.
     *
     * @param error - The error that occurred
     * @param errorInfo - Additional error information including component stack
     */
    ErrorBoundary.prototype.componentDidCatch = function (error, errorInfo) {
        var errorReporting = this.props.errorReporting;
        // Update state with error info
        this.setState({ errorInfo: errorInfo });
        // Log error locally
        logger.error('Error Boundary caught an error', {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            errorId: this.state.errorId,
        });
        // Report to external service if enabled
        if (errorReporting === null || errorReporting === void 0 ? void 0 : errorReporting.enabled) {
            this.reportError(error, {
                errorInfo: errorInfo,
                level: errorReporting.level || 'error',
                context: errorReporting.context,
                componentStack: errorInfo.componentStack,
                errorBoundary: true,
            });
        }
        // In development, also log to console for easier debugging
        if (process.env.NODE_ENV === 'development') {
            console.group('🚨 Error Boundary Caught an Error');
            console.error('Error:', error);
            console.error('Error Info:', errorInfo);
            console.groupEnd();
        }
    };
    /**
     * Reset error state and retry rendering
     *
     * @description
     * Resets the error boundary state, clearing the error and allowing
     * the component tree to re-render. Useful for retry mechanisms.
     */
    ErrorBoundary.prototype.handleResetError = function () {
        this.setState({
            hasError: false,
            error: undefined,
            errorInfo: undefined,
            errorTime: undefined,
            errorId: undefined,
        });
    };
    /**
     * Navigate to home page
     *
     * @description
     * Navigate user to the home page, clearing the current error state.
     * Typically used in error fallbacks to provide a recovery path.
     */
    ErrorBoundary.prototype.handleGoHome = function () {
        this.handleResetError();
        window.location.href = '/';
    };
    /**
     * Report error to monitoring service
     *
     * @description
     * Manually report an error to the error reporting service. Can be called
     * from fallback UI or programmatically for additional error logging.
     *
     * @param error - Error to report
     * @param context - Additional context information
     */
    ErrorBoundary.prototype.handleReportError = function () {
        return __awaiter(this, arguments, void 0, function (error, context) {
            var errorReporting, reportingError_1;
            if (error === void 0) { error = this.state.error; }
            if (context === void 0) { context = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        errorReporting = this.props.errorReporting;
                        if (!(errorReporting === null || errorReporting === void 0 ? void 0 : errorReporting.enabled)) {
                            logger.warn('Error reporting is disabled');
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.reportError(error, context)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        reportingError_1 = _a.sent();
                        logger.error('Failed to report error to monitoring service', reportingError_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Internal method to report errors
     *
     * @private
     */
    ErrorBoundary.prototype.reportError = function (error, context) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, reportError(error, __assign(__assign({}, context), { errorBoundary: true, componentStack: context.componentStack || ((_a = this.state.errorInfo) === null || _a === void 0 ? void 0 : _a.componentStack) }))];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Render the error boundary
     *
     * @returns Component tree or error fallback
     */
    ErrorBoundary.prototype.render = function () {
        var _a = this.props, children = _a.children, _b = _a.fallback, FallbackComponent = _b === void 0 ? DefaultErrorFallback : _b, showDetails = _a.showDetails, className = _a.className, fallbackProps = _a.fallbackProps;
        var _c = this.state, hasError = _c.hasError, error = _c.error, errorInfo = _c.errorInfo, errorTime = _c.errorTime, errorId = _c.errorId;
        // If no error, render children normally
        if (!hasError) {
            return children;
        }
        // Validate that error exists before rendering fallback
        if (!error) {
            logger.error('Error boundary rendered without error object');
            return (_jsxs("div", { className: "error-fallback ".concat(className || ''), children: [_jsx("h1", { children: "Something went wrong" }), _jsx("p", { children: "An unknown error occurred." }), _jsx("button", { onClick: this.handleResetError, children: "Try Again" })] }));
        }
        // Check if fallback component is valid
        if (!isValidElement(FallbackComponent) && typeof FallbackComponent !== 'function') {
            logger.error('Invalid fallback component provided to ErrorBoundary');
            return _jsx(DefaultErrorFallback, __assign({}, this.getFallbackProps()));
        }
        // Render fallback component with error information
        var fallbackProps_to_pass = this.getFallbackProps();
        return (_jsx("div", { className: "error-boundary ".concat(className || ''), children: isValidElement(FallbackComponent) ? (React.cloneElement(FallbackComponent, fallbackProps_to_pass)) : (_jsx(FallbackComponent, __assign({}, fallbackProps_to_pass))) }));
    };
    /**
     * Get props to pass to fallback component
     *
     * @private
     * @returns Props for fallback component
     */
    ErrorBoundary.prototype.getFallbackProps = function () {
        var _a = this.state, error = _a.error, errorInfo = _a.errorInfo, errorTime = _a.errorTime, errorId = _a.errorId;
        var _b = this.props, showDetails = _b.showDetails, _c = _b.fallbackProps, fallbackProps = _c === void 0 ? {} : _c;
        return __assign({ error: error, errorInfo: errorInfo, errorTime: errorTime, errorId: errorId, showDetails: showDetails, resetError: this.handleResetError, goHome: this.handleGoHome, reportError: this.handleReportError }, fallbackProps);
    };
    /** Component display name for React DevTools */
    ErrorBoundary.displayName = 'ErrorBoundary';
    /** Default props for the component */
    ErrorBoundary.defaultProps = {
        fallback: DefaultErrorFallback,
        errorReporting: {
            enabled: true,
            level: 'error',
        },
        showDetails: false,
        className: '',
        fallbackProps: {},
    };
    return ErrorBoundary;
}(Component));
export { ErrorBoundary };
// ============================================================================
// CSS Styles (if using CSS modules or styled-components)
// ============================================================================
/*
.error-fallback {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 2rem;
  background: var(--color-surface);
  border-radius: var(--border-radius-lg);
  text-align: center;
}

.error-fallback__content {
  max-width: 500px;
}

.error-fallback__icon {
  margin-bottom: 1.5rem;
}

.error-fallback__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.error-fallback__subtitle {
  color: var(--color-text-secondary);
  margin-bottom: 2rem;
}

.error-fallback__actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.error-fallback__action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-fallback__details {
  margin-top: 2rem;
  text-align: left;
}

.error-fallback__toggle {
  background: none;
  border: 1px solid var(--color-border);
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  cursor: pointer;
  color: var(--color-text-secondary);
}

.error-fallback__stack {
  margin-top: 1rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 1rem;
  font-size: 0.875rem;
}

.error-fallback__stack pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: var(--font-mono);
  color: var(--color-text-secondary);
}
*/
// ============================================================================
// Export
// ============================================================================
export default ErrorBoundary;

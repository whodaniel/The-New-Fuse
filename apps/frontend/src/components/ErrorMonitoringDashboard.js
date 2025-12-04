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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Error Monitoring Dashboard
 *
 * @description
 * Real-time error monitoring dashboard for viewing, analyzing, and managing errors
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ErrorService } from '../core/services/ErrorService';
import { errorTracker } from '../services/error-tracking.service';
import { AlertCircle, AlertTriangle, Info, Bug, TrendingUp, TrendingDown, RefreshCw, Download, Trash2, Filter, Search, ChevronDown, ChevronUp, X, } from 'lucide-react';
// ============================================================================
// Main Component
// ============================================================================
export var ErrorMonitoringDashboard = function () {
    var _a;
    var _b = useState([]), errors = _b[0], setErrors = _b[1];
    var _c = useState(null), statistics = _c[0], setStatistics = _c[1];
    var _d = useState(true), isLoading = _d[0], setIsLoading = _d[1];
    var _e = useState(null), selectedError = _e[0], setSelectedError = _e[1];
    var _f = useState({
        search: '',
        severity: 'all',
        category: 'all',
        handled: 'all',
        timeRange: '24h',
    }), filters = _f[0], setFilters = _f[1];
    var _g = useState(false), showFilters = _g[0], setShowFilters = _g[1];
    var _h = useState(true), autoRefresh = _h[0], setAutoRefresh = _h[1];
    var errorService = ErrorService.getInstance();
    // ============================================================================
    // Data fetching
    // ============================================================================
    var fetchErrors = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var errorHistory, stats, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    errorHistory = errorService.getErrorHistory();
                    return [4 /*yield*/, errorService.getErrorStats()];
                case 1:
                    stats = _a.sent();
                    setErrors(errorHistory);
                    if (stats.success && stats.data) {
                        setStatistics(stats.data);
                    }
                    return [3 /*break*/, 4];
                case 2:
                    error_1 = _a.sent();
                    console.error('Failed to fetch errors:', error_1);
                    return [3 /*break*/, 4];
                case 3:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [errorService]);
    useEffect(function () {
        fetchErrors();
        // Set up subscription for real-time updates
        var unsubscribe = errorService.subscribeToErrors(function (error) {
            setErrors(function (prev) { return __spreadArray([error], prev, true).slice(0, 1000); });
            fetchErrors(); // Refresh statistics
        });
        // Auto-refresh every 30 seconds if enabled
        var refreshInterval = null;
        if (autoRefresh) {
            refreshInterval = setInterval(fetchErrors, 30000);
        }
        return function () {
            unsubscribe();
            if (refreshInterval)
                clearInterval(refreshInterval);
        };
    }, [fetchErrors, autoRefresh]);
    // ============================================================================
    // Filtering and sorting
    // ============================================================================
    var filteredErrors = useMemo(function () {
        return errors.filter(function (error) {
            // Search filter
            if (filters.search) {
                var searchLower = filters.search.toLowerCase();
                var matchesSearch = error.message.toLowerCase().includes(searchLower) ||
                    error.code.toLowerCase().includes(searchLower);
                if (!matchesSearch)
                    return false;
            }
            // Handled filter
            if (filters.handled !== 'all') {
                var isHandled = filters.handled === 'handled';
                if (error.handled !== isHandled)
                    return false;
            }
            // Time range filter
            if (filters.timeRange !== 'all') {
                var now = Date.now();
                var timeRanges = {
                    '1h': 60 * 60 * 1000,
                    '24h': 24 * 60 * 60 * 1000,
                    '7d': 7 * 24 * 60 * 60 * 1000,
                    '30d': 30 * 24 * 60 * 60 * 1000,
                };
                var range = timeRanges[filters.timeRange];
                if (now - error.timestamp > range)
                    return false;
            }
            return true;
        });
    }, [errors, filters]);
    // ============================================================================
    // Actions
    // ============================================================================
    var handleClearErrors = useCallback(function () {
        if (window.confirm('Are you sure you want to clear all error history?')) {
            errorService.clearHistory();
            setErrors([]);
            setSelectedError(null);
        }
    }, [errorService]);
    var handleExportErrors = useCallback(function () {
        var dataStr = JSON.stringify(filteredErrors, null, 2);
        var dataBlob = new Blob([dataStr], { type: 'application/json' });
        var url = URL.createObjectURL(dataBlob);
        var link = document.createElement('a');
        link.href = url;
        link.download = "errors-".concat(new Date().toISOString(), ".json");
        link.click();
        URL.revokeObjectURL(url);
    }, [filteredErrors]);
    var handleReportError = useCallback(function (error) {
        var _a;
        errorTracker.trackError(new Error(error.message), {
            category: (_a = error.context) === null || _a === void 0 ? void 0 : _a.category,
            metadata: error.context,
        });
    }, []);
    // ============================================================================
    // Render helpers
    // ============================================================================
    var getSeverityIcon = function (severity) {
        switch (severity) {
            case 'critical':
                return _jsx(AlertCircle, { className: "text-red-500", size: 16 });
            case 'high':
                return _jsx(AlertTriangle, { className: "text-orange-500", size: 16 });
            case 'medium':
                return _jsx(AlertTriangle, { className: "text-yellow-500", size: 16 });
            default:
                return _jsx(Info, { className: "text-blue-500", size: 16 });
        }
    };
    var getTrendIcon = function () {
        if (!(statistics === null || statistics === void 0 ? void 0 : statistics.trend))
            return null;
        switch (statistics.trend) {
            case 'up':
                return _jsx(TrendingUp, { className: "text-red-500", size: 20 });
            case 'down':
                return _jsx(TrendingDown, { className: "text-green-500", size: 20 });
            default:
                return null;
        }
    };
    // ============================================================================
    // Render
    // ============================================================================
    return (_jsxs("div", { className: "error-monitoring-dashboard", children: [_jsxs("div", { className: "dashboard-header", children: [_jsxs("div", { className: "header-content", children: [_jsxs("h1", { className: "dashboard-title", children: [_jsx(Bug, { size: 24 }), "Error Monitoring Dashboard"] }), _jsxs("div", { className: "header-actions", children: [_jsxs("button", { onClick: function () { return setShowFilters(!showFilters); }, className: "btn-secondary", "aria-label": "Toggle filters", children: [_jsx(Filter, { size: 16 }), "Filters"] }), _jsxs("button", { onClick: fetchErrors, className: "btn-secondary", "aria-label": "Refresh", children: [_jsx(RefreshCw, { size: 16 }), "Refresh"] }), _jsxs("button", { onClick: handleExportErrors, className: "btn-secondary", disabled: filteredErrors.length === 0, "aria-label": "Export errors", children: [_jsx(Download, { size: 16 }), "Export"] }), _jsxs("button", { onClick: handleClearErrors, className: "btn-danger", disabled: errors.length === 0, "aria-label": "Clear errors", children: [_jsx(Trash2, { size: 16 }), "Clear"] })] })] }), statistics && (_jsxs("div", { className: "statistics-grid", children: [_jsx(StatCard, { title: "Total Errors", value: statistics.total, icon: _jsx(Bug, { size: 20 }), trend: getTrendIcon() }), _jsx(StatCard, { title: "Handled", value: statistics.handled, icon: _jsx(Info, { size: 20, className: "text-green-500" }) }), _jsx(StatCard, { title: "Unhandled", value: statistics.unhandled, icon: _jsx(AlertCircle, { size: 20, className: "text-red-500" }) }), _jsx(StatCard, { title: "Error Rate", value: ((_a = statistics.errorRate) === null || _a === void 0 ? void 0 : _a.toFixed(2)) || '0', unit: "/min", icon: _jsx(TrendingUp, { size: 20 }) })] }))] }), showFilters && (_jsxs("div", { className: "filters-panel", children: [_jsxs("div", { className: "filter-group", children: [_jsxs("label", { htmlFor: "search", children: [_jsx(Search, { size: 16 }), "Search"] }), _jsx("input", { id: "search", type: "text", value: filters.search, onChange: function (e) { return setFilters(__assign(__assign({}, filters), { search: e.target.value })); }, placeholder: "Search errors..." })] }), _jsxs("div", { className: "filter-group", children: [_jsx("label", { htmlFor: "handled", children: "Status" }), _jsxs("select", { id: "handled", value: filters.handled, onChange: function (e) {
                                    return setFilters(__assign(__assign({}, filters), { handled: e.target.value }));
                                }, children: [_jsx("option", { value: "all", children: "All" }), _jsx("option", { value: "handled", children: "Handled" }), _jsx("option", { value: "unhandled", children: "Unhandled" })] })] }), _jsxs("div", { className: "filter-group", children: [_jsx("label", { htmlFor: "timeRange", children: "Time Range" }), _jsxs("select", { id: "timeRange", value: filters.timeRange, onChange: function (e) {
                                    return setFilters(__assign(__assign({}, filters), { timeRange: e.target.value }));
                                }, children: [_jsx("option", { value: "1h", children: "Last Hour" }), _jsx("option", { value: "24h", children: "Last 24 Hours" }), _jsx("option", { value: "7d", children: "Last 7 Days" }), _jsx("option", { value: "30d", children: "Last 30 Days" }), _jsx("option", { value: "all", children: "All Time" })] })] }), _jsx("div", { className: "filter-group", children: _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: autoRefresh, onChange: function (e) { return setAutoRefresh(e.target.checked); } }), "Auto-refresh"] }) })] })), _jsx("div", { className: "errors-container", children: isLoading ? (_jsxs("div", { className: "loading-state", children: [_jsx(RefreshCw, { className: "animate-spin", size: 32 }), _jsx("p", { children: "Loading errors..." })] })) : filteredErrors.length === 0 ? (_jsxs("div", { className: "empty-state", children: [_jsx(Bug, { size: 48 }), _jsx("h3", { children: "No errors found" }), _jsx("p", { children: errors.length === 0
                                ? 'No errors have been logged yet.'
                                : 'No errors match the current filters.' })] })) : (_jsx("div", { className: "error-list", children: filteredErrors.map(function (error, index) { return (_jsx(ErrorCard, { error: error, isSelected: selectedError === error, onSelect: function () {
                            return setSelectedError(selectedError === error ? null : error);
                        }, onReport: function () { return handleReportError(error); } }, "".concat(error.timestamp, "-").concat(index))); }) })) }), selectedError && (_jsx(ErrorDetailsModal, { error: selectedError, onClose: function () { return setSelectedError(null); } }))] }));
};
var StatCard = function (_a) {
    var title = _a.title, value = _a.value, unit = _a.unit, icon = _a.icon, trend = _a.trend;
    return (_jsxs("div", { className: "stat-card", children: [_jsxs("div", { className: "stat-header", children: [_jsx("span", { className: "stat-icon", children: icon }), trend && _jsx("span", { className: "stat-trend", children: trend })] }), _jsxs("div", { className: "stat-content", children: [_jsxs("div", { className: "stat-value", children: [value, unit && _jsx("span", { className: "stat-unit", children: unit })] }), _jsx("div", { className: "stat-title", children: title })] })] }));
};
var ErrorCard = function (_a) {
    var error = _a.error, isSelected = _a.isSelected, onSelect = _a.onSelect, onReport = _a.onReport;
    var formatTimestamp = function (timestamp) {
        var date = new Date(timestamp);
        return date.toLocaleString();
    };
    return (_jsxs("div", { className: "error-card ".concat(isSelected ? 'selected' : ''), children: [_jsxs("div", { className: "error-card-header", onClick: onSelect, children: [_jsxs("div", { className: "error-info", children: [_jsx("span", { className: "error-badge ".concat(error.handled ? 'handled' : 'unhandled'), children: error.handled ? 'Handled' : 'Unhandled' }), _jsx("span", { className: "error-code", children: error.code }), _jsx("span", { className: "error-timestamp", children: formatTimestamp(error.timestamp) })] }), isSelected ? _jsx(ChevronUp, { size: 20 }) : _jsx(ChevronDown, { size: 20 })] }), _jsx("div", { className: "error-message", children: error.message }), isSelected && (_jsxs("div", { className: "error-details", children: [error.stack && (_jsxs("div", { className: "error-stack", children: [_jsx("h4", { children: "Stack Trace:" }), _jsx("pre", { children: error.stack })] })), error.context && (_jsxs("div", { className: "error-context", children: [_jsx("h4", { children: "Context:" }), _jsx("pre", { children: JSON.stringify(error.context, null, 2) })] })), _jsx("div", { className: "error-actions", children: _jsx("button", { onClick: onReport, className: "btn-primary", children: "Report to Sentry" }) })] }))] }));
};
var ErrorDetailsModal = function (_a) {
    var error = _a.error, onClose = _a.onClose;
    return (_jsx("div", { className: "modal-overlay", onClick: onClose, children: _jsxs("div", { className: "modal-content", onClick: function (e) { return e.stopPropagation(); }, children: [_jsxs("div", { className: "modal-header", children: [_jsx("h2", { children: "Error Details" }), _jsx("button", { onClick: onClose, className: "modal-close", "aria-label": "Close", children: _jsx(X, { size: 24 }) })] }), _jsxs("div", { className: "modal-body", children: [_jsxs("div", { className: "detail-section", children: [_jsx("h3", { children: "Error Code" }), _jsx("code", { children: error.code })] }), _jsxs("div", { className: "detail-section", children: [_jsx("h3", { children: "Message" }), _jsx("p", { children: error.message })] }), _jsxs("div", { className: "detail-section", children: [_jsx("h3", { children: "Timestamp" }), _jsx("p", { children: new Date(error.timestamp).toLocaleString() })] }), error.stack && (_jsxs("div", { className: "detail-section", children: [_jsx("h3", { children: "Stack Trace" }), _jsx("pre", { className: "stack-trace", children: error.stack })] })), error.context && (_jsxs("div", { className: "detail-section", children: [_jsx("h3", { children: "Context" }), _jsx("pre", { className: "context-data", children: JSON.stringify(error.context, null, 2) })] }))] })] }) }));
};
// ============================================================================
// Styles
// ============================================================================
var styles = "\n.error-monitoring-dashboard {\n  padding: 2rem;\n  max-width: 1400px;\n  margin: 0 auto;\n}\n\n.dashboard-header {\n  margin-bottom: 2rem;\n}\n\n.header-content {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 1.5rem;\n}\n\n.dashboard-title {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  font-size: 1.75rem;\n  font-weight: 600;\n  margin: 0;\n}\n\n.header-actions {\n  display: flex;\n  gap: 0.75rem;\n}\n\n.statistics-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));\n  gap: 1rem;\n  margin-top: 1.5rem;\n}\n\n.stat-card {\n  background: white;\n  border: 1px solid #e5e7eb;\n  border-radius: 0.5rem;\n  padding: 1.25rem;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);\n}\n\n.stat-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 0.75rem;\n}\n\n.stat-value {\n  font-size: 2rem;\n  font-weight: 700;\n  margin-bottom: 0.25rem;\n}\n\n.stat-unit {\n  font-size: 1rem;\n  color: #6b7280;\n  margin-left: 0.25rem;\n}\n\n.stat-title {\n  color: #6b7280;\n  font-size: 0.875rem;\n}\n\n.filters-panel {\n  background: white;\n  border: 1px solid #e5e7eb;\n  border-radius: 0.5rem;\n  padding: 1.5rem;\n  margin-bottom: 1.5rem;\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));\n  gap: 1rem;\n}\n\n.filter-group label {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  font-weight: 500;\n  margin-bottom: 0.5rem;\n}\n\n.filter-group input[type=\"text\"],\n.filter-group select {\n  width: 100%;\n  padding: 0.5rem;\n  border: 1px solid #d1d5db;\n  border-radius: 0.375rem;\n}\n\n.errors-container {\n  background: white;\n  border: 1px solid #e5e7eb;\n  border-radius: 0.5rem;\n  min-height: 400px;\n}\n\n.error-list {\n  padding: 1rem;\n}\n\n.error-card {\n  border: 1px solid #e5e7eb;\n  border-radius: 0.375rem;\n  padding: 1rem;\n  margin-bottom: 0.75rem;\n  transition: all 0.2s;\n  cursor: pointer;\n}\n\n.error-card:hover {\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);\n}\n\n.error-card.selected {\n  border-color: #3b82f6;\n  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);\n}\n\n.error-card-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 0.5rem;\n}\n\n.error-info {\n  display: flex;\n  gap: 0.75rem;\n  align-items: center;\n}\n\n.error-badge {\n  padding: 0.25rem 0.75rem;\n  border-radius: 9999px;\n  font-size: 0.75rem;\n  font-weight: 600;\n}\n\n.error-badge.handled {\n  background: #d1fae5;\n  color: #065f46;\n}\n\n.error-badge.unhandled {\n  background: #fee2e2;\n  color: #991b1b;\n}\n\n.error-code {\n  font-family: monospace;\n  font-size: 0.875rem;\n  color: #6b7280;\n}\n\n.error-timestamp {\n  font-size: 0.875rem;\n  color: #9ca3af;\n}\n\n.error-message {\n  color: #374151;\n  margin-bottom: 0.5rem;\n}\n\n.error-details {\n  margin-top: 1rem;\n  padding-top: 1rem;\n  border-top: 1px solid #e5e7eb;\n}\n\n.error-stack,\n.error-context {\n  margin-bottom: 1rem;\n}\n\n.error-stack pre,\n.error-context pre {\n  background: #f9fafb;\n  padding: 1rem;\n  border-radius: 0.375rem;\n  overflow-x: auto;\n  font-size: 0.875rem;\n}\n\n.error-actions {\n  display: flex;\n  gap: 0.75rem;\n  margin-top: 1rem;\n}\n\n.loading-state,\n.empty-state {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  padding: 4rem 2rem;\n  color: #6b7280;\n}\n\n.empty-state h3 {\n  margin: 1rem 0 0.5rem;\n  color: #374151;\n}\n\n.modal-overlay {\n  position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  background: rgba(0, 0, 0, 0.5);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  z-index: 1000;\n}\n\n.modal-content {\n  background: white;\n  border-radius: 0.5rem;\n  max-width: 800px;\n  width: 90%;\n  max-height: 90vh;\n  overflow-y: auto;\n}\n\n.modal-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 1.5rem;\n  border-bottom: 1px solid #e5e7eb;\n}\n\n.modal-close {\n  background: none;\n  border: none;\n  cursor: pointer;\n  padding: 0.25rem;\n}\n\n.modal-body {\n  padding: 1.5rem;\n}\n\n.detail-section {\n  margin-bottom: 1.5rem;\n}\n\n.detail-section h3 {\n  font-size: 0.875rem;\n  font-weight: 600;\n  color: #6b7280;\n  margin-bottom: 0.5rem;\n  text-transform: uppercase;\n}\n\n.detail-section code {\n  background: #f9fafb;\n  padding: 0.25rem 0.5rem;\n  border-radius: 0.25rem;\n  font-family: monospace;\n}\n\n.stack-trace,\n.context-data {\n  background: #f9fafb;\n  padding: 1rem;\n  border-radius: 0.375rem;\n  overflow-x: auto;\n  font-size: 0.875rem;\n  font-family: monospace;\n}\n\n.btn-primary,\n.btn-secondary,\n.btn-danger {\n  display: inline-flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.5rem 1rem;\n  border-radius: 0.375rem;\n  font-weight: 500;\n  cursor: pointer;\n  transition: all 0.2s;\n  border: none;\n}\n\n.btn-primary {\n  background: #3b82f6;\n  color: white;\n}\n\n.btn-primary:hover {\n  background: #2563eb;\n}\n\n.btn-secondary {\n  background: white;\n  color: #374151;\n  border: 1px solid #d1d5db;\n}\n\n.btn-secondary:hover {\n  background: #f9fafb;\n}\n\n.btn-danger {\n  background: #ef4444;\n  color: white;\n}\n\n.btn-danger:hover {\n  background: #dc2626;\n}\n\n.btn-primary:disabled,\n.btn-secondary:disabled,\n.btn-danger:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n\n@keyframes spin {\n  from { transform: rotate(0deg); }\n  to { transform: rotate(360deg); }\n}\n\n.animate-spin {\n  animation: spin 1s linear infinite;\n}\n";
// Inject styles
if (typeof document !== 'undefined') {
    var styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
}
export default ErrorMonitoringDashboard;

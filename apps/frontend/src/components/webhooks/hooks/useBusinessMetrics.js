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
import { useState, useCallback, useEffect } from 'react';
export function useBusinessMetrics(initialFilter) {
    var _this = this;
    if (initialFilter === void 0) { initialFilter = { timeRange: '24h' }; }
    var _a = useState({
        metrics: null,
        loading: false,
        error: null,
        lastUpdated: null,
    }), state = _a[0], setState = _a[1];
    var _b = useState(initialFilter), filter = _b[0], setFilter = _b[1];
    var apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    var getAuthHeaders = useCallback(function () {
        var token = localStorage.getItem('authToken');
        return {
            'Content-Type': 'application/json',
            'Authorization': "Bearer ".concat(token),
        };
    }, []);
    var buildQueryParams = useCallback(function (filter) {
        var params = new URLSearchParams();
        params.append('timeRange', filter.timeRange);
        if (filter.startDate && filter.endDate) {
            params.append('startDate', filter.startDate.toISOString());
            params.append('endDate', filter.endDate.toISOString());
        }
        if (filter.eventTypes && filter.eventTypes.length > 0) {
            params.append('eventTypes', filter.eventTypes.join(','));
        }
        if (filter.sources && filter.sources.length > 0) {
            params.append('sources', filter.sources.join(','));
        }
        return params.toString();
    }, []);
    var loadMetrics = useCallback(function (currentFilter) { return __awaiter(_this, void 0, void 0, function () {
        var activeFilter, queryParams, response, metrics_1, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    activeFilter = currentFilter || filter;
                    setState(function (prev) { return (__assign(__assign({}, prev), { loading: true, error: null })); });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    queryParams = buildQueryParams(activeFilter);
                    return [4 /*yield*/, fetch("".concat(apiBaseUrl, "/webhooks/analytics/metrics?").concat(queryParams), {
                            headers: getAuthHeaders(),
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("HTTP ".concat(response.status, ": ").concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    metrics_1 = _a.sent();
                    setState(function (prev) { return (__assign(__assign({}, prev), { metrics: metrics_1, loading: false, lastUpdated: new Date() })); });
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error('Failed to load business metrics:', error_1);
                    setState(function (prev) { return (__assign(__assign({}, prev), { error: error_1 instanceof Error ? error_1.message : 'Failed to load metrics', loading: false })); });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [filter, buildQueryParams, apiBaseUrl, getAuthHeaders]);
    var updateFilter = useCallback(function (newFilter) {
        var updatedFilter = __assign(__assign({}, filter), newFilter);
        setFilter(updatedFilter);
        loadMetrics(updatedFilter);
    }, [filter, loadMetrics]);
    var refreshMetrics = useCallback(function () {
        loadMetrics();
    }, [loadMetrics]);
    // Derived data calculations
    var getEventTypePercentages = useCallback(function () {
        if (!state.metrics)
            return {};
        var total = state.metrics.totalEvents;
        if (total === 0)
            return {};
        var percentages = {};
        Object.entries(state.metrics.eventsByType).forEach(function (_a) {
            var type = _a[0], count = _a[1];
            percentages[type] = (count / total) * 100;
        });
        return percentages;
    }, [state.metrics]);
    var getSourcePercentages = useCallback(function () {
        if (!state.metrics)
            return {};
        var total = state.metrics.totalEvents;
        if (total === 0)
            return {};
        var percentages = {};
        Object.entries(state.metrics.eventsBySource).forEach(function (_a) {
            var source = _a[0], count = _a[1];
            percentages[source] = (count / total) * 100;
        });
        return percentages;
    }, [state.metrics]);
    var getTopEventTypes = useCallback(function (limit) {
        if (limit === void 0) { limit = 5; }
        if (!state.metrics)
            return [];
        var percentages = getEventTypePercentages();
        return Object.entries(state.metrics.eventsByType)
            .map(function (_a) {
            var type = _a[0], count = _a[1];
            return ({
                type: type,
                count: count,
                percentage: percentages[type] || 0,
            });
        })
            .sort(function (a, b) { return b.count - a.count; })
            .slice(0, limit);
    }, [state.metrics, getEventTypePercentages]);
    var getTopSources = useCallback(function (limit) {
        if (limit === void 0) { limit = 5; }
        if (!state.metrics)
            return [];
        var percentages = getSourcePercentages();
        return Object.entries(state.metrics.eventsBySource)
            .map(function (_a) {
            var source = _a[0], count = _a[1];
            return ({
                source: source,
                count: count,
                percentage: percentages[source] || 0,
            });
        })
            .sort(function (a, b) { return b.count - a.count; })
            .slice(0, limit);
    }, [state.metrics, getSourcePercentages]);
    var getHealthScore = useCallback(function () {
        if (!state.metrics)
            return 0;
        var _a = state.metrics, errorRate = _a.errorRate, processingLatency = _a.processingLatency, activeIntegrations = _a.activeIntegrations;
        // Calculate health score based on multiple factors
        var score = 100;
        // Error rate impact (0-40 points deduction)
        score -= Math.min(errorRate * 4, 40);
        // Latency impact (0-30 points deduction)
        var latencyPenalty = Math.min((processingLatency.avg - 100) / 50, 30);
        if (latencyPenalty > 0) {
            score -= latencyPenalty;
        }
        // Active integrations boost (more integrations = better score up to a point)
        var integrationBonus = Math.min(activeIntegrations * 2, 10);
        score += integrationBonus;
        return Math.max(0, Math.min(100, score));
    }, [state.metrics]);
    var getPerformanceGrade = useCallback(function () {
        var healthScore = getHealthScore();
        if (healthScore >= 90)
            return 'A';
        if (healthScore >= 80)
            return 'B';
        if (healthScore >= 70)
            return 'C';
        if (healthScore >= 60)
            return 'D';
        return 'F';
    }, [getHealthScore]);
    var getRevenueGrowth = useCallback(function () {
        // This would need historical data to calculate growth
        // For now, return a placeholder that could be implemented with time-series data
        return 0;
    }, []);
    // Auto-refresh metrics periodically
    useEffect(function () {
        var interval = setInterval(function () {
            if (!state.loading) {
                loadMetrics();
            }
        }, 60000); // Refresh every minute
        return function () { return clearInterval(interval); };
    }, [state.loading, loadMetrics]);
    // Load initial metrics
    useEffect(function () {
        loadMetrics();
    }, [loadMetrics]);
    return __assign(__assign({}, state), { filter: filter, 
        // Actions
        loadMetrics: loadMetrics, updateFilter: updateFilter, refreshMetrics: refreshMetrics, 
        // Computed values
        getEventTypePercentages: getEventTypePercentages, getSourcePercentages: getSourcePercentages, getTopEventTypes: getTopEventTypes, getTopSources: getTopSources, getHealthScore: getHealthScore, getPerformanceGrade: getPerformanceGrade, getRevenueGrowth: getRevenueGrowth });
}

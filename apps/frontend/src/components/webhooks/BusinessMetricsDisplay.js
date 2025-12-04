var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from '@the-new-fuse/ui-consolidated';
import { Badge } from '@the-new-fuse/ui-consolidated';
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Activity, AlertTriangle, CheckCircle, Clock, BarChart3, } from 'lucide-react';
export function BusinessMetricsDisplay(_a) {
    var metrics = _a.metrics, _b = _a.loading, loading = _b === void 0 ? false : _b, _c = _a.compact, compact = _c === void 0 ? false : _c, className = _a.className;
    var formatCurrency = function (amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };
    var formatNumber = function (num) {
        if (num >= 1000000) {
            return "".concat((num / 1000000).toFixed(1), "M");
        }
        if (num >= 1000) {
            return "".concat((num / 1000).toFixed(1), "K");
        }
        return num.toString();
    };
    var formatPercentage = function (value) {
        return "".concat((value * 100).toFixed(1), "%");
    };
    var getHealthScoreColor = function (score) {
        if (score >= 90)
            return 'text-green-600';
        if (score >= 80)
            return 'text-blue-600';
        if (score >= 70)
            return 'text-yellow-600';
        if (score >= 60)
            return 'text-orange-600';
        return 'text-red-600';
    };
    var getHealthScoreIcon = function (score) {
        if (score >= 90)
            return _jsx(CheckCircle, { className: "w-5 h-5 text-green-600" });
        if (score >= 70)
            return _jsx(Activity, { className: "w-5 h-5 text-yellow-600" });
        return _jsx(AlertTriangle, { className: "w-5 h-5 text-red-600" });
    };
    if (loading) {
        return (_jsx("div", { className: "space-y-6 ".concat(className), children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: __spreadArray([], Array(4), true).map(function (_, i) { return (_jsx(Card, { className: "animate-pulse", children: _jsxs(CardContent, { className: "p-6", children: [_jsx("div", { className: "h-4 bg-gray-200 rounded w-3/4 mb-2" }), _jsx("div", { className: "h-8 bg-gray-200 rounded w-1/2 mb-2" }), _jsx("div", { className: "h-3 bg-gray-200 rounded w-full" })] }) }, i)); }) }) }));
    }
    if (!metrics) {
        return (_jsx(Card, { className: className, children: _jsxs(CardContent, { className: "p-8 text-center", children: [_jsx(BarChart3, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "No Metrics Available" }), _jsx("p", { className: "text-gray-500", children: "Business metrics will appear here once webhook events are processed" })] }) }));
    }
    var topEventTypes = Object.entries(metrics.eventsByType)
        .map(function (_a) {
        var type = _a[0], count = _a[1];
        return ({
            type: type,
            count: count,
            percentage: (count / metrics.totalEvents) * 100,
        });
    })
        .sort(function (a, b) { return b.count - a.count; })
        .slice(0, compact ? 3 : 5);
    var topSources = Object.entries(metrics.eventsBySource)
        .map(function (_a) {
        var source = _a[0], count = _a[1];
        return ({
            source: source,
            count: count,
            percentage: (count / metrics.totalEvents) * 100,
        });
    })
        .sort(function (a, b) { return b.count - a.count; })
        .slice(0, compact ? 3 : 5);
    return (_jsxs("div", { className: "space-y-6 ".concat(className), children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Total Revenue" }), _jsx(DollarSign, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: formatCurrency(metrics.revenueMetrics.totalRevenue) }), _jsx("p", { className: "text-xs text-muted-foreground", children: metrics.revenueMetrics.averageOrderValue > 0 && (_jsxs(_Fragment, { children: ["Avg: ", formatCurrency(metrics.revenueMetrics.averageOrderValue)] })) })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Active Customers" }), _jsx(Users, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: formatNumber(metrics.customerMetrics.activeCustomers) }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [metrics.customerMetrics.newCustomers, " new this period"] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Total Orders" }), _jsx(ShoppingCart, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: formatNumber(metrics.totalEvents) }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [formatPercentage(1 - metrics.errorRate), " success rate"] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "System Health" }), getHealthScoreIcon(metrics.processingLatency.avg < 1000 ? 95 : 75)] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold ".concat(getHealthScoreColor(metrics.processingLatency.avg < 1000 ? 95 : 75)), children: metrics.processingLatency.avg < 1000 ? '95%' : '75%' }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [metrics.processingLatency.avg.toFixed(0), "ms avg latency"] })] })] })] }), !compact && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Performance Metrics" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-medium", children: "Error Rate" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-sm font-bold ".concat(metrics.errorRate < 0.01 ? 'text-green-600' :
                                                                    metrics.errorRate < 0.05 ? 'text-yellow-600' : 'text-red-600'), children: formatPercentage(metrics.errorRate) }), metrics.errorRate < 0.01 ? (_jsx(TrendingDown, { className: "w-4 h-4 text-green-600" })) : (_jsx(TrendingUp, { className: "w-4 h-4 text-red-600" }))] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-medium", children: "Avg Latency" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("span", { className: "text-sm font-bold", children: [metrics.processingLatency.avg.toFixed(0), "ms"] }), _jsxs(Badge, { variant: "outline", className: "text-xs", children: ["Max: ", metrics.processingLatency.max.toFixed(0), "ms"] })] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-medium", children: "Active Integrations" }), _jsx("span", { className: "text-sm font-bold", children: metrics.activeIntegrations })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-medium", children: "Events/Hour" }), _jsx("span", { className: "text-sm font-bold", children: formatNumber(Math.round(metrics.totalEvents / 24)) })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Revenue Breakdown" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-medium", children: "Total Revenue" }), _jsx("span", { className: "text-lg font-bold", children: formatCurrency(metrics.revenueMetrics.totalRevenue) })] }), metrics.revenueMetrics.averageOrderValue > 0 && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-medium", children: "Average Order Value" }), _jsx("span", { className: "text-sm font-bold", children: formatCurrency(metrics.revenueMetrics.averageOrderValue) })] })), metrics.revenueMetrics.recurringRevenue > 0 && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-medium", children: "Recurring Revenue" }), _jsx("span", { className: "text-sm font-bold", children: formatCurrency(metrics.revenueMetrics.recurringRevenue) })] })), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-medium", children: "Customer Lifetime Value" }), _jsx("span", { className: "text-sm font-bold", children: formatCurrency(metrics.customerMetrics.lifetimeValue) })] })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Top Event Types" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-3", children: topEventTypes.map(function (_a) {
                                                var type = _a.type, count = _a.count, percentage = _a.percentage;
                                                return (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "flex items-center space-x-2", children: _jsx("span", { className: "text-sm font-medium", children: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, function (l) { return l.toUpperCase(); }) }) }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("span", { className: "text-sm text-muted-foreground", children: [count, " (", percentage.toFixed(1), "%)"] }), _jsx("div", { className: "w-16 bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-blue-600 h-2 rounded-full", style: { width: "".concat(Math.min(percentage, 100), "%") } }) })] })] }, type));
                                            }) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Top Integration Sources" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-3", children: topSources.map(function (_a) {
                                                var source = _a.source, count = _a.count, percentage = _a.percentage;
                                                return (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "flex items-center space-x-2", children: _jsx("span", { className: "text-sm font-medium", children: source }) }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("span", { className: "text-sm text-muted-foreground", children: [count, " (", percentage.toFixed(1), "%)"] }), _jsx("div", { className: "w-16 bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-green-600 h-2 rounded-full", style: { width: "".concat(Math.min(percentage, 100), "%") } }) })] })] }, source));
                                            }) }) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Customer Analytics" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: formatNumber(metrics.customerMetrics.activeCustomers) }), _jsx("div", { className: "text-sm text-muted-foreground", children: "Active Customers" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: formatNumber(metrics.customerMetrics.newCustomers) }), _jsx("div", { className: "text-sm text-muted-foreground", children: "New Customers" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-purple-600", children: formatCurrency(metrics.customerMetrics.lifetimeValue) }), _jsx("div", { className: "text-sm text-muted-foreground", children: "Avg Customer LTV" })] })] }) })] })] })), compact && (_jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsxs("span", { className: "text-muted-foreground", children: ["Last updated: ", new Date().toLocaleTimeString()] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("span", { className: "flex items-center space-x-1", children: [_jsx(Clock, { className: "w-3 h-3" }), _jsxs("span", { children: [metrics.processingLatency.avg.toFixed(0), "ms avg"] })] }), _jsxs(Badge, { variant: metrics.errorRate < 0.01 ? 'default' : 'destructive', children: [formatPercentage(metrics.errorRate), " errors"] })] })] }) }) }))] }));
}

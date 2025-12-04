import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@the-new-fuse/ui-consolidated';
import { Button } from '@the-new-fuse/ui-consolidated';
import { Badge } from '@the-new-fuse/ui-consolidated';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@the-new-fuse/ui-consolidated';
import { Activity, Plus, Settings, TrendingUp, AlertTriangle, CheckCircle, BarChart3, } from 'lucide-react';
import { useWebhookManagement } from './hooks/useWebhookManagement';
import { useBusinessMetrics } from './hooks/useBusinessMetrics';
import { useSSEConnection } from './hooks/useSSEConnection';
import { WebhookConfigurationForm } from './WebhookConfigurationForm';
import { IntegrationStatusGrid } from './IntegrationStatusGrid';
import { RealtimeEventStream } from './RealtimeEventStream';
import { BusinessMetricsDisplay } from './BusinessMetricsDisplay';
import { WebhookDeliveryLogs } from './WebhookDeliveryLogs';
export function WebhookDashboard(_a) {
    var className = _a.className;
    var _b = useState('overview'), activeTab = _b[0], setActiveTab = _b[1];
    var _c = useState(false), showNewWebhookForm = _c[0], setShowNewWebhookForm = _c[1];
    var _d = useWebhookManagement(), configurations = _d.configurations, webhookLoading = _d.loading, webhookError = _d.error, getActiveConfigurations = _d.getActiveConfigurations, getFailedDeliveries = _d.getFailedDeliveries;
    var _e = useBusinessMetrics(), metrics = _e.metrics, metricsLoading = _e.loading, getHealthScore = _e.getHealthScore, getPerformanceGrade = _e.getPerformanceGrade;
    var _f = useSSEConnection(), connectionState = _f.connectionState, latestEvent = _f.latestEvent;
    var activeConfigurations = getActiveConfigurations();
    var failedDeliveries = getFailedDeliveries();
    var healthScore = getHealthScore();
    var performanceGrade = getPerformanceGrade();
    var getStatusColor = function (status) {
        switch (status) {
            case 'active':
            case 'connected':
                return 'bg-green-100 text-green-800';
            case 'inactive':
            case 'disconnected':
                return 'bg-red-100 text-red-800';
            case 'warning':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
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
    return (_jsxs("div", { className: "space-y-6 ".concat(className), children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Webhook Dashboard" }), _jsx("p", { className: "text-muted-foreground", children: "Monitor and manage your business integrations and real-time events" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs(Badge, { className: getStatusColor(connectionState.isConnected ? 'connected' : 'disconnected'), children: [_jsx(Activity, { className: "w-3 h-3 mr-1" }), connectionState.isConnected ? 'Live' : 'Offline'] }), _jsxs(Button, { onClick: function () { return setShowNewWebhookForm(true); }, className: "bg-blue-600 hover:bg-blue-700", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Add Integration"] }), _jsxs(Button, { variant: "outline", children: [_jsx(Settings, { className: "w-4 h-4 mr-2" }), "Settings"] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Active Integrations" }), _jsx(CheckCircle, { className: "h-4 w-4 text-green-600" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: activeConfigurations.length }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [configurations.length, " total configured"] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Events Today" }), _jsx(BarChart3, { className: "h-4 w-4 text-blue-600" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: metricsLoading ? '...' : formatNumber((metrics === null || metrics === void 0 ? void 0 : metrics.totalEvents) || 0) }), _jsx("p", { className: "text-xs text-muted-foreground", children: (metrics === null || metrics === void 0 ? void 0 : metrics.revenueMetrics.totalRevenue)
                                            ? "$".concat(formatNumber(metrics.revenueMetrics.totalRevenue), " revenue")
                                            : 'No revenue data' })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Health Score" }), _jsx(TrendingUp, { className: "h-4 w-4 text-emerald-600" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: metricsLoading ? '...' : "".concat(Math.round(healthScore), "% (").concat(performanceGrade, ")") }), _jsx("p", { className: "text-xs text-muted-foreground", children: (metrics === null || metrics === void 0 ? void 0 : metrics.errorRate) ? "".concat((metrics.errorRate * 100).toFixed(1), "% error rate") : 'No errors' })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Failed Deliveries" }), _jsx(AlertTriangle, { className: "h-4 w-4 text-red-600" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: failedDeliveries.length }), _jsx("p", { className: "text-xs text-muted-foreground", children: latestEvent ? "Last event: ".concat(new Date(latestEvent.timestamp).toLocaleTimeString()) : 'No recent events' })] })] })] }), _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "space-y-4", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-5", children: [_jsx(TabsTrigger, { value: "overview", children: "Overview" }), _jsx(TabsTrigger, { value: "integrations", children: "Integrations" }), _jsx(TabsTrigger, { value: "events", children: "Live Events" }), _jsx(TabsTrigger, { value: "analytics", children: "Analytics" }), _jsx(TabsTrigger, { value: "logs", children: "Delivery Logs" })] }), _jsxs(TabsContent, { value: "overview", className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Integration Status" }) }), _jsx(CardContent, { children: _jsx(IntegrationStatusGrid, { configurations: configurations, loading: webhookLoading }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Recent Activity" }) }), _jsx(CardContent, { children: _jsx(RealtimeEventStream, { maxEvents: 5, showFilters: false }) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Business Metrics Overview" }) }), _jsx(CardContent, { children: _jsx(BusinessMetricsDisplay, { metrics: metrics, loading: metricsLoading, compact: true }) })] })] }), _jsx(TabsContent, { value: "integrations", children: _jsx(IntegrationStatusGrid, { configurations: configurations, loading: webhookLoading, showActions: true, showDetails: true }) }), _jsx(TabsContent, { value: "events", children: _jsx(RealtimeEventStream, { showFilters: true, showMetrics: true }) }), _jsx(TabsContent, { value: "analytics", children: _jsx(BusinessMetricsDisplay, { metrics: metrics, loading: metricsLoading, compact: false }) }), _jsx(TabsContent, { value: "logs", children: _jsx(WebhookDeliveryLogs, {}) })] }), webhookError && (_jsx(Card, { className: "border-red-200 bg-red-50", children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx(AlertTriangle, { className: "h-4 w-4 text-red-600 mr-2" }), _jsx("span", { className: "text-red-800", children: webhookError })] }) }) })), showNewWebhookForm && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: _jsx("div", { className: "bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto", children: _jsx(WebhookConfigurationForm, { onSuccess: function () { return setShowNewWebhookForm(false); }, onCancel: function () { return setShowNewWebhookForm(false); } }) }) }))] }));
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, RefreshCw, CheckCircle, AlertTriangle, Siren, TrendingUp, TrendingDown, ArrowRight, Plug, Database, Zap, Search, Mail, Save, BarChart, Settings, Wrench, } from 'lucide-react';
export default function SystemHealth() {
    var _a = useState([]), metrics = _a[0], setMetrics = _a[1];
    var _b = useState([]), services = _b[0], setServices = _b[1];
    var _c = useState(true), loading = _c[0], setLoading = _c[1];
    var _d = useState(new Date()), lastRefresh = _d[0], setLastRefresh = _d[1];
    // Mock data - replace with real API calls
    useEffect(function () {
        var fetchData = function () {
            setTimeout(function () {
                setMetrics([
                    {
                        name: 'CPU Usage',
                        value: 45,
                        unit: '%',
                        status: 'healthy',
                        threshold: { warning: 70, critical: 90 },
                        trend: 'stable'
                    },
                    {
                        name: 'Memory Usage',
                        value: 68,
                        unit: '%',
                        status: 'warning',
                        threshold: { warning: 65, critical: 85 },
                        trend: 'up'
                    },
                    {
                        name: 'Disk Usage',
                        value: 34,
                        unit: '%',
                        status: 'healthy',
                        threshold: { warning: 80, critical: 95 },
                        trend: 'stable'
                    },
                    {
                        name: 'Active Connections',
                        value: 1247,
                        unit: 'conn',
                        status: 'healthy',
                        threshold: { warning: 2000, critical: 3000 },
                        trend: 'up'
                    },
                    {
                        name: 'Response Time',
                        value: 145,
                        unit: 'ms',
                        status: 'healthy',
                        threshold: { warning: 200, critical: 500 },
                        trend: 'down'
                    },
                    {
                        name: 'Error Rate',
                        value: 0.8,
                        unit: '%',
                        status: 'healthy',
                        threshold: { warning: 2, critical: 5 },
                        trend: 'stable'
                    }
                ]);
                setServices([
                    {
                        name: 'API Gateway',
                        status: 'online',
                        uptime: '99.9% (7d)',
                        lastChecked: new Date().toISOString(),
                        responseTime: 95,
                        version: '2.1.0',
                        endpoint: 'https://api.thenewfuse.com'
                    },
                    {
                        name: 'Backend API',
                        status: 'online',
                        uptime: '99.8% (7d)',
                        lastChecked: new Date().toISOString(),
                        responseTime: 120,
                        version: '1.8.3',
                        endpoint: 'https://backend.thenewfuse.com'
                    },
                    {
                        name: 'Database (Primary)',
                        status: 'online',
                        uptime: '100% (7d)',
                        lastChecked: new Date().toISOString(),
                        responseTime: 25,
                        version: 'PostgreSQL 15.4'
                    },
                    {
                        name: 'Redis Cache',
                        status: 'online',
                        uptime: '99.9% (7d)',
                        lastChecked: new Date().toISOString(),
                        responseTime: 8,
                        version: 'Redis 7.0.11'
                    },
                    {
                        name: 'Vector Database',
                        status: 'online',
                        uptime: '99.7% (7d)',
                        lastChecked: new Date().toISOString(),
                        responseTime: 180,
                        version: 'Qdrant 1.6.0'
                    },
                    {
                        name: 'Message Queue',
                        status: 'maintenance',
                        uptime: '98.5% (7d)',
                        lastChecked: new Date().toISOString(),
                        responseTime: 45,
                        version: 'RabbitMQ 3.12.0'
                    },
                    {
                        name: 'File Storage',
                        status: 'online',
                        uptime: '99.9% (7d)',
                        lastChecked: new Date().toISOString(),
                        responseTime: 200,
                        version: 'MinIO 2023.10.07'
                    },
                    {
                        name: 'Monitoring',
                        status: 'online',
                        uptime: '100% (7d)',
                        lastChecked: new Date().toISOString(),
                        responseTime: 50,
                        version: 'Prometheus 2.45.0'
                    }
                ]);
                setLoading(false);
                setLastRefresh(new Date());
            }, 1000);
        };
        fetchData();
        // Auto-refresh every 30 seconds
        var interval = setInterval(fetchData, 30000);
        return function () { return clearInterval(interval); };
    }, []);
    var getStatusColor = function (status) {
        switch (status) {
            case 'healthy':
            case 'online':
                return 'text-green-600 bg-green-100 border-green-200';
            case 'warning':
            case 'maintenance':
                return 'text-yellow-600 bg-yellow-100 border-yellow-200';
            case 'critical':
            case 'offline':
                return 'text-red-600 bg-red-100 border-red-200';
            default:
                return 'text-gray-600 bg-gray-100 border-gray-200';
        }
    };
    var getTrendIcon = function (trend) {
        switch (trend) {
            case 'up':
                return _jsx(TrendingUp, { className: "h-5 w-5 text-green-500" });
            case 'down':
                return _jsx(TrendingDown, { className: "h-5 w-5 text-red-500" });
            case 'stable':
                return _jsx(ArrowRight, { className: "h-5 w-5 text-gray-500" });
            default:
                return _jsx(ArrowRight, { className: "h-5 w-5 text-gray-500" });
        }
    };
    var getServiceIcon = function (serviceName) {
        if (serviceName.includes('API'))
            return _jsx(Plug, { className: "h-5 w-5 text-gray-500" });
        if (serviceName.includes('Database'))
            return _jsx(Database, { className: "h-5 w-5 text-gray-500" });
        if (serviceName.includes('Cache'))
            return _jsx(Zap, { className: "h-5 w-5 text-gray-500" });
        if (serviceName.includes('Vector'))
            return _jsx(Search, { className: "h-5 w-5 text-gray-500" });
        if (serviceName.includes('Queue'))
            return _jsx(Mail, { className: "h-5 w-5 text-gray-500" });
        if (serviceName.includes('Storage'))
            return _jsx(Save, { className: "h-5 w-5 text-gray-500" });
        if (serviceName.includes('Monitor'))
            return _jsx(BarChart, { className: "h-5 w-5 text-gray-500" });
        return _jsx(Settings, { className: "h-5 w-5 text-gray-500" });
    };
    var overallHealth = (function () {
        var criticalCount = metrics.filter(function (m) { return m.status === 'critical'; }).length;
        var warningCount = metrics.filter(function (m) { return m.status === 'warning'; }).length;
        var offlineServices = services.filter(function (s) { return s.status === 'offline'; }).length;
        if (criticalCount > 0 || offlineServices > 0)
            return 'critical';
        if (warningCount > 0)
            return 'warning';
        return 'healthy';
    })();
    var refreshData = function () {
        setLoading(true);
        // Trigger data refresh
        setTimeout(function () {
            setLoading(false);
            setLastRefresh(new Date());
        }, 1000);
    };
    if (loading && metrics.length === 0) {
        return (_jsx("div", { className: "p-8 max-w-7xl mx-auto", children: _jsx("div", { className: "flex items-center justify-center min-h-[400px]", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) }) }));
    }
    return (_jsxs("div", { className: "p-8 max-w-7xl mx-auto", children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "flex items-center text-3xl font-bold text-gray-900 mb-2", children: [_jsx(Heart, { className: "h-8 w-8 mr-2 text-green-500" }), " System Health"] }), _jsx("p", { className: "text-gray-600", children: "Monitor system performance and service status" })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("span", { className: "text-sm text-gray-500", children: ["Last updated: ", lastRefresh.toLocaleTimeString()] }), _jsxs(Button, { onClick: refreshData, disabled: loading, children: [_jsx(RefreshCw, { className: "mr-2 h-4 w-4 ".concat(loading ? 'animate-spin' : '') }), ' ', "Refresh"] })] })] }) }), _jsx(Card, { className: "mb-8", children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "text-4xl", children: overallHealth === 'healthy' ? (_jsx(CheckCircle, { className: "h-10 w-10 text-green-500" })) : overallHealth === 'warning' ? (_jsx(AlertTriangle, { className: "h-10 w-10 text-yellow-500" })) : (_jsx(Siren, { className: "h-10 w-10 text-red-500" })) }), _jsxs("div", { children: [_jsxs("h2", { className: "text-2xl font-bold", children: ["System Status:", ' ', overallHealth === 'healthy'
                                                        ? 'Healthy'
                                                        : overallHealth === 'warning'
                                                            ? 'Warning'
                                                            : 'Critical'] }), _jsxs("p", { className: "text-gray-600", children: [services.filter(function (s) { return s.status === 'online'; }).length, "/", services.length, " services online"] })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: "text-sm text-gray-500", children: "Average Response Time" }), _jsxs("div", { className: "text-2xl font-bold", children: [Math.round(services.reduce(function (sum, s) { return sum + s.responseTime; }, 0) / services.length), "ms"] })] })] }) }) }), _jsxs(Card, { className: "mb-8", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "System Metrics" }) }), _jsx(CardContent, { children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: metrics.map(function (metric) { return (_jsxs("div", { className: "p-4 border rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "font-medium", children: metric.name }), _jsx("span", { className: "text-xl", children: getTrendIcon(metric.trend) })] }), _jsxs("div", { className: "flex items-end space-x-2 mb-2", children: [_jsx("span", { className: "text-2xl font-bold", children: metric.value }), _jsx("span", { className: "text-gray-500", children: metric.unit })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2 mb-2", children: _jsx("div", { className: "h-2 rounded-full ".concat(metric.status === 'healthy' ? 'bg-green-500' :
                                                metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'), style: {
                                                width: "".concat(Math.min(100, (metric.value / metric.threshold.critical) * 100), "%")
                                            } }) }), _jsxs("div", { className: "flex justify-between text-xs text-gray-500", children: [_jsxs("span", { children: ["Warning: ", metric.threshold.warning, metric.unit] }), _jsxs("span", { children: ["Critical: ", metric.threshold.critical, metric.unit] })] })] }, metric.name)); }) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Service Status" }) }), _jsx(CardContent, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50 border-b border-gray-200", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Service" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Uptime" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Response Time" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Version" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Last Checked" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: services.map(function (service) { return (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "text-xl mr-3", children: getServiceIcon(service.name) }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: service.name }), service.endpoint && (_jsx("div", { className: "text-xs text-gray-500", children: service.endpoint }))] })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: "px-2 py-1 text-xs font-medium rounded-full border ".concat(getStatusColor(service.status)), children: service.status }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: service.uptime }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: [service.responseTime, "ms"] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: service.version }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: new Date(service.lastChecked).toLocaleTimeString() })] }, service.name)); }) })] }) }) })] }), _jsxs("div", { className: "mt-8 grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsx(Button, { variant: "outline", className: "p-4 h-auto", children: _jsxs("div", { className: "text-center", children: [_jsx(BarChart, { className: "h-8 w-8 mx-auto mb-2" }), _jsx("div", { className: "font-medium", children: "View Logs" })] }) }), _jsx(Button, { variant: "outline", className: "p-4 h-auto", children: _jsxs("div", { className: "text-center", children: [_jsx(Wrench, { className: "h-8 w-8 mx-auto mb-2" }), _jsx("div", { className: "font-medium", children: "System Settings" })] }) }), _jsx(Button, { variant: "outline", className: "p-4 h-auto", children: _jsxs("div", { className: "text-center", children: [_jsx(TrendingUp, { className: "h-8 w-8 mx-auto mb-2" }), _jsx("div", { className: "font-medium", children: "Performance" })] }) }), _jsx(Button, { variant: "outline", className: "p-4 h-auto", children: _jsxs("div", { className: "text-center", children: [_jsx(Siren, { className: "h-8 w-8 mx-auto mb-2" }), _jsx("div", { className: "font-medium", children: "Alerts" })] }) })] })] }));
}

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
// Monitoring Dashboard Component - Real-time system monitoring interface
// Displays comprehensive system metrics, alerts, health checks, and performance analytics
import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, } from 'recharts';
var MonitoringDashboard = function () {
    var _a = useState(null), dashboardData = _a[0], setDashboardData = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    var _c = useState(true), autoRefresh = _c[0], setAutoRefresh = _c[1];
    var _d = useState(30000), refreshInterval = _d[0], setRefreshInterval = _d[1]; // 30 seconds
    var _e = useState('24h'), selectedTimeRange = _e[0], setSelectedTimeRange = _e[1];
    var _f = useState(false), alertDialogOpen = _f[0], setAlertDialogOpen = _f[1];
    var _g = useState(null), selectedAlert = _g[0], setSelectedAlert = _g[1];
    var fetchDashboardData = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, 4, 5]);
                    return [4 /*yield*/, fetch('/api/monitoring/dashboard')];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setDashboardData(data);
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error fetching dashboard data:', error_1);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []);
    var resolveAlert = function (alertId) { return __awaiter(void 0, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch("/api/monitoring/alerts/".concat(alertId, "/resolve"), {
                            method: 'PUT',
                        })];
                case 1:
                    _a.sent();
                    fetchDashboardData(); // Refresh data
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    console.error('Error resolving alert:', error_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    useEffect(function () {
        fetchDashboardData();
    }, [fetchDashboardData]);
    useEffect(function () {
        var interval;
        if (autoRefresh) {
            interval = setInterval(fetchDashboardData, refreshInterval);
        }
        return function () {
            if (interval)
                clearInterval(interval);
        };
    }, [autoRefresh, refreshInterval, fetchDashboardData]);
    var getStatusColor = function (status) {
        switch (status) {
            case 'healthy': return 'success';
            case 'warning': return 'warning';
            case 'critical': return 'error';
            default: return 'default';
        }
    };
    var getStatusIcon = function (status) {
        switch (status) {
            case 'healthy': return _jsx(CheckCircleIcon, { color: "success" });
            case 'warning': return _jsx(WarningIcon, { color: "warning" });
            case 'critical': return _jsx(ErrorIcon, { color: "error" });
            default: return _jsx(CheckCircleIcon, {});
        }
    };
    var formatUptime = function (uptime) {
        var days = Math.floor(uptime / 86400);
        var hours = Math.floor((uptime % 86400) / 3600);
        var minutes = Math.floor((uptime % 3600) / 60);
        return "".concat(days, "d ").concat(hours, "h ").concat(minutes, "m");
    };
    var formatBytes = function (bytes) {
        if (bytes === 0)
            return '0 B';
        var k = 1024;
        var sizes = ['B', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    var prepareChartData = function (dataPoints) {
        return dataPoints.map(function (point) { return ({
            timestamp: new Date(point.timestamp).toLocaleTimeString(),
            cpu: point.system.cpu,
            memory: point.system.memory,
            cacheHitRate: point.cache.hitRate,
            activeConnections: point.websocket.activeConnections,
            throughput: point.queue.throughput,
            latency: point.websocket.averageLatency,
        }); });
    };
    if (loading) {
        return (_jsxs(Box, { sx: { width: '100%', p: 3 }, children: [_jsx(Progress, {}), _jsx(Text, { variant: "h6", sx: { mt: 2 }, children: "Loading monitoring dashboard..." })] }));
    }
    if (!dashboardData) {
        return (_jsx(Box, { sx: { p: 3 }, children: _jsx(Alert, { severity: "error", children: "Failed to load dashboard data. Please try refreshing the page." }) }));
    }
    var chartData = prepareChartData(dashboardData.historicalData.dataPoints);
    var activeAlerts = dashboardData.alerts.filter(function (alert) { return !alert.resolved; });
    return (_jsxs(Box, { sx: { p: 3 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsx(Text, { variant: "h4", component: "h1", children: "System Monitoring Dashboard" }), _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 2 }, children: [_jsx(FormLabel, { control: _jsx(Switch, { checked: autoRefresh, onChange: function (e) { return setAutoRefresh(e.target.checked); } }), label: "Auto Refresh" }), _jsx(IconButton, { onClick: fetchDashboardData, disabled: loading, children: _jsx(RefreshIcon, {}) })] })] }), _jsxs(SimpleGrid, { container: true, columns: 3, sx: { mb: 3 }, children: [_jsx(SimpleGrid, { item: true, xs: 12, sm: 6, md: 2, children: _jsx(Card, { children: _jsxs(CardBody, { sx: { textAlign: 'center' }, children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }, children: [getStatusIcon(dashboardData.overview.status), _jsx(Text, { variant: "h6", sx: { ml: 1 }, children: "System Status" })] }), _jsx(Tag, { label: dashboardData.overview.status.toUpperCase(), color: getStatusColor(dashboardData.overview.status), variant: "filled" })] }) }) }), _jsx(SimpleGrid, { item: true, xs: 12, sm: 6, md: 2, children: _jsx(Card, { children: _jsxs(CardBody, { sx: { textAlign: 'center' }, children: [_jsx(Text, { variant: "h6", color: "textSecondary", children: "Uptime" }), _jsx(Text, { variant: "h5", children: formatUptime(dashboardData.overview.uptime) })] }) }) }), _jsx(SimpleGrid, { item: true, xs: 12, sm: 6, md: 2, children: _jsx(Card, { children: _jsxs(CardBody, { sx: { textAlign: 'center' }, children: [_jsx(Text, { variant: "h6", color: "textSecondary", children: "Active Users" }), _jsx(Text, { variant: "h5", children: dashboardData.overview.totalUsers })] }) }) }), _jsx(SimpleGrid, { item: true, xs: 12, sm: 6, md: 2, children: _jsx(Card, { children: _jsxs(CardBody, { sx: { textAlign: 'center' }, children: [_jsx(Text, { variant: "h6", color: "textSecondary", children: "Active Agents" }), _jsx(Text, { variant: "h5", children: dashboardData.overview.activeAgents })] }) }) }), _jsx(SimpleGrid, { item: true, xs: 12, sm: 6, md: 2, children: _jsx(Card, { children: _jsxs(CardBody, { sx: { textAlign: 'center' }, children: [_jsx(Text, { variant: "h6", color: "textSecondary", children: "Workflows" }), _jsx(Text, { variant: "h5", children: dashboardData.overview.totalWorkflows })] }) }) }), _jsx(SimpleGrid, { item: true, xs: 12, sm: 6, md: 2, children: _jsx(Card, { children: _jsxs(CardBody, { sx: { textAlign: 'center' }, children: [_jsx(Text, { variant: "h6", color: "textSecondary", children: "System Load" }), _jsxs(Text, { variant: "h5", children: [dashboardData.overview.systemLoad.toFixed(1), "%"] })] }) }) })] }), activeAlerts.length > 0 && (_jsx(Card, { sx: { mb: 3 }, children: _jsxs(CardBody, { children: [_jsxs(Text, { variant: "h6", sx: { mb: 2 }, children: ["Active Alerts (", activeAlerts.length, ")"] }), activeAlerts.slice(0, 5).map(function (alert) { return (_jsxs(Alert, { severity: alert.type === 'critical' ? 'error' : alert.type, sx: { mb: 1 }, action: _jsx(Button, { size: "small", onClick: function () { return resolveAlert(alert.id); }, children: "Resolve" }), children: [_jsxs("strong", { children: [alert.service.toUpperCase(), ":"] }), " ", alert.message] }, alert.id)); }), activeAlerts.length > 5 && (_jsxs(Button, { variant: "outlined", onClick: function () { return setAlertDialogOpen(true); }, sx: { mt: 1 }, children: ["View All Alerts (", activeAlerts.length, ")"] }))] }) })), _jsxs(SimpleGrid, { container: true, columns: 3, sx: { mb: 3 }, children: [_jsx(SimpleGrid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardBody, { children: [_jsx(Text, { variant: "h6", sx: { mb: 2 }, children: "System Performance" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(AreaChart, { data: chartData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "timestamp" }), _jsx(YAxis, {}), _jsx(RechartsTooltip, {}), _jsx(Area, { type: "monotone", dataKey: "cpu", stroke: "#8884d8", fill: "#8884d8", fillOpacity: 0.3, name: "CPU %" }), _jsx(Area, { type: "monotone", dataKey: "memory", stroke: "#82ca9d", fill: "#82ca9d", fillOpacity: 0.3, name: "Memory %" })] }) })] }) }) }), _jsx(SimpleGrid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardBody, { children: [_jsx(Text, { variant: "h6", sx: { mb: 2 }, children: "Network & Cache Performance" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: chartData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "timestamp" }), _jsx(YAxis, {}), _jsx(RechartsTooltip, {}), _jsx(Line, { type: "monotone", dataKey: "cacheHitRate", stroke: "#ff7300", name: "Cache Hit Rate %" }), _jsx(Line, { type: "monotone", dataKey: "activeConnections", stroke: "#00ff00", name: "Active Connections" })] }) })] }) }) })] }), _jsxs(SimpleGrid, { container: true, columns: 3, sx: { mb: 3 }, children: [_jsx(SimpleGrid, { item: true, xs: 12, md: 4, children: _jsx(Card, { children: _jsxs(CardBody, { children: [_jsx(Text, { variant: "h6", sx: { mb: 2 }, children: "System Resources" }), _jsxs(Box, { sx: { mb: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 1 }, children: [_jsx(Text, { variant: "body2", children: "CPU Usage" }), _jsxs(Text, { variant: "body2", children: [dashboardData.realTimeMetrics.system.cpu.toFixed(1), "%"] })] }), _jsx(Progress, { variant: "determinate", value: dashboardData.realTimeMetrics.system.cpu, color: dashboardData.realTimeMetrics.system.cpu > 80 ? 'error' : 'primary' })] }), _jsxs(Box, { sx: { mb: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 1 }, children: [_jsx(Text, { variant: "body2", children: "Memory Usage" }), _jsxs(Text, { variant: "body2", children: [dashboardData.realTimeMetrics.system.memory.toFixed(1), "%"] })] }), _jsx(Progress, { variant: "determinate", value: dashboardData.realTimeMetrics.system.memory, color: dashboardData.realTimeMetrics.system.memory > 80 ? 'error' : 'primary' })] }), _jsxs(Box, { children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 1 }, children: [_jsx(Text, { variant: "body2", children: "Disk Usage" }), _jsxs(Text, { variant: "body2", children: [dashboardData.realTimeMetrics.system.disk.toFixed(1), "%"] })] }), _jsx(Progress, { variant: "determinate", value: dashboardData.realTimeMetrics.system.disk, color: dashboardData.realTimeMetrics.system.disk > 85 ? 'error' : 'primary' })] })] }) }) }), _jsx(SimpleGrid, { item: true, xs: 12, md: 4, children: _jsx(Card, { children: _jsxs(CardBody, { children: [_jsx(Text, { variant: "h6", sx: { mb: 2 }, children: "Cache Performance" }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 1 }, children: [_jsx(Text, { variant: "body2", children: "Hit Rate" }), _jsxs(Text, { variant: "body2", color: dashboardData.realTimeMetrics.cache.hitRate > 90 ? 'success.main' : 'warning.main', children: [dashboardData.realTimeMetrics.cache.hitRate.toFixed(1), "%"] })] }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 1 }, children: [_jsx(Text, { variant: "body2", children: "Memory Usage" }), _jsx(Text, { variant: "body2", children: formatBytes(dashboardData.realTimeMetrics.cache.memoryUsage) })] }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 1 }, children: [_jsx(Text, { variant: "body2", children: "Total Keys" }), _jsx(Text, { variant: "body2", children: dashboardData.realTimeMetrics.cache.totalKeys.toLocaleString() })] })] }) }) }), _jsx(SimpleGrid, { item: true, xs: 12, md: 4, children: _jsx(Card, { children: _jsxs(CardBody, { children: [_jsx(Text, { variant: "h6", sx: { mb: 2 }, children: "Job Queue Status" }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 1 }, children: [_jsx(Text, { variant: "body2", children: "Active Jobs" }), _jsx(Text, { variant: "body2", children: dashboardData.realTimeMetrics.queue.activeJobs })] }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 1 }, children: [_jsx(Text, { variant: "body2", children: "Completed" }), _jsx(Text, { variant: "body2", children: dashboardData.realTimeMetrics.queue.completedJobs })] }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 1 }, children: [_jsx(Text, { variant: "body2", children: "Failed" }), _jsx(Text, { variant: "body2", color: dashboardData.realTimeMetrics.queue.failedJobs > 0 ? 'error.main' : 'text.primary', children: dashboardData.realTimeMetrics.queue.failedJobs })] }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 1 }, children: [_jsx(Text, { variant: "body2", children: "Throughput" }), _jsxs(Text, { variant: "body2", children: [dashboardData.realTimeMetrics.queue.throughput, "/min"] })] })] }) }) })] }), _jsx(Card, { sx: { mb: 3 }, children: _jsxs(CardBody, { children: [_jsx(Text, { variant: "h6", sx: { mb: 2 }, children: "Component Health" }), _jsx(SimpleGrid, { container: true, columns: 2, children: Object.entries(dashboardData.healthChecks).map(function (_a) {
                                var component = _a[0], health = _a[1];
                                return (_jsx(SimpleGrid, { item: true, xs: 12, sm: 6, md: 2.4, children: _jsxs(Box, { sx: { p: 2, textAlign: 'center' }, children: [getStatusIcon(health.status), _jsx(Text, { variant: "subtitle2", sx: { mt: 1 }, children: component.toUpperCase() }), _jsx(Tag, { size: "small", label: health.status, color: getStatusColor(health.status) })] }) }, component));
                            }) })] }) }), _jsxs(Modal, { open: alertDialogOpen, onClose: function () { return setAlertDialogOpen(false); }, maxWidth: "md", fullWidth: true, children: [_jsxs(ModalHeader, { children: ["All Active Alerts", _jsx(IconButton, { onClick: function () { return setAlertDialogOpen(false); }, sx: { position: 'absolute', right: 8, top: 8 }, children: _jsx(CloseIcon, {}) })] }), _jsx(ModalBody, { children: _jsx(TableContainer, { children: _jsxs(Table, { children: [_jsx(Thead, { children: _jsxs(Tr, { children: [_jsx(Td, { children: "Severity" }), _jsx(Td, { children: "Service" }), _jsx(Td, { children: "Message" }), _jsx(Td, { children: "Time" }), _jsx(Td, { children: "Action" })] }) }), _jsx(Tbody, { children: activeAlerts.map(function (alert) { return (_jsxs(Tr, { children: [_jsx(Td, { children: _jsx(Tag, { size: "small", label: alert.type, color: alert.type === 'critical' ? 'error' : alert.type }) }), _jsx(Td, { children: alert.service }), _jsx(Td, { children: alert.message }), _jsx(Td, { children: new Date(alert.timestamp).toLocaleString() }), _jsx(Td, { children: _jsx(Button, { size: "small", onClick: function () { return resolveAlert(alert.id); }, children: "Resolve" }) })] }, alert.id)); }) })] }) }) }), _jsx(ModalFooter, { children: _jsx(Button, { onClick: function () { return setAlertDialogOpen(false); }, children: "Close" }) })] })] }));
};
export default MonitoringDashboard;

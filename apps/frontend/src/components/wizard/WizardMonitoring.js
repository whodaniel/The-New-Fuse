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
exports.WizardMonitoring = WizardMonitoring;
import react_1 from 'react';
import { SimpleGrid, GridItem } from '@chakra-ui/react';
import WizardWebSocket_1 from './WizardWebSocket';
import WizardProvider_1 from './WizardProvider';
function WizardMonitoring() {
    var _a = (0, WizardWebSocket_1.useWizardWebSocket)(), subscribeToEvent = _a.subscribeToEvent, unsubscribeFromEvent = _a.unsubscribeFromEvent, sendMessage = _a.sendMessage;
    var state = (0, WizardProvider_1.useWizard)().state;
    var _b = (0, react_1.useState)(null), metrics = _b[0], setMetrics = _b[1];
    var _c = (0, react_1.useState)([]), alerts = _c[0], setAlerts = _c[1];
    var _d = (0, react_1.useState)([]), logs = _d[0], setLogs = _d[1];
    var _e = (0, react_1.useState)(false), showSettings = _e[0], setShowSettings = _e[1];
    var _f = (0, react_1.useState)({
        alertThreshold: 80,
        logRetentionDays: 7,
        metricsInterval: 5000
    }), settings = _f[0], setSettings = _f[1];
    (0, react_1.useEffect)(function () {
        var handleMetricsUpdate = function (data) {
            setMetrics(data);
            checkThresholds(data);
        };
        var handleAlert = function (alert) {
            setAlerts(function (prev) { return __spreadArray([alert], prev, true); });
        };
        var handlePerformanceLog = function (log) {
            setLogs(function (prev) { return __spreadArray([log], prev, true).slice(0, 1000); });
        };
        subscribeToEvent('system_metrics', handleMetricsUpdate);
        subscribeToEvent('system_alert', handleAlert);
        subscribeToEvent('performance_log', handlePerformanceLog);
        sendMessage('start_monitoring', { interval: settings.metricsInterval });
        return function () {
            unsubscribeFromEvent('system_metrics');
            unsubscribeFromEvent('system_alert');
            unsubscribeFromEvent('performance_log');
        };
    }, [subscribeToEvent, unsubscribeFromEvent, sendMessage, settings.metricsInterval]);
    var checkThresholds = function (metrics) {
        if (metrics.cpu > settings.alertThreshold) {
            createAlert('warning', "High CPU usage: ".concat(metrics.cpu, "%"));
        }
        if (metrics.memory > settings.alertThreshold) {
            createAlert('warning', "High memory usage: ".concat(metrics.memory, "%"));
        }
        if (metrics.errorRate > 5) {
            createAlert('error', "High error rate: ".concat(metrics.errorRate, "%"));
        }
    };
    var createAlert = function (type, message) {
        var alert = {
            id: "alert-".concat(Date.now()),
            type: type,
            message: message,
            timestamp: Date.now(),
            resolved: false
        };
        setAlerts(function (prev) { return __spreadArray([alert], prev, true); });
    };
    var resolveAlert = function (alertId) {
        setAlerts(function (prev) { return prev.map(function (alert) { return alert.id === alertId ? Object.assign(Object.assign({}, alert), { resolved: true }) : alert; }); });
    };
    var formatDuration = function (ms) {
        if (ms < 1000)
            return "".concat(ms, "ms");
        return "".concat((ms / 1000).toFixed(2), "s");
    };
    var renderMetrics = function () { return (_jsxs(SimpleGrid, { columns: 2, children: [_jsx(GridItem, { colSpan: 12, md: 3, children: _jsx(material_1.Card, { children: _jsxs(material_1.CardContent, { children: [_jsxs(material_1.Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(icons_material_1.Memory, {}), _jsx(material_1.Typography, { variant: "h6", children: "CPU Usage" })] }), _jsx(material_1.LinearProgress, { variant: "determinate", value: (metrics === null || metrics === void 0 ? void 0 : metrics.cpu) || 0, color: (metrics === null || metrics === void 0 ? void 0 : metrics.cpu) && metrics.cpu > 80 ? 'error' : 'primary' }), _jsxs(material_1.Typography, { variant: "h4", align: "center", mt: 1, children: [metrics === null || metrics === void 0 ? void 0 : metrics.cpu.toFixed(1), "%"] })] }) }) }), _jsx(GridItem, { colSpan: 12, md: 3, children: _jsx(material_1.Card, { children: _jsxs(material_1.CardContent, { children: [_jsxs(material_1.Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(icons_material_1.Speed, {}), _jsx(material_1.Typography, { variant: "h6", children: "Memory" })] }), _jsx(material_1.LinearProgress, { variant: "determinate", value: (metrics === null || metrics === void 0 ? void 0 : metrics.memory) || 0, color: (metrics === null || metrics === void 0 ? void 0 : metrics.memory) && metrics.memory > 80 ? 'error' : 'primary' }), _jsxs(material_1.Typography, { variant: "h4", align: "center", mt: 1, children: [metrics === null || metrics === void 0 ? void 0 : metrics.memory.toFixed(1), "%"] })] }) }) }), _jsx(GridItem, { colSpan: 12, md: 3, children: _jsx(material_1.Card, { children: _jsxs(material_1.CardContent, { children: [_jsxs(material_1.Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(icons_material_1.Timeline, {}), _jsx(material_1.Typography, { variant: "h6", children: "Active Tasks" })] }), _jsxs(material_1.Box, { display: "flex", justifyContent: "center", alignItems: "center", gap: 2, mt: 2, children: [_jsx(material_1.Chip, { label: "Active: ".concat((metrics === null || metrics === void 0 ? void 0 : metrics.activeAgents) || 0), color: "primary" }), _jsx(material_1.Chip, { label: "Queued: ".concat((metrics === null || metrics === void 0 ? void 0 : metrics.queuedTasks) || 0), color: "secondary" })] })] }) }) }), _jsx(GridItem, { colSpan: 12, md: 3, children: _jsx(material_1.Card, { children: _jsxs(material_1.CardContent, { children: [_jsxs(material_1.Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(icons_material_1.Warning, {}), _jsx(material_1.Typography, { variant: "h6", children: "Error Rate" })] }), _jsxs(material_1.Typography, { variant: "h4", align: "center", mt: 1, color: (metrics === null || metrics === void 0 ? void 0 : metrics.errorRate) && metrics.errorRate > 5 ? 'error' : 'inherit', children: [metrics === null || metrics === void 0 ? void 0 : metrics.errorRate.toFixed(2), "%"] })] }) }) })] })); };
    var renderAlerts = function () { return (_jsx(material_1.Card, { children: _jsxs(material_1.CardContent, { children: [_jsxs(material_1.Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, children: [_jsx(material_1.Typography, { variant: "h6", children: "System Alerts" }), _jsx(material_1.Badge, { badgeContent: alerts.filter(function (a) { return !a.resolved; }).length, color: "error", children: _jsx(icons_material_1.Warning, {}) })] }), _jsx(material_1.List, { children: alerts.slice(0, 5).map(function (alert) { return (_jsxs(material_1.ListItem, { secondaryAction: !alert.resolved && (_jsx(material_1.Button, { size: "small", onClick: function () { return resolveAlert(alert.id); }, children: "Resolve" })), children: [_jsx(material_1.ListItemIcon, { children: alert.type === 'error' ? (_jsx(icons_material_1.Warning, { color: "error" })) : (_jsx(icons_material_1.Warning, { color: "warning" })) }), _jsx(material_1.ListItemText, { primary: alert.message, secondary: new Date(alert.timestamp).toLocaleString(), sx: { textDecoration: alert.resolved ? 'line-through' : 'none' } })] }, alert.id)); }) })] }) })); };
    var renderPerformanceLogs = function () { return (_jsx(material_1.Card, { children: _jsxs(material_1.CardContent, { children: [_jsxs(material_1.Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, children: [_jsx(material_1.Typography, { variant: "h6", children: "Performance Logs" }), _jsx(material_1.IconButton, { onClick: function () { return sendMessage('refresh_logs', {}); }, children: _jsx(icons_material_1.Refresh, {}) })] }), _jsx(material_1.List, { children: logs.slice(0, 10).map(function (log, index) { return (_jsx(material_1.ListItem, { children: _jsx(material_1.ListItemText, { primary: log.operation, secondary: _jsxs(_Fragment, { children: [new Date(log.timestamp).toLocaleString(), " - Duration: ", formatDuration(log.duration), " - Status: ", log.status] }) }) }, index)); }) })] }) })); };
    return (_jsxs(material_1.Box, { children: [_jsxs(material_1.Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, children: [_jsx(material_1.Typography, { variant: "h5", children: "System Monitoring" }), _jsx(material_1.Tooltip, { title: "Monitoring Settings", children: _jsx(material_1.IconButton, { onClick: function () { return setShowSettings(true); }, children: _jsx(icons_material_1.Settings, {}) }) })] }), _jsxs(SimpleGrid, { columns: 2, children: [_jsx(GridItem, { colSpan: 12, children: renderMetrics() }), _jsx(GridItem, { colSpan: 12, md: 6, children: renderAlerts() }), _jsx(GridItem, { colSpan: 12, md: 6, children: renderPerformanceLogs() })] }), _jsxs(material_1.Dialog, { open: showSettings, onClose: function () { return setShowSettings(false); }, children: [_jsx(material_1.DialogTitle, { children: "Monitoring Settings" }), _jsx(material_1.DialogContent, { children: _jsxs(SimpleGrid, { columns: 2, children: [_jsx(GridItem, { colSpan: 12, children: _jsx(material_1.TextField, { fullWidth: true, label: "Alert Threshold (%)", type: "number", value: settings.alertThreshold, onChange: function (e) { return setSettings(function (prev) { return (Object.assign(Object.assign({}, prev), { alertThreshold: Number(e.target.value) })); }); } }) }), _jsx(GridItem, { colSpan: 12, children: _jsx(material_1.TextField, { fullWidth: true, label: "Log Retention (days)", type: "number", value: settings.logRetentionDays, onChange: function (e) { return setSettings(function (prev) { return (Object.assign(Object.assign({}, prev), { logRetentionDays: Number(e.target.value) })); }); } }) }), _jsx(GridItem, { colSpan: 12, children: _jsx(material_1.TextField, { fullWidth: true, label: "Metrics Interval (ms)", type: "number", value: settings.metricsInterval, onChange: function (e) { return setSettings(function (prev) { return (Object.assign(Object.assign({}, prev), { metricsInterval: Number(e.target.value) })); }); } }) })] }) })] })] }));
}

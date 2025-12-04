import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Grid, Stat, StatLabel, StatNumber, StatHelpText } from '@chakra-ui/react';
import { useSystemMetrics } from '../../hooks/useSystemMetrics';
export var SystemMetrics = function () {
    var _a = useSystemMetrics(), metrics = _a.metrics, loading = _a.loading, error = _a.error;
    if (loading)
        return _jsx(Box, { children: "Loading metrics..." });
    if (error)
        return _jsx(Box, { children: "Error loading metrics" });
    return (_jsxs(Grid, { templateColumns: "repeat(3, 1fr)", gap: 6, children: [_jsx(MetricCard, { label: "CPU Usage", value: "".concat(metrics.cpuUsage.value, "%"), helpText: "Current CPU utilization" }), _jsx(MetricCard, { label: "Memory Usage", value: "".concat(metrics.memoryUsage.value, "MB"), helpText: "Current memory usage" }), _jsx(MetricCard, { label: "Active Connections", value: metrics.activeConnections.value, helpText: "Current active connections" })] }));
};
var MetricCard = function (_a) {
    var label = _a.label, value = _a.value, helpText = _a.helpText;
    return (_jsxs(Stat, { children: [_jsx(StatLabel, { children: label }), _jsx(StatNumber, { children: value }), _jsx(StatHelpText, { children: helpText })] }));
};

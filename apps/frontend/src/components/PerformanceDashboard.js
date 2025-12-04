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
import { useEffect, useState, useRef } from 'react';
import { Box, SimpleGrid, GridItem, Alert, CircularProgress, Typography } from '@chakra-ui/react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';
var MetricCard = function (_a) {
    var title = _a.title, value = _a.value, unit = _a.unit, history = _a.history;
    return (_jsxs(Box, { sx: { height: '100%' }, children: [_jsx(Typography, { variant: "h6", component: "div", gutterBottom: true, children: title }), _jsxs(Typography, { variant: "h4", component: "div", color: "primary", children: [value === null || value === void 0 ? void 0 : value.toFixed(2), " ", unit] }), _jsx(Box, { style: { height: 100, mt: 2 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: history, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "timestamp", tickFormatter: function (timestamp) { return new Date(timestamp).toLocaleTimeString(); } }), _jsx(YAxis, {}), _jsx(Tooltip, { labelFormatter: function (timestamp) { return new Date(timestamp).toLocaleTimeString(); } }), _jsx(Line, { type: "monotone", dataKey: "value", stroke: "#1976d2", dot: false })] }) }) })] }));
};
var PerformanceDashboard = function () {
    var _a = useState(null), metrics = _a[0], setMetrics = _a[1];
    var _b = useState(false), connected = _b[0], setConnected = _b[1];
    var _c = useState(null), error = _c[0], setError = _c[1];
    var ws = useRef(null);
    var _d = useState({
        queue: [],
        latency: [],
        memory: [],
        cpu: [],
    }), history = _d[0], setHistory = _d[1];
    useEffect(function () {
        var connect = function () {
            var socket = new WebSocket('ws://localhost:8000/ws/metrics');
            socket.onopen = function () {
                setConnected(true);
                setError(null);
            };
            socket.onclose = function () {
                setConnected(false);
                setTimeout(connect, 5000);
            };
            socket.onerror = function (event) {
                setError('WebSocket connection error');
                console.error('WebSocket error:', event);
            };
            socket.onmessage = function (event) {
                try {
                    var data_1 = JSON.parse(event.data);
                    setMetrics(data_1);
                    var timestamp_1 = Date.now();
                    setHistory(function (prev) { return ({
                        queue: __spreadArray(__spreadArray([], prev.queue.slice(-50), true), [{ timestamp: timestamp_1, value: data_1.avg_queue_length }], false),
                        latency: __spreadArray(__spreadArray([], prev.latency.slice(-50), true), [{ timestamp: timestamp_1, value: data_1.avg_message_latency_ms }], false),
                        memory: __spreadArray(__spreadArray([], prev.memory.slice(-50), true), [{ timestamp: timestamp_1, value: data_1.avg_memory_usage_mb }], false),
                        cpu: __spreadArray(__spreadArray([], prev.cpu.slice(-50), true), [{ timestamp: timestamp_1, value: data_1.avg_cpu_usage_percent }], false),
                    }); });
                }
                catch (e) {
                    console.error('Error parsing metrics:', e);
                }
            };
            ws.current = socket;
        };
        connect();
        return function () {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);
    if (!connected) {
        return (_jsxs(Box, { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px", children: [_jsx(CircularProgress, {}), _jsx(Typography, { variant: "body1", sx: { ml: 2 }, children: "Connecting to metrics service..." })] }));
    }
    if (error) {
        return (_jsx(Alert, { severity: "error", sx: { mb: 2 }, children: error }));
    }
    if (!metrics) {
        return (_jsx(Box, { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px", children: _jsx(CircularProgress, {}) }));
    }
    return (_jsxs(Box, { style: { flexGrow: 1, p: 3 }, children: [Object.entries(metrics.alerts || {}).map(function (_a) {
                var key = _a[0], alert = _a[1];
                return (_jsxs(Alert, { severity: alert.level, sx: { mb: 2 }, children: [alert.message, " (Current value: ", alert.value, ")"] }, key));
            }), _jsxs(SimpleGrid, { columns: 3, children: [_jsx(GridItem, { colSpan: 12, md: 6, children: _jsx(MetricCard, { title: "Message Queue Length", value: metrics.avg_queue_length, unit: "messages", history: history.queue }) }), _jsx(GridItem, { colSpan: 12, md: 6, children: _jsx(MetricCard, { title: "Message Latency", value: metrics.avg_message_latency_ms, unit: "ms", history: history.latency }) }), _jsx(GridItem, { colSpan: 12, md: 6, children: _jsx(MetricCard, { title: "Memory Usage", value: metrics.avg_memory_usage_mb, unit: "MB", history: history.memory }) }), _jsx(GridItem, { colSpan: 12, md: 6, children: _jsx(MetricCard, { title: "CPU Usage", value: metrics.avg_cpu_usage_percent, unit: "%", history: history.cpu }) })] }), _jsxs(Box, { style: { mt: 3 }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "System Status" }), _jsxs(SimpleGrid, { columns: 2, children: [_jsx(GridItem, { colSpan: 12, md: 4, children: _jsxs(Typography, { variant: "body1", children: ["Uptime: ", (metrics.uptime_seconds / 3600).toFixed(2), " hours"] }) }), _jsx(GridItem, { colSpan: 12, md: 4, children: _jsxs(Typography, { variant: "body1", color: metrics.total_errors > 0 ? 'error' : 'success', children: ["Total Errors: ", metrics.total_errors] }) }), _jsx(GridItem, { colSpan: 12, md: 4, children: _jsxs(Typography, { variant: "body1", color: connected ? 'success' : 'error', children: ["Status: ", connected ? 'Connected' : 'Disconnected'] }) })] })] })] }));
};
export default PerformanceDashboard;

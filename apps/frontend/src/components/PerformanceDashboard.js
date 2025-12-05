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
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';
var MetricCard = function (_a) {
    var title = _a.title, value = _a.value, unit = _a.unit, history = _a.history;
    return (_jsxs("div", { className: "h-full", children: [_jsx("h3", { className: "text-lg font-semibold mb-2", children: title }), _jsxs("p", { className: "text-xl text-blue-500", children: [value === null || value === void 0 ? void 0 : value.toFixed(2), " ", unit] }), _jsx("div", { className: "h-[100px] mt-2", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: history, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "timestamp", tickFormatter: function (timestamp) { return new Date(timestamp).toLocaleTimeString(); } }), _jsx(YAxis, {}), _jsx(Tooltip, { labelFormatter: function (timestamp) { return new Date(timestamp).toLocaleTimeString(); } }), _jsx(Line, { type: "monotone", dataKey: "value", stroke: "#1976d2", dot: false })] }) }) })] }));
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
        return (_jsxs("div", { className: "flex justify-center items-center min-h-[200px]", children: [_jsx("div", { className: "animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600" }), _jsx("p", { className: "ml-2", children: "Connecting to metrics service..." })] }));
    }
    if (error) {
        return (_jsxs("div", { className: "p-4 bg-red-50 border border-red-200 rounded-lg mb-2 flex items-center", children: [_jsx("div", { className: "flex-shrink-0 w-5 h-5 text-red-600 mr-2", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z", clipRule: "evenodd" }) }) }), _jsx("p", { className: "text-sm text-red-800", children: error })] }));
    }
    if (!metrics) {
        return (_jsx("div", { className: "flex justify-center items-center min-h-[200px]", children: _jsx("div", { className: "animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600" }) }));
    }
    return (_jsxs("div", { className: "flex-grow p-3", children: [Object.entries(metrics.alerts || {}).map(function (_a) {
                var key = _a[0], alert = _a[1];
                var alertColor = alert.level === 'error' ? 'red' :
                    alert.level === 'warning' ? 'yellow' :
                        alert.level === 'success' ? 'green' : 'blue';
                return (_jsxs("div", { className: "p-4 bg-".concat(alertColor, "-50 border border-").concat(alertColor, "-200 rounded-lg mb-2 flex items-center"), children: [_jsx("div", { className: "flex-shrink-0 w-5 h-5 text-".concat(alertColor, "-600 mr-2"), children: _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor", children: [alert.level === 'error' && (_jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z", clipRule: "evenodd" })), alert.level === 'warning' && (_jsx("path", { fillRule: "evenodd", d: "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.086-1.742 3.086H4.42c-1.532 0-2.492-1.75-1.742-3.086l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z", clipRule: "evenodd" })), alert.level === 'success' && (_jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" })), (alert.level === 'info' || alert.level === 'default') && (_jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z", clipRule: "evenodd" }))] }) }), _jsxs("p", { className: "text-sm", children: [alert.message, " (Current value: ", alert.value, ")"] })] }, key));
            }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsx("div", { className: "col-span-3", children: _jsx(MetricCard, { title: "Message Queue Length", value: metrics.avg_queue_length, unit: "messages", history: history.queue }) }), _jsx("div", { className: "col-span-3", children: _jsx(MetricCard, { title: "Message Latency", value: metrics.avg_message_latency_ms, unit: "ms", history: history.latency }) }), _jsx("div", { className: "col-span-3", children: _jsx(MetricCard, { title: "Memory Usage", value: metrics.avg_memory_usage_mb, unit: "MB", history: history.memory }) }), _jsx("div", { className: "col-span-3", children: _jsx(MetricCard, { title: "CPU Usage", value: metrics.avg_cpu_usage_percent, unit: "%", history: history.cpu }) })] }), _jsxs("div", { className: "mt-3", children: [_jsx("h3", { className: "text-lg font-semibold mb-2", children: "System Status" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx("div", { className: "col-span-2", children: _jsxs("p", { children: ["Uptime: ", (metrics.uptime_seconds / 3600).toFixed(2), " hours"] }) }), _jsx("div", { className: "col-span-2", children: _jsxs("p", { className: metrics.total_errors > 0 ? 'text-red-500' : 'text-green-500', children: ["Total Errors: ", metrics.total_errors] }) }), _jsx("div", { className: "col-span-2", children: _jsxs("p", { className: connected ? 'text-green-500' : 'text-red-500', children: ["Status: ", connected ? 'Connected' : 'Disconnected'] }) })] })] })] }));
};
export default PerformanceDashboard;

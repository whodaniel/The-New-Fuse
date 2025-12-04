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
import React from 'react';
import { Alert } from '@/shared/ui/core/Alert';
import { Progress } from '@/shared/ui/core/Progress';
import { MetricCard } from './MetricCard';
export function PerformanceDashboard(_b) {
    var className = _b.className;
    var _c = React.useState(null), metrics = _c[0], setMetrics = _c[1];
    var _d = React.useState(false), connected = _d[0], setConnected = _d[1];
    var _e = React.useState(null), error = _e[0], setError = _e[1];
    var ws = React.useRef(null);
    var _f = React.useState({
        queue: [],
        latency: [],
        memory: [],
        cpu: [],
    }), history = _f[0], setHistory = _f[1];
    React.useEffect(function () {
        ws.current = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080');
        ws.current.onopen = function () {
            setConnected(true);
            setError(null);
        };
        ws.current.onclose = function () {
            setConnected(false);
            setError('WebSocket connection closed');
        };
        ws.current.onerror = function () {
            setError('WebSocket connection error');
        };
        ws.current.onmessage = function (event) {
            try {
                var data_1 = JSON.parse(event.data);
                setMetrics(data_1);
                var timestamp_1 = Date.now();
                setHistory(function (prev) { return ({
                    queue: __spreadArray(__spreadArray([], prev.queue.slice(-19), true), [{ timestamp: timestamp_1, value: data_1.avg_queue_length }], false),
                    latency: __spreadArray(__spreadArray([], prev.latency.slice(-19), true), [{ timestamp: timestamp_1, value: data_1.avg_message_latency_ms }], false),
                    memory: __spreadArray(__spreadArray([], prev.memory.slice(-19), true), [{ timestamp: timestamp_1, value: data_1.avg_memory_usage_mb }], false),
                    cpu: __spreadArray(__spreadArray([], prev.cpu.slice(-19), true), [{ timestamp: timestamp_1, value: data_1.avg_cpu_usage_percent }], false),
                }); });
            }
            catch (err) {
                setError('Invalid metrics data received');
            }
        };
        return function () {
            var _a;
            (_a = ws.current) === null || _a === void 0 ? void 0 : _a.close();
        };
    }, []);
    if (!connected) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(Progress, { className: "w-8 h-8" }) }));
    }
    if (error) {
        return (_jsxs(Alert, { variant: "destructive", children: [_jsx(Alert.Title, { children: "Error" }), _jsx(Alert.Description, { children: error })] }));
    }
    if (!metrics) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(Progress, { className: "w-8 h-8" }) }));
    }
    return (_jsxs("div", { className: className, children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsx(MetricCard, { title: "Average Queue Length", value: metrics.avg_queue_length, unit: "tasks", history: history.queue, color: "#2563eb" }), _jsx(MetricCard, { title: "Message Latency", value: metrics.avg_message_latency_ms, unit: "ms", history: history.latency, color: "#16a34a" }), _jsx(MetricCard, { title: "Memory Usage", value: metrics.avg_memory_usage_mb, unit: "MB", history: history.memory, color: "#9333ea" }), _jsx(MetricCard, { title: "CPU Usage", value: metrics.avg_cpu_usage_percent, unit: "%", history: history.cpu, color: "#dc2626" })] }), Object.entries(metrics.alerts).length > 0 && (_jsx("div", { className: "mt-6 space-y-4", children: Object.entries(metrics.alerts).map(function (_b) {
                    var key = _b[0], alert = _b[1];
                    return (_jsxs(Alert, { variant: alert.level === 'error' ? 'destructive' : 'warning', children: [_jsx(Alert.Title, { className: "capitalize", children: alert.level }), _jsxs(Alert.Description, { children: [alert.message, " (Value: ", alert.value, ")"] })] }, key));
                }) }))] }));
}

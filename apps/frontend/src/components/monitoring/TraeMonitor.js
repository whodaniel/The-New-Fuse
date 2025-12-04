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
import { useEffect, useState } from 'react';
import { webSocketService } from '../services/websocket';
export var TraeMonitor = function () {
    var _a = useState({
        responseTime: 0,
        memoryUsage: 0,
        activeTasks: 0,
        successRate: 1
    }), metrics = _a[0], setMetrics = _a[1];
    var _b = useState([]), recentActions = _b[0], setRecentActions = _b[1];
    useEffect(function () {
        webSocketService.on('trae:metrics', function (data) {
            setMetrics(function (prev) { return ({
                responseTime: data.duration,
                memoryUsage: data.memoryUsage,
                activeTasks: data.activeTasks,
                successRate: data.success ? 1 : prev.successRate * 0.9
            }); });
            setRecentActions(function (prev) { return __spreadArray([data], prev, true).slice(0, 10); });
        });
        return function () {
            webSocketService.off('trae:metrics');
        };
    }, []);
    return (_jsxs("div", { className: "trae-monitor p-4", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Trae AI Monitor" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "metric-card", children: [_jsx("h3", { children: "Response Time" }), _jsxs("p", { children: [metrics.responseTime, "ms"] })] }), _jsxs("div", { className: "metric-card", children: [_jsx("h3", { children: "Memory Usage" }), _jsxs("p", { children: [(metrics.memoryUsage / 1024 / 1024).toFixed(2), " MB"] })] }), _jsxs("div", { className: "metric-card", children: [_jsx("h3", { children: "Active Tasks" }), _jsx("p", { children: metrics.activeTasks })] }), _jsxs("div", { className: "metric-card", children: [_jsx("h3", { children: "Success Rate" }), _jsxs("p", { children: [(metrics.successRate * 100).toFixed(1), "%"] })] })] }), _jsxs("div", { className: "mt-4", children: [_jsx("h3", { className: "font-bold", children: "Recent Actions" }), _jsx("ul", { className: "mt-2", children: recentActions.map(function (action, i) { return (_jsxs("li", { className: "text-sm", children: [action.type, " - ", action.context.action, "(", action.success ? '✓' : '✗', ")"] }, i)); }) })] })] }));
};

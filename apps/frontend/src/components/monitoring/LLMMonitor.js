var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { webSocketService } from '../services/websocket';
export var LLMMonitor = function () {
    var _a = useState({
        activeRequests: 0,
        recentInteractions: [],
        averageLatency: 0,
        errorRate: 0
    }), llmMetrics = _a[0], setLLMMetrics = _a[1];
    useEffect(function () {
        webSocketService.on('trae:llm-metrics', function (data) {
            setLLMMetrics(function (prev) { return (__assign(__assign({}, prev), data)); });
        });
        return function () {
            webSocketService.off('trae:llm-metrics');
        };
    }, []);
    return (_jsxs("div", { className: "llm-monitor p-4", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Trae LLM Monitor" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "metric-card", children: [_jsx("h3", { children: "Active Requests" }), _jsx("p", { children: llmMetrics.activeRequests })] }), _jsxs("div", { className: "metric-card", children: [_jsx("h3", { children: "Average Latency" }), _jsxs("p", { children: [llmMetrics.averageLatency, "ms"] })] }), _jsxs("div", { className: "metric-card", children: [_jsx("h3", { children: "Error Rate" }), _jsxs("p", { children: [(llmMetrics.errorRate * 100).toFixed(1), "%"] })] })] }), _jsxs("div", { className: "mt-4", children: [_jsx("h3", { className: "font-bold", children: "Recent Interactions" }), _jsx("div", { className: "overflow-auto max-h-60", children: llmMetrics.recentInteractions.map(function (interaction, index) { return (_jsxs("div", { className: "border-b py-2", children: [_jsxs("p", { children: ["Status: ", interaction.status] }), _jsxs("p", { children: ["Duration: ", interaction.duration, "ms"] }), _jsx("p", { className: "text-sm text-gray-500", children: new Date(interaction.timestamp).toLocaleTimeString() })] }, index)); }) })] })] }));
};

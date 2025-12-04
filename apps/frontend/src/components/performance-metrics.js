"use strict";
'use client';
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMetrics = PerformanceMetrics;
import react_1 from 'react';
import card_1 from '@/components/ui/card';
import recharts_1 from 'recharts';
import websocket_1 from '../services/websocket';
function PerformanceMetrics() {
    var _a = (0, react_1.useState)([]), performanceData = _a[0], setPerformanceData = _a[1];
    (0, react_1.useEffect)(function () {
        var handlePerformanceUpdate = function (data) {
            setPerformanceData(function (prevData) { return __spreadArray(__spreadArray([], prevData.slice(-19), true), [data], false); });
        };
        websocket_1.webSocketService.on('performanceUpdate', handlePerformanceUpdate);
        return function () {
            websocket_1.webSocketService.off('performanceUpdate', handlePerformanceUpdate);
        };
    }, []);
    return (_jsxs(card_1.Card, { className: "w-full h-[300px]", children: [_jsx(card_1.CardHeader, { children: _jsx(card_1.CardTitle, { children: "Performance Metrics" }) }), _jsx(card_1.CardContent, { children: _jsx(recharts_1.ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(recharts_1.LineChart, { data: performanceData, children: [_jsx(recharts_1.CartesianGrid, { strokeDasharray: "3 3" }), _jsx(recharts_1.XAxis, { dataKey: "timestamp", tickFormatter: function (timestamp) { return new Date(timestamp).toLocaleTimeString(); } }), _jsx(recharts_1.YAxis, { yAxisId: "left" }), _jsx(recharts_1.YAxis, { yAxisId: "right", orientation: "right" }), _jsx(recharts_1.Tooltip, { labelFormatter: function (timestamp) { return new Date(timestamp).toLocaleString(); } }), _jsx(recharts_1.Line, { yAxisId: "left", type: "monotone", dataKey: "cpuUsage", stroke: "#8884d8", name: "CPU Usage (%)" }), _jsx(recharts_1.Line, { yAxisId: "left", type: "monotone", dataKey: "memoryUsage", stroke: "#82ca9d", name: "Memory Usage (%)" }), _jsx(recharts_1.Line, { yAxisId: "right", type: "monotone", dataKey: "activeAgents", stroke: "#ffc658", name: "Active Agents" })] }) }) })] }));
}

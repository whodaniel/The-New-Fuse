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
import { useState, useEffect } from 'react';
import { Card } from '@/shared/ui/core/Card';
import { ChartComponent } from 'packages/features/dashboard/components/visualization/ChartComponent';
import { webSocketService } from '@/services/websocket';
export function PerformanceMetrics() {
    var _a = useState([]), performanceData = _a[0], setPerformanceData = _a[1];
    useEffect(function () {
        var handlePerformanceUpdate = function (data) {
            setPerformanceData(function (prevData) { return __spreadArray(__spreadArray([], prevData.slice(-19), true), [data], false); });
        };
        webSocketService.on('performanceUpdate', handlePerformanceUpdate);
        return function () {
            webSocketService.off('performanceUpdate', handlePerformanceUpdate);
        };
    }, []);
    var tooltipFormatter = function (value) {
        if (value > 1000)
            return "".concat((value / 1000).toFixed(2), "k");
        return value.toFixed(2);
    };
    return (_jsxs(Card, { className: "w-full p-4", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Performance Metrics" }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [_jsxs("div", { className: "h-[300px]", children: [_jsx("h3", { className: "text-lg mb-2", children: "Resource Usage" }), _jsx(ChartComponent, { type: "area", data: performanceData, xKey: "timestamp", yKeys: ['cpu', 'memory'], tooltipFormatter: tooltipFormatter, stacked: true })] }), _jsxs("div", { className: "h-[300px]", children: [_jsx("h3", { className: "text-lg mb-2", children: "Response Metrics" }), _jsx(ChartComponent, { type: "line", data: performanceData, xKey: "timestamp", yKeys: ['responseTime', 'throughput'], tooltipFormatter: tooltipFormatter })] }), _jsxs("div", { className: "h-[300px]", children: [_jsx("h3", { className: "text-lg mb-2", children: "Error Rate" }), _jsx(ChartComponent, { type: "line", data: performanceData, xKey: "timestamp", yKeys: ['errorRate'], colors: ['#ef4444'], tooltipFormatter: function (value) { return "".concat((value * 100).toFixed(2), "%"); } })] })] })] }));
}

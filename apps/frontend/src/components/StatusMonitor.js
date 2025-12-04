import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { Badge } from './ui/badge';
import { Card, CardHeader, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { Skeleton } from './ui/skeleton';
var StatusIndicator = function (_a) {
    var status = _a.status;
    var variants = {
        healthy: 'bg-green-500',
        degraded: 'bg-yellow-500',
        critical: 'bg-red-500'
    };
    return (_jsx(Badge, { variant: "outline", className: "".concat(variants[status], " text-white"), children: status.charAt(0).toUpperCase() + status.slice(1) }));
};
export function StatusMonitor() {
    var _a = useState(null), systemStatus = _a[0], setSystemStatus = _a[1];
    var _b = useState(true), isLoading = _b[0], setIsLoading = _b[1];
    var subscribe = useWebSocket().subscribe;
    useEffect(function () {
        var unsubscribe = subscribe('system_metrics', function (data) {
            setSystemStatus(data);
            setIsLoading(false);
        });
        return function () {
            unsubscribe();
        };
    }, [subscribe]);
    if (isLoading) {
        return (_jsxs(Card, { children: [_jsx(CardHeader, { children: "System Status" }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsx(Skeleton, { className: "h-4 w-full" }), _jsx(Skeleton, { className: "h-4 w-3/4" }), _jsx(Skeleton, { className: "h-4 w-1/2" })] }) })] }));
    }
    if (!systemStatus)
        return null;
    return (_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-lg font-semibold", children: "System Status" }), _jsx(StatusIndicator, { status: systemStatus.status })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between mb-2", children: [_jsx("span", { children: "CPU Usage" }), _jsxs("span", { children: [systemStatus.cpu, "%"] })] }), _jsx(Progress, { value: systemStatus.cpu })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between mb-2", children: [_jsx("span", { children: "Memory Usage" }), _jsxs("span", { children: [systemStatus.memory, "%"] })] }), _jsx(Progress, { value: systemStatus.memory })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "text-center p-4 bg-gray-100 rounded-lg", children: [_jsx("div", { className: "text-2xl font-bold", children: systemStatus.activeConnections }), _jsx("div", { className: "text-sm text-gray-600", children: "Active Connections" })] }), _jsxs("div", { className: "text-center p-4 bg-gray-100 rounded-lg", children: [_jsx("div", { className: "text-2xl font-bold", children: systemStatus.queueSize }), _jsx("div", { className: "text-sm text-gray-600", children: "Queue Size" })] })] })] }) })] }));
}

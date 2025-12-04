import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from '@/components/ui/card';
import { LineChart, BarChart } from '@/components/ui/charts';
import { useAgentMetrics } from '@/hooks/useAgentMetrics';
export var AgentMonitoringDashboard = function () {
    var _a = useAgentMetrics(), metrics = _a.metrics, loading = _a.loading;
    return (_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs(Card, { children: [_jsx("h3", { children: "Resource Usage" }), _jsx(LineChart, { data: metrics === null || metrics === void 0 ? void 0 : metrics.resourceUsage, metrics: ['cpu', 'memory', 'tokens'] })] }), _jsxs(Card, { children: [_jsx("h3", { children: "Response Times" }), _jsx(LineChart, { data: metrics === null || metrics === void 0 ? void 0 : metrics.responseTimes, metrics: ['avg', 'p95', 'p99'] })] }), _jsxs(Card, { children: [_jsx("h3", { children: "Task Success Rate" }), _jsx(BarChart, { data: metrics === null || metrics === void 0 ? void 0 : metrics.taskSuccess, categories: ['completed', 'failed', 'retry'] })] }), _jsxs(Card, { children: [_jsx("h3", { children: "Active Connections" }), _jsx(LineChart, { data: metrics === null || metrics === void 0 ? void 0 : metrics.connections, metrics: ['websocket', 'http'] })] })] }));
};

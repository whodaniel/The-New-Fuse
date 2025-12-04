import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentOptimization = void 0;
import react_1 from 'react';
import react_query_1 from '@tanstack/react-query';
import Card_1 from '../../../core/Card';
import Button_1 from '../../../core/Button';
import Select_1 from '../../../core/Select';
import Input_1 from '../../../core/Input';
import agentService_1 from '../../../../services/api/agentService';
import react_hot_toast_1 from 'react-hot-toast';
import recharts_1 from 'recharts';
var AgentOptimization = function (_e) {
    var agentId = _e.agentId;
    var _a, _b, _c, _d;
    var _f = (0, react_1.useState)({
        target: 'accuracy',
        constraints: {
            maxLatency: 1000,
            minAccuracy: 0.9,
            maxMemory: 1024,
            maxCost: 0.1,
        },
    }), optimizationConfig = _f[0], setOptimizationConfig = _f[1];
    var metrics = (0, react_query_1.useQuery)({
        queryKey: ['agent-metrics', agentId],
        queryFn: function () { return agentService_1.agentService.getAgentMetrics(agentId); },
        refetchInterval: 30000,
    }).data;
    var optimizeMutation = (0, react_query_1.useMutation)({
        mutationFn: function () { return agentService_1.agentService.optimizeAgent(agentId, optimizationConfig); },
        onSuccess: function (data) {
            react_hot_toast_1.toast.success('Optimization completed successfully');
        },
        onError: function (error) {
            react_hot_toast_1.toast.error('Optimization failed');
            console.error('Optimization error:', error);
        },
    });
    var handleStartOptimization = function () {
        optimizeMutation.mutate();
    };
    var formatMetricsForChart = function (metrics) {
        var _a, _b, _c, _d;
        if (!metrics)
            return [];
        return [
            {
                name: 'Response Time',
                value: metrics.averageResponseTime,
                target: (_a = optimizationConfig.constraints) === null || _a === void 0 ? void 0 : _a.maxLatency,
            },
            {
                name: 'Accuracy',
                value: metrics.accuracy * 100,
                target: ((_b = optimizationConfig.constraints) === null || _b === void 0 ? void 0 : _b.minAccuracy) ? optimizationConfig.constraints.minAccuracy * 100 : undefined,
            },
            {
                name: 'Memory Usage',
                value: metrics.memoryUsage,
                target: (_c = optimizationConfig.constraints) === null || _c === void 0 ? void 0 : _c.maxMemory,
            },
            {
                name: 'Cost per Request',
                value: metrics.costPerRequest,
                target: (_d = optimizationConfig.constraints) === null || _d === void 0 ? void 0 : _d.maxCost,
            },
        ];
    };
    return (_jsxs(Card_1.Card, { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Agent Optimization" }), _jsx(Button_1.Button, { onClick: handleStartOptimization, disabled: optimizeMutation.isPending, children: "Start Optimization" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Optimization Target" }), _jsxs(Select_1.Select, { value: optimizationConfig.target, onChange: function (e) { return setOptimizationConfig(function (prev) { return (Object.assign(Object.assign({}, prev), { target: e.target.value })); }); }, children: [_jsx("option", { value: "speed", children: "Speed" }), _jsx("option", { value: "accuracy", children: "Accuracy" }), _jsx("option", { value: "efficiency", children: "Efficiency" })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-sm font-medium", children: "Constraints" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm mb-1", children: "Max Latency (ms)" }), _jsx(Input_1.Input, { type: "number", value: (_a = optimizationConfig.constraints) === null || _a === void 0 ? void 0 : _a.maxLatency, onChange: function (e) { return setOptimizationConfig(function (prev) { return (Object.assign(Object.assign({}, prev), { constraints: Object.assign(Object.assign({}, prev.constraints), { maxLatency: parseInt(e.target.value) }) })); }); }, min: 100, max: 5000 })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm mb-1", children: "Min Accuracy (%)" }), _jsx(Input_1.Input, { type: "number", value: ((_b = optimizationConfig.constraints) === null || _b === void 0 ? void 0 : _b.minAccuracy) ? optimizationConfig.constraints.minAccuracy * 100 : '', onChange: function (e) { return setOptimizationConfig(function (prev) { return (Object.assign(Object.assign({}, prev), { constraints: Object.assign(Object.assign({}, prev.constraints), { minAccuracy: parseInt(e.target.value) / 100 }) })); }); }, min: 50, max: 100 })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm mb-1", children: "Max Memory (MB)" }), _jsx(Input_1.Input, { type: "number", value: (_c = optimizationConfig.constraints) === null || _c === void 0 ? void 0 : _c.maxMemory, onChange: function (e) { return setOptimizationConfig(function (prev) { return (Object.assign(Object.assign({}, prev), { constraints: Object.assign(Object.assign({}, prev.constraints), { maxMemory: parseInt(e.target.value) }) })); }); }, min: 128, max: 4096 })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm mb-1", children: "Max Cost per Request ($)" }), _jsx(Input_1.Input, { type: "number", value: (_d = optimizationConfig.constraints) === null || _d === void 0 ? void 0 : _d.maxCost, onChange: function (e) { return setOptimizationConfig(function (prev) { return (Object.assign(Object.assign({}, prev), { constraints: Object.assign(Object.assign({}, prev.constraints), { maxCost: parseFloat(e.target.value) }) })); }); }, min: 0.01, max: 1, step: 0.01 })] })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-medium", children: "Performance Metrics" }), metrics ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "h-64", children: _jsx(recharts_1.ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(recharts_1.BarChart, { data: formatMetricsForChart(metrics), margin: { top: 5, right: 30, left: 20, bottom: 5 }, children: [_jsx(recharts_1.CartesianGrid, { strokeDasharray: "3 3" }), _jsx(recharts_1.XAxis, { dataKey: "name" }), _jsx(recharts_1.YAxis, {}), _jsx(recharts_1.Tooltip, {}), _jsx(recharts_1.Legend, {}), _jsx(recharts_1.Bar, { dataKey: "value", fill: "#8884d8", name: "Current" }), _jsx(recharts_1.Bar, { dataKey: "target", fill: "#82ca9d", name: "Target" })] }) }) }), optimizeMutation.data && (_jsxs(Card_1.Card, { className: "p-4", children: [_jsx("h4", { className: "text-sm font-medium mb-2", children: "Optimization Results" }), _jsx("div", { className: "space-y-2", children: Object.entries(optimizeMutation.data.improvements).map(function (_e) {
                                                    var key = _e[0], value = _e[1];
                                                    return (_jsxs("div", { className: "flex justify-between", children: [_jsxs("span", { className: "text-sm", children: [key, ":"] }), _jsx("span", { className: "text-sm font-medium", children: typeof value === 'number' ? "".concat((value * 100).toFixed(2), "%") : value })] }, key));
                                                }) }), optimizeMutation.data.recommendations.length > 0 && (_jsxs("div", { className: "mt-4", children: [_jsx("h5", { className: "text-sm font-medium mb-2", children: "Recommendations" }), _jsx("ul", { className: "list-disc list-inside space-y-1", children: optimizeMutation.data.recommendations.map(function (rec, index) { return (_jsx("li", { className: "text-sm", children: rec }, index)); }) })] }))] }))] })) : (_jsx("div", { className: "flex items-center justify-center h-64 border-2 border-dashed rounded-lg", children: _jsx("p", { className: "text-gray-500", children: "No metrics available" }) }))] })] })] }));
};
exports.AgentOptimization = AgentOptimization;
exports.default = exports.AgentOptimization;

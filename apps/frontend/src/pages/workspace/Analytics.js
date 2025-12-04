import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@/components/core';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Calendar, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
var WorkspaceAnalytics = function () {
    var _a = useWorkspace(), currentWorkspace = _a.currentWorkspace, loading = _a.loading, error = _a.error;
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-full", children: _jsx("div", { className: "text-lg text-muted-foreground", children: "Loading analytics..." }) }));
    }
    if (error) {
        return (_jsx("div", { className: "flex items-center justify-center h-full", children: _jsxs("div", { className: "text-lg text-red-500", children: ["Error loading analytics: ", error.message] }) }));
    }
    var metrics = [
        {
            label: 'Total Projects',
            value: (currentWorkspace === null || currentWorkspace === void 0 ? void 0 : currentWorkspace.projectCount) || 0,
            change: '+12.3%',
            trend: 'up',
        },
        {
            label: 'Active Neural Networks',
            value: (currentWorkspace === null || currentWorkspace === void 0 ? void 0 : currentWorkspace.neuralNetworkCount) || 0,
            change: '+8.1%',
            trend: 'up',
        },
        {
            label: 'Memory Usage',
            value: '85.2 GB',
            change: '+24.5%',
            trend: 'up',
        },
        {
            label: 'API Calls',
            value: '1.2M',
            change: '-3.2%',
            trend: 'down',
        },
    ];
    var renderChart = function (data, title) { return (_jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: data, margin: { top: 5, right: 30, left: 20, bottom: 5 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "date" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Line, { type: "monotone", dataKey: "value", stroke: "#8884d8", strokeWidth: 2 })] }) })); };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Analytics" }), _jsx("p", { className: "text-muted-foreground mt-2", children: "Monitor your workspace performance and usage" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs(Button, { variant: "outline", children: [_jsx(Calendar, { className: "mr-2 h-4 w-4" }), "Last 30 days"] }), _jsxs(Button, { variant: "outline", children: [_jsx(Download, { className: "mr-2 h-4 w-4" }), "Export"] })] })] }), _jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: metrics.map(function (metric) { return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium", children: metric.label }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: metric.value }), _jsxs("p", { className: "text-xs ".concat(metric.trend === 'up'
                                        ? 'text-green-500'
                                        : 'text-red-500'), children: [metric.change, " from last month"] })] })] }, metric.label)); }) }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Neural Network Performance" }), _jsx(CardDescription, { children: "Average response time and accuracy over time" })] }), _jsx(CardContent, { children: renderChart([], 'Neural Network Performance') })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Memory Usage" }), _jsx(CardDescription, { children: "Storage utilization by project" })] }), _jsx(CardContent, { children: renderChart([], 'Memory Usage') })] }), _jsxs(Card, { className: "md:col-span-2", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "API Usage" }), _jsx(CardDescription, { children: "API calls and response times over time" })] }), _jsx(CardContent, { children: renderChart([], 'API Usage') })] })] })] }));
};
export default WorkspaceAnalytics;

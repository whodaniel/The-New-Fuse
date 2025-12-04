import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/core';
import { Users, Folders, Brain, Database, Cpu, Network, } from 'lucide-react';
var Dashboard = function () {
    var metrics = [
        {
            icon: Users,
            label: 'Total Users',
            value: '1,234',
            change: '+12.3%',
            trend: 'up',
        },
        {
            icon: Folders,
            label: 'Active Workspaces',
            value: '256',
            change: '+8.1%',
            trend: 'up',
        },
        {
            icon: Brain,
            label: 'Neural Networks',
            value: '789',
            change: '+24.5%',
            trend: 'up',
        },
        {
            icon: Database,
            label: 'Storage Used',
            value: '1.2 TB',
            change: '+15.2%',
            trend: 'up',
        },
        {
            icon: Cpu,
            label: 'CPU Usage',
            value: '68%',
            change: '-3.2%',
            trend: 'down',
        },
        {
            icon: Network,
            label: 'Network Traffic',
            value: '2.3 TB',
            change: '+18.7%',
            trend: 'up',
        },
    ];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Dashboard" }), _jsx("p", { className: "text-muted-foreground mt-2", children: "System overview and key metrics" })] }), _jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: metrics.map(function (metric) { return (_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: metric.label }), _jsx(metric.icon, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: metric.value }), _jsxs("p", { className: "text-xs ".concat(metric.trend === 'up'
                                        ? 'text-green-500'
                                        : 'text-red-500'), children: [metric.change, " from last month"] })] })] }, metric.label)); }) }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "System Load" }), _jsx(CardDescription, { children: "CPU, Memory, and Network utilization" })] }), _jsx(CardContent, { children: _jsx("div", { className: "h-[350px] flex items-center justify-center border rounded-lg", children: "Chart: System Load" }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Neural Network Activity" }), _jsx(CardDescription, { children: "Active networks and processing load" })] }), _jsx(CardContent, { children: _jsx("div", { className: "h-[350px] flex items-center justify-center border rounded-lg", children: "Chart: Neural Network Activity" }) })] }), _jsxs(Card, { className: "md:col-span-2", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Recent System Events" }), _jsx(CardDescription, { children: "Latest alerts and notifications" })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: _jsx("div", { className: "h-[200px] flex items-center justify-center border rounded-lg", children: "Event List" }) }) })] })] })] }));
};
export default Dashboard;

"use strict";
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemMetrics = SystemMetrics;
import card_1 from '@/components/ui/card';
import recharts_1 from 'recharts';
var data = [
    { name: '00:00', agents: 4000, tasks: 2400, interactions: 2400 },
    { name: '04:00', agents: 3000, tasks: 1398, interactions: 2210 },
    { name: '08:00', agents: 2000, tasks: 9800, interactions: 2290 },
    { name: '12:00', agents: 2780, tasks: 3908, interactions: 2000 },
    { name: '16:00', agents: 1890, tasks: 4800, interactions: 2181 },
    { name: '20:00', agents: 2390, tasks: 3800, interactions: 2500 },
    { name: '23:59', agents: 3490, tasks: 4300, interactions: 2100 },
];
function SystemMetrics() {
    return (_jsxs(card_1.Card, { className: "w-full max-w-3xl", children: [_jsx(card_1.CardHeader, { children: _jsx(card_1.CardTitle, { children: "System Metrics" }) }), _jsx(card_1.CardContent, { children: _jsx(recharts_1.ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(recharts_1.LineChart, { data: data, children: [_jsx(recharts_1.CartesianGrid, { strokeDasharray: "3 3" }), _jsx(recharts_1.XAxis, { dataKey: "name" }), _jsx(recharts_1.YAxis, {}), _jsx(recharts_1.Tooltip, {}), _jsx(recharts_1.Line, { type: "monotone", dataKey: "agents", stroke: "#8884d8" }), _jsx(recharts_1.Line, { type: "monotone", dataKey: "tasks", stroke: "#82ca9d" }), _jsx(recharts_1.Line, { type: "monotone", dataKey: "interactions", stroke: "#ffc658" })] }) }) })] }));
}

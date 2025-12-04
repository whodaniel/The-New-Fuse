"use strict";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
import components_1 from '../components';
import { Box, SimpleGrid, GridItem, Tabs, Tab } from '@chakra-ui/react';
import react_chartjs_2_1 from 'react-chartjs-2';
import chart_js_1 from 'chart';
chart_js_1.Chart.register(chart_js_1.CategoryScale, chart_js_1.LinearScale, chart_js_1.PointElement, chart_js_1.LineElement, chart_js_1.BarElement, chart_js_1.Title, chart_js_1.Tooltip, chart_js_1.Legend);
var Analytics = function () {
    var _a = react_1.default.useState('24h'), timeRange = _a[0], setTimeRange = _a[1];
    var _b = react_1.default.useState(0), activeTab = _b[0], setActiveTab = _b[1];
    var performanceData = {
        labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
        datasets: [
            {
                label: 'Response Time (ms)',
                data: [150, 230, 180, 400, 280, 250],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
            },
        ],
    };
    var resourceUsageData = {
        labels: ['CPU', 'Memory', 'GPU', 'Network'],
        datasets: [
            {
                label: 'Usage %',
                data: [65, 78, 45, 88],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                ],
            },
        ],
    };
    return (_jsxs("div", { className: "p-6", children: [_jsx(Box, { sx: { borderBottom: 1, borderColor: 'divider', mb: 3 }, children: _jsxs(Tabs, { value: activeTab, onChange: function (_, newValue) { return setActiveTab(newValue); }, children: [_jsx(Tab, { label: "Performance" }), _jsx(Tab, { label: "Resources" }), _jsx(Tab, { label: "Knowledge Graph" }), _jsx(Tab, { label: "Task Analysis" })] }) }), activeTab === 0 && (_jsx(SimpleGrid, { templateColumns: 3, children: _jsx(GridItem, { colSpan: 12, children: _jsxs(Box, { className: "p-4", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "System Performance" }), _jsx(components_1.PerformanceMetrics, {}), _jsx("div", { className: "mt-4 h-80", children: _jsx(react_chartjs_2_1.Line, { data: performanceData, options: { maintainAspectRatio: false } }) })] }) }) })), activeTab === 1 && (_jsx(SimpleGrid, { templateColumns: 3, children: _jsx(GridItem, { colSpan: 12, children: _jsxs(Box, { className: "p-4", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Resource Usage" }), _jsx(components_1.SystemMetrics, {}), _jsx("div", { className: "mt-4 h-80", children: _jsx(react_chartjs_2_1.Bar, { data: resourceUsageData, options: { maintainAspectRatio: false } }) })] }) }) })), activeTab === 2 && (_jsx(SimpleGrid, { templateColumns: 3, children: _jsx(GridItem, { colSpan: 12, children: _jsxs(Box, { className: "p-4", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Knowledge Graph Analysis" }), _jsx(components_1.DynamicKnowledgeGraph, {})] }) }) })), activeTab === 3 && (_jsx(SimpleGrid, { templateColumns: 3, children: _jsx(GridItem, { colSpan: 12, children: _jsxs(Box, { className: "p-4", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Task Allocation Analysis" }), _jsx(components_1.PredictiveTaskAllocator, {})] }) }) }))] }));
};
exports.default = Analytics;

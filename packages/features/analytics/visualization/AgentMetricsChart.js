"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentMetricsChart = AgentMetricsChart;
import jsx_runtime_1 from 'react/jsx-runtime';
import react_1 from 'react';
import react_2 from 'react';
import chart_js_1 from 'chart.js';
import useTheme_1 from '@/hooks/useTheme';
import date_1 from '@/utils/date';
function AgentMetricsChart({ metrics, timeRange }) {
    const chartRef = (0, react_2.useRef)(null);
    const chartInstance, data;
    const { theme } = (0, useTheme_1.useTheme)();
    (0, react_1.useEffect)(() => {
        if (!chartRef.current)
            return;
        const ctx = chartRef.current.getContext('2d');
        if (!ctx)
            return;
        const config, { type };
         > (0, date_1.formatDateTime)(m.timestamp);
        [{
                label: 'Success Rate',
                data: metrics.map(m => m.successRate), theme
            } === 'dark' ? '#10B981' : '#059669',
            fill, false];
    }, {
        label: 'Response Time(ms): metrics.map(m => m.responseTime),,
        borderColor: theme === 'dark' ? '#60A5FA' : '#3B82F6',
        fill: false
    }, {
        label: 'Error Rate',
        data: metrics.map(m => m.errorRate), theme
    } === 'dark' ? '#EF4444' : '#DC2626', fill, false);
}
options: {
    responsive: true,
        interaction;
    {
        mode: 'index',
            intersect;
        false,
        ;
    }
    scales: {
        y: {
            beginAtZero: true,
                grid;
            {
                color: theme === 'dark' ? '#374151' : '#E5E7EB';
            }
        }
        x: {
            grid: {
                color: theme === 'dark' ? '#374151' : '#E5E7EB';
            }
        }
    }
}
;
if (chartInstance.current)
    : unknown;
{
    chartInstance.current.destroy();
}
chartInstance.current = new chart_js_1.Chart(ctx, config);
return () => {
    if (chartInstance.current)
        : unknown;
    {
        chartInstance.current.destroy();
        bg - gray - 800;
        rounded - lg;
        shadow;
        ">
            < h3;
        className = "text-lg font-semibold mb-4" > Agent;
        Performance;
        Metrics;
        h3 >
            (0, jsx_runtime_1.jsx)("canvas", { ref: chartRef });
        div >
        ;
        ;
    }
};
//# sourceMappingURL=AgentMetricsChart.js.map
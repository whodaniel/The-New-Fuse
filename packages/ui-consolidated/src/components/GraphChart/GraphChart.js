import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, } from 'recharts';
const defaultColors = ['#2563eb', '#7c3aed', '#db2777', '#16a34a', '#ea580c', '#0d9488'];
export function GraphChart({ type, data, title, xAxisKey = 'timestamp', yAxisKey = 'value', series, stacked = false, height = 300, width = '100%', colors = defaultColors, className = '', }) {
    const isPieChart = type === 'pie';
    const chartData = isPieChart ? data : data;
    const renderChart = () => {
        switch (type) {
            case 'line':
                return (_jsxs(LineChart, { data: chartData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: xAxisKey }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), series ? (series.map((s, index) => (_jsx(Line, { type: "monotone", dataKey: s.key, name: s.label, stroke: s.color || colors[index % colors.length] }, s.key)))) : (_jsx(Line, { type: "monotone", dataKey: yAxisKey, stroke: colors[0], activeDot: { r: 8 } }))] }));
            case 'bar':
                return (_jsxs(BarChart, { data: chartData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: xAxisKey }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), series ? (series.map((s, index) => (_jsx(Bar, { dataKey: s.key, name: s.label, fill: s.color || colors[index % colors.length], stackId: stacked ? 'stack' : undefined }, s.key)))) : (_jsx(Bar, { dataKey: yAxisKey, fill: colors[0] }))] }));
            case 'pie':
                return (_jsxs(PieChart, { children: [_jsx(Pie, { data: chartData, dataKey: "value", nameKey: "label", cx: "50%", cy: "50%", outerRadius: 80, label: true, children: chartData.map((entry, index) => (_jsx(Cell, { fill: entry.color || colors[index % colors.length] }, entry.id))) }), _jsx(Tooltip, {}), _jsx(Legend, {})] }));
            case 'area':
                return (_jsxs(AreaChart, { data: chartData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: xAxisKey }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), series ? (series.map((s, index) => (_jsx(Area, { type: "monotone", dataKey: s.key, name: s.label, fill: s.color || colors[index % colors.length], stroke: s.color || colors[index % colors.length], stackId: stacked ? 'stack' : undefined, fillOpacity: 0.6 }, s.key)))) : (_jsx(Area, { type: "monotone", dataKey: yAxisKey, stroke: colors[0], fill: colors[0], fillOpacity: 0.6 }))] }));
            default:
                return null;
        }
    };
    return (_jsxs("div", { className: `w-full ${className}`, children: [title && _jsx("h3", { className: "text-lg font-semibold mb-4", children: title }), _jsx(ResponsiveContainer, { width: width, height: height, children: renderChart() })] }));
}
export { GraphChart as Chart };

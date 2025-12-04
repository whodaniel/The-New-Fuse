"use strict";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChartSystem = void 0;
import react_1 from 'react';
import recharts_1 from 'recharts';
import { Box } from '@chakra-ui/react';
var ChartSystem = function (_c) {
    var title = _c.title, description = _c.description, series = _c.series, config = _c.config, _d = _c.height, height = _d === void 0 ? 400 : _d, _e = _c.width, width = _e === void 0 ? '100%' : _e, sx = _c.sx, className = _c.className;
    var theme = (0, material_1.useTheme)();
    var defaultColors = [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.error.main,
        theme.palette.warning.main,
        theme.palette.info.main,
        theme.palette.success.main
    ];
    var colors = config.customColors || defaultColors;
    var transformedData = (0, react_1.useMemo)(function () {
        var _a, _b;
        if (config.type === 'pie') {
            return ((_a = series[0]) === null || _a === void 0 ? void 0 : _a.data) || [];
        }
        if (config.type === 'treemap') {
            return series.map(function (s) { return ({
                name: s.name,
                children: s.data
            }); });
        }
        if (config.type === 'heatmap') {
            return series.map(function (s) { return s.data; }).flat();
        }
        return ((_b = series[0]) === null || _b === void 0 ? void 0 : _b.data) || [];
    }, [series, config.type]);
    var renderLineChart = function () { return (_jsxs(recharts_1.LineChart, { data: transformedData, children: [config.showGrid && _jsx(recharts_1.CartesianGrid, { strokeDasharray: "3 3" }), _jsx(recharts_1.XAxis, { dataKey: config.xAxisKey, label: config.xAxisLabel ? { value: config.xAxisLabel, position: 'bottom' } : undefined }), _jsx(recharts_1.YAxis, { label: config.yAxisLabel ? { value: config.yAxisLabel, angle: -90, position: 'left' } : undefined }), config.showTooltip && _jsx(recharts_1.Tooltip, {}), config.showLegend && _jsx(recharts_1.Legend, {}), series.map(function (s, i) { return (_jsx(recharts_1.Line, { type: "monotone", dataKey: s.name, stroke: s.color || colors[i % colors.length], dot: { r: 4 }, activeDot: { r: 8 } }, s.name)); })] })); };
    var renderBarChart = function () { return (_jsxs(recharts_1.BarChart, { data: transformedData, children: [config.showGrid && _jsx(recharts_1.CartesianGrid, { strokeDasharray: "3 3" }), _jsx(recharts_1.XAxis, { dataKey: config.xAxisKey, label: config.xAxisLabel ? { value: config.xAxisLabel, position: 'bottom' } : undefined }), _jsx(recharts_1.YAxis, { label: config.yAxisLabel ? { value: config.yAxisLabel, angle: -90, position: 'left' } : undefined }), config.showTooltip && _jsx(recharts_1.Tooltip, {}), config.showLegend && _jsx(recharts_1.Legend, {}), series.map(function (s, i) { return (_jsx(recharts_1.Bar, { dataKey: s.name, fill: s.color || colors[i % colors.length], stackId: config.stacked ? 'stack' : undefined }, s.name)); })] })); };
    var renderAreaChart = function () { return (_jsxs(recharts_1.AreaChart, { data: transformedData, children: [config.showGrid && _jsx(recharts_1.CartesianGrid, { strokeDasharray: "3 3" }), _jsx(recharts_1.XAxis, { dataKey: config.xAxisKey, label: config.xAxisLabel ? { value: config.xAxisLabel, position: 'bottom' } : undefined }), _jsx(recharts_1.YAxis, { label: config.yAxisLabel ? { value: config.yAxisLabel, angle: -90, position: 'left' } : undefined }), config.showTooltip && _jsx(recharts_1.Tooltip, {}), config.showLegend && _jsx(recharts_1.Legend, {}), series.map(function (s, i) { return (_jsx(recharts_1.Area, { type: "monotone", dataKey: s.name, fill: s.color || colors[i % colors.length], stroke: s.color || colors[i % colors.length], stackId: config.stacked ? 'stack' : undefined }, s.name)); })] })); };
    var renderPieChart = function () { return (_jsxs(recharts_1.PieChart, { children: [_jsx(recharts_1.Pie, { data: transformedData, dataKey: config.yAxisKey, nameKey: config.xAxisKey, cx: "50%", cy: "50%", outerRadius: height * 0.4, label: true, children: transformedData.map(function (_, index) { return (_jsx(recharts_1.Cell, { fill: colors[index % colors.length] }, "cell-".concat(index))); }) }), config.showTooltip && _jsx(recharts_1.Tooltip, {}), config.showLegend && _jsx(recharts_1.Legend, {})] })); };
    var renderScatterChart = function () { return (_jsxs(recharts_1.ScatterChart, { children: [config.showGrid && _jsx(recharts_1.CartesianGrid, { strokeDasharray: "3 3" }), _jsx(recharts_1.XAxis, { type: "number", dataKey: config.xAxisKey, name: config.xAxisLabel, label: config.xAxisLabel ? { value: config.xAxisLabel, position: 'bottom' } : undefined }), _jsx(recharts_1.YAxis, { type: "number", dataKey: config.yAxisKey, name: config.yAxisLabel, label: config.yAxisLabel ? { value: config.yAxisLabel, angle: -90, position: 'left' } : undefined }), config.showTooltip && _jsx(recharts_1.Tooltip, { cursor: { strokeDasharray: '3 3' } }), config.showLegend && _jsx(recharts_1.Legend, {}), series.map(function (s, i) { return (_jsx(recharts_1.Scatter, { name: s.name, data: s.data, fill: s.color || colors[i % colors.length] }, s.name)); })] })); };
    var renderTreemap = function () { return (_jsx(recharts_1.Treemap, { data: transformedData, dataKey: config.yAxisKey, ratio: 4 / 3, stroke: "#fff", fill: colors[0], children: config.showTooltip && _jsx(recharts_1.Tooltip, {}) })); };
    var renderRadarChart = function () { return (_jsxs(recharts_1.RadarChart, { cx: "50%", cy: "50%", outerRadius: "80%", children: [_jsx(recharts_1.PolarGrid, {}), _jsx(recharts_1.PolarAngleAxis, { dataKey: config.xAxisKey }), _jsx(recharts_1.PolarRadiusAxis, {}), series.map(function (s, i) { return (_jsx(recharts_1.Radar, { name: s.name, dataKey: s.name, data: s.data, fill: s.color || colors[i % colors.length], fillOpacity: 0.6 }, s.name)); }), config.showTooltip && _jsx(recharts_1.Tooltip, {}), config.showLegend && _jsx(recharts_1.Legend, {})] })); };
    var renderHeatmap = function () {
        var maxValue = Math.max.apply(Math, transformedData.map(function (d) { return Number(d[config.yAxisKey || '']); }));
        var minValue = Math.min.apply(Math, transformedData.map(function (d) { return Number(d[config.yAxisKey || '']); }));
        return (_jsx(Box, { style: {
                display: 'grid',
                gridTemplateColumns: "repeat(".concat(Math.ceil(Math.sqrt(transformedData.length)), ", 1fr)"),
                gap: 1,
                width: '100%',
                height: '100%'
            }, children: transformedData.map(function (d, i) {
                var value = Number(d[config.yAxisKey || '']);
                var normalizedValue = (value - minValue) / (maxValue - minValue);
                return (_jsx(material_1.Box, { sx: {
                        backgroundColor: theme.palette.primary.main,
                        opacity: normalizedValue,
                        aspectRatio: '1',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': {
                            opacity: Math.min(normalizedValue + 0.2, 1)
                        }
                    }, title: "".concat(d[config.xAxisKey || ''], " : ").concat(value) }, i));
            }) }));
    };
    var chartMap = {
        line: renderLineChart,
        bar: renderBarChart,
        area: renderAreaChart,
        pie: renderPieChart,
        scatter: renderScatterChart,
        treemap: renderTreemap,
        radar: renderRadarChart,
        heatmap: renderHeatmap
    };
    return (_jsxs(Box, { sx: Object.assign({ p: 2, height: height, width: width }, sx), className: className, children: [title && (_jsx(material_1.Typography, { variant: "h6", gutterBottom: true, children: title })), description && (_jsx(material_1.Typography, { variant: "body2", color: "text.secondary", gutterBottom: true, children: description })), _jsx(recharts_1.ResponsiveContainer, { width: "100%", height: title || description ? '90%' : '100%', children: chartMap[config.type]() })] }));
};
exports.ChartSystem = ChartSystem;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChartSystem = void 0;
import react_1 from 'react';
import recharts_1 from 'recharts';
import material_1 from '@mui/material';
const ChartSystem = ({ title, description, series, config, height = 400, width = '100%', sx, className }) => {
    const theme = (0, material_1.useTheme)();
    const defaultColors = [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.error.main,
        theme.palette.warning.main,
        theme.palette.info.main,
        theme.palette.success.main
    ];
    const colors = config.customColors || defaultColors;
    const transformedData = (0, react_1.useMemo)(() => {
        var _a, _b;
        if (config.type === 'pie') {
            return ((_a = series[0]) === null || _a === void 0 ? void 0 : _a.data) || [];
        }
        if (config.type === 'treemap') {
            return series.map(s => ({
                name: s.name,
                children: s.data
            }));
        }
        if (config.type === 'heatmap') {
            return series.map(s => s.data).flat();
        }
        return ((_b = series[0]) === null || _b === void 0 ? void 0 : _b.data) || [];
    }, [series, config.type]);
    const renderLineChart = () => (<recharts_1.LineChart data={transformedData}>
            {config.showGrid && <recharts_1.CartesianGrid strokeDasharray="3 3"/>}
            <recharts_1.XAxis dataKey={config.xAxisKey} label={config.xAxisLabel ? { value: config.xAxisLabel, position: 'bottom' } : undefined}/>
            <recharts_1.YAxis label={config.yAxisLabel ? { value: config.yAxisLabel, angle: -90, position: 'left' } : undefined}/>
            {config.showTooltip && <recharts_1.Tooltip />}
            {config.showLegend && <recharts_1.Legend />}
            {series.map((s, i) => (<recharts_1.Line key={s.name} type="monotone" dataKey={s.name} stroke={s.color || colors[i % colors.length]} dot={{ r: 4 }} activeDot={{ r: 8 }}/>))}
        </recharts_1.LineChart>);
    const renderBarChart = () => (<recharts_1.BarChart data={transformedData}>
            {config.showGrid && <recharts_1.CartesianGrid strokeDasharray="3 3"/>}
            <recharts_1.XAxis dataKey={config.xAxisKey} label={config.xAxisLabel ? { value: config.xAxisLabel, position: 'bottom' } : undefined}/>
            <recharts_1.YAxis label={config.yAxisLabel ? { value: config.yAxisLabel, angle: -90, position: 'left' } : undefined}/>
            {config.showTooltip && <recharts_1.Tooltip />}
            {config.showLegend && <recharts_1.Legend />}
            {series.map((s, i) => (<recharts_1.Bar key={s.name} dataKey={s.name} fill={s.color || colors[i % colors.length]} stackId={config.stacked ? 'stack' : undefined}/>))}
        </recharts_1.BarChart>);
    const renderAreaChart = () => (<recharts_1.AreaChart data={transformedData}>
            {config.showGrid && <recharts_1.CartesianGrid strokeDasharray="3 3"/>}
            <recharts_1.XAxis dataKey={config.xAxisKey} label={config.xAxisLabel ? { value: config.xAxisLabel, position: 'bottom' } : undefined}/>
            <recharts_1.YAxis label={config.yAxisLabel ? { value: config.yAxisLabel, angle: -90, position: 'left' } : undefined}/>
            {config.showTooltip && <recharts_1.Tooltip />}
            {config.showLegend && <recharts_1.Legend />}
            {series.map((s, i) => (<recharts_1.Area key={s.name} type="monotone" dataKey={s.name} fill={s.color || colors[i % colors.length]} stroke={s.color || colors[i % colors.length]} stackId={config.stacked ? 'stack' : undefined}/>))}
        </recharts_1.AreaChart>);
    const renderPieChart = () => (<recharts_1.PieChart>
            <recharts_1.Pie data={transformedData} dataKey={config.yAxisKey} nameKey={config.xAxisKey} cx="50%" cy="50%" outerRadius={height * 0.4} label>
                {transformedData.map((_, index) => (<recharts_1.Cell key={`cell-${index}`} fill={colors[index % colors.length]}/>))}
            </recharts_1.Pie>
            {config.showTooltip && <recharts_1.Tooltip />}
            {config.showLegend && <recharts_1.Legend />}
        </recharts_1.PieChart>);
    const renderScatterChart = () => (<recharts_1.ScatterChart>
            {config.showGrid && <recharts_1.CartesianGrid strokeDasharray="3 3"/>}
            <recharts_1.XAxis type="number" dataKey={config.xAxisKey} name={config.xAxisLabel} label={config.xAxisLabel ? { value: config.xAxisLabel, position: 'bottom' } : undefined}/>
            <recharts_1.YAxis type="number" dataKey={config.yAxisKey} name={config.yAxisLabel} label={config.yAxisLabel ? { value: config.yAxisLabel, angle: -90, position: 'left' } : undefined}/>
            {config.showTooltip && <recharts_1.Tooltip cursor={{ strokeDasharray: '3 3' }}/>}
            {config.showLegend && <recharts_1.Legend />}
            {series.map((s, i) => (<recharts_1.Scatter key={s.name} name={s.name} data={s.data} fill={s.color || colors[i % colors.length]}/>))}
        </recharts_1.ScatterChart>);
    const renderTreemap = () => (<recharts_1.Treemap data={transformedData} dataKey={config.yAxisKey} ratio={4 / 3} stroke="#fff" fill={colors[0]}>
            {config.showTooltip && <recharts_1.Tooltip />}
        </recharts_1.Treemap>);
    const renderRadarChart = () => (<recharts_1.RadarChart cx="50%" cy="50%" outerRadius="80%">
            <recharts_1.PolarGrid />
            <recharts_1.PolarAngleAxis dataKey={config.xAxisKey}/>
            <recharts_1.PolarRadiusAxis />
            {series.map((s, i) => (<recharts_1.Radar key={s.name} name={s.name} dataKey={s.name} data={s.data} fill={s.color || colors[i % colors.length]} fillOpacity={0.6}/>))}
            {config.showTooltip && <recharts_1.Tooltip />}
            {config.showLegend && <recharts_1.Legend />}
        </recharts_1.RadarChart>);
    const renderHeatmap = () => {
        const maxValue = Math.max(...transformedData.map(d => Number(d[config.yAxisKey || ''])));
        const minValue = Math.min(...transformedData.map(d => Number(d[config.yAxisKey || ''])));
        return (<material_1.Box sx={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(transformedData.length))}, 1fr)`,
                gap: 1,
                width: '100%',
                height: '100%'
            }}>
                {transformedData.map((d, i) => {
                const value = Number(d[config.yAxisKey || '']);
                const normalizedValue = (value - minValue) / (maxValue - minValue);
                return (<material_1.Box key={i} sx={{
                        backgroundColor: theme.palette.primary.main,
                        opacity: normalizedValue,
                        aspectRatio: '1',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': {
                            opacity: Math.min(normalizedValue + 0.2, 1)
                        }
                    }} title={`${d[config.xAxisKey || '']} : ${value}`}/>);
            })}
            </material_1.Box>);
    };
    const chartMap = {
        line: renderLineChart,
        bar: renderBarChart,
        area: renderAreaChart,
        pie: renderPieChart,
        scatter: renderScatterChart,
        treemap: renderTreemap,
        radar: renderRadarChart,
        heatmap: renderHeatmap
    };
    return (<material_1.Paper sx={Object.assign({ p: 2, height: height, width: width }, sx)} className={className}>
            {title && (<material_1.Typography variant="h6" gutterBottom>
                    {title}
                </material_1.Typography>)}
            {description && (<material_1.Typography variant="body2" color="text.secondary" gutterBottom>
                    {description}
                </material_1.Typography>)}
            <recharts_1.ResponsiveContainer width="100%" height={title || description ? '90%' : '100%'}>
                {chartMap[config.type]()}
            </recharts_1.ResponsiveContainer>
        </material_1.Paper>);
};
exports.ChartSystem = ChartSystem;
export {};
//# sourceMappingURL=ChartSystem.js.map
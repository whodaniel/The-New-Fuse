// @ts-nocheck
import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
} from 'recharts';

interface ChartSeries {
  name: string;
  data: any[];
  color?: string;
}

interface ChartConfig {
  type: 'line' | 'bar' | 'area' | 'pie' | 'scatter' | 'treemap' | 'radar' | 'heatmap';
  xAxisKey: string;
  yAxisKey: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
  customColors?: string[];
}

interface ChartSystemProps {
  title?: string;
  description?: string;
  series: ChartSeries[];
  config: ChartConfig;
  height?: number | string;
  width?: string | number;
  className?: string;
}

export const ChartSystem: React.FC<ChartSystemProps> = ({
  title,
  description,
  series,
  config,
  height = 400,
  width = '100%',
  className,
}) => {
  const defaultColors = [
    '#3B82F6', // blue-500
    '#EC4899', // pink-500
    '#EF4444', // red-500
    '#F59E0B', // amber-500
    '#10B981', // emerald-500
    '#8B5CF6', // violet-500
  ];
  const colors = config.customColors || defaultColors;

  const transformedData = useMemo(() => {
    if (config.type === 'pie') {
      return series[0]?.data || [];
    }
    if (config.type === 'treemap') {
      return series.map((s) => ({
        name: s.name,
        children: s.data,
      }));
    }
    if (config.type === 'heatmap') {
      return series.map((s) => s.data).flat();
    }
    return series[0]?.data || [];
  }, [series, config.type]);

  const renderLineChart = () => (
    <LineChart data={transformedData}>
      {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
      <XAxis
        dataKey={config.xAxisKey}
        label={config.xAxisLabel ? { value: config.xAxisLabel, position: 'bottom' } : undefined}
      />
      <YAxis
        label={
          config.yAxisLabel ? { value: config.yAxisLabel, angle: -90, position: 'left' } : undefined
        }
      />
      {config.showTooltip && <Tooltip />}
      {config.showLegend && <Legend />}
      {series.map((s, i) => (
        <Line
          key={s.name}
          type="monotone"
          dataKey={s.name}
          stroke={s.color || colors[i % colors.length]}
          dot={{ r: 4 }}
          activeDot={{ r: 8 }}
        />
      ))}
    </LineChart>
  );

  const renderBarChart = () => (
    <BarChart data={transformedData}>
      {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
      <XAxis
        dataKey={config.xAxisKey}
        label={config.xAxisLabel ? { value: config.xAxisLabel, position: 'bottom' } : undefined}
      />
      <YAxis
        label={
          config.yAxisLabel ? { value: config.yAxisLabel, angle: -90, position: 'left' } : undefined
        }
      />
      {config.showTooltip && <Tooltip />}
      {config.showLegend && <Legend />}
      {series.map((s, i) => (
        <Bar
          key={s.name}
          dataKey={s.name}
          fill={s.color || colors[i % colors.length]}
          stackId={config.stacked ? 'stack' : undefined}
        />
      ))}
    </BarChart>
  );

  const renderAreaChart = () => (
    <AreaChart data={transformedData}>
      {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
      <XAxis
        dataKey={config.xAxisKey}
        label={config.xAxisLabel ? { value: config.xAxisLabel, position: 'bottom' } : undefined}
      />
      <YAxis
        label={
          config.yAxisLabel ? { value: config.yAxisLabel, angle: -90, position: 'left' } : undefined
        }
      />
      {config.showTooltip && <Tooltip />}
      {config.showLegend && <Legend />}
      {series.map((s, i) => (
        <Area
          key={s.name}
          type="monotone"
          dataKey={s.name}
          fill={s.color || colors[i % colors.length]}
          stroke={s.color || colors[i % colors.length]}
          stackId={config.stacked ? 'stack' : undefined}
        />
      ))}
    </AreaChart>
  );

  const renderPieChart = () => (
    <PieChart>
      <Pie
        data={transformedData}
        dataKey={config.yAxisKey}
        nameKey={config.xAxisKey}
        cx="50%"
        cy="50%"
        outerRadius="80%"
        label
      >
        {transformedData.map((_, index) => (
          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
        ))}
      </Pie>
      {config.showTooltip && <Tooltip />}
      {config.showLegend && <Legend />}
    </PieChart>
  );

  const renderScatterChart = () => (
    <ScatterChart>
      {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
      <XAxis
        type="number"
        dataKey={config.xAxisKey}
        name={config.xAxisLabel}
        label={config.xAxisLabel ? { value: config.xAxisLabel, position: 'bottom' } : undefined}
      />
      <YAxis
        type="number"
        dataKey={config.yAxisKey}
        name={config.yAxisLabel}
        label={
          config.yAxisLabel ? { value: config.yAxisLabel, angle: -90, position: 'left' } : undefined
        }
      />
      {config.showTooltip && <Tooltip cursor={{ strokeDasharray: '3 3' }} />}
      {config.showLegend && <Legend />}
      {series.map((s, i) => (
        <Scatter
          key={s.name}
          name={s.name}
          data={s.data}
          fill={s.color || colors[i % colors.length]}
        />
      ))}
    </ScatterChart>
  );

  const renderTreemap = () => (
    <Treemap
      data={transformedData}
      dataKey={config.yAxisKey}
      ratio={4 / 3}
      stroke="#fff"
      fill={colors[0]}
    >
      {config.showTooltip && <Tooltip />}
    </Treemap>
  );

  const renderRadarChart = () => (
    <RadarChart cx="50%" cy="50%" outerRadius="80%">
      <PolarGrid />
      <PolarAngleAxis dataKey={config.xAxisKey} />
      <PolarRadiusAxis />
      {series.map((s, i) => (
        <Radar
          key={s.name}
          name={s.name}
          dataKey={s.name}
          data={s.data}
          fill={s.color || colors[i % colors.length]}
          fillOpacity={0.6}
        />
      ))}
      {config.showTooltip && <Tooltip />}
      {config.showLegend && <Legend />}
    </RadarChart>
  );

  const renderHeatmap = () => {
    const d = (transformedData as any[]) || [];
    const maxValue = Math.max(...d.map((item) => Number(item[config.yAxisKey || '']) || 0));
    const minValue = Math.min(...d.map((item) => Number(item[config.yAxisKey || '']) || 0));

    const gridColCount = Math.ceil(Math.sqrt(d.length));

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridColCount}, 1fr)`,
          gap: '4px',
          width: '100%',
          height: '100%',
        }}
      >
        {d.map((item, i) => {
          const value = Number(item[config.yAxisKey || '']);
          const normalizedValue =
            maxValue === minValue ? 1 : (value - minValue) / (maxValue - minValue);
          return (
            <div
              key={i}
              className="bg-blue-500 rounded"
              style={{
                opacity: Math.max(0.1, normalizedValue),
                aspectRatio: '1',
                cursor: 'pointer',
              }}
              title={`${item[config.xAxisKey || '']} : ${value}`}
            />
          );
        })}
      </div>
    );
  };

  const chartMap = {
    line: renderLineChart,
    bar: renderBarChart,
    area: renderAreaChart,
    pie: renderPieChart,
    scatter: renderScatterChart,
    treemap: renderTreemap,
    radar: renderRadarChart,
    heatmap: renderHeatmap,
  };

  return (
    <div
      className={`p-4 border border-gray-200 rounded-md bg-transparent ${className || ''}`}
      style={{ height: height, width: width }}
    >
      {title && <h3 className="text-lg font-medium mb-2">{title}</h3>}
      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
      <div style={{ width: '100%', height: title || description ? 'calc(100% - 3em)' : '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartMap[config.type]()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

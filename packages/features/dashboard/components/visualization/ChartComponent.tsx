import React, { FC, useMemo } from 'react';
import {
  LineChart, BarChart, PieChart, AreaChart,
  Line, Bar, Pie, Area,
  CartesianGrid, XAxis, YAxis,
  Tooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts';

export type ChartType = 'line' | 'bar' | 'pie' | 'area';

interface ChartData {
  [key: string]: string | number | Date;
}

interface ChartComponentProps {
  type: ChartType;
  data: ChartData[];
  xKey: string;
  yKeys: string[];
  colors?: string[];
  stacked?: boolean;
  className?: string;
  height?: number | string;
  tooltipFormatter?: (value: number | string) => string;
}

const defaultColors = [
  '#2563eb', // blue
  '#7c3aed', // purple
  '#db2777', // pink
  '#16a34a', // green
  '#ea580c', // orange
  '#0d9488', // teal
];

export const ChartComponent: FC<ChartComponentProps> = ({
  type,
  data,
  xKey,
  yKeys,
  colors = defaultColors,
  stacked = false,
  className = '',
  height = 300,
  tooltipFormatter
}) => {
  const chartColors = useMemo(() => {
    return colors.length >= yKeys.length
      ? colors
      : [...colors, ...Array(yKeys.length - colors.length).fill(defaultColors[colors.length % defaultColors.length])];
  }, [colors, yKeys]);

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip formatter={tooltipFormatter} />
            <Legend />
            {yKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={chartColors[index]}
                activeDot={{ r: 8 }}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip formatter={tooltipFormatter} />
            <Legend />
            {yKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={chartColors[index]}
                stackId={stacked ? 'stack' : undefined}
              />
            ))}
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              nameKey={xKey}
              dataKey={yKeys[0]}
              cx="50%"
              cy="50%"
              outerRadius="80%"
              fill={chartColors[0]}
              label
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={tooltipFormatter} />
            <Legend />
          </PieChart>
        );

      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip formatter={tooltipFormatter} />
            <Legend />
            {yKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                fill={chartColors[index]}
                stroke={chartColors[index]}
                stackId={stacked ? 'stack' : undefined}
              />
            ))}
          </AreaChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`w-full h-[${typeof height === 'number' ? `${height}px` : height}] ${className}`}>
      <ResponsiveContainer>{renderChart()}</ResponsiveContainer>
    </div>
  );
};

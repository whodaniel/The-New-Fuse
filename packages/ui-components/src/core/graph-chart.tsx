import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

export type ChartType = "line" | "bar" | "pie" | "area";

export interface ChartData {
  id: string;
  label: string;
  value: number;
  color?: string;
}

export interface SeriesData {
  timestamp: string | number;
  [key: string]: string | number;
}

export interface ChartProps {
  type: ChartType;
  data: ChartData[] | SeriesData[];
  title?: string;
  xAxisKey?: string;
  yAxisKey?: string;
  series?: Array<{
    key: string;
    label: string;
    color: string;
  }>;
  stacked?: boolean;
  height?: number | string;
  width?: number | string;
  colors?: string[];
  className?: string;
}

const defaultColors = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#16a34a",
  "#ea580c",
  "#0d9488",
];

export function GraphChart({
  type,
  data,
  title,
  xAxisKey = "timestamp",
  yAxisKey = "value",
  series,
  stacked = false,
  height = 300,
  width = "100%",
  colors = defaultColors,
  className = "",
}: ChartProps) {
  const isPieChart = type === "pie";
  const chartData = isPieChart ? data as ChartData[] : data as SeriesData[];

  const renderChart = () => {
    switch (type) {
      case "line":
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {series
              ? series.map((s, index) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.label}
                    stroke={s.color || colors[index % colors.length]}
                  />
                ))
              : <Line
                  type="monotone"
                  dataKey={yAxisKey}
                  stroke={colors[0]}
                  activeDot={{ r: 8 }}
                />
            }
          </LineChart>
        );

      case "bar":
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {series
              ? series.map((s, index) => (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    name={s.label}
                    fill={s.color || colors[index % colors.length]}
                    stackId={stacked ? "stack" : undefined}
                  />
                ))
              : <Bar
                  dataKey={yAxisKey}
                  fill={colors[0]}
                />
            }
          </BarChart>
        );

      case "pie":
        return (
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.id}
                  fill={entry.color || colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );

      case "area":
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {series
              ? series.map((s, index) => (
                  <Area
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.label}
                    fill={s.color || colors[index % colors.length]}
                    stroke={s.color || colors[index % colors.length]}
                    stackId={stacked ? "stack" : undefined}
                    fillOpacity={0.6}
                  />
                ))
              : <Area
                  type="monotone"
                  dataKey={yAxisKey}
                  stroke={colors[0]}
                  fill={colors[0]}
                  fillOpacity={0.6}
                />
            }
          </AreaChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
      )}
      <ResponsiveContainer width={width} height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}

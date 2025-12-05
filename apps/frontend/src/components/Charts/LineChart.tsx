import React from 'react';
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface LineChartProps {
  data: Array<Record<string, any>>;
  xKey: string;
  yKey: string;
  height?: number;
}

export const LineChart: React.FC<LineChartProps> = ({ data, xKey, yKey, height = 300 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey={yKey} stroke="#8884d8" />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

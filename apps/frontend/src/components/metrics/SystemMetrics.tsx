import { Card, CardContent } from '@/components/ui/card';
import React from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface SystemMetricsProps {
  data: {
    cpu: number;
    memory: number;
    latency: number;
    timestamp: number;
  }[];
}

export const SystemMetrics: React.FC<SystemMetricsProps> = ({ data }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium">CPU Usage</div>
            <div className="text-2xl font-bold">{data[data.length - 1]?.cpu}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium">Memory Usage</div>
            <div className="text-2xl font-bold">{data[data.length - 1]?.memory}MB</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium">Latency</div>
            <div className="text-2xl font-bold">{data[data.length - 1]?.latency}ms</div>
          </CardContent>
        </Card>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
            <YAxis />
            <Tooltip labelFormatter={(value) => new Date(value).toLocaleString()} />
            <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU %" />
            <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Memory (MB)" />
            <Line type="monotone" dataKey="latency" stroke="#ffc658" name="Latency (ms)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

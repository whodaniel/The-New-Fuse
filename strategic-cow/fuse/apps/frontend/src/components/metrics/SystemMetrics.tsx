import { GlassCard as Card } from '@/components/ui/premium/GlassCard';
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
  const latestData = data[data.length - 1];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card title="CPU Usage" gradient="blue" className="text-center">
          <div className="text-2xl font-bold text-white">{latestData?.cpu}%</div>
        </Card>
        <Card title="Memory Usage" gradient="purple" className="text-center">
          <div className="text-2xl font-bold text-white">{latestData?.memory}MB</div>
        </Card>
        <Card title="Latency" gradient="cyan" className="text-center">
          <div className="text-2xl font-bold text-white">{latestData?.latency}ms</div>
        </Card>
      </div>

      <Card title="System Metrics Over Time" gradient="green" className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              stroke="rgba(255,255,255,0.5)"
            />
            <YAxis stroke="rgba(255,255,255,0.5)" />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleString()}
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
            <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU %" />
            <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Memory (MB)" />
            <Line type="monotone" dataKey="latency" stroke="#ffc658" name="Latency (ms)" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

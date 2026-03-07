// @ts-nocheck
import { GlassCard as Card } from '@/components/ui/premium/GlassCard';
import React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface PerformanceMetricsProps {
  data: {
    successRate: number;
    responseTime: number;
    throughput: number;
    errorRate: number;
    timestamp: number;
  }[];
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ data }) => {
  const latestMetrics = data[data.length - 1];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card title="Success Rate" gradient="blue" className="text-center">
          <div className="text-2xl font-bold text-white">{latestMetrics?.successRate}%</div>
        </Card>
        <Card title="Error Rate" gradient="red" className="text-center">
          <div className="text-2xl font-bold text-white">{latestMetrics?.errorRate}%</div>
        </Card>
        <Card title="Avg Response Time" gradient="cyan" className="text-center">
          <div className="text-2xl font-bold text-white">{latestMetrics?.responseTime}ms</div>
        </Card>
        <Card title="Throughput" gradient="green" className="text-center">
          <div className="text-2xl font-bold text-white">{latestMetrics?.throughput}/s</div>
        </Card>
      </div>

      <Card title="Performance Over Time" gradient="purple" className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
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
            <Bar dataKey="successRate" fill="#8884d8" name="Success %" />
            <Bar dataKey="errorRate" fill="#ff6b6b" name="Error %" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

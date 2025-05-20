import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PerformanceMetricsProps {
  data: {
    successRate: number;
    responseTime: number;
    throughput: number;
    errorRate: number;
    timestamp: number;
  }[];
}

export const PerformanceMetrics: React.React.FC<PerformanceMetricsProps> = ({ data }) => {
  const latestMetrics = data[data.length - 1];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium">Success Rate</div>
            <div className="text-2xl font-bold">{latestMetrics?.successRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium">Error Rate</div>
            <div className="text-2xl font-bold">{latestMetrics?.errorRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium">Avg Response Time</div>
            <div className="text-2xl font-bold">{latestMetrics?.responseTime}ms</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium">Throughput</div>
            <div className="text-2xl font-bold">{latestMetrics?.throughput}/s</div>
          </CardContent>
        </Card>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={(value) => new Date(value).toLocaleTimeString()} 
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleString()}
            />
            <Bar dataKey="successRate" fill="#82ca9d" name="Success Rate %" />
            <Bar dataKey="errorRate" fill="#ff8042" name="Error Rate %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
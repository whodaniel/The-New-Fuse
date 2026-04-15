'use client';
import { GlassCard as Card } from '@/components/ui/premium/GlassCard';
import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { webSocketService } from '../services/websocket';

interface PerformanceData {
  timestamp: number;
  cpuUsage: number;
  memoryUsage: number;
  activeAgents: number;
}

export function PerformanceMetrics() {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);

  useEffect(() => {
    const handlePerformanceUpdate = (data: PerformanceData) => {
      setPerformanceData((prevData) => [...prevData.slice(-19), data]);
    };
    webSocketService.on('performanceUpdate', handlePerformanceUpdate);
    return () => {
      webSocketService.off('performanceUpdate', handlePerformanceUpdate);
    };
  }, []);

  return (
    <Card title="Performance Metrics" gradient="purple" className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={performanceData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
            stroke="rgba(255,255,255,0.5)"
          />
          <YAxis yAxisId="left" stroke="rgba(255,255,255,0.5)" />
          <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.5)" />
          <Tooltip
            labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
            contentStyle={{
              backgroundColor: 'rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="cpuUsage"
            stroke="#8884d8"
            name="CPU Usage (%)"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="memoryUsage"
            stroke="#82ca9d"
            name="Memory Usage (%)"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="activeAgents"
            stroke="#ffc658"
            name="Active Agents"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

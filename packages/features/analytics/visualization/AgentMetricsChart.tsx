import React from 'react';
import { ChartComponent } from 'packages/features/dashboard/components/visualization/ChartComponent';
import { formatDateTime } from '@/utils/date';

interface AgentMetric {
  timestamp: Date;
  successRate: number;
  responseTime: number;
  errorRate: number;
  tokenUsage: number;
  throughput: number;
}

interface AgentMetricsChartProps {
  metrics: AgentMetric[];
  timeRange: '24h' | '7d' | '30d';
}

export function AgentMetricsChart({ metrics, _timeRange }: AgentMetricsChartProps) {
  const formattedData = metrics.map(m => ({
    ...m,
    timestamp: formatDateTime(m.timestamp),
    successRate: m.successRate * 100,
  }));

  return (
    <div className="space-y-6">
      <div className="h-[300px]">
        <h3 className="text-lg font-medium mb-2">Success & Error Rates</h3>
        <ChartComponent
          type="line"
          data={formattedData}
          xKey="timestamp"
          yKeys={['successRate', 'errorRate']}
          colors={['#10B981', '#EF4444']}
          tooltipFormatter={(value) => `${value.toFixed(2)}%`}
        />
      </div>

      <div className="h-[300px]">
        <h3 className="text-lg font-medium mb-2">Response Time & Throughput</h3>
        <ChartComponent
          type="line"
          data={formattedData}
          xKey="timestamp"
          yKeys={['responseTime', 'throughput']}
          colors={['#60A5FA', '#F59E0B']}
          tooltipFormatter={(value) => {
            if (value > 1000) return `${(value / 1000).toFixed(2)}k`;
            return value.toFixed(2);
          }}
        />
      </div>

      <div className="h-[300px]">
        <h3 className="text-lg font-medium mb-2">Token Usage</h3>
        <ChartComponent
          type="area"
          data={formattedData}
          xKey="timestamp"
          yKeys={['tokenUsage']}
          colors={['#8B5CF6']}
          tooltipFormatter={(value) => {
            if (value > 1000) return `${(value / 1000).toFixed(1)}k tokens`;
            return `${value} tokens`;
          }}
        />
      </div>
    </div>
  );
}
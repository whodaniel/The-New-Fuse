import React, { useState, useEffect } from 'react';
import { Card } from '@/shared/ui/core/Card';
import { ChartComponent } from 'packages/features/dashboard/components/visualization/ChartComponent';
import { webSocketService } from '@/services/websocket';

interface PerformanceMetric {
  timestamp: number;
  cpu: number;
  memory: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
}

export function PerformanceMetrics() {
  const [performanceData, setPerformanceData] = useState<PerformanceMetric[]>([]);

  useEffect(() => {
    const handlePerformanceUpdate = (data: PerformanceMetric) => {
      setPerformanceData(prevData => [...prevData.slice(-19), data]);
    };

    webSocketService.on('performanceUpdate', handlePerformanceUpdate);
    return () => {
      webSocketService.off('performanceUpdate', handlePerformanceUpdate);
    };
  }, []);

  const tooltipFormatter = (value: number) => {
    if (value > 1000) return `${(value / 1000).toFixed(2)}k`;
    return value.toFixed(2);
  };

  return (
    <Card className="w-full p-4">
      <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-[300px]">
          <h3 className="text-lg mb-2">Resource Usage</h3>
          <ChartComponent
            type="area"
            data={performanceData}
            xKey="timestamp"
            yKeys={['cpu', 'memory']}
            tooltipFormatter={tooltipFormatter}
            stacked={true}
          />
        </div>

        <div className="h-[300px]">
          <h3 className="text-lg mb-2">Response Metrics</h3>
          <ChartComponent
            type="line"
            data={performanceData}
            xKey="timestamp"
            yKeys={['responseTime', 'throughput']}
            tooltipFormatter={tooltipFormatter}
          />
        </div>

        <div className="h-[300px]">
          <h3 className="text-lg mb-2">Error Rate</h3>
          <ChartComponent
            type="line"
            data={performanceData}
            xKey="timestamp"
            yKeys={['errorRate']}
            colors={['#ef4444']}
            tooltipFormatter={(value) => `${(value * 100).toFixed(2)}%`}
          />
        </div>
      </div>
    </Card>
  );
}
import React from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, BarChart } from '@/components/ui/charts';
import { useAgentMetrics } from '@/hooks/useAgentMetrics';

export const AgentMonitoringDashboard: React.FC = () => {
  const { metrics, loading } = useAgentMetrics();

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <h3>Resource Usage</h3>
        <LineChart
          data={metrics?.resourceUsage}
          metrics={['cpu', 'memory', 'tokens']}
        />
      </Card>
      
      <Card>
        <h3>Response Times</h3>
        <LineChart
          data={metrics?.responseTimes}
          metrics={['avg', 'p95', 'p99']}
        />
      </Card>

      <Card>
        <h3>Task Success Rate</h3>
        <BarChart
          data={metrics?.taskSuccess}
          categories={['completed', 'failed', 'retry']}
        />
      </Card>

      <Card>
        <h3>Active Connections</h3>
        <LineChart
          data={metrics?.connections}
          metrics={['websocket', 'http']}
        />
      </Card>
    </div>
  );
};
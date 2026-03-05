// @ts-nocheck
import { BarChart, LineChart } from '@/components/ui/charts';
import { GlassCard } from '@/components/ui/premium';
import { useAgentMetrics } from '@/hooks/useAgentMetrics';
import React from 'react';

export const AgentMonitoringDashboard: React.FC = () => {
  const { metrics, loading } = useAgentMetrics();

  return (
    <div className="grid grid-cols-2 gap-4">
      <GlassCard className="p-6">
        <h3>Resource Usage</h3>
        <LineChart data={metrics?.resourceUsage} metrics={['cpu', 'memory', 'tokens']} />
      </GlassCard>

      <GlassCard className="p-6">
        <h3>Response Times</h3>
        <LineChart data={metrics?.responseTimes} metrics={['avg', 'p95', 'p99']} />
      </GlassCard>

      <GlassCard className="p-6">
        <h3>Task Success Rate</h3>
        <BarChart data={metrics?.taskSuccess} categories={['completed', 'failed', 'retry']} />
      </GlassCard>

      <GlassCard className="p-6">
        <h3>Active Connections</h3>
        <LineChart data={metrics?.connections} metrics={['websocket', 'http']} />
      </GlassCard>
    </div>
  );
};

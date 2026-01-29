'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import React, { useEffect, useState } from 'react';
import { AgentMetrics as AgentMetricsType } from '../types';

interface AgentMetricsDisplayProps {
  agentId: string;
  refreshInterval?: number;
  onMetricsUpdate?: (metrics: AgentMetricsType) => void;
}

export const AgentMetricsDisplay: React.FC<AgentMetricsDisplayProps> = ({
  agentId,
  refreshInterval = 30000,
  onMetricsUpdate,
}) => {
  const [metrics, setMetrics] = useState<AgentMetricsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(`/api/agents/${agentId}/metrics`);
        if (!response.ok) throw new Error('Failed to fetch metrics');
        const data: AgentMetricsType = await response.json();
        setMetrics(data);
        setError(null);
        onMetricsUpdate?.(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [agentId, refreshInterval, onMetricsUpdate]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-red-500">Error: {error}</p>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className="p-6">
        <p className="text-gray-500">No metrics available</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Agent Metrics</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Success Rate</h3>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{metrics.successRate}%</p>
            </div>
            <Progress value={metrics.successRate} className="mt-2" />
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Response Time</h3>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">
                {metrics.averageResponseTime}ms
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Tasks</h3>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Completed</span>
                <span className="font-medium text-gray-900">
                  {metrics.completedTasks}/{metrics.totalTasks}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Failed</span>
                <span className="font-medium text-gray-900">{metrics.failedTasks}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Resource Usage</h3>
            <div className="mt-2 space-y-2">
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">CPU</span>
                  <span className="font-medium text-gray-900">
                    {metrics.resourceUsage?.cpu ?? 0}%
                  </span>
                </div>
                <Progress value={metrics.resourceUsage?.cpu ?? 0} className="mt-1" />
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Memory</span>
                  <span className="font-medium text-gray-900">
                    {metrics.resourceUsage?.memory ?? 0}%
                  </span>
                </div>
                <Progress value={metrics.resourceUsage?.memory ?? 0} className="mt-1" />
              </div>
            </div>
          </div>
        </div>

        {metrics.lastActive && (
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500">
              Last active: {new Date(metrics.lastActive).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

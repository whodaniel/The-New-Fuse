import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { toast } from 'react-toastify';
export const AgentMetricsDisplay: React.FC = ({ agentId, refreshInterval = 30000, onMetricsUpdate, }) => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchMetrics = async (): Promise<void> {) => {
            try {
                const response = await fetch(`/api/agents/${agentId}/metrics`);
                if (!response.ok)
                    throw new Error('Failed to fetch metrics');
                const data = await response.json();
                setMetrics(data);
                onMetricsUpdate === null || onMetricsUpdate === void 0 ? void 0 : onMetricsUpdate(data);
            }
            catch (error) {
                console.error('Error fetching metrics:', error);
                toast.error('Failed to fetch agent metrics');
            }
            finally {
                setLoading(false);
            }
        };
        fetchMetrics();
        const interval = setInterval(fetchMetrics, refreshInterval);
        return () => clearInterval(interval);
    }, [agentId, refreshInterval, onMetricsUpdate]);
    if (loading) {
        return (<Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </Card>);
    }
    if (!metrics) {
        return (<Card className="p-6">
        <p className="text-gray-500">No metrics available</p>
      </Card>);
    }
    return (<Card className="p-6 space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Success Rate</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">
              {metrics.successRate}%
            </p>
          </div>
          <Progress value={metrics.successRate} className="mt-2"/>
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
          <div className="mt-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Completed</span>
              <span className="text-sm font-medium text-gray-900">
                {metrics.completedTasks}/{metrics.totalTasks}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-sm text-gray-500">Failed</span>
              <span className="text-sm font-medium text-gray-900">
                {metrics.failedTasks}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">Resource Usage</h3>
          <div className="mt-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">CPU</span>
              <span className="text-sm font-medium text-gray-900">
                {metrics.resourceUsage.cpu}%
              </span>
            </div>
            <Progress value={metrics.resourceUsage.cpu} className="mt-1"/>
            <div className="flex justify-between mt-2">
              <span className="text-sm text-gray-500">Memory</span>
              <span className="text-sm font-medium text-gray-900">
                {metrics.resourceUsage.memory}%
              </span>
            </div>
            <Progress value={metrics.resourceUsage.memory} className="mt-1"/>
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Last active: {new Date(metrics.lastActive).toLocaleString()}
      </div>
    </Card>);
};
//# sourceMappingURL=index.js.map
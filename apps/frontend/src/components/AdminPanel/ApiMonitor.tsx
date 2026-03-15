import { LoadingSpinner, StatCard } from '@/components/ui/design-system';
import React from 'react';
import { useApiMetrics } from '../../hooks/useApiMetrics';

export const ApiMonitor: React.FC = () => {
  const { metrics, endpoints, errors, loading } = useApiMetrics();

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Requests"
          value={metrics.totalRequests}
          subtitle="Last 24 hours"
          color="primary"
        />
        <StatCard
          title="Error Rate"
          value={`${metrics.errorRate}%`}
          subtitle="Overall"
          color={metrics.errorRate > 5 ? 'danger' : 'success'}
        />
        <StatCard
          title="Avg Response Time"
          value={`${metrics.avgResponseTime}ms`}
          subtitle="All endpoints"
          color="primary"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-transparent dark:bg-transparent rounded-md shadow-none-none">
          <h3 className="text-lg font-semibold mb-4">Request Volume</h3>
          {/* TODO: Replace with actual chart component */}
          <div className="h-[200px] flex items-center justify-center text-gray-400">
            Chart placeholder
          </div>
        </div>
        <div className="p-4 bg-transparent dark:bg-transparent rounded-md shadow-none-none">
          <h3 className="text-lg font-semibold mb-4">Response Times</h3>
          {/* TODO: Replace with actual chart component */}
          <div className="h-[200px] flex items-center justify-center text-gray-400">
            Chart placeholder
          </div>
        </div>
      </div>

      {/* Endpoints Table */}
      <div className="bg-transparent dark:bg-transparent rounded-md shadow-none-none overflow-hidden">
        <table className="min-w-full divide-y divide-border/50 dark:divide-border/40">
          <thead className="bg-transparent dark:bg-neutral-900">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                Endpoint
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                Method
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                Requests
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                Avg Time
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                Error Rate
              </th>
            </tr>
          </thead>
          <tbody className="bg-transparent dark:bg-transparent divide-y divide-border/50 dark:divide-border/40">
            {endpoints.map((endpoint) => (
              <tr
                key={`${endpoint.method}-${endpoint.path}`}
                className="hover:bg-transparent dark:hover:bg-muted/20"
              >
                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {endpoint.path}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground dark:text-muted-foreground">
                  {endpoint.method}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground dark:text-muted-foreground">
                  {endpoint.requests}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground dark:text-muted-foreground">
                  {endpoint.avgTime}ms
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground dark:text-muted-foreground">
                  {endpoint.errorRate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

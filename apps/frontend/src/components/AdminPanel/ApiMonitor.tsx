import React from 'react';
import { StatCard, LoadingSpinner } from '@/components/ui/design-system';
import { useApiMetrics } from '../../hooks/useApiMetrics';

export const ApiMonitor: React.FC = () => {
  const { metrics, endpoints, errors, loading } = useApiMetrics();

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Request Volume</h3>
          {/* TODO: Replace with actual chart component */}
          <div className="h-[200px] flex items-center justify-center text-gray-400">
            Chart placeholder
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Response Times</h3>
          {/* TODO: Replace with actual chart component */}
          <div className="h-[200px] flex items-center justify-center text-gray-400">
            Chart placeholder
          </div>
        </div>
      </div>

      {/* Endpoints Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
          <thead className="bg-neutral-50 dark:bg-neutral-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Endpoint
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Requests
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Avg Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Error Rate
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
            {endpoints.map((endpoint) => (
              <tr key={`${endpoint.method}-${endpoint.path}`} className="hover:bg-neutral-50 dark:hover:bg-neutral-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {endpoint.path}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                  {endpoint.method}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                  {endpoint.requests}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                  {endpoint.avgTime}ms
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
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


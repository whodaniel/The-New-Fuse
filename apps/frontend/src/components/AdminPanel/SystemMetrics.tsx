import React from 'react';
import { StatCard, LoadingSpinner } from '@/components/ui/design-system';
import { useSystemMetrics } from '../../hooks/useSystemMetrics';

export const SystemMetrics: React.FC = () => {
  const { metrics, loading, error } = useSystemMetrics();

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-danger-600">Error loading metrics</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        title="CPU Usage"
        value={`${metrics.cpuUsage.value}%`}
        subtitle="Current CPU utilization"
        color={metrics.cpuUsage.value > 80 ? 'danger' : 'primary'}
      />
      <StatCard
        title="Memory Usage"
        value={`${metrics.memoryUsage.value}MB`}
        subtitle="Current memory usage"
        color={metrics.memoryUsage.value > 1000 ? 'warning' : 'primary'}
      />
      <StatCard
        title="Active Connections"
        value={metrics.activeConnections.value}
        subtitle="Current active connections"
        color="primary"
      />
    </div>
  );
};

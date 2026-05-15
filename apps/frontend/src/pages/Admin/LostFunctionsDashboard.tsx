// @ts-nocheck
/**
 * Lost Functions Dashboard
 *
 * Surfaces backend functions that exist but weren't exposed in the frontend.
 * Organized by category for easy navigation.
 */

import Admin, { QueueMetrics, RelayAgent, ServiceStatus } from '@/services/admin.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertCircle,
  Bot,
  Box,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Cpu,
  Eye,
  Filter,
  HardDrive,
  Layers,
  LayoutDashboard,
  MemoryStick,
  MessageSquare,
  Pause,
  Play,
  RefreshCw,
  Search,
  Server,
  Settings,
  Trash2,
  Users,
  X,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

const Section: React.FC<SectionProps> = ({ title, icon, children, defaultExpanded = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            {icon}
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        </div>
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {expanded && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">{children}</div>
      )}
    </div>
  );
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
};

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
  </div>
);

// ============================================================================
// CACHE MANAGEMENT SECTION
// ============================================================================

const CacheSection: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedKey, setSelectedKey] = useState('');
  const [keyValue, setKeyValue] = useState('');
  const [pattern, setPattern] = useState('');

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['cache-stats'],
    queryFn: Admin.Cache.getStats,
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['cache-metrics'],
    queryFn: Admin.Cache.getMetrics,
  });

  const invalidateMutation = useMutation({
    mutationFn: ({ pattern, reason }: { pattern: string; reason: string }) =>
      Admin.Cache.triggerInvalidation(pattern, reason),
    onSuccess: () => {
      toast.success('Cache invalidated successfully');
      queryClient.invalidateQueries({ queryKey: ['cache-stats'] });
    },
    onError: (error) => toast.error(`Failed to invalidate cache: ${error}`),
  });

  const clearAllMutation = useMutation({
    mutationFn: Admin.Cache.clearAll,
    onSuccess: () => {
      toast.success('All cache cleared');
      queryClient.invalidateQueries({ queryKey: ['cache-stats'] });
    },
    onError: (error) => toast.error(`Failed to clear cache: ${error}`),
  });

  const getKeyMutation = useMutation({
    mutationFn: Admin.Cache.getKey,
    onSuccess: (data) => {
      setKeyValue(JSON.stringify(data, null, 2));
    },
    onError: () => toast.error('Key not found'),
  });

  const deleteKeyMutation = useMutation({
    mutationFn: Admin.Cache.deleteKey,
    onSuccess: () => {
      toast.success('Key deleted');
      setSelectedKey('');
      setKeyValue('');
      refetchStats();
    },
  });

  const deletePatternMutation = useMutation({
    mutationFn: Admin.Cache.deleteByPattern,
    onSuccess: (result) => {
      toast.success(`Deleted ${result.deleted} keys`);
      setPattern('');
      refetchStats();
    },
  });

  if (statsLoading || metricsLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Hit Rate"
          value={`${((stats?.hitRate || 0) * 100).toFixed(1)}%`}
          icon={<Zap className="w-5 h-5" />}
          color={
            stats && stats.hitRate > 0.8 ? 'green' : stats && stats.hitRate > 0.5 ? 'yellow' : 'red'
          }
        />
        <MetricCard
          title="Cache Keys"
          value={stats?.keys || 0}
          icon={<Box className="w-5 h-5" />}
          color="blue"
        />
        <MetricCard
          title="Memory Usage"
          value={`${((stats?.memoryUsage || 0) / 1024 / 1024).toFixed(1)} MB`}
          icon={<MemoryStick className="w-5 h-5" />}
          color="purple"
        />
        <MetricCard
          title="Total Requests"
          value={(stats?.hits || 0) + (stats?.misses || 0)}
          icon={<Activity className="w-5 h-5" />}
          color="green"
        />
      </div>

      {/* Key Inspector */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Search className="w-4 h-4" />
          Key Inspector
        </h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            placeholder="Enter cache key..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <button
            onClick={() => getKeyMutation.mutate(selectedKey)}
            disabled={!selectedKey || getKeyMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteKeyMutation.mutate(selectedKey)}
            disabled={!selectedKey || deleteKeyMutation.isPending}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        {keyValue && (
          <pre className="bg-gray-800 text-gray-100 p-3 rounded-lg text-sm overflow-auto max-h-60">
            {keyValue}
          </pre>
        )}
      </div>

      {/* Pattern Delete */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Delete by Pattern
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="e.g., user:* or session:*"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <button
            onClick={() => deletePatternMutation.mutate(pattern)}
            disabled={!pattern || deletePatternMutation.isPending}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() =>
            invalidateMutation.mutate({ pattern: '*', reason: 'Manual invalidation from admin' })
          }
          disabled={invalidateMutation.isPending}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Invalidate All
        </button>
        <button
          onClick={() => clearAllMutation.mutate()}
          disabled={clearAllMutation.isPending}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear All Cache
        </button>
        <button
          onClick={() => refetchStats()}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Top Keys */}
      {metrics?.topKeys && metrics.topKeys.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Top Keys by Access</h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Key</th>
                  <th className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">Hits</th>
                  <th className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">
                    Last Accessed
                  </th>
                </tr>
              </thead>
              <tbody>
                {metrics.topKeys.slice(0, 10).map((key) => (
                  <tr key={key.key} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2 font-mono text-xs truncate max-w-xs">{key.key}</td>
                    <td className="px-4 py-2 text-right">{key.hits}</td>
                    <td className="px-4 py-2 text-right text-gray-400">
                      {new Date(key.lastAccessed).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// JOB QUEUE SECTION
// ============================================================================

const JobsSection: React.FC = () => {
  const queryClient = useQueryClient();

  const {
    data: dashboard,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['jobs-dashboard'],
    queryFn: Admin.Jobs.getDashboard,
  });

  const pauseMutation = useMutation({
    mutationFn: Admin.Jobs.pauseQueue,
    onSuccess: () => {
      toast.success('Queue paused');
      queryClient.invalidateQueries({ queryKey: ['jobs-dashboard'] });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: Admin.Jobs.resumeQueue,
    onSuccess: () => {
      toast.success('Queue resumed');
      queryClient.invalidateQueries({ queryKey: ['jobs-dashboard'] });
    },
  });

  const cleanMutation = useMutation({
    mutationFn: ({ name, grace }: { name: string; grace: number }) =>
      Admin.Jobs.cleanQueue(name, grace),
    onSuccess: (result) => {
      toast.success(`Cleaned ${result.cleaned} jobs`);
      queryClient.invalidateQueries({ queryKey: ['jobs-dashboard'] });
    },
  });

  if (isLoading) return <LoadingSpinner />;

  const stats = dashboard?.stats;
  const queues = dashboard?.queues || [];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Jobs"
          value={stats?.total || 0}
          icon={<Layers className="w-5 h-5" />}
          color="blue"
        />
        <MetricCard
          title="Completed"
          value={stats?.completed || 0}
          subtitle={`${(((stats?.completed || 0) / (stats?.total || 1)) * 100).toFixed(1)}%`}
          icon={<Check className="w-5 h-5" />}
          color="green"
        />
        <MetricCard
          title="Failed"
          value={stats?.failed || 0}
          icon={<X className="w-5 h-5" />}
          color={stats && stats.failed > 0 ? 'red' : 'green'}
        />
        <MetricCard
          title="Active"
          value={stats?.active || 0}
          icon={<Play className="w-5 h-5" />}
          color="yellow"
        />
      </div>

      {/* Queues Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-medium text-gray-900 dark:text-white">Job Queues</h3>
          <button
            onClick={() => refetch()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400">Queue</th>
              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">Total</th>
              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">Active</th>
              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">Failed</th>
              <th className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">Status</th>
              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {queues.map((queue: QueueMetrics) => (
              <tr
                key={queue.name}
                className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
              >
                <td className="px-4 py-3 font-medium">{queue.name}</td>
                <td className="px-4 py-3 text-right">{queue.count}</td>
                <td className="px-4 py-3 text-right">
                  <span className={queue.active > 0 ? 'text-yellow-600 dark:text-yellow-400' : ''}>
                    {queue.active}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={queue.failed > 0 ? 'text-red-600 dark:text-red-400' : ''}>
                    {queue.failed}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {queue.paused ? (
                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs">
                      Paused
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {queue.paused ? (
                      <button
                        onClick={() => resumeMutation.mutate(queue.name)}
                        disabled={resumeMutation.isPending}
                        className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                        title="Resume"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => pauseMutation.mutate(queue.name)}
                        disabled={pauseMutation.isPending}
                        className="p-1.5 text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded"
                        title="Pause"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => cleanMutation.mutate({ name: queue.name, grace: 86400000 })}
                      disabled={cleanMutation.isPending}
                      className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                      title="Clean old jobs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================================
// SYSTEM METRICS SECTION
// ============================================================================

const SystemSection: React.FC = () => {
  const {
    data: metrics,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: Admin.System.getMetrics,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const { data: services } = useQuery({
    queryKey: ['services-status'],
    queryFn: Admin.System.getServicesStatus,
    refetchInterval: 10000,
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* System Resources */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="CPU Usage"
          value={`${(metrics?.cpu.usage || 0).toFixed(1)}%`}
          subtitle={`${metrics?.cpu.cores || 0} cores`}
          icon={<Cpu className="w-5 h-5" />}
          color={
            metrics && metrics.cpu.usage > 80
              ? 'red'
              : metrics && metrics.cpu.usage > 60
                ? 'yellow'
                : 'green'
          }
        />
        <MetricCard
          title="Memory"
          value={`${(((metrics?.memory.used || 0) / (metrics?.memory.total || 1)) * 100).toFixed(1)}%`}
          subtitle={`${((metrics?.memory.used || 0) / 1024 / 1024 / 1024).toFixed(1)} / ${((metrics?.memory.total || 0) / 1024 / 1024 / 1024).toFixed(1)} GB`}
          icon={<MemoryStick className="w-5 h-5" />}
          color={
            metrics && metrics.memory.percentage > 80
              ? 'red'
              : metrics && metrics.memory.percentage > 60
                ? 'yellow'
                : 'green'
          }
        />
        <MetricCard
          title="Disk"
          value={`${(((metrics?.disk.used || 0) / (metrics?.disk.total || 1)) * 100).toFixed(1)}%`}
          subtitle={`${((metrics?.disk.used || 0) / 1024 / 1024 / 1024).toFixed(1)} / ${((metrics?.disk.total || 0) / 1024 / 1024 / 1024).toFixed(1)} GB`}
          icon={<HardDrive className="w-5 h-5" />}
          color={
            metrics && metrics.disk.percentage > 80
              ? 'red'
              : metrics && metrics.disk.percentage > 60
                ? 'yellow'
                : 'green'
          }
        />
        <MetricCard
          title="Uptime"
          value={`${Math.floor((metrics?.uptime || 0) / 3600)}h`}
          icon={<Clock className="w-5 h-5" />}
          color="blue"
        />
      </div>

      {/* Services Status */}
      {services && services.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Server className="w-4 h-4" />
              Service Status
            </h3>
          </div>
          <div className="p-4 grid gap-3">
            {services.map((service: ServiceStatus) => (
              <div
                key={service.name}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      service.status === 'healthy'
                        ? 'bg-green-500'
                        : service.status === 'degraded'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{service.name}</p>
                    <p className="text-xs text-gray-400">{service.message}</p>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-400">
                  <p>{service.responseTime}ms</p>
                  <p className="text-xs">{new Date(service.lastChecked).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Network Stats */}
      {metrics?.network && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Network Traffic
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {((metrics.network.bytesIn || 0) / 1024 / 1024).toFixed(1)} MB
              </p>
              <p className="text-sm text-gray-400">Inbound</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {((metrics.network.bytesOut || 0) / 1024 / 1024).toFixed(1)} MB
              </p>
              <p className="text-sm text-gray-400">Outbound</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {metrics.network.connections}
              </p>
              <p className="text-sm text-gray-400">Connections</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => refetch()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Refresh Metrics
      </button>
    </div>
  );
};

// ============================================================================
// AGENT REGISTRY SECTION
// ============================================================================

const AgentRegistrySection: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<string>('');

  const { data: agents, isLoading } = useQuery({
    queryKey: ['registered-agents'],
    queryFn: Admin.AgentRegistry.getOrientationSummary,
  });

  const { data: agentProgress } = useQuery({
    queryKey: ['agent-progress', selectedAgent],
    queryFn: () => Admin.AgentRegistry.getOnboardingProgress(selectedAgent),
    enabled: !!selectedAgent,
  });

  const startOnboardingMutation = useMutation({
    mutationFn: Admin.AgentRegistry.startOnboarding,
    onSuccess: () => {
      toast.success('Onboarding started');
      queryClient.invalidateQueries({ queryKey: ['registered-agents'] });
    },
  });

  const testCapabilitiesMutation = useMutation({
    mutationFn: Admin.AgentRegistry.testCapabilities,
    onSuccess: (result) => {
      toast.success(`Capabilities: ${result.passed.length} passed, ${result.failed.length} failed`);
    },
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          title="Total Agents"
          value={agents?.totalAgents || 0}
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
        <MetricCard
          title="Completed"
          value={agents?.completed || 0}
          icon={<Check className="w-5 h-5" />}
          color="green"
        />
        <MetricCard
          title="In Progress"
          value={agents?.inProgress || 0}
          icon={<Clock className="w-5 h-5" />}
          color="yellow"
        />
      </div>

      {/* Onboarding Progress */}
      {selectedAgent && agentProgress && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 dark:text-white">
              Onboarding Progress: {selectedAgent}
            </h3>
            <button
              onClick={() => setSelectedAgent('')}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">
                Step {agentProgress.currentStep} of {agentProgress.totalSteps}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {Math.round((agentProgress.currentStep / agentProgress.totalSteps) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{
                  width: `${(agentProgress.currentStep / agentProgress.totalSteps) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {agentProgress.steps.map((step) => (
              <div
                key={step.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50"
              >
                {step.status === 'completed' ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : step.status === 'in_progress' ? (
                  <Clock className="w-5 h-5 text-yellow-500" />
                ) : step.status === 'failed' ? (
                  <X className="w-5 h-5 text-red-500" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                )}
                <span className="text-gray-900 dark:text-white">{step.name}</span>
                <span
                  className={`ml-auto text-xs px-2 py-1 rounded-full ${
                    step.status === 'completed'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : step.status === 'in_progress'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        : step.status === 'failed'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {step.status}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => testCapabilitiesMutation.mutate(selectedAgent)}
              disabled={testCapabilitiesMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Test Capabilities
            </button>
            <button
              onClick={() => startOnboardingMutation.mutate(selectedAgent)}
              disabled={startOnboardingMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Restart Onboarding
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// RELAY BRIDGE SECTION
// ============================================================================

const RelaySection: React.FC = () => {
  const { data: health, isLoading } = useQuery({
    queryKey: ['relay-health'],
    queryFn: Admin.Relay.getHealth,
    refetchInterval: 5000,
  });

  const { data: status } = useQuery({
    queryKey: ['relay-status'],
    queryFn: Admin.Relay.getStatus,
    refetchInterval: 5000,
  });

  const { data: agents } = useQuery({
    queryKey: ['relay-agents'],
    queryFn: Admin.Relay.getAgents,
    refetchInterval: 10000,
  });

  const restartMutation = useMutation({
    mutationFn: Admin.Relay.restart,
    onSuccess: () => toast.success('Relay restarted'),
    onError: (error) => toast.error(`Failed to restart: ${error}`),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Health Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Status"
          value={health?.status || 'Unknown'}
          icon={
            health?.status === 'healthy' ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )
          }
          color={health?.status === 'healthy' ? 'green' : 'red'}
        />
        <MetricCard
          title="Uptime"
          value={`${Math.floor((health?.uptime || 0) / 3600)}h`}
          icon={<Clock className="w-5 h-5" />}
          color="blue"
        />
        <MetricCard
          title="Agents"
          value={status?.agents || 0}
          icon={<Users className="w-5 h-5" />}
          color="purple"
        />
        <MetricCard
          title="Channels"
          value={status?.channels || 0}
          icon={<MessageSquare className="w-5 h-5" />}
          color="yellow"
        />
      </div>

      {/* Connected Agents */}
      {agents && agents.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white">Connected Agents</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Name</th>
                <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Platform</th>
                <th className="px-4 py-2 text-center text-gray-600 dark:text-gray-400">Status</th>
                <th className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">Channels</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent: RelayAgent) => (
                <tr key={agent.id} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-2 font-medium">{agent.name}</td>
                  <td className="px-4 py-2 text-gray-400">{agent.platform}</td>
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        agent.status === 'active'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : agent.status === 'idle'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {agent.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">{agent.channels.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => restartMutation.mutate()}
          disabled={restartMutation.isPending}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${restartMutation.isPending ? 'animate-spin' : ''}`} />
          Restart Relay
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN DASHBOARD
// ============================================================================

const LostFunctionsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'cache', label: 'Cache', icon: <Box className="w-4 h-4" /> },
    { id: 'jobs', label: 'Jobs', icon: <Layers className="w-4 h-4" /> },
    { id: 'system', label: 'System', icon: <Server className="w-4 h-4" /> },
    { id: 'agents', label: 'Agents', icon: <Bot className="w-4 h-4" /> },
    { id: 'relay', label: 'Relay', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Settings className="w-6 h-6 text-blue-600" />
                Lost Functions Dashboard
              </h1>
              <p className="text-sm text-gray-400 dark:text-gray-400 mt-1">
                Backend functions now surfaced in the frontend
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h2 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                Welcome to the Lost Functions Dashboard
              </h2>
              <p className="text-blue-700 dark:text-blue-400 text-sm">
                This dashboard surfaces backend functions that exist but weren't exposed in the
                frontend. Use the tabs above to access cache management, job queue monitoring,
                system metrics, agent registry, and relay bridge controls.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Box className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Cache Management</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View cache statistics, inspect keys, warm cache, and trigger invalidations.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <Layers className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Job Queues</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monitor job queues, view failed jobs, pause/resume queues, and clean old jobs.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Server className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">System Metrics</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Real-time CPU, memory, disk usage, and service health monitoring.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cache' && (
          <Section title="Cache Management" icon={<Box className="w-5 h-5" />} defaultExpanded>
            <CacheSection />
          </Section>
        )}

        {activeTab === 'jobs' && (
          <Section
            title="Job Queue Monitoring"
            icon={<Layers className="w-5 h-5" />}
            defaultExpanded
          >
            <JobsSection />
          </Section>
        )}

        {activeTab === 'system' && (
          <Section title="System Metrics" icon={<Server className="w-5 h-5" />} defaultExpanded>
            <SystemSection />
          </Section>
        )}

        {activeTab === 'agents' && (
          <Section title="Agent Registry" icon={<Bot className="w-5 h-5" />} defaultExpanded>
            <AgentRegistrySection />
          </Section>
        )}

        {activeTab === 'relay' && (
          <Section
            title="Relay Bridge"
            icon={<MessageSquare className="w-5 h-5" />}
            defaultExpanded
          >
            <RelaySection />
          </Section>
        )}
      </main>
    </div>
  );
};

export default LostFunctionsDashboard;

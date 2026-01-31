import {
  Activity,
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Users,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dashboardService from '../services/dashboard.service';
import { useRoute } from './route-context';
import { StatsCard } from './ui/premium/GlassCard';
import { PremiumButton } from './ui/premium/PremiumButton';

// Skeleton component for StatsCard
function StatsCardSkeleton() {
  return (
    <div className="bg-white/10 p-6 rounded-2xl animate-pulse">
      <div className="h-4 bg-slate-700/50 rounded w-3/4 mb-4"></div>
      <div className="h-8 bg-slate-700/50 rounded w-1/2 mb-4"></div>
      <div className="h-3 bg-slate-700/50 rounded w-1/4"></div>
    </div>
  );
}

interface DashboardMetrics {
  activeAgents: { value: number; change: number };
  systemLoad: { value: number; change: number };
  tasksCompleted: { value: number; change: number };
  avgResponse: { value: number; change: number };
  workspaceCount: { value: number; change: number };
}

export function Dashboard() {
  const { setPageTitle } = useRoute();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      setError('Failed to fetch dashboard metrics. The backend might be unavailable.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPageTitle('Dashboard');
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, [setPageTitle, fetchMetrics]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-white mb-2">System Overview</h1>
          <p className="text-gray-400">Real-time monitoring</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <PremiumButton
            variant="secondary"
            size="lg"
            onClick={() => !loading && fetchMetrics()}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </PremiumButton>
          <Link to="/agents/new">
            <PremiumButton variant="gradient" size="lg">
              <Zap className="w-4 h-4 mr-2" />
              New Agent
            </PremiumButton>
          </Link>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {loading && !metrics ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : error ? (
          <div className="md:col-span-2 lg:col-span-4 xl:col-span-5 bg-red-500/10 border border-red-500/30 text-red-200 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Error Loading Data</h3>
            <p className="text-red-300/80 mb-6 max-w-md">{error}</p>
            <PremiumButton variant="secondary" onClick={fetchMetrics} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Retry
            </PremiumButton>
          </div>
        ) : metrics ? (
          <>
            <StatsCard
              label="Active Agents"
              value={metrics.activeAgents.value.toString()}
              change={`${metrics.activeAgents.change > 0 ? '+' : ''}${metrics.activeAgents.change}`}
              changeType={metrics.activeAgents.change >= 0 ? 'positive' : 'negative'}
              icon={Users}
              gradient="blue"
            />
            <StatsCard
              label="System Load"
              value={`${metrics.systemLoad.value}%`}
              change={`${metrics.systemLoad.change > 0 ? '+' : ''}${metrics.systemLoad.change}%`}
              changeType={metrics.systemLoad.change <= 0 ? 'positive' : 'negative'}
              icon={Cpu}
              gradient="purple"
            />
            <StatsCard
              label="Tasks Completed"
              value={metrics.tasksCompleted.value.toString()}
              change={`+${metrics.tasksCompleted.change}`}
              changeType="positive"
              icon={CheckCircle2}
              gradient="green"
            />
            <StatsCard
              label="Avg Response"
              value={`${metrics.avgResponse.value}s`}
              change={`${metrics.avgResponse.change > 0 ? '+' : ''}${metrics.avgResponse.change}s`}
              changeType={metrics.avgResponse.change <= 0 ? 'positive' : 'negative'}
              icon={Activity}
              gradient="orange"
            />
            <StatsCard
              label="Workspaces"
              value={metrics.workspaceCount.value.toString()}
              change={`${metrics.workspaceCount.change > 0 ? '+' : ''}${metrics.workspaceCount.change}`}
              changeType={metrics.workspaceCount.change >= 0 ? 'positive' : 'negative'}
              icon={Briefcase}
              gradient="teal"
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

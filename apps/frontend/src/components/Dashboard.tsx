import { Activity, AlertTriangle, CheckCircle2, Cpu, RefreshCw, Users, Zap } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import dashboardService from '../services/dashboard.service';
import { useRoute } from './route-context';
import { GlassCard, StatsCard } from './ui/premium/GlassCard';
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
          <p className="text-gray-400">Real-time monitoring and agent orchestration</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading && !metrics ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : error ? (
           <div className="md:col-span-2 lg:col-span-4 bg-red-500/10 border border-red-500/30 text-red-200 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
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
import { Briefcase } from 'lucide-react';
// ... other imports

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

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Collaboration (Wide) */}
        <GlassCard
          className="lg:col-span-2 min-h-[400px]"
          title="Agent Collaboration Network"
          gradient="blue"
        >
          <div className="flex items-center justify-center h-full min-h-[300px] border border-dashed border-white/10 rounded-xl bg-white/5">
            <div className="text-center">
              <Activity className="w-12 h-12 text-blue-400 mx-auto mb-4 opacity-50" />
              <p className="text-gray-400">Live collaboration visualization active</p>
              <p className="text-sm text-gray-500 mt-2">Data refreshing in real-time...</p>
            </div>
          </div>
        </GlassCard>

        {/* System Health (Side) */}
        <div className="space-y-6">
          <GlassCard title="System Health" gradient="green">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">CPU Usage</span>
                <span className="text-white font-bold">45%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }} />
              </div>

              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-400">Memory</span>
                <span className="text-white font-bold">62%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '62%' }} />
              </div>

              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-400">Storage</span>
                <span className="text-white font-bold">28%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '28%' }} />
              </div>
            </div>
          </GlassCard>

          <GlassCard title="Recent Alerts" gradient="orange">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-red-200">High Latency Detected</h4>
                  <p className="text-xs text-red-300/70 mt-1">Agent-007 response time &gt; 2s</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <Activity className="w-5 h-5 text-yellow-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-yellow-200">System Update Available</h4>
                  <p className="text-xs text-yellow-300/70 mt-1">Patch v2.4 ready for deploy</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Task Board and Network */}
      <div className="grid gap-6 md:grid-cols-2">
        <GlassCard className="min-h-[300px]" title="Active Tasks" gradient="purple">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs">
                    T-{i}0{i}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-purple-300">
                      Data Analysis Task
                    </p>
                    <p className="text-xs text-gray-400">Assigned to: Analyst Bot</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500">2m ago</div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="min-h-[300px]" title="Performance Metrics" gradient="pink">
          <div className="flex items-end justify-between h-40 mt-4 px-2 space-x-2">
            {[40, 65, 30, 80, 55, 90, 45].map((h, i) => (
              <div
                key={i}
                className="w-full bg-pink-500/20 rounded-t-sm relative group hover:bg-pink-500/40 transition-colors"
                style={{ height: `${h}%` }}
              >
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  {h}%
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500 px-2">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

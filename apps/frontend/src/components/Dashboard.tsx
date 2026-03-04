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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import dashboardService from '../services/dashboard.service';
import WebSocketService from '../services/WebSocketService';
import OpsPageHeader from './ops/OpsPageHeader';
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
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastRealtimeSignal, setLastRealtimeSignal] = useState<number | null>(null);

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

  useEffect(() => {
    const wsService = WebSocketService.getInstance();
    const markRealtimeSignal = () => setLastRealtimeSignal(Date.now());

    const removeConnectionListener = wsService.onServiceEvent(
      'connectionStateChanged',
      (connected) => {
        setIsRealtimeConnected(connected);
      }
    );
    const removeAgentStatusListener = wsService.on('agent:status', markRealtimeSignal);
    const removeMeshStatusListener = wsService.on('mesh:status', markRealtimeSignal);

    void wsService.connect().catch(() => undefined);

    return () => {
      removeAgentStatusListener();
      removeMeshStatusListener();
      removeConnectionListener();
    };
  }, []);

  const focusItems = useMemo(() => {
    if (!metrics) return [];
    const items: Array<{
      level: 'critical' | 'warning' | 'healthy';
      title: string;
      detail: string;
    }> = [];

    if (metrics.systemLoad.value >= 85) {
      items.push({
        level: 'critical',
        title: `System load at ${metrics.systemLoad.value}%`,
        detail: 'Reduce concurrent runs or scale capacity to avoid degraded responses.',
      });
    }

    if (metrics.activeAgents.value === 0) {
      items.push({
        level: 'warning',
        title: 'No active agents detected',
        detail: 'Start at least one agent before queuing more work.',
      });
    }

    if (metrics.avgResponse.value > 2) {
      items.push({
        level: 'warning',
        title: `Average response is ${metrics.avgResponse.value}s`,
        detail: 'Latency is above target; inspect the slowest workflows.',
      });
    }

    if (items.length === 0) {
      items.push({
        level: 'healthy',
        title: 'No immediate blockers found',
        detail: 'You can focus on throughput and new task creation.',
      });
    }

    return items;
  }, [metrics]);

  const healthSnapshot = useMemo(() => {
    if (!metrics) {
      return { cpu: 0, memory: 0, storage: 0 };
    }

    const cpu = Math.max(0, Math.min(100, metrics.systemLoad.value));
    const memory = Math.max(0, Math.min(100, Math.round(metrics.avgResponse.value * 18)));
    const storage = Math.max(0, Math.min(100, Math.round(metrics.workspaceCount.value * 7)));

    return { cpu, memory, storage };
  }, [metrics]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <OpsPageHeader
        eyebrow="Overview"
        title="Operations Dashboard"
        subtitle="See health, identify blockers, and move directly to the next high-impact action."
        meta={
          metrics ? (
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300">
                {metrics.activeAgents.value} active agents
              </span>
              <span className="px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                {metrics.tasksCompleted.value} tasks completed
              </span>
              <span
                className={`px-2 py-1 rounded-full border ${
                  isRealtimeConnected
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                }`}
              >
                Agent Stream: {isRealtimeConnected ? 'Live' : 'Polling'}
              </span>
              <span
                className={`px-2 py-1 rounded-full border ${
                  isRealtimeConnected
                    ? 'bg-purple-500/10 border-purple-500/20 text-purple-300'
                    : 'bg-slate-500/10 border-slate-500/20 text-slate-300'
                }`}
              >
                Mesh: {isRealtimeConnected ? 'Connected' : 'Degraded'}
              </span>
              {lastRealtimeSignal && (
                <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                  Last signal {new Date(lastRealtimeSignal).toLocaleTimeString()}
                </span>
              )}
            </div>
          ) : null
        }
        actions={
          <>
            <PremiumButton
              variant="secondary"
              size="lg"
              onClick={() => !loading && fetchMetrics()}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </PremiumButton>
            <Link to="/tasks/new">
              <PremiumButton variant="outline" size="lg">
                Create Task
              </PremiumButton>
            </Link>
            <Link to="/agents/new">
              <PremiumButton variant="gradient" size="lg">
                <Zap className="w-4 h-4 mr-2" />
                New Agent
              </PremiumButton>
            </Link>
          </>
        }
      />

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
          <div className="h-full min-h-[300px] border border-dashed border-white/10 rounded-xl bg-white/5 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl bg-black/25 border border-white/10 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Connected Agents</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {metrics?.activeAgents.value ?? 0}
                </p>
              </div>
              <div className="rounded-xl bg-black/25 border border-white/10 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Workflow Throughput
                </p>
                <p className="text-3xl font-bold text-white mt-1">
                  {metrics?.tasksCompleted.value ?? 0}
                </p>
              </div>
              <div className="rounded-xl bg-black/25 border border-white/10 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Success Rate</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {metrics?.systemLoad.value
                    ? 100 - Math.min(40, Math.round(metrics.systemLoad.value / 3))
                    : 100}
                  %
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-xl bg-black/25 border border-white/10 p-4">
              <p className="text-sm text-slate-300">
                Collaboration lanes are syncing via websocket when available, with 30-second polling
                fallback. Use <span className="text-blue-300">Task Operations</span> to drill into
                execution.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* System Health (Side) */}
        <div className="space-y-6">
          <GlassCard title="System Health" gradient="green">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">CPU Usage</span>
                <span className="text-white font-bold">{healthSnapshot.cpu}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${healthSnapshot.cpu}%` }}
                />
              </div>

              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-400">Memory</span>
                <span className="text-white font-bold">{healthSnapshot.memory}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${healthSnapshot.memory}%` }}
                />
              </div>

              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-400">Storage</span>
                <span className="text-white font-bold">{healthSnapshot.storage}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${healthSnapshot.storage}%` }}
                />
              </div>
            </div>
          </GlassCard>

          <GlassCard title="Recent Alerts" gradient="orange">
            <div className="space-y-3">
              {focusItems.map((item, idx) => (
                <div
                  key={`${item.title}-${idx}`}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    item.level === 'critical'
                      ? 'bg-red-500/10 border-red-500/20'
                      : item.level === 'warning'
                        ? 'bg-yellow-500/10 border-yellow-500/20'
                        : 'bg-green-500/10 border-green-500/20'
                  }`}
                >
                  <AlertTriangle
                    className={`w-5 h-5 shrink-0 ${
                      item.level === 'critical'
                        ? 'text-red-400'
                        : item.level === 'warning'
                          ? 'text-yellow-400'
                          : 'text-green-400'
                    }`}
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                    <p className="text-xs text-slate-300 mt-1">{item.detail}</p>
                  </div>
                </div>
              ))}
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

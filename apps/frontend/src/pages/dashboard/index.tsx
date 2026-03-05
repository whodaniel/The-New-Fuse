// @ts-nocheck
import { Sidebar } from '@/components/layout/Sidebar';
import { ActionCard, GlassCard, PremiumButton, StatsCard } from '@/components/ui/premium';
import { useAuth } from '@/providers/AuthProvider';
import { Agent, agentService } from '@/services/AgentService';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Cpu,
  Gauge,
  Layers,
  PauseCircle,
  Plus,
  RefreshCcw,
  Settings,
  TrendingUp,
  Users,
  Wrench,
  XCircle,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  activeAgents: number;
  totalAgents: number;
  totalInteractions: number;
  successRate: number;
  totalUsers: number;
  systemLoad: number;
  uptime: string;
}

interface RecentActivity {
  agentId: string;
  agentName: string;
  status: Agent['status'];
  action: string;
  timestamp: string;
}

interface QuickAction {
  title: string;
  description: string;
  count?: string;
  icon: React.ElementType;
  action: () => void;
  gradient: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'cyan';
}

interface StatusCounts {
  active: number;
  standby: number;
  inactive: number;
  error: number;
}

interface FocusItem {
  id: string;
  level: 'critical' | 'warning' | 'healthy';
  title: string;
  detail: string;
  actionLabel: string;
  action: () => void;
}

const AnimatedCounter = ({ end, duration = 1200 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{count.toLocaleString()}</span>;
};

const formatTimeAgo = (date?: Date): string => {
  if (!date || Number.isNaN(date.getTime())) return 'Recently';

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  const days = Math.floor(diffHours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const emptyStatusCounts: StatusCounts = {
  active: 0,
  standby: 0,
  inactive: 0,
  error: 0,
};

const getStatusBadgeClasses = (status: Agent['status']) => {
  switch (status) {
    case 'active':
      return 'bg-green-500/15 text-green-300 border border-green-500/30';
    case 'error':
      return 'bg-red-500/15 text-red-300 border border-red-500/30';
    case 'inactive':
      return 'bg-orange-500/15 text-orange-300 border border-orange-500/30';
    default:
      return 'bg-slate-500/15 text-slate-300 border border-slate-500/30';
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [stats, setStats] = useState<DashboardStats>({
    activeAgents: 0,
    totalAgents: 0,
    totalInteractions: 0,
    successRate: 0,
    totalUsers: 0,
    systemLoad: 0,
    uptime: 'Unknown',
  });
  const [statusCounts, setStatusCounts] = useState<StatusCounts>(emptyStatusCounts);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      setRefreshing(true);

      const fetchedAgents = await agentService.getAgents();
      const counts = fetchedAgents.reduce<StatusCounts>(
        (acc, agent) => {
          if (agent.status in acc) {
            acc[agent.status as keyof StatusCounts] += 1;
          }
          return acc;
        },
        { ...emptyStatusCounts }
      );

      const activity: RecentActivity[] = [...fetchedAgents]
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 6)
        .map((agent) => ({
          agentId: agent.id,
          agentName: agent.name,
          status: agent.status,
          action:
            agent.status === 'active'
              ? 'Running and available for tasks'
              : agent.status === 'error'
                ? 'Needs intervention before it can execute'
                : agent.status === 'inactive'
                  ? 'Configured but currently stopped'
                  : 'Ready but waiting for assignment',
          timestamp: formatTimeAgo(agent.updatedAt),
        }));

      let monitoringData: any = null;
      try {
        const monitoringResponse = await fetch('/api/monitoring/health');
        if (monitoringResponse.ok) {
          monitoringData = await monitoringResponse.json();
        }
      } catch {
        // Monitoring endpoint may be unavailable in some environments.
      }

      setAgents(fetchedAgents);
      setStatusCounts(counts);
      setRecentActivity(activity);
      setStats({
        activeAgents: counts.active,
        totalAgents: fetchedAgents.length,
        totalInteractions: monitoringData?.overview?.totalRequests || 0,
        successRate: Number(monitoringData?.overview?.successRate || 0),
        totalUsers: monitoringData?.overview?.totalUsers || 0,
        systemLoad: Number(monitoringData?.overview?.systemLoad || 0),
        uptime: monitoringData?.overview?.uptime || 'Unknown',
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Dashboard data is partially unavailable right now.');
      setStats({
        activeAgents: 0,
        totalAgents: 0,
        totalInteractions: 0,
        successRate: 0,
        totalUsers: 0,
        systemLoad: 0,
        uptime: 'Unknown',
      });
      setStatusCounts(emptyStatusCounts);
      setAgents([]);
      setRecentActivity([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const quickActions: QuickAction[] = [
    {
      title: 'Deploy Agent',
      description: 'Create and launch a new agent from templates',
      icon: Plus,
      action: () => navigate('/dashboard/agents/new'),
      gradient: 'blue',
    },
    {
      title: 'Fix Failing Agents',
      description: 'Review and recover agents in an error state',
      count: `${statusCounts.error} failing`,
      icon: Wrench,
      action: () => navigate('/dashboard/agents'),
      gradient: 'orange',
    },
    {
      title: 'Create Task',
      description: 'Queue up new work for your fleet',
      icon: Layers,
      action: () => navigate('/tasks/new'),
      gradient: 'purple',
    },
    {
      title: 'Review Analytics',
      description: 'Inspect performance trends and throughput',
      icon: BarChart3,
      action: () => navigate('/dashboard/analytics'),
      gradient: 'green',
    },
    {
      title: 'Open Workflows',
      description: 'Manage running and scheduled workflows',
      icon: Activity,
      action: () => navigate('/workflows'),
      gradient: 'cyan',
    },
    {
      title: 'Dashboard Settings',
      description: 'Adjust notification and display preferences',
      icon: Settings,
      action: () => navigate('/dashboard/settings'),
      gradient: 'pink',
    },
  ];

  const focusItems = useMemo<FocusItem[]>(() => {
    const items: FocusItem[] = [];

    if (statusCounts.error > 0) {
      items.push({
        id: 'errors',
        level: 'critical',
        title: `${statusCounts.error} agent${statusCounts.error > 1 ? 's' : ''} in error state`,
        detail: 'Resolve failing agents first to unblock queued tasks.',
        actionLabel: 'Open Agent Dashboard',
        action: () => navigate('/dashboard/agents'),
      });
    }

    if (statusCounts.active === 0 && stats.totalAgents > 0) {
      items.push({
        id: 'no-active',
        level: 'warning',
        title: 'No agents are currently active',
        detail: 'Start at least one agent before creating new workloads.',
        actionLabel: 'Manage Agents',
        action: () => navigate('/dashboard/agents'),
      });
    }

    if (stats.successRate > 0 && stats.successRate < 95) {
      items.push({
        id: 'success-rate',
        level: 'warning',
        title: `Success rate is ${stats.successRate.toFixed(1)}%`,
        detail: 'Investigate analytics to identify failure hotspots.',
        actionLabel: 'Review Analytics',
        action: () => navigate('/dashboard/analytics'),
      });
    }

    if (stats.systemLoad >= 85) {
      items.push({
        id: 'system-load',
        level: 'warning',
        title: `System load at ${stats.systemLoad.toFixed(1)}%`,
        detail: 'High load can increase latency and cause retries.',
        actionLabel: 'Open Workflows',
        action: () => navigate('/workflows'),
      });
    }

    if (items.length === 0) {
      items.push({
        id: 'healthy',
        level: 'healthy',
        title: 'No immediate blockers detected',
        detail: 'You can focus on throughput and new task creation.',
        actionLabel: 'Create New Task',
        action: () => navigate('/tasks/new'),
      });
    }

    return items;
  }, [navigate, stats.successRate, stats.systemLoad, stats.totalAgents, statusCounts]);

  const fleetBreakdown = useMemo(
    () => [
      { label: 'Active', value: statusCounts.active, color: 'bg-green-500' },
      { label: 'Standby', value: statusCounts.standby, color: 'bg-slate-400' },
      { label: 'Inactive', value: statusCounts.inactive, color: 'bg-orange-500' },
      { label: 'Error', value: statusCounts.error, color: 'bg-red-500' },
    ],
    [statusCounts]
  );

  return (
    <div className="flex h-screen bg-transparent relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] bg-pink-600/10 rounded-full blur-[100px] animate-pulse" />
      </div>

      <Sidebar />

      <main className="flex-1 p-6 overflow-auto relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-8 fade-in">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                Operations Dashboard
              </h1>
              <p className="text-gray-300 text-lg mt-2 flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                {error ? (
                  <span className="text-amber-400">{error}</span>
                ) : (
                  <span>
                    Signed in as {user?.displayName || 'User'}
                    {lastUpdated ? ` • Updated ${formatTimeAgo(lastUpdated)}` : ''}
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <PremiumButton
                variant="outline"
                onClick={fetchDashboardData}
                icon={RefreshCcw}
                iconPosition="left"
                size="md"
                disabled={refreshing}
              >
                {refreshing ? 'Refreshing' : 'Refresh'}
              </PremiumButton>
              <PremiumButton
                onClick={() => navigate('/dashboard/agents/new')}
                icon={Plus}
                iconPosition="left"
                size="md"
              >
                Deploy Agent
              </PremiumButton>
              <PremiumButton variant="outline" onClick={logout} size="md">
                Logout
              </PremiumButton>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
            <div className="fade-in" style={{ animationDelay: '0ms' }}>
              <StatsCard
                label="Active Agents"
                value={loading ? '...' : <AnimatedCounter end={stats.activeAgents} />}
                change={`${statusCounts.error} with errors`}
                changeType={statusCounts.error > 0 ? 'negative' : 'positive'}
                icon={Users}
                gradient="blue"
              />
            </div>

            <div className="fade-in" style={{ animationDelay: '100ms' }}>
              <StatsCard
                label="Total Agents"
                value={loading ? '...' : <AnimatedCounter end={stats.totalAgents} />}
                change={`${statusCounts.standby} on standby`}
                changeType="neutral"
                icon={Layers}
                gradient="purple"
              />
            </div>

            <div className="fade-in" style={{ animationDelay: '200ms' }}>
              <StatsCard
                label="Requests Processed"
                value={loading ? '...' : <AnimatedCounter end={stats.totalInteractions} />}
                change="Monitoring API"
                changeType="neutral"
                icon={TrendingUp}
                gradient="green"
              />
            </div>

            <div className="fade-in" style={{ animationDelay: '300ms' }}>
              <StatsCard
                label="Success Rate"
                value={loading ? '...' : `${stats.successRate.toFixed(1)}%`}
                change={stats.successRate >= 95 ? 'Healthy' : 'Needs review'}
                changeType={stats.successRate >= 95 ? 'positive' : 'negative'}
                icon={CheckCircle2}
                gradient="orange"
              />
            </div>

            <div className="fade-in" style={{ animationDelay: '400ms' }}>
              <StatsCard
                label="System Load"
                value={loading ? '...' : `${stats.systemLoad.toFixed(1)}%`}
                change={stats.systemLoad >= 85 ? 'High pressure' : 'Within limits'}
                changeType={stats.systemLoad >= 85 ? 'negative' : 'positive'}
                icon={Gauge}
                gradient="cyan"
              />
            </div>

            <div className="fade-in" style={{ animationDelay: '500ms' }}>
              <StatsCard
                label="Uptime"
                value={loading ? '...' : stats.uptime}
                change={`${stats.totalUsers} active users`}
                changeType="neutral"
                icon={Cpu}
                gradient="pink"
              />
            </div>
          </div>

          <div className="mb-8 fade-in" style={{ animationDelay: '600ms' }}>
            <h2 className="text-2xl font-bold text-white mb-6">Do Next</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickActions.map((action, index) => (
                <div
                  key={action.title}
                  className="fade-in"
                  style={{ animationDelay: `${700 + index * 100}ms` }}
                >
                  <ActionCard
                    title={action.title}
                    description={action.description}
                    icon={action.icon}
                    gradient={action.gradient}
                    onClick={action.action}
                  >
                    {action.count ? (
                      <p className="text-xs text-amber-300 mt-1">{action.count}</p>
                    ) : null}
                  </ActionCard>
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <div className="fade-in" style={{ animationDelay: '1300ms' }}>
              <GlassCard
                icon={AlertTriangle}
                title="Needs Attention"
                subtitle="Prioritized actions based on current system state"
                gradient="orange"
              >
                <div className="space-y-3">
                  {focusItems.map((item) => {
                    const levelStyles = {
                      critical: 'border-red-500/30 bg-red-500/10 text-red-200',
                      warning: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
                      healthy: 'border-green-500/30 bg-green-500/10 text-green-200',
                    };

                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-lg border ${levelStyles[item.level]} transition-all duration-200`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-white">{item.title}</p>
                            <p className="text-sm text-gray-300 mt-1">{item.detail}</p>
                          </div>
                          <PremiumButton variant="outline" size="sm" onClick={item.action}>
                            {item.actionLabel}
                          </PremiumButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            </div>

            <div className="fade-in" style={{ animationDelay: '1400ms' }}>
              <GlassCard
                icon={Activity}
                title="Recent Agent Activity"
                subtitle="Latest updates from your fleet"
                gradient="blue"
              >
                <div className="space-y-3">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <button
                        key={activity.agentId}
                        type="button"
                        className="w-full text-left flex items-center justify-between p-4 bg-black/20 border border-white/10 rounded-lg backdrop-blur-sm hover:bg-white/10 transition-all duration-200"
                        onClick={() => navigate(`/dashboard/agents/${activity.agentId}`)}
                      >
                        <div>
                          <p className="font-semibold text-white">{activity.agentName}</p>
                          <p className="text-sm text-gray-400">{activity.action}</p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusBadgeClasses(activity.status)}`}
                          >
                            {activity.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-2">{activity.timestamp}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No recent agent activity</p>
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="fade-in" style={{ animationDelay: '1500ms' }}>
              <GlassCard
                icon={Cpu}
                title="System Checks"
                subtitle="Current platform readiness"
                gradient="green"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/10">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <span className="text-white font-medium">Agent Capacity</span>
                    </div>
                    <span className="text-sm text-gray-300">
                      {statusCounts.active > 0 ? 'Ready' : 'No active agents'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/10">
                    <div className="flex items-center gap-3">
                      <Gauge className="w-5 h-5 text-cyan-400" />
                      <span className="text-white font-medium">Load Pressure</span>
                    </div>
                    <span className="text-sm text-gray-300">{stats.systemLoad.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/10">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                      <span className="text-white font-medium">Success Rate</span>
                    </div>
                    <span className="text-sm text-gray-300">{stats.successRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/10">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-blue-400" />
                      <span className="text-white font-medium">Runtime Uptime</span>
                    </div>
                    <span className="text-sm text-gray-300">{stats.uptime}</span>
                  </div>
                </div>
              </GlassCard>
            </div>

            <div className="fade-in" style={{ animationDelay: '1600ms' }}>
              <GlassCard
                icon={Users}
                title="Fleet Composition"
                subtitle="Agent status distribution"
                gradient="purple"
              >
                <div className="space-y-4">
                  {fleetBreakdown.map((item) => {
                    const total = Math.max(stats.totalAgents, 1);
                    const percent = Math.round((item.value / total) * 100);

                    return (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            {item.label === 'Error' ? (
                              <XCircle className="w-4 h-4 text-red-400" />
                            ) : item.label === 'Inactive' ? (
                              <PauseCircle className="w-4 h-4 text-orange-400" />
                            ) : item.label === 'Active' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                            ) : (
                              <Clock className="w-4 h-4 text-slate-400" />
                            )}
                            {item.label}
                          </div>
                          <span className="text-sm text-white font-semibold">
                            {item.value} ({percent}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`${item.color} h-full rounded-full`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  <PremiumButton
                    variant="outline"
                    size="sm"
                    icon={Layers}
                    iconPosition="left"
                    onClick={() => navigate('/dashboard/agents')}
                  >
                    Open Full Fleet View ({agents.length})
                  </PremiumButton>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

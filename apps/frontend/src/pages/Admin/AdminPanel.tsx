// @ts-nocheck
import { Badge, GlassCard, PremiumButton } from '@/components/ui';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart,
  Bot,
  Building,
  Circle,
  ClipboardList,
  Cpu,
  Flag,
  Hammer,
  Heart,
  Plug,
  Plus,
  RefreshCw,
  Shield,
  Siren,
  User,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalWorkspaces: number;
  activeWorkspaces: number;
  totalAgents: number;
  runningAgents: number;
  systemUptime: string;
  serverHealth: 'healthy' | 'warning' | 'critical';
  memoryUsage: number;
  cpuUsage: number;
}

export default function AdminPanel() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchAdminMetrics = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || '';
      const response = await fetch('/api/admin/metrics/dashboard', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Admin metrics unavailable (${response.status})`);
      }

      const data = await response.json();
      const healthRaw = String(data?.system?.health || 'warning').toLowerCase();
      const serverHealth: SystemMetrics['serverHealth'] =
        healthRaw === 'healthy' ? 'healthy' : healthRaw === 'critical' ? 'critical' : 'warning';

      const formatUptime = (seconds: number) => {
        if (!Number.isFinite(seconds) || seconds <= 0) return 'unknown';
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        return `${days}d ${hours}h`;
      };

      setMetrics({
        totalUsers: Number(data?.users?.total || 0),
        activeUsers: Number(data?.users?.active || 0),
        totalWorkspaces: 0,
        activeWorkspaces: 0,
        totalAgents: Number(data?.agents?.total || 0),
        runningAgents: Number(data?.agents?.active || 0),
        systemUptime: formatUptime(Number(data?.system?.uptime || 0)),
        serverHealth,
        memoryUsage: Math.round(Number(data?.system?.memory?.percentage || 0)),
        cpuUsage: Math.round(Number(data?.system?.cpu?.usage || 0)),
      });
    } catch (error: any) {
      setMetrics(null);
      setLoadError(error?.message || 'Failed to load admin metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminMetrics();
  }, []);

  const getHealthBadge = (health: SystemMetrics['serverHealth']) => {
    switch (health) {
      case 'healthy':
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Healthy</Badge>
        );
      case 'warning':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Warning</Badge>
        );
      case 'critical':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Critical</Badge>;
      default:
        return <Badge variant="outline">{health}</Badge>;
    }
  };

  const getHealthIcon = (health: SystemMetrics['serverHealth']) => {
    switch (health) {
      case 'healthy':
        return <Heart className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage < 50) return 'bg-green-500';
    if (usage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const adminSections = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: <Users className="h-6 w-6" />,
      link: '/admin/users',
      gradient: 'blue',
    },
    {
      title: 'Agent Skills',
      description: 'Configure agent capabilities',
      icon: <Bot className="h-6 w-6" />,
      link: '/admin/agent-skills',
      gradient: 'green',
    },
    {
      title: 'System Health',
      description: 'Monitor system performance and status',
      icon: <Heart className="h-6 w-6" />,
      link: '/admin/system-health',
      gradient: 'emerald',
    },
    {
      title: 'Feature Flags',
      description: 'Enable/disable features and experiments',
      icon: <Flag className="h-6 w-6" />,
      link: '/admin/features',
      gradient: 'purple',
    },
    {
      title: 'Port Management',
      description: 'Manage application ports and services',
      icon: <Plug className="h-6 w-6" />,
      link: '/admin/port-management',
      gradient: 'orange',
    },
    {
      title: 'Security Dashboard',
      description: 'Security status and encryption',
      icon: <Shield className="h-6 w-6" />,
      link: '/admin/security',
      gradient: 'red',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center">
            <User className="h-8 w-8 mr-2" /> Admin Panel
          </h1>
          <p className="text-gray-400">System administration and management dashboard</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-400 hidden md:block">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <PremiumButton onClick={fetchAdminMetrics} variant="secondary" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </PremiumButton>
        </div>
      </div>

      {loadError && (
        <div className="rounded-md border border-amber-300 bg-amber-100/80 px-4 py-2 text-sm text-amber-900">
          {loadError}
        </div>
      )}

      {/* System Overview */}
      {metrics && (
        <>
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassCard gradient="blue" className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{metrics.totalUsers}</p>
                  <p className="text-sm text-blue-200">Total Users</p>
                  <p className="text-xs text-blue-300 mt-1">{metrics.activeUsers} active now</p>
                </div>
                <Users className="h-8 w-8 text-blue-300 opacity-50" />
              </div>
            </GlassCard>

            <GlassCard gradient="purple" className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{metrics.totalWorkspaces}</p>
                  <p className="text-sm text-purple-200">Total Workspaces</p>
                  <p className="text-xs text-purple-300 mt-1">{metrics.activeWorkspaces} active</p>
                </div>
                <Building className="h-8 w-8 text-purple-300 opacity-50" />
              </div>
            </GlassCard>

            <GlassCard gradient="green" className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{metrics.totalAgents}</p>
                  <p className="text-sm text-green-200">Total Agents</p>
                  <p className="text-xs text-green-300 mt-1">{metrics.runningAgents} running</p>
                </div>
                <Bot className="h-8 w-8 text-green-300 opacity-50" />
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">System Health</p>
                  <div className="flex items-center gap-2">
                    {getHealthIcon(metrics.serverHealth)}
                    {getHealthBadge(metrics.serverHealth)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Uptime: {metrics.systemUptime}
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Resource Usage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Memory Usage</h3>
                <Cpu className="h-5 w-5 text-gray-400" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Used</span>
                <span className="text-sm font-medium text-white">{metrics.memoryUsage}%</span>
              </div>
              <div className="w-full bg-transparent/10 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(metrics.memoryUsage)}`}
                  style={{ width: `${metrics.memoryUsage}%` }}
                ></div>
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">CPU Usage</h3>
                <Activity className="h-5 w-5 text-gray-400" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Used</span>
                <span className="text-sm font-medium text-white">{metrics.cpuUsage}%</span>
              </div>
              <div className="w-full bg-transparent/10 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(metrics.cpuUsage)}`}
                  style={{ width: `${metrics.cpuUsage}%` }}
                ></div>
              </div>
            </GlassCard>
          </div>
        </>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <PremiumButton variant="gradient" className="h-auto p-4 flex flex-col items-start gap-2">
            <div className="text-2xl mb-1">
              <Plus className="h-6 w-6" />
            </div>
            <div className="font-medium">Create User</div>
            <div className="text-sm opacity-80 text-left font-normal">
              Add a new user to the system
            </div>
          </PremiumButton>

          <PremiumButton variant="secondary" className="h-auto p-4 flex flex-col items-start gap-2">
            <div className="text-2xl mb-1 text-green-400">
              <Hammer className="h-6 w-6" />
            </div>
            <div className="font-medium">Create Workspace</div>
            <div className="text-sm opacity-80 text-left font-normal">Set up a new workspace</div>
          </PremiumButton>

          <PremiumButton variant="secondary" className="h-auto p-4 flex flex-col items-start gap-2">
            <div className="text-2xl mb-1 text-purple-400">
              <Bot className="h-6 w-6" />
            </div>
            <div className="font-medium">Deploy Agent</div>
            <div className="text-sm opacity-80 text-left font-normal">Deploy a new AI agent</div>
          </PremiumButton>

          <PremiumButton variant="secondary" className="h-auto p-4 flex flex-col items-start gap-2">
            <div className="text-2xl mb-1 text-orange-400">
              <BarChart className="h-6 w-6" />
            </div>
            <div className="font-medium">View Reports</div>
            <div className="text-sm opacity-80 text-left font-normal">Generate system reports</div>
          </PremiumButton>

          <PremiumButton variant="secondary" className="h-auto p-4 flex flex-col items-start gap-2">
            <div className="text-2xl mb-1 text-red-400">
              <Siren className="h-6 w-6" />
            </div>
            <div className="font-medium">System Alerts</div>
            <div className="text-sm opacity-80 text-left font-normal">Check system alerts</div>
          </PremiumButton>

          <PremiumButton variant="secondary" className="h-auto p-4 flex flex-col items-start gap-2">
            <div className="text-2xl mb-1 text-gray-400">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div className="font-medium">Audit Logs</div>
            <div className="text-sm opacity-80 text-left font-normal">Review system activity</div>
          </PremiumButton>
        </div>
      </div>

      {/* Admin Sections */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Administration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminSections.map((section, index) => (
            <Link key={index} to={section.link}>
              <GlassCard className="h-full group cursor-pointer transition-all hover:border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`p-3 rounded-md bg-${section.gradient}-500/10 text-${section.gradient}-400 group-hover:bg-${section.gradient}-500/20 transition-all`}
                  >
                    {section.icon}
                  </div>
                  <div className="text-muted-foreground group-hover:text-white transition-colors">
                    →
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{section.title}</h3>
                <p className="text-sm text-gray-400">{section.description}</p>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <GlassCard className="p-4">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[
            {
              icon: '👤',
              title: 'New user registered',
              desc: 'alice@example.com',
              time: '5 minutes ago',
            },
            {
              icon: '🤖',
              title: 'Agent deployment completed',
              desc: 'ChatBot v2.1',
              time: '12 minutes ago',
            },
            { icon: '🏢', title: 'Workspace created', desc: 'Marketing Team', time: '1 hour ago' },
            {
              icon: '⚙️',
              title: 'System configuration updated',
              desc: 'Feature flags modified',
              time: '2 hours ago',
            },
          ].map((activity, i) => (
            <div
              key={i}
              className="flex items-center space-x-4 p-3 bg-transparent/5 rounded-md border border-white/10 hover:bg-transparent/10 transition-colors"
            >
              <div className="text-2xl">{activity.icon}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{activity.title}</p>
                <p className="text-xs text-gray-400">
                  {activity.desc} • {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
            View All Activity →
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

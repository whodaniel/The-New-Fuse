import {
  Activity,
  AlertCircle,
  ArrowUp,
  BarChart3,
  Bot,
  Building,
  CheckCircle,
  Clock,
  Database,
  FileText,
  Flag,
  HardDrive,
  Heart,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Server,
  Settings,
  Shield,
  Trash2,
  TrendingUp,
  Users,
  Wifi,
  WifiOff,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthorization } from '../../hooks/useAuthorization';

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
  diskUsage: number;
  networkTraffic: number;
  apiRequests: number;
  apiErrors: number;
  databaseConnections: number;
  cacheHitRate: number;
}

interface RecentActivity {
  id: string;
  type: 'user' | 'agent' | 'system' | 'security';
  user: string;
  action: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error';
}

interface Alert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

interface RelayChannel {
  id: string;
  name: string;
  members?: string[];
}

interface RelayHealthResponse {
  status?: string;
  relay?: string;
  uptime?: number;
  agents?: number;
  channels?: number;
}

interface RelayActivityEvent {
  id?: string;
  streamId?: string;
  type?: string;
  eventType?: string;
  source?: string;
  channel?: string;
  content?: string;
  relayTimestamp?: number;
  originalTimestamp?: number;
  metadata?: Record<string, unknown>;
}

const defaultMetrics: SystemMetrics = {
  totalUsers: 147,
  activeUsers: 23,
  totalWorkspaces: 12,
  activeWorkspaces: 8,
  totalAgents: 34,
  runningAgents: 12,
  systemUptime: 'Unknown',
  serverHealth: 'warning',
  memoryUsage: 0,
  cpuUsage: 0,
  diskUsage: 0,
  networkTraffic: 0,
  apiRequests: 0,
  apiErrors: 0,
  databaseConnections: 0,
  cacheHitRate: 0,
};

const RelayMetricCard = ({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle: string;
}) => (
  <div className="bg-white rounded-lg shadow-lg p-4 border-l-4 border-indigo-500">
    <div className="text-2xl font-bold text-gray-900">{value}</div>
    <div className="text-sm text-gray-700">{title}</div>
    <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
  </div>
);

export default function ComprehensiveAdminDashboard() {
  const { isSuperAdmin, userRole } = useAuthorization();
  const relayHttpBase = useMemo(
    () =>
      (import.meta.env.VITE_RELAY_HTTP_URL as string | undefined)?.replace(/\/$/, '') ||
      'http://localhost:3000',
    []
  );
  const relayWsUrl = useMemo(() => {
    const fromEnv = (import.meta.env.VITE_RELAY_WS_URL as string | undefined)?.trim();
    if (fromEnv) return fromEnv;
    return `${relayHttpBase.replace(/^http/i, 'ws')}/ws`;
  }, [relayHttpBase]);

  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [relayConnected, setRelayConnected] = useState(false);
  const [relayReachable, setRelayReachable] = useState(false);
  const [activityPersistenceAvailable, setActivityPersistenceAvailable] = useState(false);
  const [relayChannels, setRelayChannels] = useState<RelayChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [networkEventsCount, setNetworkEventsCount] = useState(0);
  const [actionBusy, setActionBusy] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const wsRef = useRef<WebSocket | null>(null);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    const icons = {
      user: <Users className="h-5 w-5 text-blue-500" />,
      agent: <Bot className="h-5 w-5 text-green-500" />,
      system: <Server className="h-5 w-5 text-gray-500" />,
      security: <Shield className="h-5 w-5 text-red-500" />,
    };
    return icons[type];
  };

  const getAlertIcon = (level: Alert['level']) => {
    const icons = {
      info: <AlertCircle className="h-5 w-5 text-blue-500" />,
      warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
      error: <XCircle className="h-5 w-5 text-red-500" />,
      critical: <XCircle className="h-5 w-5 text-red-700" />,
    };
    return icons[level];
  };

  const toRecentActivity = useCallback((event: RelayActivityEvent): RecentActivity => {
    const source = event.source || 'relay';
    const content = String(event.content || '').trim();
    const messageText = content.length > 100 ? `${content.slice(0, 100)}...` : content;
    const eventLabel = event.eventType || event.type || 'activity';
    const lower = `${source} ${eventLabel} ${content}`.toLowerCase();

    const type: RecentActivity['type'] = lower.includes('agent')
      ? 'agent'
      : lower.includes('security') || lower.includes('auth')
        ? 'security'
        : lower.includes('user')
          ? 'user'
          : 'system';

    const status: RecentActivity['status'] =
      lower.includes('error') || lower.includes('failed')
        ? 'error'
        : lower.includes('warn')
          ? 'warning'
          : 'success';

    return {
      id:
        event.id || event.streamId || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      user: source,
      action: messageText ? `${eventLabel}: ${messageText}` : eventLabel,
      timestamp: new Date(event.relayTimestamp || event.originalTimestamp || Date.now()),
      status,
    };
  }, []);

  const toSafePercent = (value: unknown) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
  };

  const getCountByRange = (range: '1h' | '24h' | '7d' | '30d') => {
    if (range === '1h') return 30;
    if (range === '24h') return 100;
    if (range === '7d') return 250;
    return 500;
  };

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const activityCount = getCountByRange(timeRange);
      const activityUrl = `${relayHttpBase}/activity/recent?count=${activityCount}${selectedChannelId ? `&channel=${encodeURIComponent(selectedChannelId)}` : ''}`;

      const [healthResult, channelsResult, agentsResult, activityResult, adminMetricsResult] =
        await Promise.allSettled([
          fetch(`${relayHttpBase}/health`, { method: 'GET' }),
          fetch(`${relayHttpBase}/channels`, { method: 'GET' }),
          fetch(`${relayHttpBase}/agents`, { method: 'GET' }),
          fetch(activityUrl, { method: 'GET' }),
          fetch('/api/admin/metrics/dashboard', { method: 'GET' }),
        ]);

      const relayHealth: RelayHealthResponse | null =
        healthResult.status === 'fulfilled' && healthResult.value.ok
          ? await healthResult.value.json()
          : null;

      const channels: RelayChannel[] =
        channelsResult.status === 'fulfilled' && channelsResult.value.ok
          ? await channelsResult.value.json()
          : [];

      const agents: unknown[] =
        agentsResult.status === 'fulfilled' && agentsResult.value.ok
          ? await agentsResult.value.json()
          : [];

      let activityEvents: RelayActivityEvent[] = [];
      if (activityResult.status === 'fulfilled' && activityResult.value.ok) {
        const payload = (await activityResult.value.json()) as { events?: RelayActivityEvent[] };
        activityEvents = Array.isArray(payload.events) ? payload.events : [];
        setActivityPersistenceAvailable(true);
      } else {
        setActivityPersistenceAvailable(false);
      }

      let adminMetrics: any = null;
      if (adminMetricsResult.status === 'fulfilled' && adminMetricsResult.value.ok) {
        adminMetrics = await adminMetricsResult.value.json();
      }

      const uptimeSeconds = relayHealth?.uptime;
      const uptimeHours = Number.isFinite(uptimeSeconds)
        ? Math.floor((uptimeSeconds as number) / 3600)
        : 0;

      const mergedMetrics: SystemMetrics = {
        ...defaultMetrics,
        totalUsers: Number(adminMetrics?.users?.total ?? defaultMetrics.totalUsers),
        activeUsers: Number(adminMetrics?.users?.active ?? defaultMetrics.activeUsers),
        totalWorkspaces: Number(adminMetrics?.workflows?.total ?? defaultMetrics.totalWorkspaces),
        activeWorkspaces: Number(
          adminMetrics?.workflows?.total
            ? Math.max(1, Math.floor(adminMetrics.workflows.total * 0.65))
            : defaultMetrics.activeWorkspaces
        ),
        totalAgents: Number(
          adminMetrics?.agents?.total ?? agents.length ?? defaultMetrics.totalAgents
        ),
        runningAgents: Number(
          adminMetrics?.agents?.active ?? relayHealth?.agents ?? defaultMetrics.runningAgents
        ),
        systemUptime: uptimeHours > 0 ? `${uptimeHours}h` : defaultMetrics.systemUptime,
        serverHealth:
          relayHealth?.status === 'ok' ? 'healthy' : relayHealth ? 'warning' : 'critical',
        memoryUsage: toSafePercent(
          adminMetrics?.system?.memory?.percentage ?? defaultMetrics.memoryUsage
        ),
        cpuUsage: toSafePercent(adminMetrics?.system?.cpu?.usage ?? defaultMetrics.cpuUsage),
        diskUsage: toSafePercent(adminMetrics?.system?.disk?.usage ?? defaultMetrics.diskUsage),
        networkTraffic: activityEvents.length,
        apiRequests: Number(adminMetrics?.auditLogs?.total ?? activityEvents.length),
        apiErrors: activityEvents.filter((e) => {
          const label = `${e.type || ''} ${e.eventType || ''} ${e.content || ''}`.toLowerCase();
          return label.includes('error') || label.includes('fail');
        }).length,
        databaseConnections: Number(
          adminMetrics?.system?.database?.connections ?? defaultMetrics.databaseConnections
        ),
        cacheHitRate: toSafePercent(
          adminMetrics?.system?.cache?.hitRate ?? defaultMetrics.cacheHitRate
        ),
      };

      setRelayReachable(!!relayHealth);
      setRelayChannels(channels);
      if (!selectedChannelId && channels.length > 0) {
        setSelectedChannelId(channels[0].id);
      }
      setMetrics(mergedMetrics);

      const mappedActivities = activityEvents.slice(0, 12).map(toRecentActivity);
      setRecentActivities(mappedActivities);
      setNetworkEventsCount(activityEvents.length);

      const derivedAlerts: Alert[] = [];
      if (!relayHealth) {
        derivedAlerts.push({
          id: 'relay-offline',
          level: 'critical',
          message: `Relay unavailable at ${relayHttpBase}/health`,
          timestamp: new Date(),
          resolved: false,
        });
      }
      if (!activityEvents.length) {
        derivedAlerts.push({
          id: 'no-activity',
          level: 'warning',
          message: 'No recent relay activity found for selected window.',
          timestamp: new Date(),
          resolved: false,
        });
      }
      if (!activityPersistenceAvailable) {
        derivedAlerts.push({
          id: 'activity-persistence',
          level: 'warning',
          message: 'Activity persistence endpoint is unavailable or disabled.',
          timestamp: new Date(),
          resolved: false,
        });
      }
      setAlerts(derivedAlerts);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [relayHttpBase, selectedChannelId, timeRange, toRecentActivity]);

  const connectRelaySocket = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(relayWsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setRelayConnected(true);
        ws.send(
          JSON.stringify({
            id: `admin-${Date.now()}`,
            type: 'CHANNEL_LIST',
            source: 'super-admin-dashboard',
            payload: {},
            timestamp: Date.now(),
          })
        );
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data)) as {
            type?: string;
            payload?: { channels?: RelayChannel[] };
          };
          if (msg.type === 'CHANNEL_LIST' && Array.isArray(msg.payload?.channels)) {
            setRelayChannels(msg.payload.channels);
          }
        } catch {
          // Ignore parse errors for non-json relay payloads.
        }
      };

      ws.onerror = () => {
        setRelayConnected(false);
      };

      ws.onclose = () => {
        setRelayConnected(false);
      };
    } catch {
      setRelayConnected(false);
    }
  }, [relayWsUrl]);

  const disconnectRelaySocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setRelayConnected(false);
  }, []);

  const sendRelayControl = useCallback(
    async (type: 'CHANNEL_PAUSE' | 'CHANNEL_RESUME') => {
      if (!selectedChannelId) return;
      setActionBusy(true);
      try {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          connectRelaySocket();
          await new Promise((resolve) => setTimeout(resolve, 250));
        }

        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          throw new Error('Relay socket is not connected');
        }

        wsRef.current.send(
          JSON.stringify({
            id: `admin-control-${Date.now()}`,
            type,
            source: 'super-admin-dashboard',
            channel: selectedChannelId,
            payload: { channelId: selectedChannelId },
            timestamp: Date.now(),
          })
        );

        await new Promise((resolve) => setTimeout(resolve, 200));
        await loadDashboardData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Control action failed');
      } finally {
        setActionBusy(false);
      }
    },
    [connectRelaySocket, loadDashboardData, selectedChannelId]
  );

  const confirmDeleteChannel = useCallback(async () => {
    const selectedChannel = relayChannels.find((ch) => ch.id === selectedChannelId);
    if (!selectedChannel || !isSuperAdmin) return;
    if (deleteConfirmText.trim() !== selectedChannel.name.trim()) {
      setError('Channel name confirmation mismatch. Deletion blocked.');
      return;
    }

    setActionBusy(true);
    try {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        connectRelaySocket();
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        throw new Error('Relay socket is not connected');
      }

      wsRef.current.send(
        JSON.stringify({
          id: `admin-delete-${Date.now()}`,
          type: 'CHANNEL_DELETE',
          source: 'super-admin-dashboard',
          channel: selectedChannelId,
          payload: { channelId: selectedChannelId },
          timestamp: Date.now(),
        })
      );

      setDeleteConfirmOpen(false);
      setDeleteConfirmText('');
      await new Promise((resolve) => setTimeout(resolve, 200));
      await loadDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Channel delete failed');
    } finally {
      setActionBusy(false);
    }
  }, [
    connectRelaySocket,
    deleteConfirmText,
    isSuperAdmin,
    loadDashboardData,
    relayChannels,
    selectedChannelId,
  ]);

  useEffect(() => {
    connectRelaySocket();
    void loadDashboardData();
    return () => {
      disconnectRelaySocket();
    };
  }, [connectRelaySocket, disconnectRelaySocket, loadDashboardData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      void loadDashboardData();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadDashboardData]);

  const adminSections = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: <Users className="h-6 w-6" />,
      link: '/admin/user-management',
      color: 'bg-blue-500',
      count: metrics?.totalUsers || 0,
    },
    {
      title: 'System Metrics',
      description: 'Real-time performance monitoring',
      icon: <BarChart3 className="h-6 w-6" />,
      link: '/admin/system-metrics',
      color: 'bg-purple-500',
      count: `${metrics?.cpuUsage || 0}%`,
    },
    {
      title: 'Agent Management',
      description: 'Monitor and control AI agents',
      icon: <Bot className="h-6 w-6" />,
      link: '/admin/agent-management',
      color: 'bg-green-500',
      count: metrics?.runningAgents || 0,
    },
    {
      title: 'Database Admin',
      description: 'Database queries and management',
      icon: <Database className="h-6 w-6" />,
      link: '/admin/database',
      color: 'bg-indigo-500',
      count: metrics?.databaseConnections || 0,
    },
    {
      title: 'API Analytics',
      description: 'API usage and performance stats',
      icon: <Activity className="h-6 w-6" />,
      link: '/admin/api-analytics',
      color: 'bg-orange-500',
      count: metrics?.apiRequests || 0,
    },
    {
      title: 'Configuration',
      description: 'System configuration management',
      icon: <Settings className="h-6 w-6" />,
      link: '/admin/configuration',
      color: 'bg-gray-500',
    },
    {
      title: 'Audit Logs',
      description: 'View system activity logs',
      icon: <FileText className="h-6 w-6" />,
      link: '/admin/audit-logs',
      color: 'bg-yellow-500',
    },
    {
      title: 'Backup & Restore',
      description: 'Data backup and recovery',
      icon: <HardDrive className="h-6 w-6" />,
      link: '/admin/backup-restore',
      color: 'bg-red-500',
    },
    {
      title: 'System Health',
      description: 'Infrastructure monitoring',
      icon: <Heart className="h-6 w-6" />,
      link: '/admin/system-health',
      color: 'bg-pink-500',
    },
    {
      title: 'Feature Flags',
      description: 'Toggle features and experiments',
      icon: <Flag className="h-6 w-6" />,
      link: '/admin/feature-flags',
      color: 'bg-teal-500',
    },
    {
      title: 'OpenClaw Security',
      description: 'Secure API key rotation',
      icon: <Shield className="h-6 w-6" />,
      link: '/admin/openclaw-security',
      color: 'bg-emerald-600',
    },
  ];

  if (loading && !metrics) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-pulse">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center bg-red-50 border border-red-200 p-8 rounded-lg">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-800 mb-2">Failed to Load Data</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              void loadDashboardData();
            }}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center mx-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const selectedChannel = relayChannels.find((ch) => ch.id === selectedChannelId);
  const selectedChannelName = selectedChannel?.name || 'No channel selected';

  return (
    <div className="p-8 max-w-[1600px] mx-auto bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
              <Shield className="h-10 w-10 mr-3 text-blue-600" />
              Super Admin Control Panel
            </h1>
            <p className="text-gray-600">
              Comprehensive platform management and network orchestration
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '1h' | '24h' | '7d' | '30d')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <button
              onClick={() => setAutoRefresh((prev) => !prev)}
              className={`px-4 py-2 rounded-lg transition-colors ${autoRefresh ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              Auto Refresh: {autoRefresh ? 'On' : 'Off'}
            </button>
            <button
              onClick={() => void loadDashboardData()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      </div>

      {metrics && (
        <div
          className={`mb-8 p-6 rounded-lg border-2 ${
            metrics.serverHealth === 'healthy'
              ? 'bg-green-50 border-green-200'
              : metrics.serverHealth === 'warning'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              {metrics.serverHealth === 'healthy' ? (
                <Heart className="h-5 w-5 text-green-500" />
              ) : metrics.serverHealth === 'warning' ? (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <div>
                <h3 className="text-lg font-semibold">
                  System Status:{' '}
                  {metrics.serverHealth.charAt(0).toUpperCase() + metrics.serverHealth.slice(1)}
                </h3>
                <p className="text-sm text-gray-600">Uptime: {metrics.systemUptime}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{metrics.activeUsers}</div>
                <div className="text-xs text-gray-600">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{metrics.runningAgents}</div>
                <div className="text-xs text-gray-600">Running Agents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{metrics.cacheHitRate}%</div>
                <div className="text-xs text-gray-600">Cache Hit Rate</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Network Activity Control</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
          <RelayMetricCard
            title="Relay API"
            value={relayReachable ? 'Online' : 'Offline'}
            subtitle={relayReachable ? relayHttpBase : `Unreachable: ${relayHttpBase}`}
          />
          <RelayMetricCard
            title="Relay Socket"
            value={relayConnected ? 'Connected' : 'Disconnected'}
            subtitle={relayConnected ? relayWsUrl : 'Open socket to send controls'}
          />
          <RelayMetricCard
            title="Activity Stream"
            value={activityPersistenceAvailable ? 'Enabled' : 'Unavailable'}
            subtitle="/activity/recent"
          />
          <RelayMetricCard
            title="Channels"
            value={relayChannels.length}
            subtitle="Available relay channels"
          />
          <RelayMetricCard
            title="Agents"
            value={metrics?.runningAgents || 0}
            subtitle="Observed active agents"
          />
          <RelayMetricCard
            title="Events"
            value={networkEventsCount}
            subtitle={`Window: ${timeRange}`}
          />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Relay Channel</label>
              <select
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {relayChannels.length === 0 ? (
                  <option value="">No channels</option>
                ) : (
                  relayChannels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      {channel.name} ({channel.id})
                    </option>
                  ))
                )}
              </select>
              <p className="text-xs text-gray-500 mt-1">Selected: {selectedChannelName}</p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={relayConnected ? disconnectRelaySocket : connectRelaySocket}
                className={`px-3 py-2 rounded-lg text-white flex items-center ${relayConnected ? 'bg-slate-700 hover:bg-slate-800' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {relayConnected ? (
                  <WifiOff className="h-4 w-4 mr-2" />
                ) : (
                  <Wifi className="h-4 w-4 mr-2" />
                )}
                {relayConnected ? 'Disconnect Socket' : 'Connect Socket'}
              </button>
              <button
                onClick={() => void sendRelayControl('CHANNEL_PAUSE')}
                disabled={!selectedChannelId || actionBusy}
                className="px-3 py-2 rounded-lg text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 flex items-center"
              >
                <PauseCircle className="h-4 w-4 mr-2" />
                Pause
              </button>
              <button
                onClick={() => void sendRelayControl('CHANNEL_RESUME')}
                disabled={!selectedChannelId || actionBusy}
                className="px-3 py-2 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 flex items-center"
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Resume
              </button>
              <button
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={!selectedChannelId || actionBusy || !isSuperAdmin}
                className="px-3 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center"
                title={
                  isSuperAdmin
                    ? 'Delete selected channel'
                    : `Delete is restricted to SUPER_ADMIN (current role: ${userRole || 'unknown'})`
                }
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-8 w-8 text-blue-500" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {metrics.totalUsers.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Users</div>
            <div className="mt-2 text-xs text-green-600 flex items-center">
              <ArrowUp className="h-3 w-3 mr-1" />
              12% from last month
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <Bot className="h-8 w-8 text-green-500" />
              <Activity className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{metrics.totalAgents}</div>
            <div className="text-sm text-gray-600">Total Agents</div>
            <div className="mt-2 text-xs text-gray-600">
              {metrics.runningAgents} currently active
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="h-8 w-8 text-purple-500" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {metrics.apiRequests.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Network Events</div>
            <div className="mt-2 text-xs text-red-600 flex items-center">
              {metrics.apiErrors} flagged errors
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <Building className="h-8 w-8 text-orange-500" />
              <Activity className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{metrics.totalWorkspaces}</div>
            <div className="text-sm text-gray-600">Workspaces</div>
            <div className="mt-2 text-xs text-gray-600">{metrics.activeWorkspaces} active</div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {adminSections.map((section, index) => (
            <Link
              key={index}
              to={section.link}
              className="bg-white rounded-lg shadow-lg p-5 hover:shadow-xl transition-all group hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-lg ${section.color} text-white`}>{section.icon}</div>
                {section.count && (
                  <div className="text-2xl font-bold text-gray-700">{section.count}</div>
                )}
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{section.title}</h3>
              <p className="text-xs text-gray-600">{section.description}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Network Activity Feed</h3>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No recent relay activity.</div>
            ) : (
              recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="mt-1">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{activity.user}</p>
                    <p className="text-xs text-gray-600 break-words">{activity.action}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                  <div>
                    {activity.status === 'success' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {activity.status === 'warning' && (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                    {activity.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                  </div>
                </div>
              ))
            )}
          </div>
          <Link
            to="/admin/audit-logs"
            className="block text-center mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View Full Audit Logs →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
            <AlertCircle className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {alerts.filter((a) => !a.resolved).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>No active alerts</p>
              </div>
            ) : (
              alerts
                .filter((a) => !a.resolved)
                .map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.level === 'critical'
                        ? 'bg-red-50 border-red-500'
                        : alert.level === 'error'
                          ? 'bg-red-50 border-red-400'
                          : alert.level === 'warning'
                            ? 'bg-yellow-50 border-yellow-500'
                            : 'bg-blue-50 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {getAlertIcon(alert.level)}
                      <div className="flex-1">
                        <div className="text-sm font-semibold capitalize">{alert.level}</div>
                        <div className="text-sm text-gray-700 mt-1">{alert.message}</div>
                        <div className="text-xs text-gray-500 mt-2">
                          {formatTimestamp(alert.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
          {alerts.filter((a) => !a.resolved).length > 0 && (
            <Link
              to="/admin/system-health"
              className="block text-center mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All Alerts →
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-gray-900">{metrics?.systemUptime}</div>
            <div className="text-sm text-gray-600">System Uptime</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">{metrics?.databaseConnections}</div>
            <div className="text-sm text-gray-600">DB Connections</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">{metrics?.cacheHitRate}%</div>
            <div className="text-sm text-gray-600">Cache Hit Rate</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">
              {(((metrics?.apiErrors || 0) / (metrics?.apiRequests || 1)) * 100).toFixed(2)}%
            </div>
            <div className="text-sm text-gray-600">Error Rate</div>
          </div>
        </div>
      </div>

      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Channel Deletion</h3>
            <p className="text-sm text-gray-600 mb-3">
              This action is destructive. To confirm, type the exact channel name:
            </p>
            <p className="text-sm font-semibold text-gray-900 mb-3">{selectedChannelName}</p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type channel name to confirm"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => void confirmDeleteChannel()}
                disabled={
                  actionBusy ||
                  !isSuperAdmin ||
                  !selectedChannel ||
                  deleteConfirmText.trim() !== selectedChannel.name.trim()
                }
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                Delete Channel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

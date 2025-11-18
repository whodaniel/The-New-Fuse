import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building,
  Heart,
  Database,
  BarChart3,
  Settings,
  FileText,
  HardDrive,
  Activity,
  Flag,
  Bot,
  RefreshCw,
  TrendingUp,
  Server,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

export default function ComprehensiveAdminDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  // Mock performance data for charts
  const performanceData = [
    { time: '00:00', cpu: 45, memory: 62, requests: 1200 },
    { time: '04:00', cpu: 32, memory: 58, requests: 800 },
    { time: '08:00', cpu: 68, memory: 72, requests: 3500 },
    { time: '12:00', cpu: 78, memory: 76, requests: 4200 },
    { time: '16:00', cpu: 85, memory: 80, requests: 4800 },
    { time: '20:00', cpu: 52, memory: 68, requests: 2100 },
  ];

  const apiUsageData = [
    { name: 'Auth', value: 4200 },
    { name: 'Users', value: 3100 },
    { name: 'Agents', value: 2800 },
    { name: 'Chat', value: 5200 },
    { name: 'Other', value: 1500 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // In production, replace with actual API calls
      await new Promise(resolve => setTimeout(resolve, 1000));

      setMetrics({
        totalUsers: 1247,
        activeUsers: 342,
        totalWorkspaces: 156,
        activeWorkspaces: 89,
        totalAgents: 234,
        runningAgents: 87,
        systemUptime: '45 days, 12 hours',
        serverHealth: 'healthy',
        memoryUsage: 68,
        cpuUsage: 45,
        diskUsage: 52,
        networkTraffic: 1.2,
        apiRequests: 145234,
        apiErrors: 234,
        databaseConnections: 45,
        cacheHitRate: 94.2,
      });

      setRecentActivities([
        {
          id: '1',
          type: 'user',
          user: 'alice@example.com',
          action: 'Created new workspace "Marketing Team"',
          timestamp: new Date(Date.now() - 5 * 60000),
          status: 'success',
        },
        {
          id: '2',
          type: 'agent',
          user: 'ChatBot v3.2',
          action: 'Agent deployed successfully',
          timestamp: new Date(Date.now() - 12 * 60000),
          status: 'success',
        },
        {
          id: '3',
          type: 'system',
          user: 'System',
          action: 'Database backup completed',
          timestamp: new Date(Date.now() - 30 * 60000),
          status: 'success',
        },
        {
          id: '4',
          type: 'security',
          user: 'bob@example.com',
          action: 'Failed login attempt detected',
          timestamp: new Date(Date.now() - 45 * 60000),
          status: 'warning',
        },
        {
          id: '5',
          type: 'system',
          user: 'System',
          action: 'Cache cleared successfully',
          timestamp: new Date(Date.now() - 60 * 60000),
          status: 'success',
        },
      ]);

      setAlerts([
        {
          id: '1',
          level: 'warning',
          message: 'High CPU usage detected on server-02 (85%)',
          timestamp: new Date(Date.now() - 10 * 60000),
          resolved: false,
        },
        {
          id: '2',
          level: 'info',
          message: 'System maintenance scheduled for Saturday 2:00 AM',
          timestamp: new Date(Date.now() - 120 * 60000),
          resolved: false,
        },
        {
          id: '3',
          level: 'error',
          message: 'Database connection pool exhausted',
          timestamp: new Date(Date.now() - 180 * 60000),
          resolved: true,
        },
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthBadge = (health: SystemMetrics['serverHealth']) => {
    const badges = {
      healthy: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      critical: 'bg-red-100 text-red-800 border-red-200',
    };
    return badges[health];
  };

  const getHealthIcon = (health: SystemMetrics['serverHealth']) => {
    const icons = {
      healthy: <CheckCircle className="h-5 w-5 text-green-500" />,
      warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
      critical: <XCircle className="h-5 w-5 text-red-500" />,
    };
    return icons[health];
  };

  const getUsageColor = (usage: number) => {
    if (usage < 50) return 'bg-green-500';
    if (usage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

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
  ];

  if (loading && !metrics) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
              <Shield className="h-10 w-10 mr-3 text-blue-600" />
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Comprehensive platform management and monitoring
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <button
              onClick={loadDashboardData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* System Status Banner */}
      {metrics && (
        <div className={`mb-8 p-6 rounded-lg border-2 ${
          metrics.serverHealth === 'healthy'
            ? 'bg-green-50 border-green-200'
            : metrics.serverHealth === 'warning'
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getHealthIcon(metrics.serverHealth)}
              <div>
                <h3 className="text-lg font-semibold">
                  System Status: {metrics.serverHealth.charAt(0).toUpperCase() + metrics.serverHealth.slice(1)}
                </h3>
                <p className="text-sm text-gray-600">
                  Uptime: {metrics.systemUptime} | Last updated: {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
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

      {/* Key Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-8 w-8 text-blue-500" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{metrics.totalUsers.toLocaleString()}</div>
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
            <div className="text-3xl font-bold text-gray-900">{metrics.apiRequests.toLocaleString()}</div>
            <div className="text-sm text-gray-600">API Requests (24h)</div>
            <div className="mt-2 text-xs text-red-600 flex items-center">
              {metrics.apiErrors} errors (0.16%)
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <Building className="h-8 w-8 text-orange-500" />
              <Activity className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{metrics.totalWorkspaces}</div>
            <div className="text-sm text-gray-600">Workspaces</div>
            <div className="mt-2 text-xs text-gray-600">
              {metrics.activeWorkspaces} active
            </div>
          </div>
        </div>
      )}

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="cpu" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="CPU %" />
              <Area type="monotone" dataKey="memory" stackId="2" stroke="#10b981" fill="#10b981" name="Memory %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API Request Volume</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="requests" stroke="#8b5cf6" strokeWidth={2} name="Requests" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* API Usage Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API Endpoints Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={apiUsageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {apiUsageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Resource Usage */}
        {metrics && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Usage</h3>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">CPU Usage</span>
                  <span className="text-sm font-bold">{metrics.cpuUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${getUsageColor(metrics.cpuUsage)}`}
                    style={{ width: `${metrics.cpuUsage}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Memory Usage</span>
                  <span className="text-sm font-bold">{metrics.memoryUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${getUsageColor(metrics.memoryUsage)}`}
                    style={{ width: `${metrics.memoryUsage}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Disk Usage</span>
                  <span className="text-sm font-bold">{metrics.diskUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${getUsageColor(metrics.diskUsage)}`}
                    style={{ width: `${metrics.diskUsage}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Network Traffic</span>
                  <span className="text-sm font-bold">{metrics.networkTraffic} GB/s</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-300 bg-blue-500"
                    style={{ width: `${Math.min(metrics.networkTraffic * 20, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Admin Sections Grid */}
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
                <div className={`p-3 rounded-lg ${section.color} text-white`}>
                  {section.icon}
                </div>
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

      {/* Recent Activity and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="mt-1">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{activity.user}</p>
                  <p className="text-xs text-gray-600">{activity.action}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatTimestamp(activity.timestamp)}</p>
                </div>
                <div>
                  {activity.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {activity.status === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                  {activity.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/admin/audit-logs"
            className="block text-center mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View All Activity →
          </Link>
        </div>

        {/* System Alerts */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
            <AlertCircle className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {alerts.filter(a => !a.resolved).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>No active alerts</p>
              </div>
            ) : (
              alerts.filter(a => !a.resolved).map((alert) => (
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
                      <div className="text-xs text-gray-500 mt-2">{formatTimestamp(alert.timestamp)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {alerts.filter(a => !a.resolved).length > 0 && (
            <Link
              to="/admin/system-health"
              className="block text-center mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All Alerts →
            </Link>
          )}
        </div>
      </div>

      {/* Footer Stats */}
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
            <div className="text-3xl font-bold text-gray-900">{(metrics?.apiErrors || 0) / (metrics?.apiRequests || 1) * 100}%</div>
            <div className="text-sm text-gray-600">Error Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}

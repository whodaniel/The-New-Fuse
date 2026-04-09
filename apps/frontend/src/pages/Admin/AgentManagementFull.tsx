import {
  Activity,
  AlertCircle,
  Bot,
  CheckCircle,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Settings,
  StopCircle,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface Agent {
  id: string;
  name: string;
  type: 'chatbot' | 'assistant' | 'automation' | 'analytics';
  status: 'running' | 'stopped' | 'error' | 'starting';
  uptime: string;
  requestsHandled: number;
  avgResponseTime: number;
  errorRate: number;
  lastActive: Date;
  cpuUsage: number;
  memoryUsage: number;
}

interface PerformancePoint {
  time: string;
  requests: number;
  responseTime: number;
  errors: number;
}

const normalizeAgentType = (value: unknown): Agent['type'] => {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'chatbot' || normalized === 'automation' || normalized === 'analytics') {
    return normalized;
  }
  return 'assistant';
};

const normalizeAgentStatus = (value: unknown): Agent['status'] => {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'running' || normalized === 'error' || normalized === 'starting') {
    return normalized;
  }
  return 'stopped';
};

const toFiniteNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export default function AgentManagementFull() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformancePoint[]>([]);

  useEffect(() => {
    loadAgents();
    const interval = setInterval(loadAgents, 10000);
    return () => clearInterval(interval);
  }, []);

  const [stats, setStats] = useState({ total: 0, running: 0, error: 0 });

  const loadAgents = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const [agentsRes, statsRes] = await Promise.all([
        fetch('/api/admin/agents?limit=100', { headers }),
        fetch('/api/admin/agents/stats', { headers }),
      ]);

      if (!agentsRes.ok || !statsRes.ok) throw new Error('Failed to fetch data');

      const agentsData = await agentsRes.json();
      const statsPayload = await statsRes.json();
      const statsData = statsPayload?.data ?? statsPayload;

      setStats({
        total: toFiniteNumber(statsData?.total),
        running: toFiniteNumber(statsData?.running),
        error: toFiniteNumber(statsData?.error),
      });

      const rows = Array.isArray(agentsData?.data)
        ? agentsData.data
        : Array.isArray(agentsData)
          ? agentsData
          : [];

      const mappedAgents: Agent[] = rows.map((a: any) => ({
        id: String(a?.id || ''),
        name: String(a?.name || 'Unnamed Agent'),
        type: normalizeAgentType(a?.type),
        status: normalizeAgentStatus(a?.status),
        uptime: String(a?.uptime || '0m'),
        requestsHandled: toFiniteNumber(a?.requestsHandled),
        avgResponseTime: toFiniteNumber(a?.avgResponseTime),
        errorRate: toFiniteNumber(a?.errorRate),
        lastActive: new Date(a?.updatedAt || Date.now()),
        cpuUsage: toFiniteNumber(a?.cpuUsage),
        memoryUsage: toFiniteNumber(a?.memoryUsage),
      }));

      setAgents(mappedAgents);

      // Build timeline snapshots from live aggregate values instead of synthetic chart data.
      const totals = mappedAgents.reduce(
        (acc, agent) => {
          acc.requests += agent.requestsHandled;
          acc.responseTime += agent.avgResponseTime;
          acc.errors += agent.errorRate;
          return acc;
        },
        { requests: 0, responseTime: 0, errors: 0 }
      );
      const avgResponseTime =
        mappedAgents.length > 0 ? totals.responseTime / mappedAgents.length : 0;
      const avgErrorRate = mappedAgents.length > 0 ? totals.errors / mappedAgents.length : 0;
      const point: PerformancePoint = {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        requests: totals.requests,
        responseTime: Math.round(avgResponseTime),
        errors: Number(avgErrorRate.toFixed(2)),
      };
      setPerformanceData((prev) => [...prev.slice(-23), point]);
    } catch (error) {
      console.error('Error loading agents:', error);
      setAgents([]);
      setLoadError('Agent management endpoints are unavailable right now.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Agent['status']) => {
    const badges = {
      running: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      stopped: { bg: 'bg-gray-100', text: 'text-gray-800', icon: StopCircle },
      error: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      starting: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertCircle },
    };
    return badges[status];
  };

  const getTypeBadge = (type: Agent['type']) => {
    const badges = {
      chatbot: 'bg-blue-100 text-blue-800',
      assistant: 'bg-purple-100 text-purple-800',
      automation: 'bg-green-100 text-green-800',
      analytics: 'bg-orange-100 text-orange-800',
    };
    return badges[type];
  };

  const handleAgentAction = (agentId: string, action: 'start' | 'stop' | 'restart' | 'delete') => {
    console.log(`${action} agent ${agentId}`);
    // Implement agent actions
  };

  return (
    <div className="p-4 max-w-[1600px] mx-auto bg-transparent min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <Bot className="h-8 w-8 mr-3 text-blue-600" />
              Agent Management
            </h1>
            <p className="text-muted-foreground">
              Monitor and control AI agents across the platform
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadAgents}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-muted/20 flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Deploy Agent
            </button>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {loadError}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-transparent rounded-md shadow-none p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Agents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Bot className="h-12 w-12 text-blue-500 opacity-20" />
          </div>
        </div>
        <div className="bg-transparent rounded-md shadow-none p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Running</p>
              <p className="text-2xl font-bold text-green-600">{stats.running}</p>
            </div>
            <Play className="h-12 w-12 text-green-500 opacity-20" />
          </div>
        </div>
        <div className="bg-transparent rounded-md shadow-none p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">With Errors</p>
              <p className="text-2xl font-bold text-red-600">{stats.error}</p>
            </div>
            <AlertCircle className="h-12 w-12 text-red-500 opacity-20" />
          </div>
        </div>
        <div className="bg-transparent rounded-md shadow-none p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Requests</p>
              <p className="text-2xl font-bold text-purple-600">
                {agents.reduce((sum, a) => sum + a.requestsHandled, 0).toLocaleString()}
              </p>
            </div>
            <Activity className="h-12 w-12 text-purple-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Agent List */}
      <div className="bg-transparent rounded-md shadow-none overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border/50">
            <thead className="bg-transparent">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Uptime
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Requests
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Response Time
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Resources
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-border/50">
              {agents.map((agent) => {
                const statusBadge = getStatusBadge(agent.status);
                const StatusIcon = statusBadge.icon;
                return (
                  <tr key={agent.id} className="hover:bg-muted/20">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-md flex items-center justify-center">
                          <Bot className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                          <div className="text-xs text-muted-foreground">ID: {agent.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadge(agent.type)}`}
                      >
                        {agent.type}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge.bg} ${statusBadge.text}`}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {agent.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground">
                      {agent.uptime}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {agent.requestsHandled.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{agent.avgResponseTime}ms</div>
                      <div className="text-xs text-muted-foreground">Error: {agent.errorRate}%</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-muted-foreground">
                        <div>CPU: {agent.cpuUsage}%</div>
                        <div>Mem: {agent.memoryUsage}MB</div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {agent.status === 'running' ? (
                          <button
                            onClick={() => handleAgentAction(agent.id, 'stop')}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Stop"
                          >
                            <Pause className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAgentAction(agent.id, 'start')}
                            className="text-green-600 hover:text-green-900"
                            title="Start"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleAgentAction(agent.id, 'restart')}
                          className="text-blue-600 hover:text-blue-900"
                          title="Restart"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                          className="text-muted-foreground hover:text-gray-900"
                          title="Settings"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleAgentAction(agent.id, 'delete')}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-transparent rounded-md shadow-none-none p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Volume</h3>
          {performanceData.length === 0 && (
            <div className="pb-4 text-sm text-muted-foreground">
              No live metrics yet. Refresh after agents report activity.
            </div>
          )}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-transparent rounded-md shadow-none-none p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time & Errors</h3>
          {performanceData.length === 0 && (
            <div className="pb-4 text-sm text-muted-foreground">
              No live metrics yet. Refresh after agents report activity.
            </div>
          )}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="responseTime"
                stroke="#10b981"
                strokeWidth={2}
                name="Response Time (ms)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="errors"
                stroke="#ef4444"
                strokeWidth={2}
                name="Errors"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

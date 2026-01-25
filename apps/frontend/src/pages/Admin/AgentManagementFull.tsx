import {
  Activity,
  AlertCircle,
  Bot,
  CheckCircle,
  Eye,
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

export default function AgentManagementFull() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  useEffect(() => {
    loadAgents();
    const interval = setInterval(loadAgents, 10000);
    return () => clearInterval(interval);
  }, []);

  const [stats, setStats] = useState({ total: 0, running: 0, error: 0 });

  const loadAgents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [agentsRes, statsRes] = await Promise.all([
        fetch('/api/admin/agents?limit=100', { headers }),
        fetch('/api/admin/agents/stats', { headers }),
      ]);

      if (!agentsRes.ok || !statsRes.ok) throw new Error('Failed to fetch data');

      const agentsData = await agentsRes.json();
      const statsData = await statsRes.json();

      setStats({
        total: statsData.total || 0,
        running: statsData.running || 0,
        error: statsData.error || 0,
      });

      const mappedAgents: Agent[] = agentsData.data.map((a: any) => ({
        id: a.id,
        name: a.name,
        type: (a.type || 'assistant').toLowerCase(),
        status: (a.status || 'stopped').toLowerCase(),
        uptime: '0m', // Todo: Implement uptime tracking
        requestsHandled: 0, // Todo: Implement metrics
        avgResponseTime: 0,
        errorRate: 0,
        lastActive: new Date(a.updatedAt || Date.now()),
        cpuUsage: 0,
        memoryUsage: 0,
      }));

      setAgents(mappedAgents);

      // Generate placeholder performance data until backend metrics are ready
      const perfData = Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        requests: Math.floor(Math.random() * 1000 + 500),
        responseTime: Math.floor(Math.random() * 500 + 200),
        errors: Math.floor(Math.random() * 20),
      }));
      setPerformanceData(perfData);
    } catch (error) {
      console.error('Error loading agents:', error);
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

  return (
    <div className="p-8 max-w-[1600px] mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Bot className="h-8 w-8 mr-3 text-blue-600" />
              Agent Management
            </h1>
            <p className="text-gray-600">Monitor and control AI agents across the platform</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadAgents}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Deploy Agent
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Agents</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Bot className="h-12 w-12 text-blue-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Running</p>
              <p className="text-3xl font-bold text-green-600">{stats.running}</p>
            </div>
            <Play className="h-12 w-12 text-green-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">With Errors</p>
              <p className="text-3xl font-bold text-red-600">{stats.error}</p>
            </div>
            <AlertCircle className="h-12 w-12 text-red-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-3xl font-bold text-purple-600">
                {agents.reduce((sum, a) => sum + a.requestsHandled, 0).toLocaleString()}
              </p>
            </div>
            <Activity className="h-12 w-12 text-purple-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Agent List */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uptime
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Response Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resources
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {agents.map((agent) => {
                const statusBadge = getStatusBadge(agent.status);
                const StatusIcon = statusBadge.icon;
                return (
                  <tr key={agent.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Bot className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                          <div className="text-xs text-gray-500">ID: {agent.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadge(agent.type)}`}
                      >
                        {agent.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge.bg} ${statusBadge.text}`}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {agent.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agent.uptime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {agent.requestsHandled.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{agent.avgResponseTime}ms</div>
                      <div className="text-xs text-gray-500">Error: {agent.errorRate}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-600">
                        <div>CPU: {agent.cpuUsage}%</div>
                        <div>Mem: {agent.memoryUsage}MB</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                          onClick={() => setSelectedAgent(agent)}
                          className="text-purple-600 hover:text-purple-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900" title="Settings">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Volume</h3>
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

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time & Errors</h3>
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

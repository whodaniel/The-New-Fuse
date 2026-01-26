import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertTriangle,
  BarChart,
  CheckCircle,
  Clock,
  Cloud,
  Cog,
  Cpu,
  Filter,
  MoreVertical,
  Pause,
  Pencil,
  Play,
  Plus,
  Search,
  User,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface Agent {
  id: string;
  name: string;
  description: string;
  type: 'conversational' | 'task-automation' | 'data-analysis' | 'content-generation';
  status: 'active' | 'inactive' | 'error' | 'training';
  lastActive: string;
  totalTasks: number;
  successRate: number;
  averageResponseTime: number;
  model: string;
  deployment: 'cloud' | 'local' | 'hybrid';
  owner: string;
  createdAt: string;
  tags: string[];
  metrics: {
    tasksToday: number;
    tasksThisWeek: number;
    errorRate: number;
    uptime: number;
  };
}

const AgentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('lastActive');
  const [showFilters, setShowFilters] = useState(false);

  // Mock data for development
  const mockAgents: Agent[] = [
    {
      id: '1',
      name: 'Customer Support Bot',
      description:
        'Handles customer inquiries and support tickets with natural language processing.',
      type: 'conversational',
      status: 'active',
      lastActive: '2024-01-15T10:30:00Z',
      totalTasks: 1247,
      successRate: 94.5,
      averageResponseTime: 1.2,
      model: 'GPT-4',
      deployment: 'cloud',
      owner: 'Sarah Johnson',
      createdAt: '2024-01-01T00:00:00Z',
      tags: ['customer-service', 'nlp', 'production'],
      metrics: {
        tasksToday: 45,
        tasksThisWeek: 312,
        errorRate: 5.5,
        uptime: 99.2,
      },
    },
    {
      id: '2',
      name: 'Data Analyzer Pro',
      description: 'Automated data analysis and report generation for business intelligence.',
      type: 'data-analysis',
      status: 'active',
      lastActive: '2024-01-15T09:45:00Z',
      totalTasks: 856,
      successRate: 98.1,
      averageResponseTime: 3.7,
      model: 'Claude-3',
      deployment: 'hybrid',
      owner: 'Mike Chen',
      createdAt: '2024-01-05T00:00:00Z',
      tags: ['analytics', 'reporting', 'bi'],
      metrics: {
        tasksToday: 12,
        tasksThisWeek: 89,
        errorRate: 1.9,
        uptime: 97.8,
      },
    },
    {
      id: '3',
      name: 'Content Creator',
      description: 'Generates marketing content, blog posts, and social media updates.',
      type: 'content-generation',
      status: 'inactive',
      lastActive: '2024-01-14T16:20:00Z',
      totalTasks: 423,
      successRate: 91.2,
      averageResponseTime: 2.1,
      model: 'GPT-3.5',
      deployment: 'cloud',
      owner: 'Emma Davis',
      createdAt: '2024-01-10T00:00:00Z',
      tags: ['content', 'marketing', 'social-media'],
      metrics: {
        tasksToday: 0,
        tasksThisWeek: 67,
        errorRate: 8.8,
        uptime: 95.4,
      },
    },
    {
      id: '4',
      name: 'Workflow Automator',
      description: 'Automates repetitive business processes and task workflows.',
      type: 'task-automation',
      status: 'error',
      lastActive: '2024-01-15T08:15:00Z',
      totalTasks: 2134,
      successRate: 89.7,
      averageResponseTime: 0.8,
      model: 'Custom Model',
      deployment: 'local',
      owner: 'Alex Rodriguez',
      createdAt: '2023-12-20T00:00:00Z',
      tags: ['automation', 'workflows', 'rpa'],
      metrics: {
        tasksToday: 8,
        tasksThisWeek: 156,
        errorRate: 10.3,
        uptime: 87.2,
      },
    },
  ];

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/dashboard/agents');
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      } else {
        // Use mock data as fallback
        setAgents(mockAgents);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      setAgents(mockAgents);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'inactive':
        return <Pause className="w-5 h-5 text-gray-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'training':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'conversational':
        return <User className="w-5 h-5" />;
      case 'task-automation':
        return <Cog className="w-5 h-5" />;
      case 'data-analysis':
        return <BarChart className="w-5 h-5" />;
      case 'content-generation':
        return <Pencil className="w-5 h-5" />;
      default:
        return <Cpu className="w-5 h-5" />;
    }
  };

  const getDeploymentIcon = (deployment: string) => {
    switch (deployment) {
      case 'cloud':
        return <Cloud className="w-4 h-4" />;
      case 'local':
        return <Cpu className="w-4 h-4" />;
      case 'hybrid':
        return (
          <div className="flex space-x-1">
            <Cloud className="w-3 h-3" />
            <Cpu className="w-3 h-3" />
          </div>
        );
      default:
        return <Cpu className="w-4 h-4" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    const matchesType = typeFilter === 'all' || agent.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const sortedAgents = [...filteredAgents].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'status':
        return a.status.localeCompare(b.status);
      case 'successRate':
        return b.successRate - a.successRate;
      case 'totalTasks':
        return b.totalTasks - a.totalTasks;
      case 'lastActive':
      default:
        return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
    }
  });

  const handleAgentAction = async (agentId: string, action: string) => {
    try {
      const response = await fetch(`/api/dashboard/agents/${agentId}/${action}`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchAgents(); // Refresh the list
      }
    } catch (error) {
      console.error(`Failed to ${action} agent:`, error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agent dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agent Dashboard</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Monitor and manage your AI agents
              </p>
            </div>
            <Link
              to="/dashboard/agents/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Agent
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Cpu className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Agents</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{agents.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {agents.filter((a) => a.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <BarChart className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Success Rate
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {agents.length > 0
                    ? Math.round(agents.reduce((sum, a) => sum + a.successRate, 0) / agents.length)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tasks Today</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {agents.reduce((sum, a) => sum + a.metrics.tasksToday, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                title="Filter by status"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="error">Error</option>
                <option value="training">Training</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                title="Filter by type"
              >
                <option value="all">All Types</option>
                <option value="conversational">Conversational</option>
                <option value="task-automation">Task Automation</option>
                <option value="data-analysis">Data Analysis</option>
                <option value="content-generation">Content Generation</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                title="Sort by"
              >
                <option value="lastActive">Last Active</option>
                <option value="name">Name</option>
                <option value="status">Status</option>
                <option value="successRate">Success Rate</option>
                <option value="totalTasks">Total Tasks</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title="Toggle Filters"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedAgents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      {getTypeIcon(agent.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {agent.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(agent.status)}
                        <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {agent.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="Agent Options"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-500" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      >
                        <DropdownMenuItem onClick={() => handleAgentAction(agent.id, 'edit')}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleAgentAction(
                              agent.id,
                              agent.status === 'active' ? 'pause' : 'start'
                            )
                          }
                        >
                          {agent.status === 'active' ? (
                            <>
                              <Pause className="w-4 h-4 mr-2" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Start
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/dashboard/agents/${agent.id}`)}>
                          <BarChart className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                  {agent.description}
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Success Rate</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {agent.successRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Tasks</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {agent.totalTasks.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Avg Response</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {agent.averageResponseTime}s
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Uptime</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {agent.metrics.uptime}%
                    </p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {agent.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {agent.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                      +{agent.tags.length - 3}
                    </span>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    {getDeploymentIcon(agent.deployment)}
                    <span>{agent.model}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {agent.status === 'active' && (
                      <button
                        onClick={() => handleAgentAction(agent.id, 'pause')}
                        className="p-1 text-gray-500 hover:text-yellow-600 transition-colors"
                        title="Pause Agent"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    )}

                    {agent.status === 'inactive' && (
                      <button
                        onClick={() => handleAgentAction(agent.id, 'start')}
                        className="p-1 text-gray-500 hover:text-green-600 transition-colors"
                        title="Start Agent"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}

                    <Link
                      to={`/dashboard/agents/${agent.id}`}
                      className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                      title="View Details"
                    >
                      <BarChart className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => handleAgentAction(agent.id, 'edit')}
                      className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Edit Agent"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Last Active */}
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Last active: {formatTimeAgo(agent.lastActive)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {sortedAgents.length === 0 && (
          <div className="text-center py-12">
            <Cpu className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No agents found
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first AI agent'}
            </p>
            <Link
              to="/dashboard/agents/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Agent
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDashboard;

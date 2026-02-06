import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface WorkspaceMetrics {
  totalMembers: number;
  activeMembers: number;
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  totalAgents: number;
  activeAgents: number;
  messagesThisWeek: number;
  messagesLastWeek: number;
  storageUsed: number;
  storageLimit: number;
}

interface ActivityData {
  date: string;
  messages: number;
  tasksCompleted: number;
  agentInteractions: number;
}

interface ProjectStatus {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'on-hold';
  progress: number;
  members: number;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
}

export default function WorkspaceAnalytics() {
  const [metrics, setMetrics] = useState<WorkspaceMetrics | null>(null);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [projects, setProjects] = useState<ProjectStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  // Mock data - replace with API call
  useEffect(() => {
    setTimeout(() => {
      setMetrics({
        totalMembers: 24,
        activeMembers: 18,
        totalProjects: 8,
        activeProjects: 5,
        totalTasks: 156,
        completedTasks: 89,
        totalAgents: 12,
        activeAgents: 8,
        messagesThisWeek: 1247,
        messagesLastWeek: 1089,
        storageUsed: 12.4,
        storageLimit: 50,
      });

      setActivityData([
        { date: '2024-01-10', messages: 145, tasksCompleted: 12, agentInteractions: 89 },
        { date: '2024-01-11', messages: 167, tasksCompleted: 8, agentInteractions: 102 },
        { date: '2024-01-12', messages: 198, tasksCompleted: 15, agentInteractions: 134 },
        { date: '2024-01-13', messages: 234, tasksCompleted: 18, agentInteractions: 156 },
        { date: '2024-01-14', messages: 189, tasksCompleted: 22, agentInteractions: 178 },
        { date: '2024-01-15', messages: 156, tasksCompleted: 9, agentInteractions: 145 },
        { date: '2024-01-16', messages: 178, tasksCompleted: 14, agentInteractions: 167 },
      ]);

      setProjects([
        {
          id: '1',
          name: 'Customer Portal Redesign',
          status: 'active',
          progress: 75,
          members: 6,
          dueDate: '2024-02-15',
          priority: 'high',
        },
        {
          id: '2',
          name: 'AI Agent Integration',
          status: 'active',
          progress: 45,
          members: 4,
          dueDate: '2024-02-28',
          priority: 'high',
        },
        {
          id: '3',
          name: 'Mobile App Development',
          status: 'active',
          progress: 20,
          members: 8,
          dueDate: '2024-03-30',
          priority: 'medium',
        },
        {
          id: '4',
          name: 'Security Audit',
          status: 'completed',
          progress: 100,
          members: 3,
          dueDate: '2024-01-15',
          priority: 'high',
        },
        {
          id: '5',
          name: 'Documentation Update',
          status: 'on-hold',
          progress: 60,
          members: 2,
          dueDate: '2024-02-10',
          priority: 'low',
        },
      ]);

      setLoading(false);
    }, 1000);
  }, [timeRange]);

  const getStatusBadge = (status: ProjectStatus['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityBadge = (priority: ProjectStatus['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Workspace Analytics</h1>
            <p className="text-gray-600">Insights and metrics for your workspace performance</p>
          </div>
          <div className="flex space-x-3">
            <Link
              to="/workspace/overview"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Back to Overview
            </Link>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{metrics.activeMembers}</p>
                <p className="text-sm text-gray-600">Active Members</p>
                <p className="text-xs text-gray-500">of {metrics.totalMembers} total</p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{metrics.activeProjects}</p>
                <p className="text-sm text-gray-600">Active Projects</p>
                <p className="text-xs text-gray-500">of {metrics.totalProjects} total</p>
              </div>
              <div className="text-3xl">🚀</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{metrics.completedTasks}</p>
                <p className="text-sm text-gray-600">Tasks Completed</p>
                <p className="text-xs text-gray-500">of {metrics.totalTasks} total</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{metrics.activeAgents}</p>
                <p className="text-sm text-gray-600">Active Agents</p>
                <p className="text-xs text-gray-500">of {metrics.totalAgents} total</p>
              </div>
              <div className="text-3xl">🤖</div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Messages & Growth */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Communication Activity</h2>
          {metrics && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-lg font-bold text-blue-900">
                    {metrics.messagesThisWeek.toLocaleString()}
                  </p>
                  <p className="text-sm text-blue-700">Messages This Week</p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-medium ${
                      parseFloat(
                        calculateGrowth(metrics.messagesThisWeek, metrics.messagesLastWeek)
                      ) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {parseFloat(
                      calculateGrowth(metrics.messagesThisWeek, metrics.messagesLastWeek)
                    ) >= 0
                      ? '+'
                      : ''}
                    {calculateGrowth(metrics.messagesThisWeek, metrics.messagesLastWeek)}%
                  </p>
                  <p className="text-xs text-gray-500">vs last week</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-900">
                    {metrics.messagesLastWeek.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Last Week</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-900">
                    {Math.round(metrics.messagesThisWeek / 7)}
                  </p>
                  <p className="text-sm text-gray-600">Daily Average</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Storage Usage */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Storage Usage</h2>
          {metrics && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Used Storage</span>
                <span className="text-sm font-medium">
                  {metrics.storageUsed} GB of {metrics.storageLimit} GB
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(metrics.storageUsed / metrics.storageLimit) * 100}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-900">78%</p>
                  <p className="text-sm text-gray-600">Files</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-900">15%</p>
                  <p className="text-sm text-gray-600">Messages</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-900">7%</p>
                  <p className="text-sm text-gray-600">Other</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Activity Chart Simulation */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Activity Overview</h2>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {activityData.map((day, index) => (
            <div key={index} className="text-center">
              <div className="text-xs text-gray-500 mb-1">
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="space-y-1">
                <div
                  className="bg-blue-500 rounded mx-auto"
                  style={{
                    height: `${Math.max(20, (day.messages / 250) * 60)}px`,
                    width: '12px',
                  }}
                  title={`${day.messages} messages`}
                ></div>
                <div
                  className="bg-green-500 rounded mx-auto"
                  style={{
                    height: `${Math.max(20, (day.tasksCompleted / 25) * 60)}px`,
                    width: '12px',
                  }}
                  title={`${day.tasksCompleted} tasks completed`}
                ></div>
                <div
                  className="bg-purple-500 rounded mx-auto"
                  style={{
                    height: `${Math.max(20, (day.agentInteractions / 200) * 60)}px`,
                    width: '12px',
                  }}
                  title={`${day.agentInteractions} agent interactions`}
                ></div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
            <span>Messages</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span>Tasks Completed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
            <span>Agent Interactions</span>
          </div>
        </div>
      </div>

      {/* Project Status */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Project Status</h2>
          <Link to="/tasks" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All Projects →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Members
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{project.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(project.status)}`}
                    >
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityBadge(project.priority)}`}
                    >
                      {project.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{project.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {project.members}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(project.dueDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/tasks/new"
          className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors text-center"
        >
          <div className="text-3xl mb-2">📋</div>
          <div className="font-medium">Create New Task</div>
          <div className="text-sm opacity-90">Start a new project task</div>
        </Link>

        <Link
          to="/agents/new"
          className="bg-purple-600 text-white p-6 rounded-lg hover:bg-purple-700 transition-colors text-center"
        >
          <div className="text-3xl mb-2">🤖</div>
          <div className="font-medium">Deploy New Agent</div>
          <div className="text-sm opacity-90">Add AI agent to workspace</div>
        </Link>

        <Link
          to="/workspace/members"
          className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 transition-colors text-center"
        >
          <div className="text-3xl mb-2">👥</div>
          <div className="font-medium">Invite Members</div>
          <div className="text-sm opacity-90">Add team members</div>
        </Link>
      </div>
    </div>
  );
}

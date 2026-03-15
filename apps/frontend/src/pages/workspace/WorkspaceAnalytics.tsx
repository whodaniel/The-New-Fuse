import React, { useEffect, useMemo, useState } from 'react';
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

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export default function WorkspaceAnalytics() {
  const [metrics, setMetrics] = useState<WorkspaceMetrics | null>(null);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [projects, setProjects] = useState<ProjectStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [workspacesRes, agentsRes, tasksRes, roomsRes] = await Promise.all([
          fetch('/api/workspaces', { headers: getAuthHeaders(), credentials: 'include' }),
          fetch('/api/agents', { headers: getAuthHeaders(), credentials: 'include' }),
          fetch('/api/unified-ledger/tasks', { headers: getAuthHeaders(), credentials: 'include' }),
          fetch('/api/chat/rooms', { headers: getAuthHeaders(), credentials: 'include' }),
        ]);

        if (!workspacesRes.ok) {
          throw new Error(`Workspace analytics unavailable (${workspacesRes.status})`);
        }

        const workspaces = await workspacesRes.json();
        const current = Array.isArray(workspaces) && workspaces.length > 0 ? workspaces[0] : null;

        const [membersRes, projectsRes] = current?.id
          ? await Promise.all([
              fetch(`/api/workspaces/${current.id}/members`, {
                headers: getAuthHeaders(),
                credentials: 'include',
              }),
              fetch(`/api/workspaces/${current.id}/projects`, {
                headers: getAuthHeaders(),
                credentials: 'include',
              }),
            ])
          : [null, null];

        const members = membersRes?.ok ? await membersRes.json() : [];
        const projectsRaw = projectsRes?.ok ? await projectsRes.json() : [];
        const agentsRaw = agentsRes.ok ? await agentsRes.json() : [];
        const agents = Array.isArray(agentsRaw)
          ? agentsRaw
          : Array.isArray(agentsRaw?.data)
            ? agentsRaw.data
            : [];

        const tasksRaw = tasksRes.ok ? await tasksRes.json() : [];
        const tasks = Array.isArray(tasksRaw)
          ? tasksRaw
          : Array.isArray(tasksRaw?.items)
            ? tasksRaw.items
            : Array.isArray(tasksRaw?.records)
              ? tasksRaw.records
              : [];

        const rooms = roomsRes.ok ? await roomsRes.json() : [];
        const firstRoom = Array.isArray(rooms) && rooms.length > 0 ? rooms[0] : null;
        const messagesRes = firstRoom?.id
          ? await fetch(
              `/api/chat/rooms/${encodeURIComponent(firstRoom.id)}/messages?limit=300&offset=0`,
              { headers: getAuthHeaders(), credentials: 'include' }
            )
          : null;
        const messagesPayload = messagesRes?.ok ? await messagesRes.json() : { messages: [] };
        const messages = Array.isArray(messagesPayload?.messages)
          ? messagesPayload.messages
          : Array.isArray(messagesPayload)
            ? messagesPayload
            : [];

        const now = Date.now();
        const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
        const thisWeekStart = now - oneWeekMs;
        const lastWeekStart = now - oneWeekMs * 2;

        const messagesThisWeek = messages.filter((message: any) => {
          const ts = new Date(message?.createdAt || message?.timestamp || 0).getTime();
          return ts >= thisWeekStart && ts <= now;
        }).length;
        const messagesLastWeek = messages.filter((message: any) => {
          const ts = new Date(message?.createdAt || message?.timestamp || 0).getTime();
          return ts >= lastWeekStart && ts < thisWeekStart;
        }).length;

        const mappedProjects: ProjectStatus[] = (Array.isArray(projectsRaw) ? projectsRaw : []).map(
          (project: any) => {
            const statusText = String(project?.status || 'active').toLowerCase();
            const status: ProjectStatus['status'] =
              statusText === 'completed'
                ? 'completed'
                : statusText === 'on-hold' || statusText === 'paused'
                  ? 'on-hold'
                  : 'active';

            return {
              id: String(project?.id || ''),
              name: String(project?.name || 'Unnamed Project'),
              status,
              progress: Number(project?.progress || 0),
              members: Number(project?.membersCount || project?.members?.length || 0),
              dueDate: String(project?.dueDate || ''),
              priority:
                String(project?.priority || 'medium').toLowerCase() === 'high'
                  ? 'high'
                  : String(project?.priority || 'medium').toLowerCase() === 'low'
                    ? 'low'
                    : 'medium',
            };
          }
        );

        const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 7;
        const buckets: Record<string, number> = {};
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(now - i * 24 * 60 * 60 * 1000);
          const key = date.toISOString().slice(0, 10);
          buckets[key] = 0;
        }
        for (const message of messages) {
          const key = new Date(message?.createdAt || message?.timestamp || 0)
            .toISOString()
            .slice(0, 10);
          if (key in buckets) buckets[key] += 1;
        }
        const activity = Object.entries(buckets).map(([date, count]) => ({
          date,
          messages: count,
        }));

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((task: any) => {
          const status = String(task?.status || '').toLowerCase();
          return status === 'done' || status === 'completed';
        }).length;

        setMetrics({
          totalMembers: Array.isArray(members) ? members.length : 0,
          activeMembers: Array.isArray(members) ? members.length : 0,
          totalProjects: mappedProjects.length,
          activeProjects: mappedProjects.filter((project) => project.status === 'active').length,
          totalTasks,
          completedTasks,
          totalAgents: agents.length,
          activeAgents: agents.filter(
            (agent: any) => String(agent?.status).toLowerCase() === 'active'
          ).length,
          messagesThisWeek,
          messagesLastWeek,
          storageUsed: 0,
          storageLimit: 0,
        });
        setProjects(mappedProjects);
        setActivityData(activity);
      } catch (error: any) {
        setMetrics(null);
        setProjects([]);
        setActivityData([]);
        setLoadError(error?.message || 'Failed to load workspace analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const messageGrowth = useMemo(() => {
    if (!metrics || metrics.messagesLastWeek === 0) return '0.0';
    return (
      ((metrics.messagesThisWeek - metrics.messagesLastWeek) / metrics.messagesLastWeek) *
      100
    ).toFixed(1);
  }, [metrics]);

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

  if (loading) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Workspace Analytics</h1>
            <p className="text-muted-foreground">Live workspace metrics and project status</p>
          </div>
          <div className="flex space-x-3">
            <Link
              to="/workspace/overview"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Back to Overview
            </Link>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="mb-6 rounded-md border border-amber-300 bg-amber-100/80 px-4 py-2 text-sm text-amber-900">
          {loadError}
        </div>
      )}

      {metrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Metric
              label="Active Members"
              value={metrics.activeMembers}
              sub={`of ${metrics.totalMembers}`}
            />
            <Metric
              label="Active Projects"
              value={metrics.activeProjects}
              sub={`of ${metrics.totalProjects}`}
            />
            <Metric
              label="Tasks Completed"
              value={metrics.completedTasks}
              sub={`of ${metrics.totalTasks}`}
            />
            <Metric
              label="Active Agents"
              value={metrics.activeAgents}
              sub={`of ${metrics.totalAgents}`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            <div className="bg-transparent rounded-md shadow-none p-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Communication Activity</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-md">
                  <div>
                    <p className="text-lg font-bold text-blue-900">
                      {metrics.messagesThisWeek.toLocaleString()}
                    </p>
                    <p className="text-sm text-blue-700">Messages This Week</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-medium ${parseFloat(messageGrowth) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {parseFloat(messageGrowth) >= 0 ? '+' : ''}
                      {messageGrowth}%
                    </p>
                    <p className="text-xs text-muted-foreground">vs last week</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-transparent rounded-md shadow-none p-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Storage Usage</h2>
              <p className="text-sm text-muted-foreground">
                Storage instrumentation is not currently exposed by backend endpoints.
              </p>
            </div>
          </div>

          <div className="bg-transparent rounded-md shadow-none p-4 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Message Activity</h2>
            {activityData.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No activity data is currently available.
              </p>
            )}
            {activityData.length > 0 && (
              <div className="grid grid-cols-7 gap-2">
                {activityData.slice(-7).map((day) => (
                  <div key={day.date} className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div
                      className="bg-blue-500 rounded mx-auto"
                      style={{ height: `${Math.max(12, day.messages * 4)}px`, width: '12px' }}
                      title={`${day.messages} messages`}
                    ></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-transparent rounded-md shadow-none p-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Project Status</h2>
              <Link to="/tasks" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All Projects
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-transparent border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Members
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Due Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-transparent divide-y divide-border/50">
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-muted/20">
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {project.name}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(project.status)}`}
                        >
                          {project.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityBadge(project.priority)}`}
                        >
                          {project.priority}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground">
                        {project.progress}%
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {project.members}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground">
                        {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'n/a'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {projects.length === 0 && (
                <p className="mt-4 text-sm text-muted-foreground">
                  No workspace projects are currently available.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const Metric: React.FC<{ label: string; value: number; sub: string }> = ({ label, value, sub }) => (
  <div className="bg-transparent rounded-md shadow-none p-4">
    <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-xs text-muted-foreground">{sub}</p>
  </div>
);

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { GlassCard, PremiumButton } from '@/components/ui/premium';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle,
  ClipboardList,
  Clock,
  Filter,
  MoreVertical,
  Search,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ... (interfaces)

// ... imports ...

export default function TasksPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');

  // Mock data - replace with API call
  useEffect(() => {
    setTimeout(() => {
      setTasks([
        {
          id: '1',
          title: 'Implement user authentication system',
          description: 'Create a secure authentication system with JWT tokens and password hashing',
          status: 'in-progress',
          priority: 'high',
          assignee: 'John Doe',
          assigneeAvatar: '👤',
          dueDate: '2024-01-20T00:00:00Z',
          createdAt: '2024-01-10T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          tags: ['backend', 'security', 'authentication'],
          progress: 65,
          workspaceId: 'ws1',
          workspaceName: 'Development Team',
        },
        {
          id: '2',
          title: 'Design new landing page',
          description:
            'Create a modern, responsive landing page design with improved conversion rates',
          status: 'pending',
          priority: 'medium',
          assignee: 'Jane Smith',
          assigneeAvatar: '👩',
          dueDate: '2024-01-25T00:00:00Z',
          createdAt: '2024-01-12T00:00:00Z',
          updatedAt: '2024-01-14T00:00:00Z',
          tags: ['design', 'frontend', 'ui/ux'],
          progress: 0,
          workspaceId: 'ws2',
          workspaceName: 'Design Team',
        },
        {
          id: '3',
          title: 'Setup CI/CD pipeline',
          description: 'Configure automated testing and deployment pipeline using GitHub Actions',
          status: 'completed',
          priority: 'high',
          assignee: 'Bob Wilson',
          assigneeAvatar: '👨',
          dueDate: '2024-01-15T00:00:00Z',
          createdAt: '2024-01-05T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          tags: ['devops', 'automation', 'deployment'],
          progress: 100,
          workspaceId: 'ws1',
          workspaceName: 'Development Team',
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusBadge = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>
        );
      case 'in-progress':
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">In Progress</Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>
        );
      case 'cancelled':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityIcon = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignee.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'dueDate':
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'progress':
        return b.progress - a.progress;
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

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
        {/* ... */}
      </div>

      {/* Stats Cards */}
      {/* ... */}

      {/* Search and Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              placeholder="Search tasks..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <select
                className="h-10 pl-3 pr-8 py-2 rounded-md border border-white/10 bg-white/5 text-sm text-gray-300 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all" className="bg-gray-900">
                  All Status
                </option>
                <option value="pending" className="bg-gray-900">
                  Pending
                </option>
                <option value="in-progress" className="bg-gray-900">
                  In Progress
                </option>
                <option value="completed" className="bg-gray-900">
                  Completed
                </option>
                <option value="cancelled" className="bg-gray-900">
                  Cancelled
                </option>
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-3 w-3 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                className="h-10 pl-3 pr-8 py-2 rounded-md border border-white/10 bg-white/5 text-sm text-gray-300 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all" className="bg-gray-900">
                  All Priority
                </option>
                <option value="urgent" className="bg-gray-900">
                  Urgent
                </option>
                <option value="high" className="bg-gray-900">
                  High
                </option>
                <option value="medium" className="bg-gray-900">
                  Medium
                </option>
                <option value="low" className="bg-gray-900">
                  Low
                </option>
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-3 w-3 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                className="h-10 pl-3 pr-8 py-2 rounded-md border border-white/10 bg-white/5 text-sm text-gray-300 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="dueDate" className="bg-gray-900">
                  Due Date
                </option>
                <option value="priority" className="bg-gray-900">
                  Priority
                </option>
                <option value="progress" className="bg-gray-900">
                  Progress
                </option>
                <option value="title" className="bg-gray-900">
                  Title
                </option>
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-3 w-3 pointer-events-none" />
            </div>

            <div className="bg-white/5 rounded-lg p-1 flex border border-white/10">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded transition-colors text-sm ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1 rounded transition-colors text-sm ${viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Kanban
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Task List/Grid */}
      {viewMode === 'list' ? (
        <GlassCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Assignee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedTasks.map((task, index) => (
                  <motion.tr
                    key={task.id}
                    className="hover:bg-white/5 transition-colors group"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">{task.title}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {task.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(task.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap flex items-center gap-2">
                      {getPriorityIcon(task.priority)}
                      <span className="text-sm text-gray-300 capitalize">{task.priority}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">{task.assigneeAvatar}</span>
                        <span className="text-sm text-gray-300">{task.assignee}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-white/10 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{task.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button className="text-gray-500 hover:text-white transition-colors p-1 rounded hover:bg-white/10">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 overflow-x-auto pb-4 h-full">
          {(['pending', 'in-progress', 'completed', 'cancelled'] as const).map((status) => {
            const statusTasks = sortedTasks.filter((t) => t.status === status);
            return (
              <div key={status} className="flex flex-col gap-4 min-w-[280px]">
                <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                  <h3 className="text-sm font-bold capitalize text-gray-200">
                    {status.replace('-', ' ')}
                  </h3>
                  <Badge variant="outline" className="bg-black/20 border-white/10 text-xs">
                    {statusTasks.length}
                  </Badge>
                </div>
                <div className="flex flex-col gap-3 h-full">
                  <AnimatePresence>
                    {statusTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <GlassCard
                          className="p-4 hover:border-blue-500/50 transition-colors cursor-pointer group hover:bg-white/10"
                          onClick={() => navigate(`/tasks/${task.id}`)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            {getPriorityIcon(task.priority)}
                            <button className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                          <h4 className="text-sm font-semibold text-white mb-1 line-clamp-2">
                            {task.title}
                          </h4>
                          <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                            {task.description}
                          </p>

                          <div className="flex items-center justify-between mt-auto">
                            <div className="flex items-center -space-x-2">
                              <div
                                className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs border border-gray-800"
                                title={task.assignee}
                              >
                                {task.assigneeAvatar}
                              </div>
                            </div>
                            {task.dueDate && (
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(task.dueDate).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </div>
                            )}
                          </div>

                          <div className="mt-3">
                            <div className="w-full bg-white/10 rounded-full h-1">
                              <div
                                className={`h-1 rounded-full ${task.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>
                        </GlassCard>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {statusTasks.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-white/5 rounded-lg">
                      <p className="text-xs text-gray-600">No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {sortedTasks.length === 0 && (
        <GlassCard className="text-center py-16">
          <ClipboardList className="mx-auto h-16 w-16 text-gray-600 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No tasks found</h3>
          <p className="text-gray-400 mb-6">Create a task to get started.</p>
          <PremiumButton variant="gradient" glow onClick={() => navigate('/tasks/new')}>
            Create Task
          </PremiumButton>
        </GlassCard>
      )}
    </div>
  );
}

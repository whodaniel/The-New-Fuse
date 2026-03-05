// @ts-nocheck
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import { Badge } from '@/components/ui/badge';
import {
  GlassCard,
  IconButton,
  PremiumButton,
  PremiumInput,
  PremiumSelect,
} from '@/components/ui/premium';
import { listTasks } from '@/services/unifiedLedgerApi';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle,
  ClipboardList,
  Clock,
  LayoutGrid,
  List,
  MoreVertical,
  Search,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  assignee: string;
  assigneeAvatar: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  progress: number;
  workspaceId: string;
  workspaceName: string;
}

export default function TasksPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');

  useEffect(() => {
    const load = async () => {
      try {
        const records = await listTasks();
        const mapped: Task[] = records.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          status:
            r.status === 'in_progress'
              ? 'in-progress'
              : r.status === 'completed'
                ? 'completed'
                : r.status === 'rejected' || r.status === 'failed'
                  ? 'cancelled'
                  : 'pending',
          priority: r.priority === 'critical' || r.priority === 'urgent' ? 'urgent' : r.priority,
          assignee: r.assignee || r.owner || 'Unassigned',
          assigneeAvatar: '🤖',
          dueDate: r.updatedAt,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          tags: r.tags || [],
          progress: r.fractal?.progressPercent || 0,
          workspaceId: 'tnf',
          workspaceName: 'Unified Ledger',
        }));
        setTasks(mapped);
      } catch (error) {
        console.error('Failed to load tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
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

  const completedCount = tasks.filter((task) => task.status === 'completed').length;
  const inProgressCount = tasks.filter((task) => task.status === 'in-progress').length;
  const urgentCount = tasks.filter((task) => task.priority === 'urgent').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <OpsPageHeader
        eyebrow="Execution"
        title="Task Operations"
        subtitle="Track delivery, unblock bottlenecks, and keep execution moving."
        meta={
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/20">
              {tasks.length} total
            </Badge>
            <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20">
              {urgentCount} urgent
            </Badge>
            <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20">
              {inProgressCount} in progress
            </Badge>
          </div>
        }
        actions={
          <PremiumButton variant="gradient" glow onClick={() => navigate('/tasks/new')}>
            Create Task
          </PremiumButton>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Completed</p>
          <p className="text-2xl font-bold text-white mt-1">{completedCount}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Open Work</p>
          <p className="text-2xl font-bold text-white mt-1">{tasks.length - completedCount}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Visible Results</p>
          <p className="text-2xl font-bold text-white mt-1">{sortedTasks.length}</p>
        </GlassCard>
      </div>

      {/* Search and Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <PremiumInput
              placeholder="Search tasks..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
              iconPosition="left"
            />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <div className="min-w-[140px]">
              <PremiumSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'in-progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
              />
            </div>

            <div className="min-w-[140px]">
              <PremiumSelect
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Priority' },
                  { value: 'urgent', label: 'Urgent' },
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' },
                ]}
              />
            </div>

            <div className="min-w-[140px]">
              <PremiumSelect
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: 'dueDate', label: 'Due Date' },
                  { value: 'priority', label: 'Priority' },
                  { value: 'progress', label: 'Progress' },
                  { value: 'title', label: 'Title' },
                ]}
              />
            </div>

            <div className="bg-white/5 rounded-lg p-1 flex border border-white/10 h-12 items-center">
              <IconButton
                icon={List}
                onClick={() => setViewMode('list')}
                className={`w-8 h-8 rounded transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                tooltip="List View"
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="sm"
              />
              <IconButton
                icon={LayoutGrid}
                onClick={() => setViewMode('kanban')}
                className={`w-8 h-8 rounded transition-colors ${viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                tooltip="Kanban View"
                variant={viewMode === 'kanban' ? 'primary' : 'ghost'}
                size="sm"
              />
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
                      <IconButton
                        icon={MoreVertical}
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-white"
                      />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      ) : (
        <div className="flex md:grid md:grid-cols-4 gap-6 overflow-x-auto pb-4 h-[calc(100vh-280px)] snap-x snap-mandatory md:snap-none">
          {(['pending', 'in-progress', 'completed', 'cancelled'] as const).map((status) => {
            const statusTasks = sortedTasks.filter((t) => t.status === status);
            return (
              <div
                key={status}
                className="flex flex-col gap-4 min-w-[280px] snap-center md:snap-align-none"
              >
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
                            <IconButton
                              icon={MoreVertical}
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            />
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

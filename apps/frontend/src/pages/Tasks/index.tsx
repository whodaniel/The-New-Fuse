import { Badge } from '@/components/ui/badge';
import {
  GlassCard,
  PremiumButton,
  PremiumInput,
  PremiumSelect,
  StatsCard,
} from '@/components/ui/premium';
import { listTasks } from '@/services/unifiedLedgerApi';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Bot,
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  List,
  MoreVertical,
  Plus,
  Search,
  Target,
  TrendingUp,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'Completed' | 'In Progress' | 'Pending Review' | 'Not Started';
  priority: 'Critical' | 'High' | 'Medium' | 'Normal' | 'Low';
  dueDate: string;
  assignedTo: string;
  category: string;
  createdAt: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

/**
 * Tasks page component - Premium Design System
 */
const Tasks: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterAssignee, setFilterAssignee] = useState('All');

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const records = await listTasks();
        const mapped: Task[] = records.map((record) => ({
          id: record.id,
          title: record.title,
          description: record.description,
          status:
            record.status === 'completed'
              ? 'Completed'
              : record.status === 'in_progress'
                ? 'In Progress'
                : record.status === 'failed' || record.status === 'rejected'
                  ? 'Pending Review'
                  : 'Not Started',
          priority:
            record.priority === 'critical'
              ? 'Critical'
              : record.priority === 'high'
                ? 'High'
                : record.priority === 'medium'
                  ? 'Medium'
                  : 'Low',
          dueDate: record.updatedAt,
          assignedTo: record.assignee || record.owner || 'Unassigned',
          category: record.kind || 'General',
          createdAt: record.createdAt,
        }));
        setTasks(mapped);
      } catch (error) {
        console.error('Failed to load tasks:', error);
        setTasks([]);
        setLoadError('Task endpoints are unavailable');
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  // Filter tasks based on search query and filters
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'All' || task.priority === filterPriority;
    const matchesAssignee = filterAssignee === 'All' || task.assignedTo === filterAssignee;

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  // Get unique values for filters
  const taskStatuses = ['All', ...new Set(tasks.map((task) => task.status))];
  const taskPriorities = ['All', ...new Set(tasks.map((task) => task.priority))];
  const taskAssignees = ['All', ...new Set(tasks.map((task) => task.assignedTo))];

  // Get status badge with Premium styling
  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
    > = {
      Completed: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle },
      'In Progress': { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Clock },
      'Pending Review': { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: Clock },
      'Not Started': { bg: 'bg-transparent0/20', text: 'text-gray-400', icon: Clock },
    };
    const { bg, text, icon: Icon } = config[status] || config['Not Started'];
    return (
      <Badge className={`${bg} ${text} border-${text.replace('text-', '')}/30`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  // Get priority badge with Premium styling
  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      Critical: { bg: 'bg-red-500/20', text: 'text-red-400' },
      High: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
      Medium: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
      Normal: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
      Low: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    };
    const { bg, text } = config[priority] || config['Normal'];
    return (
      <Badge className={`${bg} ${text} border-${text.replace('text-', '')}/30`}>
        <AlertTriangle className="w-3 h-3 mr-1" />
        {priority}
      </Badge>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Calculate days remaining
  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="text-red-400">Overdue by {Math.abs(diffDays)} days</span>;
    } else if (diffDays === 0) {
      return <span className="text-orange-400">Due today</span>;
    } else {
      return <span className="text-gray-400">{diffDays} days remaining</span>;
    }
  };

  // Calculate stats
  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'Completed').length,
    inProgress: tasks.filter((t) => t.status === 'In Progress').length,
    critical: tasks.filter((t) => t.priority === 'Critical').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-blue-400 font-mono">LOADING TASKS...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 p-4 max-w-7xl mx-auto">
        {loadError && (
          <GlassCard className="p-4 mb-6 border border-amber-500/40 bg-amber-500/10">
            <p className="text-sm text-amber-200">{loadError}. No synthetic tasks are shown.</p>
          </GlassCard>
        )}
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-2">
                Tasks
              </h1>
              <p className="text-gray-400">Manage and track agent tasks</p>
            </div>
            <PremiumButton variant="gradient" icon={Plus} onClick={() => navigate('/tasks/new')}>
              Create Task
            </PremiumButton>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <motion.div variants={itemVariants}>
            <StatsCard
              label="Total Tasks"
              value={stats.total.toString()}
              icon={List}
              gradient="blue"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard
              label="Completed"
              value={stats.completed.toString()}
              change={`${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% complete`}
              changeType="positive"
              icon={CheckCircle}
              gradient="green"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard
              label="In Progress"
              value={stats.inProgress.toString()}
              icon={TrendingUp}
              gradient="purple"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard
              label="Critical"
              value={stats.critical.toString()}
              changeType={stats.critical > 0 ? 'negative' : 'neutral'}
              icon={Target}
              gradient="orange"
            />
          </motion.div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <GlassCard className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <PremiumInput
                  placeholder="Search tasks..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchQuery(e.target.value)
                  }
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <PremiumSelect
                    value={filterStatus}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFilterStatus(e.target.value)
                    }
                  >
                    {taskStatuses.map((status: string) => (
                      <option key={status} value={status}>
                        {status === 'All' ? 'All Status' : status}
                      </option>
                    ))}
                  </PremiumSelect>
                </div>
                <PremiumSelect
                  value={filterPriority}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFilterPriority(e.target.value)
                  }
                >
                  {taskPriorities.map((priority: string) => (
                    <option key={priority} value={priority}>
                      {priority === 'All' ? 'All Priority' : priority}
                    </option>
                  ))}
                </PremiumSelect>
                <PremiumSelect
                  value={filterAssignee}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFilterAssignee(e.target.value)
                  }
                >
                  {taskAssignees.map((assignee: string) => (
                    <option key={assignee} value={assignee}>
                      {assignee === 'All' ? 'All Agents' : assignee}
                    </option>
                  ))}
                </PremiumSelect>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Tasks List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task, index) => (
              <motion.div
                key={task.id}
                variants={itemVariants}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard className="hover:border-purple-500/30 transition-all duration-300">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-semibold text-white">{task.title}</h3>
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-transparent/10 rounded-md transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-gray-400 mb-4">{task.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                      <Badge className="bg-transparent/10 text-gray-300 border-white/10">
                        {task.category}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Assigned To</p>
                        <p className="text-white flex items-center">
                          <Bot className="w-4 h-4 mr-1 text-purple-400" />
                          {task.assignedTo}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Created</p>
                        <p className="text-white">{formatDate(task.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Due Date</p>
                        <p className="text-white flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-blue-400" />
                          {formatDate(task.dueDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Time Remaining</p>
                        <p>{getDaysRemaining(task.dueDate)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-3 py-2 border-t border-white/10 flex justify-end gap-2">
                    <PremiumButton
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    >
                      View Details
                    </PremiumButton>
                    <PremiumButton
                      variant="gradient"
                      size="sm"
                      onClick={() => navigate(`/tasks/${task.id}/edit`)}
                    >
                      Edit Task
                    </PremiumButton>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-transparent/5 flex items-center justify-center border border-white/10">
              <Clock className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No tasks found</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery ||
              filterStatus !== 'All' ||
              filterPriority !== 'All' ||
              filterAssignee !== 'All'
                ? 'Try adjusting your search or filters'
                : 'Create your first task to get started'}
            </p>
            <PremiumButton variant="gradient" icon={Plus} onClick={() => navigate('/tasks/new')}>
              Create Task
            </PremiumButton>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Tasks;

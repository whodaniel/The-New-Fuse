import { Badge } from '@/components/ui/badge';
import { GlassCard, PremiumButton, StatsCard } from '@/components/ui/premium';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/useToast';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Bot,
  CheckCircle,
  Clock,
  Code,
  Edit,
  History,
  List,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Settings,
  Trash2,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

// Types
interface Task {
  id: number;
  title: string;
  status: 'Completed' | 'In Progress' | 'Pending';
  completedAt?: string;
  startedAt?: string;
  assignedAt?: string;
}

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  message: string;
}

interface AgentDetails {
  id: number;
  name: string;
  description: string;
  type: string;
  status: 'Active' | 'Inactive' | 'Maintenance';
  lastActive: string;
  tasks: number;
  successRate: string;
  icon: React.ElementType;
  createdAt: string;
  createdBy: string;
  capabilities: string[];
  configuration: {
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
  };
  recentTasks: Task[];
  logs: LogEntry[];
}

// Mock data for agent details
const mockAgentDetails: AgentDetails = {
  id: 1,
  name: 'CodeAssistant',
  description: 'Helps with coding tasks and code reviews',
  type: 'Development',
  status: 'Active',
  lastActive: '2 minutes ago',
  tasks: 42,
  successRate: '98%',
  icon: Code,
  createdAt: '2023-04-15',
  createdBy: 'John Doe',
  capabilities: ['Code generation', 'Code review', 'Bug fixing', 'Documentation', 'Refactoring'],
  configuration: {
    model: 'GPT-4',
    temperature: 0.7,
    maxTokens: 4096,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
  },
  recentTasks: [
    { id: 1, title: 'Implement new API endpoint', status: 'Completed', completedAt: '2023-06-10' },
    { id: 2, title: 'Fix authentication bug', status: 'In Progress', startedAt: '2023-06-12' },
    { id: 3, title: 'Optimize database queries', status: 'Pending', assignedAt: '2023-06-11' },
  ],
  logs: [
    {
      timestamp: '2023-06-12T14:30:00Z',
      level: 'INFO',
      message: 'Agent started task #2: Fix authentication bug',
    },
    { timestamp: '2023-06-12T14:35:22Z', level: 'INFO', message: 'Analyzing authentication flow' },
    {
      timestamp: '2023-06-12T14:40:15Z',
      level: 'WARNING',
      message: 'Detected potential security issue in token validation',
    },
    {
      timestamp: '2023-06-12T14:45:30Z',
      level: 'INFO',
      message: 'Implementing fix for token validation',
    },
  ],
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
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
 * Agent Detail page component - Premium Design System
 */
const AgentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  // In a real app, we would fetch the agent details based on the ID
  const agent = mockAgentDetails;
  const AgentIcon = agent.icon;

  // Get status badge with Premium styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      case 'Inactive':
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
            <Clock className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      case 'Maintenance':
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            <AlertCircle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get task status badge
  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            {status}
          </Badge>
        );
      case 'In Progress':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{status}</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">{status}</Badge>;
    }
  };

  // Get log level badge
  const getLogLevelBadge = (level: string) => {
    switch (level) {
      case 'INFO':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{level}</Badge>;
      case 'WARNING':
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">{level}</Badge>
        );
      case 'ERROR':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">{level}</Badge>;
      case 'DEBUG':
        return (
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">{level}</Badge>
        );
      default:
        return <Badge>{level}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };

  // Handle agent actions
  const handleToggleAgent = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: agent.status === 'Active' ? 'Agent Paused' : 'Agent Activated',
        description: `${agent.name} has been ${agent.status === 'Active' ? 'paused' : 'activated'}.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: 'Agent Restarted',
        description: `${agent.name} has been restarted successfully.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${agent.name}?`)) {
      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        toast({
          title: 'Agent Deleted',
          description: `${agent.name} has been deleted.`,
          variant: 'destructive',
        });
        navigate('/agents');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 p-6 max-w-6xl mx-auto">
        {/* Back Button & Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <Link
            to="/agents"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Agents
          </Link>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center border border-white/10">
                <AgentIcon className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-bold text-white">{agent.name}</h1>
                  {getStatusBadge(agent.status)}
                </div>
                <p className="text-gray-400">{agent.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <PremiumButton
                variant="glass"
                size="sm"
                onClick={handleToggleAgent}
                disabled={isLoading}
                icon={agent.status === 'Active' ? Pause : Play}
              >
                {agent.status === 'Active' ? 'Pause' : 'Activate'}
              </PremiumButton>
              <PremiumButton
                variant="glass"
                size="sm"
                onClick={handleRestart}
                disabled={isLoading}
                icon={RefreshCw}
              >
                Restart
              </PremiumButton>
              <PremiumButton
                variant="glass"
                size="sm"
                onClick={() => navigate(`/agents/${id}/edit`)}
                icon={Edit}
              >
                Edit
              </PremiumButton>
              <PremiumButton
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isLoading}
                icon={Trash2}
                className="text-red-400 hover:text-red-300"
              >
                Delete
              </PremiumButton>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          <motion.div variants={itemVariants}>
            <StatsCard
              label="Status"
              value={agent.status}
              change={`Last active: ${agent.lastActive}`}
              changeType={agent.status === 'Active' ? 'positive' : 'neutral'}
              icon={Activity}
              gradient="green"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard
              label="Tasks Completed"
              value={agent.tasks.toString()}
              change={`Success rate: ${agent.successRate}`}
              changeType="positive"
              icon={Zap}
              gradient="blue"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard
              label="Created"
              value={formatDate(agent.createdAt)}
              change={`By: ${agent.createdBy}`}
              changeType="neutral"
              icon={History}
              gradient="purple"
            />
          </motion.div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <TabsList className="bg-white/5 backdrop-blur-md border border-white/10 p-1 rounded-xl">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg px-4 py-2 text-gray-400 transition-all"
              >
                <Bot className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="tasks"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg px-4 py-2 text-gray-400 transition-all"
              >
                <List className="w-4 h-4 mr-2" />
                Tasks
              </TabsTrigger>
              <TabsTrigger
                value="logs"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg px-4 py-2 text-gray-400 transition-all"
              >
                <Activity className="w-4 h-4 mr-2" />
                Logs
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg px-4 py-2 text-gray-400 transition-all"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>
          </motion.div>

          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <GlassCard
                  icon={Bot}
                  title="Agent Capabilities"
                  subtitle="Features and skills available"
                  gradient="purple"
                >
                  <div className="p-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {agent.capabilities.map((capability: string, index: number) => (
                        <Badge
                          key={index}
                          className="bg-purple-500/20 text-purple-400 border-purple-500/30"
                        >
                          {capability}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-gray-400">
                      This agent is designed to assist with various coding tasks, including code
                      generation, code review, bug fixing, documentation, and refactoring. It uses
                      advanced AI models to understand code context and provide helpful suggestions.
                    </p>
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.1 }}
              >
                <GlassCard
                  icon={Activity}
                  title="Recent Activity"
                  subtitle="Latest tasks and progress"
                  gradient="blue"
                >
                  <div className="p-4 space-y-3">
                    {agent.recentTasks.map((task: Task) => (
                      <motion.div
                        key={task.id}
                        whileHover={{ scale: 1.01 }}
                        className="flex justify-between items-center p-4 bg-black/20 rounded-xl border border-white/5"
                      >
                        <div>
                          <div className="font-medium text-white">{task.title}</div>
                          <div className="text-sm text-gray-400">
                            {task.status === 'Completed'
                              ? `Completed on ${task.completedAt}`
                              : task.status === 'In Progress'
                                ? `Started on ${task.startedAt}`
                                : `Assigned on ${task.assignedAt}`}
                          </div>
                        </div>
                        {getTaskStatusBadge(task.status)}
                      </motion.div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <GlassCard
                  icon={List}
                  title="Task History"
                  subtitle="All assigned tasks"
                  gradient="green"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-gray-400">
                        Detailed task history including all tasks assigned to this agent.
                      </p>
                      <PremiumButton variant="glass" size="sm" icon={List}>
                        View All Tasks
                      </PremiumButton>
                    </div>
                    <div className="space-y-3">
                      {agent.recentTasks.map((task: Task) => (
                        <div
                          key={task.id}
                          className="flex justify-between items-center p-4 bg-black/20 rounded-xl border border-white/5"
                        >
                          <div>
                            <div className="font-medium text-white">{task.title}</div>
                            <div className="text-sm text-gray-400">
                              {task.status === 'Completed'
                                ? `Completed on ${task.completedAt}`
                                : task.status === 'In Progress'
                                  ? `Started on ${task.startedAt}`
                                  : `Assigned on ${task.assignedAt}`}
                            </div>
                          </div>
                          {getTaskStatusBadge(task.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <GlassCard
                  icon={Activity}
                  title="Agent Logs"
                  subtitle="Activity and system logs"
                  gradient="orange"
                >
                  <div className="p-4">
                    <div className="flex justify-end mb-4">
                      <PremiumButton variant="glass" size="sm" icon={RefreshCw}>
                        Refresh Logs
                      </PremiumButton>
                    </div>
                    <div className="space-y-2">
                      {agent.logs.map((log: LogEntry, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-start gap-4 p-3 bg-black/20 rounded-lg border-b border-white/5 last:border-0"
                        >
                          <div className="w-32 shrink-0 text-xs text-gray-500">
                            {formatTimestamp(log.timestamp)}
                          </div>
                          <div className="w-20 shrink-0">{getLogLevelBadge(log.level)}</div>
                          <div className="flex-1 text-sm text-gray-300">{log.message}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <GlassCard
                  icon={Settings}
                  title="Agent Configuration"
                  subtitle="Model and behavior settings"
                  gradient="cyan"
                >
                  <div className="p-4 space-y-3">
                    {Object.entries(agent.configuration).map(
                      ([key, value]: [string, string | number]) => (
                        <div
                          key={key}
                          className="flex justify-between items-center p-4 bg-black/20 rounded-xl border border-white/5"
                        >
                          <div className="font-medium text-gray-300 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          <div className="text-white font-mono">{value}</div>
                        </div>
                      )
                    )}
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.1 }}
              >
                <GlassCard
                  icon={Settings}
                  title="Advanced Settings"
                  subtitle="API keys, integrations, and permissions"
                  gradient="purple"
                >
                  <div className="p-4">
                    <p className="text-gray-400 mb-4">
                      Advanced settings including API keys, integration settings, permissions, and
                      other configuration options.
                    </p>
                    <PremiumButton
                      variant="glass"
                      icon={Settings}
                      onClick={() => navigate(`/agents/${id}/edit`)}
                    >
                      Edit Configuration
                    </PremiumButton>
                  </div>
                </GlassCard>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-12 h-12 text-purple-500" />
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDetail;

import { Badge } from '@/components/ui/badge';
import {
  GlassCard,
  PremiumButton,
  PremiumInput,
  PremiumSelect,
  StatsCard,
} from '@/components/ui/premium';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Bot,
  Brain,
  Clock,
  Edit3,
  Eye,
  Grid3X3,
  LayoutList,
  MessageSquare,
  Play,
  Plus,
  Rocket,
  Search,
  Settings2,
  Sparkles,
  Square,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface Agent {
  id: string;
  name: string;
  description: string;
  type: 'chat' | 'task' | 'analysis' | 'automation';
  status: 'active' | 'inactive' | 'training' | 'error';
  model: string;
  capabilities: string[];
  createdAt: string;
  lastActive: string;
  messagesCount: number;
  successRate: number;
  avgResponseTime: number;
  version: string;
  workspaceId: string;
  workspaceName: string;
  owner: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export default function AgentsPage() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('lastActive');

  // Fetch agents from real API
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const { agentService } = await import('@/services/AgentService');
        const fetchedAgents = await agentService.getAgents();

        // Transform API data to match our interface
        const transformedAgents: Agent[] = fetchedAgents.map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description || 'No description available',
          type: mapAgentType(a.type),
          status: mapAgentStatus(a.status),
          model: a.model || 'GPT-4',
          capabilities: a.capabilities || [],
          createdAt: a.createdAt || new Date().toISOString(),
          lastActive: a.updatedAt || new Date().toISOString(),
          messagesCount: a.metadata?.messagesCount || 0,
          successRate: a.metadata?.successRate || 95.0,
          avgResponseTime: a.metadata?.avgResponseTime || 1.5,
          version: a.metadata?.version || '1.0.0',
          workspaceId: a.metadata?.workspaceId || 'default',
          workspaceName: a.metadata?.workspaceName || 'Default Workspace',
          owner: a.metadata?.owner || 'System',
        }));

        setAgents(transformedAgents);
      } catch (error) {
        console.error('Error fetching agents:', error);
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  // Map API agent type to UI type
  const mapAgentType = (type: string): Agent['type'] => {
    const typeMap: Record<string, Agent['type']> = {
      CHAT: 'chat',
      TASK: 'task',
      ANALYSIS: 'analysis',
      WORKFLOW: 'automation',
      ASSISTANT: 'chat',
      BASIC: 'task',
      CONVERSATIONAL: 'chat',
      IDE_EXTENSION: 'task',
      API: 'automation',
    };
    return typeMap[type] || 'task';
  };

  // Map API agent status to UI status
  const mapAgentStatus = (status: string): Agent['status'] => {
    const statusMap: Record<string, Agent['status']> = {
      ACTIVE: 'active',
      active: 'active',
      INACTIVE: 'inactive',
      inactive: 'inactive',
      IDLE: 'inactive',
      idle: 'inactive',
      INITIALIZING: 'training',
      initializing: 'training',
      READY: 'active',
      ready: 'active',
      ERROR: 'error',
      error: 'error',
      BUSY: 'active',
      busy: 'active',
      OFFLINE: 'inactive',
      offline: 'inactive',
      TERMINATED: 'inactive',
      terminated: 'inactive',
    };
    return statusMap[status] || 'inactive';
  };

  const getStatusConfig = (status: Agent['status']) => {
    switch (status) {
      case 'active':
        return {
          bgClass: 'bg-emerald-500/10',
          textClass: 'text-emerald-400',
          borderClass: 'border-emerald-500/20',
          icon: Activity,
          label: 'Active',
        };
      case 'inactive':
        return {
          bgClass: 'bg-slate-500/10',
          textClass: 'text-slate-400',
          borderClass: 'border-slate-500/20',
          icon: Square,
          label: 'Inactive',
        };
      case 'training':
        return {
          bgClass: 'bg-blue-500/10',
          textClass: 'text-blue-400',
          borderClass: 'border-blue-500/20',
          icon: Sparkles,
          label: 'Training',
        };
      case 'error':
        return {
          bgClass: 'bg-red-500/10',
          textClass: 'text-red-400',
          borderClass: 'border-red-500/20',
          icon: Zap,
          label: 'Error',
        };
      default:
        return {
          bgClass: 'bg-slate-500/10',
          textClass: 'text-slate-400',
          borderClass: 'border-slate-500/20',
          icon: Square,
          label: 'Unknown',
        };
    }
  };

  const getTypeConfig = (type: Agent['type']) => {
    switch (type) {
      case 'chat':
        return {
          bgClass: 'bg-purple-500/10',
          textClass: 'text-purple-400',
          borderClass: 'border-purple-500/20',
          icon: MessageSquare,
          label: 'Chat',
        };
      case 'task':
        return {
          bgClass: 'bg-blue-500/10',
          textClass: 'text-blue-400',
          borderClass: 'border-blue-500/20',
          icon: Zap,
          label: 'Task',
        };
      case 'analysis':
        return {
          bgClass: 'bg-orange-500/10',
          textClass: 'text-orange-400',
          borderClass: 'border-orange-500/20',
          icon: BarChart3,
          label: 'Analysis',
        };
      case 'automation':
        return {
          bgClass: 'bg-cyan-500/10',
          textClass: 'text-cyan-400',
          borderClass: 'border-cyan-500/20',
          icon: Settings2,
          label: 'Automation',
        };
      default:
        return {
          bgClass: 'bg-slate-500/10',
          textClass: 'text-slate-400',
          borderClass: 'border-slate-500/20',
          icon: Bot,
          label: 'Unknown',
        };
    }
  };

  const filteredAgents = agents.filter((agent: Agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || agent.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const sortedAgents = [...filteredAgents].sort((a: Agent, b: Agent) => {
    switch (sortBy) {
      case 'lastActive':
        return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
      case 'name':
        return a.name.localeCompare(b.name);
      case 'successRate':
        return b.successRate - a.successRate;
      case 'messagesCount':
        return b.messagesCount - a.messagesCount;
      default:
        return 0;
    }
  });

  const handleAgentAction = (agentId: string, action: string) => {
    setLoading(true);

    setTimeout(() => {
      setAgents((prev: Agent[]) =>
        prev.map((agent: Agent) =>
          agent.id === agentId && action === 'start'
            ? { ...agent, status: 'active' as const }
            : agent.id === agentId && action === 'stop'
              ? { ...agent, status: 'inactive' as const }
              : agent
        )
      );

      setLoading(false);
    }, 500);
  };

  // Calculate stats
  const totalAgents = agents.length;
  const activeAgents = agents.filter((a: Agent) => a.status === 'active').length;
  const totalMessages = agents.reduce((sum: number, a: Agent) => sum + a.messagesCount, 0);
  const avgSuccessRate =
    agents.length > 0
      ? (agents.reduce((sum: number, a: Agent) => sum + a.successRate, 0) / agents.length).toFixed(
          1
        )
      : '0';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] bg-pink-600/10 rounded-full blur-[100px] animate-pulse" />
      </div>

      <div className="relative z-10 p-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-2 flex items-center gap-3">
                <Bot className="w-10 h-10 text-purple-400" />
                AI Agent Fleet
              </h1>
              <p className="text-gray-400 text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                Command and orchestrate your intelligent agents across all workspaces
              </p>
            </div>
            <div className="flex gap-3">
              <PremiumButton
                onClick={() => navigate('/agents/new')}
                icon={Plus}
                iconPosition="left"
                size="md"
              >
                Deploy Agent
              </PremiumButton>
              <PremiumButton
                variant="outline"
                onClick={() => navigate('/dashboard/agents')}
                icon={BarChart3}
                iconPosition="left"
                size="md"
              >
                Analytics
              </PremiumButton>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <motion.div variants={itemVariants}>
            <StatsCard
              label="Total Agents"
              value={totalAgents}
              change="+3 this week"
              changeType="positive"
              icon={Bot}
              gradient="blue"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard
              label="Active Agents"
              value={activeAgents}
              change="Online and operational"
              changeType="positive"
              icon={Activity}
              gradient="green"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard
              label="Total Messages"
              value={totalMessages.toLocaleString()}
              change="+15% this month"
              changeType="positive"
              icon={MessageSquare}
              gradient="purple"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard
              label="Avg Success Rate"
              value={`${avgSuccessRate}%`}
              change="Fleet performance"
              changeType="positive"
              icon={TrendingUp}
              gradient="orange"
            />
          </motion.div>
        </motion.div>

        {/* Filters and View Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <GlassCard className="mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <PremiumInput
                    placeholder="Search agents..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearchTerm(e.target.value)
                    }
                    className="pl-10 w-64"
                  />
                </div>
                <div className="flex gap-2">
                  <PremiumSelect
                    value={typeFilter}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setTypeFilter(e.target.value)
                    }
                  >
                    <option value="all">All Types</option>
                    <option value="chat">Chat</option>
                    <option value="task">Task</option>
                    <option value="analysis">Analysis</option>
                    <option value="automation">Automation</option>
                  </PremiumSelect>
                  <PremiumSelect
                    value={statusFilter}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setStatusFilter(e.target.value)
                    }
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="training">Training</option>
                    <option value="error">Error</option>
                  </PremiumSelect>
                  <PremiumSelect
                    value={sortBy}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setSortBy(e.target.value)
                    }
                  >
                    <option value="lastActive">Last Active</option>
                    <option value="name">Name</option>
                    <option value="successRate">Success Rate</option>
                    <option value="messagesCount">Messages</option>
                  </PremiumSelect>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">View:</span>
                <PremiumButton
                  variant={viewMode === 'grid' ? 'gradient' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  icon={Grid3X3}
                >
                  Grid
                </PremiumButton>
                <PremiumButton
                  variant={viewMode === 'list' ? 'gradient' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  icon={LayoutList}
                >
                  List
                </PremiumButton>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Agents Content */}
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            <motion.div
              key="grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {sortedAgents.map((agent: Agent) => {
                const statusConfig = getStatusConfig(agent.status);
                const typeConfig = getTypeConfig(agent.type);
                const TypeIcon = typeConfig.icon;
                const StatusIcon = statusConfig.icon;

                return (
                  <motion.div key={agent.id} variants={itemVariants}>
                    <GlassCard hoverEffect className="h-full">
                      <div className="p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/10">
                              <TypeIcon className={`w-6 h-6 ${typeConfig.textClass}`} />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
                              <p className="text-xs text-gray-500">v{agent.version}</p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Badge
                              className={`${statusConfig.bgClass} ${statusConfig.textClass} border ${statusConfig.borderClass}`}
                            >
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                          {agent.description}
                        </p>

                        {/* Model & Owner */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                              <Brain className="w-3 h-3" /> Model
                            </p>
                            <p className="text-sm font-medium text-white">{agent.model}</p>
                          </div>
                          <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                              <Users className="w-3 h-3" /> Owner
                            </p>
                            <p className="text-sm font-medium text-white truncate">{agent.owner}</p>
                          </div>
                        </div>

                        {/* Capabilities */}
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 mb-2">Capabilities</p>
                          <div className="flex flex-wrap gap-1">
                            {agent.capabilities
                              .slice(0, 3)
                              .map((capability: string, index: number) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-xs bg-white/5 text-gray-300 rounded-lg border border-white/10"
                                >
                                  {capability}
                                </span>
                              ))}
                            {agent.capabilities.length > 3 && (
                              <span className="px-2 py-1 text-xs bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
                                +{agent.capabilities.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="text-center bg-black/20 rounded-lg p-2 border border-white/5">
                            <p className="text-xs text-gray-500">Messages</p>
                            <p className="text-sm font-bold text-blue-400">
                              {agent.messagesCount.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-center bg-black/20 rounded-lg p-2 border border-white/5">
                            <p className="text-xs text-gray-500">Success</p>
                            <p className="text-sm font-bold text-emerald-400">
                              {agent.successRate}%
                            </p>
                          </div>
                          <div className="text-center bg-black/20 rounded-lg p-2 border border-white/5">
                            <p className="text-xs text-gray-500">Response</p>
                            <p className="text-sm font-bold text-purple-400">
                              {agent.avgResponseTime}s
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Link to={`/agents/${agent.id}`} className="flex-1">
                            <PremiumButton
                              variant="gradient"
                              size="sm"
                              className="w-full"
                              icon={Eye}
                            >
                              View Details
                            </PremiumButton>
                          </Link>
                          <PremiumButton
                            variant={agent.status === 'active' ? 'ghost' : 'glass'}
                            size="sm"
                            onClick={() =>
                              handleAgentAction(
                                agent.id,
                                agent.status === 'active' ? 'stop' : 'start'
                              )
                            }
                            icon={agent.status === 'active' ? Square : Play}
                          >
                            {agent.status === 'active' ? 'Stop' : 'Start'}
                          </PremiumButton>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GlassCard>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Agent
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Model
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Messages
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Success Rate
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Last Active
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sortedAgents.map((agent: Agent) => {
                        const statusConfig = getStatusConfig(agent.status);
                        const typeConfig = getTypeConfig(agent.type);
                        const TypeIcon = typeConfig.icon;
                        const StatusIcon = statusConfig.icon;

                        return (
                          <motion.tr
                            key={agent.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="hover:bg-white/5 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/10">
                                  <TypeIcon className={`w-5 h-5 ${typeConfig.textClass}`} />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-white">{agent.name}</div>
                                  <div className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">
                                    {agent.description}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                className={`${typeConfig.bgClass} ${typeConfig.textClass} border ${typeConfig.borderClass}`}
                              >
                                {typeConfig.label}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                className={`${statusConfig.bgClass} ${statusConfig.textClass} border ${statusConfig.borderClass}`}
                              >
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-300">{agent.model}</td>
                            <td className="px-6 py-4 text-sm text-gray-300">
                              {agent.messagesCount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-white/10 rounded-full h-2">
                                  <div
                                    className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full"
                                    style={{ width: `${agent.successRate}%` }}
                                  />
                                </div>
                                <span className="text-sm text-emerald-400">
                                  {agent.successRate}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-400 flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(agent.lastActive).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-end gap-2">
                                <Link to={`/agents/${agent.id}`}>
                                  <PremiumButton variant="ghost" size="sm" icon={Eye} />
                                </Link>
                                <PremiumButton variant="ghost" size="sm" icon={Edit3} />
                                <PremiumButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleAgentAction(
                                      agent.id,
                                      agent.status === 'active' ? 'stop' : 'start'
                                    )
                                  }
                                  icon={agent.status === 'active' ? Square : Play}
                                />
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {sortedAgents.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <GlassCard className="max-w-md mx-auto">
              <div className="p-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/10">
                  <Bot className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No agents found</h3>
                <p className="text-gray-400 mb-6">
                  Try adjusting your search or filter criteria, or deploy your first AI agent.
                </p>
                <PremiumButton onClick={() => navigate('/agents/new')} icon={Rocket}>
                  Deploy Your First Agent
                </PremiumButton>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}

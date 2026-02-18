import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
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
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GlassCard, StatsCard } from '../../components/ui/premium/GlassCard';
import { PremiumButton } from '../../components/ui/premium/PremiumButton';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

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
        setAgents([]);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      setAgents([]);
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
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500/30 font-sans"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative">
              <div className="absolute -left-4 top-0 bottom-0 w-1 bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
              <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
                Agent{' '}
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Fleet Terminal
                </span>
              </h1>
              <p className="mt-2 text-slate-400 font-medium">
                Orchestrate and manage your distributed AI intelligence mesh
              </p>
            </div>
            <PremiumButton
              onClick={() => navigate('/dashboard/agents/new')}
              variant="indigo"
              className="shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_40px_rgba(79,70,229,0.5)] transition-all duration-500 scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              Initialize New Agent
            </PremiumButton>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <StatsCard
            label="Total Agents"
            value={agents.length}
            icon={Cpu}
            gradient="blue"
            change="+1 provisioned"
            changeType="positive"
          />
          <StatsCard
            label="Active Nodes"
            value={agents.filter((a) => a.status === 'active').length}
            icon={CheckCircle}
            gradient="cyan"
            change="Online"
            changeType="positive"
          />
          <StatsCard
            label="Avg Sync Rate"
            value={`${agents.length > 0 ? Math.round(agents.reduce((sum, a) => sum + a.successRate, 0) / agents.length) : 0}%`}
            icon={Zap}
            gradient="indigo"
            change="Last 24h"
            changeType="neutral"
          />
          <StatsCard
            label="Tasks Orchestrated"
            value={agents.reduce((sum, a) => sum + a.metrics.tasksToday, 0)}
            icon={Activity}
            gradient="purple"
            change="Today"
            changeType="positive"
          />
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          variants={itemVariants}
          className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl p-6 mb-8 hover:border-white/20 transition-all group"
        >
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="relative group/search">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within/search:text-cyan-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Search agent signature or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/5 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent text-white placeholder-slate-500 transition-all font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-slate-300 focus:ring-2 focus:ring-cyan-500/50 text-sm font-bold tracking-widest uppercase appearance-none cursor-pointer"
                  title="Filter by status"
                >
                  <option value="all">Any Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="error">Critical</option>
                  <option value="training">Learning</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-slate-300 focus:ring-2 focus:ring-cyan-500/50 text-sm font-bold tracking-widest uppercase appearance-none cursor-pointer"
                  title="Filter by type"
                >
                  <option value="all">Any Type</option>
                  <option value="conversational">Sync: Conv</option>
                  <option value="task-automation">Sync: Auto</option>
                  <option value="data-analysis">Sync: Anal</option>
                  <option value="content-generation">Sync: Gen</option>
                </select>
              </div>

              <div className="h-full w-px bg-white/10 mx-2 hidden lg:block" />

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 rounded-xl border transition-all ${showFilters ? 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'}`}
                title="Advanced Controls"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Agents Grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {sortedAgents.map((agent) => (
              <motion.div
                layout
                key={agent.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <GlassCard className="h-full relative overflow-hidden group/card hover:shadow-[0_0_50px_rgba(0,0,0,0.5)] border-white/5 hover:border-cyan-500/30 p-0">
                  {/* Status Pulse Border */}
                  <div
                    className={`absolute top-0 right-0 w-32 h-32 opacity-10 blur-3xl rounded-full translate-x-16 -translate-y-16 transition-all duration-500 ${
                      agent.status === 'active'
                        ? 'bg-emerald-500 group-hover/card:opacity-30'
                        : agent.status === 'error'
                          ? 'bg-red-500'
                          : 'bg-slate-500'
                    }`}
                  />

                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-slate-900 border border-white/5 rounded-2xl group-hover/card:border-cyan-500/50 group-hover/card:bg-slate-800 transition-all duration-500">
                          {getTypeIcon(agent.type)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white group-hover/card:text-cyan-400 transition-colors">
                            {agent.name}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <div
                              className={`w-2 h-2 rounded-full ${connected ? 'animate-pulse' : ''} ${
                                agent.status === 'active'
                                  ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                                  : agent.status === 'error'
                                    ? 'bg-red-500 shadow-[0_0_8px_#ef4444]'
                                    : 'bg-slate-500'
                              }`}
                            />
                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">
                              {agent.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-500 hover:text-white">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-slate-900 border-white/10 text-white rounded-xl shadow-2xl backdrop-blur-xl"
                        >
                          <DropdownMenuItem
                            onClick={() => handleAgentAction(agent.id, 'edit')}
                            className="hover:bg-white/10 cursor-pointer p-3"
                          >
                            <Pencil className="w-4 h-4 mr-3 text-cyan-400" />
                            Signature Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleAgentAction(
                                agent.id,
                                agent.status === 'active' ? 'pause' : 'start'
                              )
                            }
                            className="hover:bg-white/10 cursor-pointer p-3"
                          >
                            {agent.status === 'active' ? (
                              <>
                                <Pause className="w-4 h-4 mr-3 text-yellow-500" />
                                Suspend Node
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-3 text-emerald-500" />
                                Engage Node
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(`/dashboard/agents/${agent.id}`)}
                            className="hover:bg-white/10 cursor-pointer p-3"
                          >
                            <BarChart className="w-4 h-4 mr-3 text-purple-400" />
                            Deep Analytics
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-400 mb-6 line-clamp-2 leading-relaxed font-medium">
                      {agent.description}
                    </p>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-white/2 p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1">
                          Success
                        </p>
                        <p className="text-lg font-bold text-white tabular-nums">
                          {agent.successRate}%
                        </p>
                      </div>
                      <div className="bg-white/2 p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1">
                          Total Load
                        </p>
                        <p className="text-lg font-bold text-white tabular-nums">
                          {agent.totalTasks.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Footer Tags */}
                    <div className="flex flex-wrap gap-2 pt-6 border-t border-white/5">
                      <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-full border border-white/5 text-[10px] font-bold text-slate-400">
                        {getDeploymentIcon(agent.deployment)}
                        {agent.model}
                      </div>
                      {agent.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold rounded-full uppercase tracking-tighter"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Interactive Action Bar */}
                    <div className="mt-6 flex items-center justify-between opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 bg-slate-900/80 backdrop-blur-xl -mx-6 -mb-6 p-4 border-t border-cyan-500/20">
                      <div className="text-[10px] text-slate-500 font-mono">
                        SIG://{agent.id.slice(0, 12)}
                      </div>
                      <Link
                        to={`/dashboard/agents/${agent.id}`}
                        className="flex items-center gap-2 text-[10px] font-black text-cyan-400 tracking-widest hover:text-cyan-300 uppercase"
                      >
                        Open Insight
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {sortedAgents.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-32"
          >
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
              <Cpu className="w-10 h-10 text-slate-600 animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No entities detected in sector</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-10 font-medium">
              Sector synchronization returned zero active agent signatures. Initialize a new entity
              to begin orchestration.
            </p>
            <PremiumButton
              onClick={() => navigate('/dashboard/agents/new')}
              variant="cyan"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-3" />
              Initialize Sector
            </PremiumButton>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default AgentDashboard;

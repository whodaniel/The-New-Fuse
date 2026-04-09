// @ts-nocheck
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
  FilePenLine,
  Filter,
  Grid,
  Image as ImageIcon,
  List,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Sparkles,
  Workflow,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Agent {
  id: string;
  name: string;
  description: string;
  type: string;
  status: 'active' | 'inactive' | 'training';
  capabilities: string[];
  lastActive: string;
  performance: number;
  conversations: number;
}

interface LocalAICapabilityStatus {
  enabled: boolean;
  reason?: string;
  endpoints?: Record<string, boolean>;
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

const AIAgentPortal: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [localAIStatus, setLocalAIStatus] = useState<LocalAICapabilityStatus | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const authHeaders = {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      };

      const [agentsResponse, localAiResponse] = await Promise.all([
        fetch('/api/agents', { headers: authHeaders }),
        fetch('/api/local-ai/status', { headers: authHeaders }),
      ]);

      if (agentsResponse.ok) {
        const data = await agentsResponse.json();
        setAgents(Array.isArray(data) ? data : []);
      } else {
        setAgents([]);
      }

      if (localAiResponse.ok) {
        const localAiData = await localAiResponse.json();
        setLocalAIStatus(localAiData);
      } else {
        setLocalAIStatus(null);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      setAgents([]);
      setLocalAIStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || agent.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Active' },
      inactive: { bg: 'bg-transparent0/20', text: 'text-gray-400', label: 'Inactive' },
      training: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Training' },
    };
    const { bg, text, label } = config[status] || config.inactive;
    return (
      <Badge className={`${bg} ${text} border-${text.replace('text-', '')}/30`}>
        <div
          className={`w-1.5 h-1.5 rounded-full ${bg.replace('/20', '')} mr-1.5 ${status === 'active' ? 'animate-pulse' : ''}`}
        />
        {label}
      </Badge>
    );
  };

  const AgentCard = ({ agent, index }: { agent: Agent; index: number }) => (
    <motion.div variants={itemVariants}>
      <GlassCard className="h-full group hover:border-purple-500/30 transition-all duration-300">
        <div className="p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-md bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-300">
                <Bot className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                  {agent.name}
                </h3>
                {getStatusBadge(agent.status)}
              </div>
            </div>
            <Link
              to={`/agents/${agent.id}`}
              className="p-2 text-gray-400 hover:text-white hover:bg-transparent/10 rounded-md transition-colors"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>

          <p className="text-gray-400 mb-4 line-clamp-2">{agent.description}</p>

          {/* Performance Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Performance</span>
              <span className="text-white font-medium">{agent.performance}%</span>
            </div>
            <div className="h-2 bg-transparent/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${agent.performance}%` }}
                transition={{ duration: 1, delay: index * 0.1 }}
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span>{agent.conversations.toLocaleString()} chats</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="w-4 h-4" />
              <span>{agent.lastActive}</span>
            </div>
          </div>

          {/* Capabilities */}
          <div className="flex flex-wrap gap-2">
            {agent.capabilities.slice(0, 2).map((capability, idx) => (
              <Badge key={idx} className="bg-transparent/5 text-gray-300 border-white/10 text-xs">
                {capability}
              </Badge>
            ))}
            {agent.capabilities.length > 2 && (
              <Badge className="bg-transparent/5 text-gray-400 border-white/10 text-xs">
                +{agent.capabilities.length - 2}
              </Badge>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg font-semibold animate-pulse">Loading AI Agents...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 p-4 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-md bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center border border-white/10">
                <Brain className="w-7 h-7 text-purple-400" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                  AI Agent Portal
                </h1>
                <p className="text-gray-400">Manage and monitor your AI agents</p>
              </div>
            </div>
            <Link to="/agents/new">
              <PremiumButton variant="gradient" glow icon={Plus}>
                Create Agent
              </PremiumButton>
            </Link>
          </div>
          {localAIStatus && localAIStatus.enabled === false && (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm">
              Local AI integration is not deployed in this environment.
            </div>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <motion.div variants={itemVariants}>
            <StatsCard
              label="Total Agents"
              value={agents.length.toString()}
              icon={Bot}
              gradient="purple"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard
              label="Active Agents"
              value={agents.filter((a) => a.status === 'active').length.toString()}
              icon={Zap}
              gradient="green"
              change="Online now"
              changeType="positive"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard
              label="Total Conversations"
              value={agents.reduce((sum, agent) => sum + agent.conversations, 0).toLocaleString()}
              icon={MessageSquare}
              gradient="blue"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard
              label="Avg Performance"
              value={`${agents.length > 0 ? Math.round(agents.reduce((sum, agent) => sum + agent.performance, 0) / agents.length) : 0}%`}
              icon={BarChart3}
              gradient="orange"
            />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="mb-8"
        >
          <GlassCard className="p-4 border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 via-slate-950/30 to-fuchsia-500/10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-cyan-100">
                  <Sparkles className="w-3.5 h-3.5" />
                  Visual Identity Ops
                </div>
                <h2 className="mt-3 text-2xl font-bold text-white">Integrated from /ai-portal</h2>
                <p className="text-sm text-gray-300 mt-1">
                  Manage portrait regeneration, prompt strategy, and profile lookbook directly in
                  the Agent Portal workflow.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to="/ai-portal/pfp-studio">
                  <PremiumButton variant="gradient" icon={ImageIcon} iconPosition="left" size="sm">
                    PFP Studio
                  </PremiumButton>
                </Link>
                <Link to="/ai-portal/pfp-prompts">
                  <PremiumButton variant="outline" icon={FilePenLine} iconPosition="left" size="sm">
                    Prompt Catalog
                  </PremiumButton>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Link to="/ai-portal/pfp-studio">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 hover:border-cyan-300/40 transition-colors">
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-cyan-300" />
                    Batch Portrait Ops
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    Select multiple agents, regenerate, drag/drop replacements, persist across
                    refresh.
                  </p>
                </div>
              </Link>
              <Link to="/ai-portal/pfp-prompts">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 hover:border-cyan-300/40 transition-colors">
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    <FilePenLine className="w-4 h-4 text-cyan-300" />
                    Prompt Workspace
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    Edit prompt specs, copy variants, and sync prompt overrides to portrait
                    generation.
                  </p>
                </div>
              </Link>
              <Link to="/workflows/builder">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 hover:border-cyan-300/40 transition-colors">
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-cyan-300" />
                    Agent Factory Workflows
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    Jump into workflow orchestration and wire identity operations into production
                    flows.
                  </p>
                </div>
              </Link>
            </div>
          </GlassCard>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <GlassCard className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 gap-4 w-full lg:w-auto">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <PremiumInput
                    placeholder="Search agents..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearchTerm(e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <PremiumSelect
                    value={filterStatus}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFilterStatus(e.target.value)
                    }
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="training">Training</option>
                  </PremiumSelect>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-transparent/5 p-1 rounded-md border border-white/10">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'grid'
                      ? 'bg-purple-500/30 text-purple-300'
                      : 'text-gray-400 hover:text-white hover:bg-transparent/5'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'list'
                      ? 'bg-purple-500/30 text-purple-300'
                      : 'text-gray-400 hover:text-white hover:bg-transparent/5'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Agents Grid/List */}
        <AnimatePresence mode="popLayout">
          {filteredAgents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-transparent/5 flex items-center justify-center border border-white/10">
                <Bot className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No agents found</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating your first AI agent.'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <Link to="/agents/new">
                  <PremiumButton variant="gradient" glow icon={Plus}>
                    Create Your First Agent
                  </PremiumButton>
                </Link>
              )}
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-4'
              }
            >
              {filteredAgents.map((agent, index) => (
                <AgentCard key={agent.id} agent={agent} index={index} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AIAgentPortal;

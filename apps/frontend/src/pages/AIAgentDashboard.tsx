// @ts-nocheck
import {
  Badge,
  GlassCard,
  PremiumButton,
  PremiumInput,
  PremiumSelect,
  StatsCard,
} from '@/components/ui';
import { agentService, type Agent, type LocalAICapabilityStatus } from '@/services/AgentService';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Bot,
  Brain,
  FilePenLine,
  Filter,
  Grid,
  Image as ImageIcon,
  List,
  Network,
  Plus,
  Search,
  Sparkles,
  Terminal,
  Workflow,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [localAIStatus, setLocalAIStatus] = useState<LocalAICapabilityStatus | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fetchedAgents, localAiData] = await Promise.all([
        agentService.getAgents(),
        agentService.getLocalAICapabilityStatus(),
      ]);
      setAgents(fetchedAgents);
      setLocalAIStatus(localAiData);
    } catch (error) {
      console.error('Error fetching portal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agent.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || agent.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'ACTIVE' },
      inactive: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'STANDBY' },
      training: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'TUNING' },
      error: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'FAULT' },
    };
    const { bg, text, label } = config[status] || config.inactive;
    return (
      <Badge className={`${bg} ${text} border-transparent text-[10px] font-black tracking-widest`}>
        <div
          className={`w-1.5 h-1.5 rounded-full ${bg.replace('/20', '')} mr-1.5 ${status === 'active' ? 'animate-pulse' : ''}`}
        />
        {label}
      </Badge>
    );
  };

  const AgentCard = ({ agent, index }: { agent: Agent; index: number }) => (
    <motion.div variants={itemVariants}>
      <GlassCard className="h-full group hover:border-amber-500/30 transition-all duration-300 border-white/5 bg-slate-900/40 backdrop-blur-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-slate-800 group-hover:bg-amber-500 transition-colors" />
        <div className="p-5">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 overflow-hidden shadow-2xl">
                {agent.metadata?.pfpUrl ? (
                  <img
                    src={agent.metadata.pfpUrl}
                    alt={agent.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Bot className="w-7 h-7 text-slate-500" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-black text-white group-hover:text-amber-400 transition-colors tracking-tight">
                  {agent.name}
                </h3>
                {getStatusBadge(agent.status)}
              </div>
            </div>
            <Link
              to={`/agents/${agent.id}`}
              className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <Terminal className="w-4 h-4" />
            </Link>
          </div>

          <p className="text-slate-400 text-sm mb-6 line-clamp-2 leading-relaxed font-medium">
            {agent.description || 'Autonomous agent operative provisioned for kernel tasks.'}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-3 bg-black/40 rounded border border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                Backbone
              </p>
              <p className="text-xs font-bold text-sky-400 mt-0.5 truncate">
                {agent.model || 'Native'}
              </p>
            </div>
            <div className="p-3 bg-black/40 rounded border border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                Kernel
              </p>
              <p className="text-xs font-bold text-amber-400 mt-0.5">
                {agent.metadata?.kernelVersion || 'v0.9.4'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
            {agent.capabilities.slice(0, 3).map((capability, idx) => (
              <Badge
                key={idx}
                className="bg-white/5 text-slate-500 border-white/5 text-[9px] font-black uppercase"
              >
                {capability}
              </Badge>
            ))}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em]">
            Syncing Agent Portal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] relative overflow-hidden pb-20">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-600/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 p-4 lg:p-10 max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                <Brain className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <h1 className="text-5xl font-black text-white tracking-tighter uppercase">
                  AI Agent Portal
                </h1>
                <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.2em] mt-1 flex items-center gap-2">
                  <Network className="w-3 h-3 text-amber-500" />
                  Kernel Hive Operations & Fleet Intelligence
                </p>
              </div>
            </div>
            <Link to="/agents/new">
              <PremiumButton
                variant="gradient"
                className="bg-amber-500 hover:bg-amber-600 text-black font-black h-14 px-8 shadow-lg shadow-amber-500/10"
              >
                <Plus className="mr-2 h-6 w-6" />
                Forge New Operative
              </PremiumButton>
            </Link>
          </div>
          {localAIStatus && localAIStatus.enabled === false && (
            <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-amber-200/80 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3">
              <Zap className="w-4 h-4 text-amber-500" />
              Local Kernel SIMD acceleration not detected in this environment.
            </div>
          )}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label="FORGED FLEET"
            value={agents.length.toString()}
            icon={Bot}
            className="bg-slate-900/40 border-white/5"
          />
          <StatsCard
            label="ACTIVE SYNAPSES"
            value={agents.filter((a) => a.status === 'active').length.toString()}
            icon={Zap}
            className="bg-slate-900/40 border-white/5"
          />
          <StatsCard
            label="CROSS-AGENT OPS"
            value="14.2k"
            icon={Network}
            className="bg-slate-900/40 border-white/5"
          />
          <StatsCard
            label="SYSTEM THROUGHPUT"
            value="49k/s"
            icon={BarChart3}
            className="bg-slate-900/40 border-white/5"
          />
        </div>

        {/* IDENTITY OPS - REFACTORED LINKS */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
        >
          <GlassCard className="p-8 border border-sky-400/20 bg-slate-900/40 backdrop-blur-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5">
              <Sparkles className="w-40 h-40 text-sky-400" />
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 mb-8">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-sky-100">
                  <Sparkles className="w-3.5 h-3.5" />
                  Identity Synchronization
                </div>
                <h2 className="mt-4 text-3xl font-black text-white uppercase tracking-tight">
                  Visual Identity & Lookbook
                </h2>
                <p className="text-slate-400 mt-2 font-medium leading-relaxed">
                  Reforge agent souls through advanced portrait regeneration and prompt override
                  mapping. Unified visual state is pushed instantly to the synaptic bus.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/ai-portal/pfp-studio">
                  <PremiumButton
                    variant="outline"
                    className="border-sky-500/40 text-sky-300 bg-sky-500/5 hover:bg-sky-500/10 h-12 font-bold px-6"
                  >
                    <ImageIcon className="mr-2 h-5 w-5" />
                    PFP Studio
                  </PremiumButton>
                </Link>
                <Link to="/ai-portal/pfp-prompts">
                  <PremiumButton
                    variant="outline"
                    className="border-slate-700 text-slate-300 bg-white/5 hover:bg-white/10 h-12 font-bold px-6"
                  >
                    <FilePenLine className="mr-2 h-5 w-5" />
                    Prompt Catalog
                  </PremiumButton>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/ai-portal/pfp-studio" className="group">
                <div className="h-full rounded-2xl border border-white/5 bg-black/40 p-6 hover:border-sky-500/40 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-5 h-5 text-sky-400" />
                  </div>
                  <p className="text-base font-black text-white uppercase tracking-tight">
                    Batch Portrait Forge
                  </p>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed font-bold uppercase tracking-tighter">
                    Select multiple operatives, regenerate, and deploy visual identity overrides.
                  </p>
                </div>
              </Link>
              <Link to="/ai-portal/pfp-prompts" className="group">
                <div className="h-full rounded-2xl border border-white/5 bg-black/40 p-6 hover:border-amber-500/40 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FilePenLine className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-base font-black text-white uppercase tracking-tight">
                    Prompt Architecture
                  </p>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed font-bold uppercase tracking-tighter">
                    Tune the technical specs that drive generative portraits and identity variance.
                  </p>
                </div>
              </Link>
              <Link to="/workflows/builder" className="group">
                <div className="h-full rounded-2xl border border-white/5 bg-black/40 p-6 hover:border-emerald-500/40 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Workflow className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-base font-black text-white uppercase tracking-tight">
                    Factory Automation
                  </p>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed font-bold uppercase tracking-tighter">
                    Wire identity operations into production flows and automated swarm deployments.
                  </p>
                </div>
              </Link>
            </div>
          </GlassCard>
        </motion.div>

        {/* Search and Filters */}
        <GlassCard className="p-4 bg-slate-900/40 border-white/5">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 gap-4 w-full lg:w-auto">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-amber-500 transition-colors" />
                <PremiumInput
                  placeholder="Search fleet by callsign, model, or directive..."
                  className="pl-12 h-14 bg-slate-950/50 border-slate-800 text-slate-100"
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchTerm(e.target.value)
                  }
                />
              </div>
              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-slate-500" />
                <PremiumSelect
                  value={filterStatus}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFilterStatus(e.target.value)
                  }
                  className="h-14 bg-slate-950/50 border-slate-800 text-slate-300 min-w-[160px]"
                >
                  <option value="all">ALL STATUS</option>
                  <option value="active">ACTIVE</option>
                  <option value="inactive">STANDBY</option>
                  <option value="error">FAULT</option>
                </PremiumSelect>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-black/20 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Agents Grid/List */}
        <AnimatePresence mode="popLayout">
          {filteredAgents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-slate-950/20 rounded-[3rem] border border-dashed border-slate-800"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-900 flex items-center justify-center border border-white/5">
                <Bot className="w-10 h-10 text-slate-600" />
              </div>
              <h3 className="text-xl font-black text-white mb-2 uppercase">
                No operatives detected
              </h3>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm font-bold uppercase tracking-tighter">
                {searchTerm || filterStatus !== 'all'
                  ? 'The search parameters returned no results from the kernel.'
                  : 'Start by manufacturing your first autonomous agent soul.'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <Link to="/agents/new">
                  <PremiumButton
                    variant="gradient"
                    className="bg-amber-500 text-black font-black px-10 h-14"
                  >
                    Forge First Operative
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
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
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

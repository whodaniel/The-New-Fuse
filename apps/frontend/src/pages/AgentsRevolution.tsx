import { Badge } from '@/components/ui/badge';
import { GlassCard, PremiumButton, PremiumInput, PremiumSelect } from '@/components/ui/premium';
import { useDebounce } from '@/hooks/useDebounce';
import { agentService, type Agent } from '@/services/AgentService';
import {
  ArrowRight,
  Bot,
  Box,
  CheckCircle2,
  Clock,
  Code2,
  Command,
  Cpu,
  Database,
  FileCode,
  Gavel,
  Layers,
  Loader2,
  LucideIcon,
  MessageSquare,
  Microscope,
  Plus,
  Search,
  Send,
  Sparkles,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Swarm Activity interface
interface SwarmActivity {
  id: string;
  type: 'auction' | 'scan' | 'award';
  title: string;
  agent: string;
  timestamp: Date;
  status: 'active' | 'completed';
}

// Icon mapping for agent types
const typeIcons: Record<string, LucideIcon> = {
  development: Code2,
  coder: Code2,
  analytics: Database,
  content: FileCode,
  security: Layers,
  chat: Bot,
  assistant: Sparkles,
  workflow: Zap,
  analyzer: Microscope,
  executor: Cpu,
  environment: Box,
  scout: Search,
  coordinator: Command,
  communicator: MessageSquare,
  default: Bot,
};

// Gradient mapping for agent types
const typeGradients: Record<string, string> = {
  development: 'from-blue-500 to-cyan-500',
  coder: 'from-blue-600 to-cyan-400',
  analytics: 'from-purple-500 to-pink-500',
  content: 'from-orange-500 to-red-500',
  security: 'from-green-500 to-emerald-500',
  chat: 'from-indigo-500 to-purple-500',
  assistant: 'from-pink-500 to-rose-500',
  workflow: 'from-yellow-500 to-orange-500',
  analyzer: 'from-cyan-400 to-blue-600',
  executor: 'from-red-500 to-orange-500',
  environment: 'from-slate-700 to-gray-900',
  scout: 'from-purple-600 to-indigo-800',
  coordinator: 'from-amber-500 to-orange-600',
  communicator: 'from-teal-400 to-emerald-500',
  default: 'from-gray-500 to-slate-500',
};

// Transformed agent interface for UI
interface UIAgent {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  status: 'Active' | 'Paused' | 'Error' | 'Standby';
  metrics: {
    tasksCompleted: number;
    successRate: number;
    avgResponseTime: string;
  };
  icon: LucideIcon;
  gradient: string;
  pfpUrl?: string;
}

// Transform API agent to UI agent
const transformAgent = (agent: Agent): UIAgent => {
  const type = agent.type?.toLowerCase() || 'default';

  // Map internal status to UI status
  let uiStatus: UIAgent['status'] = 'Paused';
  if (agent.status === 'active') uiStatus = 'Active';
  else if (agent.status === 'error') uiStatus = 'Error';
  else if (agent.status === 'standby' || !agent.status) uiStatus = 'Standby';

  return {
    id: agent.id,
    name: agent.name,
    tagline: agent.model
      ? `Powered by ${agent.model}`
      : agent.description?.split('.')[0] || 'AI-powered agent',
    description: agent.description || 'No description available',
    category: agent.type || 'General',
    status: uiStatus,
    metrics: {
      tasksCompleted: agent.metadata?.tasksCompleted || 0,
      successRate: agent.metadata?.successRate || 0,
      avgResponseTime: agent.metadata?.avgResponseTime || '0s',
    },
    icon: typeIcons[type] || typeIcons.default,
    gradient: typeGradients[type] || typeGradients.default,
    pfpUrl: agent.metadata?.pfpUrl,
  };
};

// Memoized Agent Card Component to prevent re-renders
const AgentCard = memo(({ agent }: { agent: UIAgent }) => {
  const navigate = useNavigate();
  const Icon = agent.icon;

  const getStatusBadge = (status: UIAgent['status']) => {
    switch (status) {
      case 'Active':
        return (
          <Badge className="px-4 py-2 bg-green-500/20 text-green-400 border-green-500/30 font-semibold">
            <CheckCircle2 className="w-4 h-4 mr-2 animate-pulse" />
            Active
          </Badge>
        );
      case 'Standby':
        return (
          <Badge className="px-4 py-2 bg-blue-500/20 text-blue-400 border-blue-500/30 font-semibold">
            <Clock className="w-4 h-4 mr-2" />
            Standby
          </Badge>
        );
      case 'Error':
        return (
          <Badge className="px-4 py-2 bg-red-500/20 text-red-400 border-red-500/30 font-semibold">
            <Zap className="w-4 h-4 mr-2 animate-bounce" />
            Alert
          </Badge>
        );
      default:
        return (
          <Badge className="px-4 py-2 bg-yellow-500/20 text-yellow-400 border-yellow-500/30 font-semibold">
            <Clock className="w-4 h-4 mr-2" />
            Paused
          </Badge>
        );
    }
  };

  return (
    <GlassCard
      onClick={() => navigate(`/agents/${agent.id}`)}
      className="group relative p-10 rounded-3xl hover:border-white/30 transition-all duration-500 cursor-pointer overflow-hidden border border-white/10"
    >
      {/* Gradient Overlay on Hover */}
      <div
        className={`absolute inset-0 bg-linear-to-br ${agent.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
      />

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div
            className={`w-20 h-20 rounded-2xl bg-linear-to-br ${agent.gradient} flex items-center justify-center shadow-2xl group-hover:scale-110 transform transition-transform overflow-hidden`}
          >
            {agent.pfpUrl ? (
              <img
                src={agent.pfpUrl}
                alt={agent.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <Icon className="w-10 h-10 text-white" />
            )}
          </div>
          <div className="flex items-center gap-3">{getStatusBadge(agent.status)}</div>
        </div>

        {/* Content */}
        <div>
          <h3 className="text-4xl font-black text-white mb-3 group-hover:text-transparent group-hover:bg-linear-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all">
            {agent.name}
          </h3>
          <p className="text-xl font-semibold text-blue-400 mb-4">{agent.tagline}</p>
          <p className="text-lg text-gray-400 leading-relaxed">{agent.description}</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/10">
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Tasks
            </p>
            <p className="text-2xl font-bold text-white">
              {agent.metrics.tasksCompleted.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Success
            </p>
            <p className="text-2xl font-bold text-green-400">{agent.metrics.successRate}%</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Speed
            </p>
            <p className="text-2xl font-bold text-blue-400">{agent.metrics.avgResponseTime}</p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center justify-between pt-6 border-t border-white/10">
          <span className="text-sm text-gray-500 font-medium">{agent.category}</span>
          <span className="flex items-center gap-2 text-blue-400 font-bold group-hover:gap-4 transition-all">
            View Details
            <ArrowRight className="w-5 h-5" />
          </span>
        </div>
      </div>
    </GlassCard>
  );
});

AgentCard.displayName = 'AgentCard';

/**
 * AGENTS PAGE REVOLUTION
 * Bold. Modern. Premium.
 * Now with REAL data from the backend API!
 */
export const AgentsRevolution = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  // Debounce search query to prevent excessive filtering and re-renders
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [agents, setAgents] = useState<UIAgent[]>([]);
  const [activities, setActivity] = useState<SwarmActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const humanOptions = agentService.getHumanConnectionOptions();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedAgents, fetchedActivity] = await Promise.all([
        agentService.getAgents(),
        agentService.getSwarmActivity(),
      ]);
      setAgents(fetchedAgents.map(transformAgent));
      setActivity(fetchedActivity);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('An unexpected error occurred while fetching your swarm data. Please try again.');
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter logic using debounced search query
  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      agent.tagline.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || agent.category === filterCategory;
    const matchesStatus = filterStatus === 'All' || agent.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = ['All', ...new Set(agents.map((a) => a.category))].map((c) => ({
    value: c,
    label: c,
  }));
  const statuses = ['All', ...new Set(agents.map((a) => a.status))].map((s) => ({
    value: s,
    label: s,
  }));

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-xl text-gray-400">Loading your AI workforce...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center p-8">
          <div className="inline-flex rounded-full bg-red-500/10 p-4">
            <Bot className="w-16 h-16 text-red-400" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">Oops! Something went wrong.</h2>
          <p className="mt-4 text-lg text-gray-400">{error}</p>
          <PremiumButton onClick={fetchAgents} variant="gradient" className="mt-8">
            <ArrowRight className="mr-2 h-5 w-5" />
            Try Again
          </PremiumButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent px-6 py-16">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* HERO HEADER - MASSIVE */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-blue-500/10 border border-blue-500/30">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-blue-300">Your AI Workforce</span>
            </div>
            <h1 className="text-7xl lg:text-8xl font-black mb-6 leading-none">
              <span className="text-white">AI Agents</span>
              <br />
              <span className="bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                That Actually Work
              </span>
            </h1>
            <p className="text-2xl text-gray-400 max-w-2xl leading-relaxed">
              Deploy autonomous agents that think, execute, and scale infinitely.{' '}
              <span className="text-white font-semibold">No babysitting required.</span>
            </p>
          </div>
          <PremiumButton
            onClick={() => navigate('/agents/new')}
            size="xl"
            variant="gradient"
            className="shadow-[0_0_40px_rgba(59,130,246,0.6)] hover:shadow-[0_0_60px_rgba(59,130,246,0.8)] transform hover:scale-105 transition-all duration-300 whitespace-nowrap"
          >
            <Plus className="mr-3 h-6 w-6" />
            Deploy New Agent
            <ArrowRight className="ml-3 h-6 w-6" />
          </PremiumButton>
        </div>

        {/* SEARCH & FILTERS - PREMIUM */}
        <GlassCard className="p-8 rounded-3xl backdrop-blur-2xl shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search Bar */}
            <div className="relative flex-1">
              <PremiumInput
                placeholder="Search by name, capability, or use case..."
                className="h-16 text-lg rounded-2xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={Search}
                iconPosition="left"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <div className="relative min-w-[180px]">
                <PremiumSelect
                  options={categories}
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="h-16 rounded-2xl text-lg appearance-none"
                />
              </div>
              <div className="relative min-w-[160px]">
                <PremiumSelect
                  options={statuses}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-16 rounded-2xl text-lg appearance-none"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* SWARM INTELLIGENCE & HUMAN HANDOFF */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Live Activity Feed */}
          <GlassCard className="lg:col-span-2 p-8 rounded-3xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <TrendingUp className="text-blue-400" />
                Swarm Intelligence
              </h3>
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">LIVE FEED</Badge>
            </div>
            <div className="space-y-4">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div
                    className={`p-3 rounded-xl bg-linear-to-br ${
                      act.type === 'auction'
                        ? 'from-amber-500 to-orange-600'
                        : act.type === 'award'
                          ? 'from-green-500 to-emerald-600'
                          : 'from-blue-500 to-cyan-600'
                    }`}
                  >
                    {act.type === 'auction' ? (
                      <Gavel className="w-5 h-5 text-white" />
                    ) : act.type === 'award' ? (
                      <Trophy className="w-5 h-5 text-white" />
                    ) : (
                      <Zap className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white">{act.title}</p>
                    <p className="text-sm text-gray-500">
                      Initiated by <span className="text-blue-400 font-medium">{act.agent}</span> •{' '}
                      {new Date(act.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {act.status === 'active' && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                      <span className="text-xs font-bold text-blue-400">BIDDING</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Human Connection Points */}
          <GlassCard className="p-8 rounded-3xl space-y-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <Users className="text-purple-400" />
              Human Relay
            </h3>
            <p className="text-gray-400 text-sm">
              Agents will use these channels to escalate critical decisions to you.
            </p>
            <div className="space-y-3">
              {humanOptions.map((opt) => (
                <a
                  key={opt.name}
                  href={opt.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/5">
                      {opt.icon === 'Send' ? (
                        <Send className="w-5 h-5 text-blue-400" />
                      ) : (
                        <MessageSquare className="w-5 h-5 text-purple-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white group-hover:text-blue-400 transition-colors">
                        {opt.name}
                      </p>
                      <p className="text-xs text-gray-500">{opt.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:translate-x-1 transition-transform" />
                </a>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* AGENTS GRID - BOLD CARDS */}
        <div className="grid md:grid-cols-2 gap-8">
          {filteredAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>

        {/* Empty State */}
        {filteredAgents.length === 0 && (
          <div className="text-center py-32">
            <Bot className="mx-auto h-24 w-24 text-gray-700 mb-8" />
            <h3 className="text-4xl font-bold text-white mb-4">No Agents Found</h3>
            <p className="text-xl text-gray-400 mb-10 max-w-xl mx-auto">
              {searchQuery || filterCategory !== 'All' || filterStatus !== 'All'
                ? 'Try adjusting your filters or search query.'
                : 'Deploy your first AI agent and watch it transform your workflow.'}
            </p>
            <PremiumButton
              onClick={() => navigate('/agents/new')}
              size="xl"
              variant="gradient"
              className="shadow-[0_0_40px_rgba(59,130,246,0.6)] hover:shadow-[0_0_60px_rgba(59,130,246,0.8)] transform hover:scale-105 transition-all duration-300"
            >
              <Plus className="mr-3 h-6 w-6" />
              Deploy Your First Agent
            </PremiumButton>
          </div>
        )}

        {/* Stats Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16">
          <GlassCard className="p-8 rounded-2xl backdrop-blur-xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-4">
              <Command className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-5xl font-black text-white mb-2">{agents.length}</p>
            <p className="text-lg text-gray-400">Agents Deployed</p>
          </GlassCard>
          <GlassCard className="p-8 rounded-2xl backdrop-blur-xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-5xl font-black text-white mb-2">
              {agents.length > 0
                ? (
                    agents.reduce((acc, a) => acc + (a.metrics.successRate || 0), 0) / agents.length
                  ).toFixed(1)
                : '0'}
              %
            </p>
            <p className="text-lg text-gray-400">Avg Success Rate</p>
          </GlassCard>
          <GlassCard className="p-8 rounded-2xl backdrop-blur-xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mb-4">
              <Zap className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-5xl font-black text-white mb-2">1.9s</p>
            <p className="text-lg text-gray-400">Avg Response Time</p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default AgentsRevolution;

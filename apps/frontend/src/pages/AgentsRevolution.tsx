import OpsPageHeader from '@/components/ops/OpsPageHeader';
import { Badge } from '@/components/ui/badge';
import { GlassCard, PremiumButton, PremiumInput, PremiumSelect } from '@/components/ui/premium';
import { useDebounce } from '@/hooks/useDebounce';
import { agentService, type Agent, type SwarmCapabilityStatus } from '@/services/AgentService';
import {
  ArrowLeftRight,
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
  Gift,
  Layers,
  Loader2,
  LucideIcon,
  MessageSquare,
  Microscope,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
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
  'viability-tester': ShieldCheck,
  benchmarker: ArrowLeftRight,
  'opportunity-scout': Gift,
  default: Bot,
};

// Gradient mapping for agent types
const typeGradients: Record<string, string> = {
  development: 'from-slate-600 to-slate-700',
  coder: 'from-slate-600 to-slate-700',
  analytics: 'from-slate-700 to-slate-800',
  content: 'from-zinc-600 to-slate-700',
  security: 'from-emerald-700 to-slate-800',
  chat: 'from-slate-600 to-indigo-700',
  assistant: 'from-slate-600 to-violet-700',
  workflow: 'from-slate-600 to-cyan-700',
  analyzer: 'from-slate-700 to-blue-800',
  executor: 'from-slate-700 to-rose-800',
  environment: 'from-slate-700 to-gray-900',
  scout: 'from-slate-700 to-indigo-900',
  coordinator: 'from-slate-700 to-amber-700',
  communicator: 'from-slate-700 to-teal-700',
  'viability-tester': 'from-slate-700 to-emerald-700',
  benchmarker: 'from-slate-700 to-purple-700',
  'opportunity-scout': 'from-slate-700 to-orange-700',
  default: 'from-slate-600 to-slate-800',
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
          <Badge className="px-4 py-2 bg-emerald-500/12 text-emerald-200 border-emerald-500/25 font-semibold">
            <CheckCircle2 className="w-4 h-4 mr-2 animate-pulse" />
            Active
          </Badge>
        );
      case 'Standby':
        return (
          <Badge className="px-4 py-2 bg-slate-500/12 text-slate-200 border-slate-500/25 font-semibold">
            <Clock className="w-4 h-4 mr-2" />
            Standby
          </Badge>
        );
      case 'Error':
        return (
          <Badge className="px-4 py-2 bg-rose-500/12 text-rose-200 border-rose-500/25 font-semibold">
            <Zap className="w-4 h-4 mr-2 animate-bounce" />
            Alert
          </Badge>
        );
      default:
        return (
          <Badge className="px-4 py-2 bg-amber-500/12 text-amber-200 border-amber-500/25 font-semibold">
            <Clock className="w-4 h-4 mr-2" />
            Paused
          </Badge>
        );
    }
  };

  return (
    <GlassCard
      onClick={() => navigate(`/agents/${agent.id}`)}
      className="group relative p-5 sm:p-6 rounded-xl hover:border-white/30 transition-all duration-300 cursor-pointer overflow-hidden border border-white/10"
    >
      {/* Gradient Overlay on Hover */}
      <div
        className={`absolute inset-0 bg-linear-to-br ${agent.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
      />

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div
            className={`w-14 h-14 rounded-md bg-linear-to-br ${agent.gradient} flex items-center justify-center shadow-none group-hover:scale-105 transform transition-transform overflow-hidden`}
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
              <Icon className="w-7 h-7 text-white" />
            )}
          </div>
          <div className="flex items-center gap-3">{getStatusBadge(agent.status)}</div>
        </div>

        {/* Content */}
        <div>
          <h3 className="text-2xl font-extrabold text-white mb-2 group-hover:text-transparent group-hover:bg-linear-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all">
            {agent.name}
          </h3>
          <p className="text-sm font-semibold text-slate-300 mb-3">{agent.tagline}</p>
          <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">{agent.description}</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
              Tasks
            </p>
            <p className="text-xl font-bold text-white">
              {agent.metrics.tasksCompleted.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
              Success
            </p>
            <p className="text-xl font-bold text-slate-100">{agent.metrics.successRate}%</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
              Speed
            </p>
            <p className="text-xl font-bold text-slate-100">{agent.metrics.avgResponseTime}</p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <span className="text-sm text-muted-foreground font-medium">{agent.category}</span>
          <span className="flex items-center gap-2 text-slate-200 font-bold group-hover:text-white group-hover:gap-4 transition-all">
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
  const [swarmCapabilityStatus, setSwarmCapabilityStatus] = useState<SwarmCapabilityStatus | null>(
    null
  );
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
      const capabilityStatus = await agentService.getSwarmCapabilityStatus();
      setAgents(fetchedAgents.map(transformAgent));
      setActivity(fetchedActivity);
      setSwarmCapabilityStatus(capabilityStatus);
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
          <Loader2 className="w-12 h-12 text-slate-300 animate-spin mx-auto mb-4" />
          <p className="text-xl text-gray-400">Loading your AI workforce...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center p-4">
          <div className="inline-flex rounded-full bg-rose-500/10 p-4">
            <Bot className="w-16 h-16 text-rose-300" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-white">Oops! Something went wrong.</h2>
          <p className="mt-4 text-lg text-gray-400">{error}</p>
          <PremiumButton onClick={fetchData} variant="gradient" className="mt-8">
            <ArrowRight className="mr-2 h-5 w-5" />
            Try Again
          </PremiumButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-2">
      <div className="max-w-[1500px] mx-auto space-y-6">
        <OpsPageHeader
          eyebrow="Fleet"
          title="Agent Operations"
          subtitle="Operate your agent fleet, isolate failures, and scale what performs."
          meta={
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge className="bg-slate-500/15 text-slate-100 border-slate-500/25">
                {agents.filter((agent) => agent.status === 'Active').length} active
              </Badge>
              <Badge className="bg-rose-500/12 text-rose-200 border-rose-500/25">
                {agents.filter((agent) => agent.status === 'Error').length} errors
              </Badge>
              <Badge className="bg-slate-500/10 text-slate-300 border-slate-500/20">
                {agents.length} total
              </Badge>
            </div>
          }
          actions={
            <>
              <PremiumButton onClick={fetchData} variant="outline">
                Refresh
              </PremiumButton>
              <PremiumButton onClick={() => navigate('/agents/new')} size="lg" variant="gradient">
                <Plus className="mr-2 h-5 w-5" />
                Deploy Agent
              </PremiumButton>
            </>
          }
        />

        {/* SEARCH & FILTERS - PREMIUM */}
        <GlassCard className="p-4 rounded-xl backdrop-blur-xl shadow-none">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <PremiumInput
                placeholder="Search by name, capability, or use case..."
                className="h-11 text-sm rounded-md"
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
                  className="h-11 rounded-md text-sm appearance-none"
                />
              </div>
              <div className="relative min-w-[160px]">
                <PremiumSelect
                  options={statuses}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-11 rounded-md text-sm appearance-none"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* SWARM INTELLIGENCE & HUMAN HANDOFF */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Live Activity Feed */}
          <GlassCard className="lg:col-span-2 p-4 rounded-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="text-slate-200" />
                Swarm Intelligence
              </h3>
              <div className="flex items-center gap-2">
                <Badge className="bg-slate-500/15 text-slate-100 border-slate-500/25">
                  LIVE FEED
                </Badge>
                {swarmCapabilityStatus &&
                  Object.keys(swarmCapabilityStatus.unavailable || {}).length > 0 && (
                    <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30">
                      PARTIAL
                    </Badge>
                  )}
              </div>
            </div>
            {swarmCapabilityStatus &&
              Object.keys(swarmCapabilityStatus.unavailable || {}).length > 0 && (
                <div className="p-4 rounded-md border border-amber-500/30 bg-amber-500/10 text-sm text-amber-200">
                  Some swarm execution/message APIs are not deployed yet. Live activity feed remains
                  available.
                </div>
              )}
            <div className="space-y-4">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-center gap-4 p-4 rounded-md bg-transparent/5 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div
                    className={`p-3 rounded-md bg-linear-to-br ${
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
                    <p className="text-sm text-muted-foreground">
                      Initiated by <span className="text-slate-100 font-medium">{act.agent}</span> •{' '}
                      {new Date(act.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {act.status === 'active' && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-300 animate-ping" />
                      <span className="text-xs font-bold text-slate-200">BIDDING</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Human Connection Points */}
          <GlassCard className="p-4 rounded-xl space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="text-slate-200" />
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
                  className="flex items-center justify-between p-4 rounded-md bg-transparent/5 border border-white/5 hover:border-white/20 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-transparent/5">
                      {opt.icon === 'Send' ? (
                        <Send className="w-5 h-5 text-slate-200" />
                      ) : (
                        <MessageSquare className="w-5 h-5 text-slate-200" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white group-hover:text-slate-100 transition-colors">
                        {opt.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{opt.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </a>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* AGENTS GRID - BOLD CARDS */}
        <div className="grid md:grid-cols-2 gap-4">
          {filteredAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>

        {/* Empty State */}
        {filteredAgents.length === 0 && (
          <div className="text-center py-16">
            <Bot className="mx-auto h-16 w-16 text-foreground mb-6" />
            <h3 className="text-2xl font-bold text-white mb-3">No Agents Found</h3>
            <p className="text-base text-gray-400 mb-8 max-w-xl mx-auto">
              {searchQuery || filterCategory !== 'All' || filterStatus !== 'All'
                ? 'Try adjusting your filters or search query.'
                : 'Deploy your first AI agent and watch it transform your workflow.'}
            </p>
            <PremiumButton
              onClick={() => navigate('/agents/new')}
              size="lg"
              variant="gradient"
              className="shadow-[0_0_40px_rgba(59,130,246,0.6)] hover:shadow-[0_0_60px_rgba(59,130,246,0.8)] transform hover:scale-105 transition-all duration-300"
            >
              <Plus className="mr-3 h-6 w-6" />
              Deploy Your First Agent
            </PremiumButton>
          </div>
        )}

        {/* Stats Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          <GlassCard className="p-4 rounded-md backdrop-blur-xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-500/20 mb-4">
              <Command className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-4xl font-bold text-white mb-2">{agents.length}</p>
            <p className="text-base text-gray-400">Agents Deployed</p>
          </GlassCard>
          <GlassCard className="p-4 rounded-md backdrop-blur-xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-500/20 mb-4">
              <TrendingUp className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-4xl font-bold text-white mb-2">
              {agents.length > 0
                ? (
                    agents.reduce((acc, a) => acc + (a.metrics.successRate || 0), 0) / agents.length
                  ).toFixed(1)
                : '0'}
              %
            </p>
            <p className="text-base text-gray-400">Avg Success Rate</p>
          </GlassCard>
          <GlassCard className="p-4 rounded-md backdrop-blur-xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-500/20 mb-4">
              <Zap className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-4xl font-bold text-white mb-2">1.9s</p>
            <p className="text-base text-gray-400">Avg Response Time</p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default AgentsRevolution;

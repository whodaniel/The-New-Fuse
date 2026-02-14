import { Badge } from '@/components/ui/badge';
import { GlassCard, PremiumButton, PremiumInput, PremiumSelect } from '@/components/ui/premium';
import { agentService, type Agent } from '@/services/AgentService';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  Code2,
  Command,
  Database,
  FileCode,
  Layers,
  Loader2,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Icon mapping for agent types
const typeIcons: Record<string, React.ElementType> = {
  development: Code2,
  analytics: Database,
  content: FileCode,
  security: Layers,
  chat: Bot,
  assistant: Sparkles,
  workflow: Zap,
  default: Bot,
};

// Gradient mapping for agent types
const typeGradients: Record<string, string> = {
  development: 'from-blue-500 to-cyan-500',
  analytics: 'from-purple-500 to-pink-500',
  content: 'from-orange-500 to-red-500',
  security: 'from-green-500 to-emerald-500',
  chat: 'from-indigo-500 to-purple-500',
  assistant: 'from-pink-500 to-rose-500',
  workflow: 'from-yellow-500 to-orange-500',
  default: 'from-gray-500 to-slate-500',
};

// Transformed agent interface for UI
interface UIAgent {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  status: 'Active' | 'Paused' | 'Error';
  metrics: {
    tasksCompleted: number;
    successRate: number;
    avgResponseTime: string;
  };
  icon: React.ElementType;
  gradient: string;
}

// Transform API agent to UI agent
const transformAgent = (agent: Agent): UIAgent => {
  const type = agent.type?.toLowerCase() || 'default';
  return {
    id: agent.id,
    name: agent.name,
    tagline: agent.model
      ? `Powered by ${agent.model}`
      : agent.description?.split('.')[0] || 'AI-powered agent',
    description: agent.description || 'No description available',
    category: agent.type || 'General',
    status: agent.status === 'active' ? 'Active' : agent.status === 'error' ? 'Error' : 'Paused',
    metrics: {
      tasksCompleted: agent.metadata?.tasksCompleted || 0,
      successRate: agent.metadata?.successRate || 0,
      avgResponseTime: agent.metadata?.avgResponseTime || '0s',
    },
    icon: typeIcons[type] || typeIcons.default,
    gradient: typeGradients[type] || typeGradients.default,
  };
};

/**
 * AGENTS PAGE REVOLUTION
 * Bold. Modern. Premium.
 * Now with REAL data from the backend API!
 */
export const AgentsRevolution = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [agents, setAgents] = useState<UIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedAgents = await agentService.getAgents();
      setAgents(fetchedAgents.map(transformAgent));
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError('An unexpected error occurred while fetching your agents. Please try again.');
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  // Filter logic
  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.tagline.toLowerCase().includes(searchQuery.toLowerCase());
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

        {/* AGENTS GRID - BOLD CARDS */}
        <div className="grid md:grid-cols-2 gap-8">
          {filteredAgents.map((agent) => (
            <GlassCard
              key={agent.id}
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
                    className={`w-20 h-20 rounded-2xl bg-linear-to-br ${agent.gradient} flex items-center justify-center shadow-2xl group-hover:scale-110 transform transition-transform`}
                  >
                    <agent.icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex items-center gap-3">
                    {agent.status === 'Active' ? (
                      <Badge className="px-4 py-2 bg-green-500/20 text-green-400 border-green-500/30 font-semibold">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Active
                      </Badge>
                    ) : (
                      <Badge className="px-4 py-2 bg-yellow-500/20 text-yellow-400 border-yellow-500/30 font-semibold">
                        <Clock className="w-4 h-4 mr-2" />
                        Paused
                      </Badge>
                    )}
                  </div>
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
                    <p className="text-2xl font-bold text-green-400">
                      {agent.metrics.successRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">
                      Speed
                    </p>
                    <p className="text-2xl font-bold text-blue-400">
                      {agent.metrics.avgResponseTime}
                    </p>
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

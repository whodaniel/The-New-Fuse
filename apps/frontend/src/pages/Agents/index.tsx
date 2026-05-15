// @ts-nocheck
import { Badge, GlassCard, PremiumButton, PremiumInput } from '@/components/ui';
import { agentService, type Agent } from '@/services/AgentService';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Bot,
  CheckCircle,
  Clock,
  Filter,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Transformed UI Agent interface
interface UIAgent {
  id: string;
  name: string;
  description: string;
  type: string;
  status: 'Active' | 'Inactive' | 'Maintenance';
  lastActive: string;
  tasks: number;
  successRate: string;
  capabilities: string[];
}

// Transform API agent to UI format
const transformAgent = (agent: Agent): UIAgent => ({
  id: agent.id,
  name: agent.name,
  description: agent.description || 'No description available',
  type: agent.type || 'General',
  status:
    agent.status === 'active' ? 'Active' : agent.status === 'error' ? 'Maintenance' : 'Inactive',
  lastActive: agent.updatedAt ? formatTimeAgo(new Date(agent.updatedAt)) : 'Unknown',
  tasks: agent.metadata?.tasksCompleted || 0,
  successRate: agent.metadata?.successRate ? `${agent.metadata.successRate}%` : 'N/A',
  capabilities: agent.capabilities || [],
});

// Format time ago helper
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

/**
 * Agents page component - Now with REAL data from the backend API!
 */
const Agents: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [agents, setAgents] = useState<UIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch agents from API
  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedAgents = await agentService.getAgents();
      setAgents(fetchedAgents.map(transformAgent));
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError('Failed to load agents. Please try again.');
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter agents based on search query and filters
  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || agent.type === filterType;
    const matchesStatus = filterStatus === 'All' || agent.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Get unique agent types for filter
  const agentTypes = ['All', ...new Set(agents.map((agent) => agent.type))];

  // Get unique agent statuses for filter
  const agentStatuses = ['All', 'Active', 'Inactive', 'Maintenance'];

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      case 'Inactive':
        return (
          <Badge className="bg-transparent0/10 text-gray-400 border-gray-500/20 hover:bg-muted/200/20">
            <Clock className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      case 'Maintenance':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20">
            <AlertCircle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-xl text-gray-400">Loading your AI agents...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-xl text-red-400 mb-4">{error}</p>
          <PremiumButton variant="gradient" onClick={fetchAgents}>
            <RefreshCw className="w-4 h-4 mr-2" /> Try Again
          </PremiumButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-lg">
        <div>
          <h1 className="text-5xl font-extrabold text-white mb-sm font-heading">My AI Agents</h1>
          <p className="text-lg text-gray-400">
            Manage and monitor your deployed AI workforce
            <span className="text-blue-400 ml-2">({agents.length} agents)</span>
          </p>
        </div>
        <div className="flex gap-3">
          <PremiumButton variant="glass" size="sm" onClick={fetchAgents}>
            <RefreshCw className="h-4 w-4" />
          </PremiumButton>
          <PremiumButton variant="gradient" size="lg" glow onClick={() => navigate('/agents/new')}>
            <Plus className="mr-sm h-5 w-5" /> Deploy New Agent
          </PremiumButton>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <GlassCard className="p-xl">
        <div className="flex flex-col md:flex-row gap-lg">
          <div className="relative flex-1">
            <Search className="absolute left-lg top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <PremiumInput
              placeholder="Search agents by name or description..."
              className="h-14 pl-14 text-base bg-transparent/5 border-white/10 text-white placeholder:text-muted-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-md">
            <div className="relative min-w-[140px]">
              <select
                className="h-14 w-full px-lg py-md rounded-md border border-white/10 bg-transparent/5 backdrop-blur-sm text-base text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer hover:bg-transparent/10 transition-all"
                value={filterType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFilterType(e.target.value)
                }
              >
                {agentTypes.map((type: string) => (
                  <option key={type} value={type} className="bg-gray-900">
                    {type}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-lg top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
            </div>
            <div className="relative min-w-[140px]">
              <select
                className="h-14 w-full px-lg py-md rounded-md border border-white/10 bg-transparent/5 backdrop-blur-sm text-base text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer hover:bg-transparent/10 transition-all"
                value={filterStatus}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFilterStatus(e.target.value)
                }
              >
                {agentStatuses.map((status) => (
                  <option key={status} value={status} className="bg-gray-900">
                    {status}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-lg top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Premium Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-xl">
        {filteredAgents.map((agent, index) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <GlassCard
              hoverEffect
              className="h-full flex flex-col justify-between group cursor-pointer p-3xl"
              onClick={() => navigate(`/agents/${agent.id}`)}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-md bg-gradient-to-br from-blue-500/10 to-purple-500/10 group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all">
                    <Bot className="h-6 w-6 text-blue-400 group-hover:text-blue-300 transition-colors" />
                  </div>
                  <div className="flex items-center">
                    {getStatusBadge(agent.status)}
                    <button
                      className="ml-2 p-1 text-muted-foreground hover:text-white transition-colors rounded-full hover:bg-transparent/10"
                      title="More options"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        // Menu logic here
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-md group-hover:text-blue-300 transition-colors font-heading">
                  {agent.name}
                </h3>
                <p className="text-base text-gray-400 mb-xl line-clamp-2 leading-relaxed">
                  {agent.description}
                </p>

                <div className="grid grid-cols-3 gap-lg py-lg border-t border-white/10 mb-md">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-sm font-semibold">
                      Type
                    </p>
                    <p className="text-base font-semibold text-gray-200">{agent.type}</p>
                  </div>
                  <div className="text-center border-l border-white/10">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-sm font-semibold">
                      Tasks
                    </p>
                    <p className="text-base font-semibold text-gray-200">{agent.tasks}</p>
                  </div>
                  <div className="text-center border-l border-white/10">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-sm font-semibold">
                      Success
                    </p>
                    <p className="text-base font-semibold text-green-400">{agent.successRate}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm text-muted-foreground mt-lg pt-lg border-t border-white/10">
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-sm" />
                  Last active: {agent.lastActive}
                </span>
                <span className="text-blue-400 font-semibold group-hover:translate-x-2 transition-transform inline-flex items-center">
                  View Details <span className="ml-sm">→</span>
                </span>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      {filteredAgents.length === 0 && (
        <GlassCard className="text-center py-16">
          <Bot className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No agents found</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {searchQuery || filterType !== 'All' || filterStatus !== 'All'
              ? "Try adjusting your search or filters to find what you're looking for."
              : 'Create your first AI agent to get started automating your workflow.'}
          </p>
          <PremiumButton variant="gradient" glow onClick={() => navigate('/agents/new')}>
            <Plus className="mr-2 h-4 w-4" /> Create First Agent
          </PremiumButton>
        </GlassCard>
      )}
    </div>
  );
};

export default Agents;

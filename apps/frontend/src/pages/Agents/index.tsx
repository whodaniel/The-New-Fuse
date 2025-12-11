import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { GlassCard, PremiumButton } from '@/components/ui/premium';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Bot,
  CheckCircle,
  Clock,
  Code,
  Database,
  FileText,
  Filter,
  MoreVertical,
  Plus,
  Search,
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Mock data for agents
const mockAgents = [
  {
    id: 1,
    name: 'CodeAssistant',
    description: 'Helps with coding tasks and code reviews',
    type: 'Development',
    status: 'Active',
    lastActive: '2 minutes ago',
    tasks: 42,
    successRate: '98%',
    icon: Code,
  },
  {
    id: 2,
    name: 'DataAnalyzer',
    description: 'Analyzes data and generates insights',
    type: 'Analytics',
    status: 'Active',
    lastActive: '15 minutes ago',
    tasks: 38,
    successRate: '95%',
    icon: Database,
  },
  {
    id: 3,
    name: 'ContentWriter',
    description: 'Creates and edits content for various platforms',
    type: 'Content',
    status: 'Inactive',
    lastActive: '2 days ago',
    tasks: 31,
    successRate: '92%',
    icon: FileText,
  },
  {
    id: 4,
    name: 'BugHunter',
    description: 'Identifies and fixes bugs in the codebase',
    type: 'QA',
    status: 'Maintenance',
    lastActive: '1 hour ago',
    tasks: 27,
    successRate: '89%',
    icon: Bot,
  },
  {
    id: 5,
    name: 'APIIntegrator',
    description: 'Handles API integrations and data synchronization',
    type: 'Development',
    status: 'Active',
    lastActive: '30 minutes ago',
    tasks: 24,
    successRate: '94%',
    icon: Code,
  },
  {
    id: 6,
    name: 'DocumentationBot',
    description: 'Creates and maintains documentation',
    type: 'Content',
    status: 'Active',
    lastActive: '45 minutes ago',
    tasks: 19,
    successRate: '97%',
    icon: FileText,
  },
];

/**
 * Agents page component
 */
const Agents: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Filter agents based on search query and filters
  const filteredAgents = mockAgents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || agent.type === filterType;
    const matchesStatus = filterStatus === 'All' || agent.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Get unique agent types for filter
  const agentTypes = ['All', ...new Set(mockAgents.map((agent) => agent.type))];

  // Get unique agent statuses for filter
  const agentStatuses = ['All', ...new Set(mockAgents.map((agent) => agent.status))];

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
          <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20">
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

  return (
    <div className="space-y-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-lg">
        <div>
          <h1 className="text-5xl font-extrabold text-white mb-sm font-heading">My AI Agents</h1>
          <p className="text-lg text-gray-400">Manage and monitor your deployed AI workforce</p>
        </div>
        <PremiumButton variant="gradient" size="lg" glow onClick={() => navigate('/agents/new')}>
          <Plus className="mr-sm h-5 w-5" /> Deploy New Agent
        </PremiumButton>
      </div>

      {/* Enhanced Search and Filters */}
      <GlassCard className="p-xl">
        <div className="flex flex-col md:flex-row gap-lg">
          <div className="relative flex-1">
            <Search className="absolute left-lg top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search agents by name or description..."
              className="h-14 pl-14 text-base bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-md">
            <div className="relative min-w-[140px]">
              <select
                className="h-14 w-full px-lg py-md rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm text-base text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer hover:bg-white/10 transition-all"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
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
                className="h-14 w-full px-lg py-md rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm text-base text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer hover:bg-white/10 transition-all"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
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
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard
              hoverEffect
              className="h-full flex flex-col justify-between group cursor-pointer p-3xl"
              onClick={() => navigate(`/agents/${agent.id}`)}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all">
                    <agent.icon className="h-6 w-6 text-blue-400 group-hover:text-blue-300 transition-colors" />
                  </div>
                  <div className="flex items-center">
                    {getStatusBadge(agent.status)}
                    <button
                      className="ml-2 p-1 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-white/10"
                      title="More options"
                      onClick={(e) => {
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
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-sm font-semibold">
                      Type
                    </p>
                    <p className="text-base font-semibold text-gray-200">{agent.type}</p>
                  </div>
                  <div className="text-center border-l border-white/10">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-sm font-semibold">
                      Tasks
                    </p>
                    <p className="text-base font-semibold text-gray-200">{agent.tasks}</p>
                  </div>
                  <div className="text-center border-l border-white/10">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-sm font-semibold">
                      Success
                    </p>
                    <p className="text-base font-semibold text-green-400">{agent.successRate}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm text-gray-500 mt-lg pt-lg border-t border-white/10">
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
          <Bot className="mx-auto h-16 w-16 text-gray-600 mb-4" />
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

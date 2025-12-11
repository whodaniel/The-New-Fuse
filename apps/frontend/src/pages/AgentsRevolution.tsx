import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  Code2,
  Command,
  Database,
  FileCode,
  Filter,
  Layers,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Mock data - completely rewritten
const revolutionaryAgents = [
  {
    id: 1,
    name: 'CodeGenius Pro',
    tagline: 'Your AI pair programmer that never sleeps',
    description:
      'Refactors legacy code, writes tests, and ships features 10x faster than human developers.',
    category: 'Development',
    status: 'Active',
    metrics: {
      tasksCompleted: 1247,
      successRate: 99.2,
      avgResponseTime: '1.2s',
    },
    icon: Code2,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 2,
    name: 'DataOracle AI',
    tagline: 'Transform chaos into insights',
    description:
      'Analyzes petabytes of data, predicts trends, and delivers actionable business intelligence in real-time.',
    category: 'Analytics',
    status: 'Active',
    metrics: {
      tasksCompleted: 892,
      successRate: 97.8,
      avgResponseTime: '2.1s',
    },
    icon: Database,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 3,
    name: 'ContentMaster',
    tagline: 'Write. Edit. Dominate.',
    description:
      'Generates SEO-optimized content, adapts tone for any audience, and publishes across all platforms.',
    category: 'Content',
    status: 'Paused',
    metrics: {
      tasksCompleted: 634,
      successRate: 94.5,
      avgResponseTime: '3.4s',
    },
    icon: FileCode,
    gradient: 'from-orange-500 to-red-500',
  },
  {
    id: 4,
    name: 'SecurityGuardian',
    tagline: 'Zero-day defender',
    description:
      'Scans codebases for vulnerabilities, patches exploits automatically, and monitors 24/7 for threats.',
    category: 'Security',
    status: 'Active',
    metrics: {
      tasksCompleted: 2103,
      successRate: 99.9,
      avgResponseTime: '0.8s',
    },
    icon: Layers,
    gradient: 'from-green-500 to-emerald-500',
  },
];

/**
 * AGENTS PAGE REVOLUTION
 * Bold. Modern. Premium.
 */
export const AgentsRevolution = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Filter logic
  const filteredAgents = revolutionaryAgents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || agent.category === filterCategory;
    const matchesStatus = filterStatus === 'All' || agent.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = ['All', ...new Set(revolutionaryAgents.map((a) => a.category))];
  const statuses = ['All', ...new Set(revolutionaryAgents.map((a) => a.status))];

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
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                That Actually Work
              </span>
            </h1>
            <p className="text-2xl text-gray-400 max-w-2xl leading-relaxed">
              Deploy autonomous agents that think, execute, and scale infinitely.{' '}
              <span className="text-white font-semibold">No babysitting required.</span>
            </p>
          </div>
          <Button
            onClick={() => navigate('/agents/new')}
            className="h-16 px-10 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-[0_0_40px_rgba(59,130,246,0.6)] hover:shadow-[0_0_60px_rgba(59,130,246,0.8)] transform hover:scale-105 transition-all duration-300 whitespace-nowrap"
          >
            <Plus className="mr-3 h-6 w-6" />
            Deploy New Agent
            <ArrowRight className="ml-3 h-6 w-6" />
          </Button>
        </div>

        {/* SEARCH & FILTERS - PREMIUM */}
        <div className="p-8 rounded-3xl bg-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
              <Input
                placeholder="Search by name, capability, or use case..."
                className="h-16 pl-16 pr-6 text-lg bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-2xl transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <div className="relative min-w-[180px]">
                <Filter className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                <select
                  className="h-16 w-full pl-14 pr-6 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm text-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer hover:bg-white/10 transition-all"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-gray-900">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative min-w-[160px]">
                <select
                  className="h-16 w-full px-6 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm text-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer hover:bg-white/10 transition-all"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status} className="bg-gray-900">
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* AGENTS GRID - BOLD CARDS */}
        <div className="grid md:grid-cols-2 gap-8">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              onClick={() => navigate(`/agents/${agent.id}`)}
              className="group relative p-10 rounded-3xl bg-white/[0.02] backdrop-blur-2xl border border-white/10 hover:border-white/30 transition-all duration-500 cursor-pointer overflow-hidden"
            >
              {/* Gradient Overlay on Hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${agent.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
              />

              <div className="relative z-10 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${agent.gradient} flex items-center justify-center shadow-2xl group-hover:scale-110 transform transition-transform`}
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
                  <h3 className="text-4xl font-black text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all">
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
            </div>
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
            <Button
              onClick={() => navigate('/agents/new')}
              className="h-16 px-12 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-[0_0_40px_rgba(59,130,246,0.6)] hover:shadow-[0_0_60px_rgba(59,130,246,0.8)] transform hover:scale-105 transition-all duration-300"
            >
              <Plus className="mr-3 h-6 w-6" />
              Deploy Your First Agent
            </Button>
          </div>
        )}

        {/* Stats Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16">
          <div className="p-8 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-4">
              <Command className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-5xl font-black text-white mb-2">{revolutionaryAgents.length}</p>
            <p className="text-lg text-gray-400">Agents Deployed</p>
          </div>
          <div className="p-8 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-5xl font-black text-white mb-2">97.9%</p>
            <p className="text-lg text-gray-400">Avg Success Rate</p>
          </div>
          <div className="p-8 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mb-4">
              <Zap className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-5xl font-black text-white mb-2">1.9s</p>
            <p className="text-lg text-gray-400">Avg Response Time</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentsRevolution;

/**
 * Agent Browser Component
 *
 * Real-time agent discovery and capability browsing interface
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Activity,
  Cpu,
  CheckCircle,
  XCircle,
  Zap,
  TrendingUp,
  Clock,
  DollarSign,
} from 'lucide-react';

interface AgentCapability {
  name: string;
  version: string;
  description: string;
  languages?: string[];
  frameworks?: string[];
  confidence: number;
  pricing?: {
    perInvocation?: number;
    perMinute?: number;
    perToken?: number;
    currency?: string;
  };
}

interface AgentHealthMetrics {
  isHealthy: boolean;
  uptime: number;
  successRate: number;
  avgResponseTime: number;
  cpuUsage: number;
  memoryUsage: number;
  activeTasks: number;
  totalTasks: number;
  failedTasks: number;
}

interface DiscoveredAgent {
  registration: {
    agentId: string;
    name: string;
    description?: string;
    type?: string;
    groups?: string[];
    capabilities: AgentCapability[];
    version: string;
  };
  status: 'online' | 'busy' | 'idle' | 'offline' | 'error';
  load: number;
  metrics: AgentHealthMetrics;
  lastHeartbeat: Date;
  score?: number;
}

interface DiscoveryQuery {
  capability?: string;
  languages?: string[];
  frameworks?: string[];
  groups?: string[];
  maxCpuUsage?: number;
  maxLoad?: number;
  minConfidence?: number;
  minSuccessRate?: number;
  semanticSearch?: boolean;
  sortBy?: 'relevance' | 'load' | 'successRate' | 'responseTime' | 'uptime';
  limit?: number;
}

export const AgentBrowser: React.FC = () => {
  const [agents, setAgents] = useState<DiscoveredAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<DiscoveredAgent | null>(null);
  const [filters, setFilters] = useState<DiscoveryQuery>({
    semanticSearch: true,
    sortBy: 'relevance',
    limit: 50,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch agents
  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const query: DiscoveryQuery = {
        ...filters,
        capability: searchQuery || undefined,
      };

      const response = await fetch('/api/agents/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query),
      });

      const data = await response.json();
      setAgents(data.data.agents || []);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Real-time updates (would connect to WebSocket)
  useEffect(() => {
    const interval = setInterval(fetchAgents, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchAgents]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'idle':
        return 'bg-blue-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (isHealthy: boolean) => {
    return isHealthy ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatCost = (pricing: AgentCapability['pricing']) => {
    if (!pricing) return 'Free';
    if (pricing.perInvocation) {
      return `$${pricing.perInvocation.toFixed(4)}/call`;
    }
    if (pricing.perMinute) {
      return `$${pricing.perMinute.toFixed(4)}/min`;
    }
    if (pricing.perToken) {
      return `$${pricing.perToken.toFixed(6)}/token`;
    }
    return 'Free';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Agent List */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search capabilities (e.g., 'review Python code')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <span className="text-sm text-gray-500">{agents.length} agents</span>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max CPU Usage
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.maxCpuUsage || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, maxCpuUsage: Number(e.target.value) || undefined })
                  }
                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded"
                  placeholder="e.g., 80"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Success Rate
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={filters.minSuccessRate || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, minSuccessRate: Number(e.target.value) || undefined })
                  }
                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded"
                  placeholder="e.g., 0.9"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      sortBy: e.target.value as DiscoveryQuery['sortBy'],
                    })
                  }
                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value="relevance">Relevance</option>
                  <option value="load">Load</option>
                  <option value="successRate">Success Rate</option>
                  <option value="responseTime">Response Time</option>
                  <option value="uptime">Uptime</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Agent List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {agents.map((agent) => (
                <div
                  key={agent.registration.agentId}
                  onClick={() => setSelectedAgent(agent)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedAgent?.registration.agentId === agent.registration.agentId
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {agent.registration.name}
                        </h3>
                        <span
                          className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {agent.registration.description || 'No description'}
                      </p>
                    </div>
                    {agent.score !== undefined && (
                      <div className="ml-2 text-xs font-semibold text-blue-600">
                        {(agent.score * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Activity className="w-3 h-3" />
                      {(agent.load * 100).toFixed(0)}%
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <TrendingUp className="w-3 h-3" />
                      {(agent.metrics.successRate * 100).toFixed(0)}%
                    </div>
                    {getStatusIcon(agent.metrics.isHealthy)}
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {agent.registration.capabilities.slice(0, 3).map((cap, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded"
                      >
                        {cap.name}
                      </span>
                    ))}
                    {agent.registration.capabilities.length > 3 && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        +{agent.registration.capabilities.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Panel - Agent Details */}
      <div className="flex-1 overflow-y-auto">
        {selectedAgent ? (
          <div className="p-6">
            {/* Agent Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {selectedAgent.registration.name}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedAgent.registration.agentId}
                  </p>
                  {selectedAgent.registration.description && (
                    <p className="text-gray-700 mt-3">{selectedAgent.registration.description}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedAgent.status === 'online'
                        ? 'bg-green-100 text-green-800'
                        : selectedAgent.status === 'busy'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {selectedAgent.status.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">
                    v{selectedAgent.registration.version}
                  </span>
                </div>
              </div>

              {selectedAgent.registration.groups && selectedAgent.registration.groups.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedAgent.registration.groups.map((group, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                    >
                      {group}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Health Metrics */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Health Metrics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Cpu className="w-4 h-4" />
                    <span className="text-xs font-medium">CPU Usage</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedAgent.metrics.cpuUsage.toFixed(1)}%
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Activity className="w-4 h-4" />
                    <span className="text-xs font-medium">Load</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {(selectedAgent.load * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-medium">Success Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {(selectedAgent.metrics.successRate * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium">Avg Response</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedAgent.metrics.avgResponseTime}ms
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs font-medium">Active Tasks</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedAgent.metrics.activeTasks}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Total Tasks</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedAgent.metrics.totalTasks}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <XCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Failed Tasks</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedAgent.metrics.failedTasks}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium">Uptime</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {formatUptime(selectedAgent.metrics.uptime)}
                  </div>
                </div>
              </div>
            </div>

            {/* Capabilities */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Capabilities</h2>
              <div className="space-y-4">
                {selectedAgent.registration.capabilities.map((capability, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{capability.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{capability.description}</p>

                        {(capability.languages || capability.frameworks) && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {capability.languages?.map((lang, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium"
                              >
                                {lang}
                              </span>
                            ))}
                            {capability.frameworks?.map((fw, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium"
                              >
                                {fw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="ml-4 text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {(capability.confidence * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500">confidence</div>

                        {capability.pricing && (
                          <div className="mt-2 flex items-center gap-1 text-sm text-gray-700">
                            <DollarSign className="w-3 h-3" />
                            {formatCost(capability.pricing)}
                          </div>
                        )}

                        <div className="text-xs text-gray-500 mt-1">v{capability.version}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg">Select an agent to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentBrowser;

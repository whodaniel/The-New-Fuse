import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Agent {
  id: string;
  name: string;
  description: string;
  type: 'chat' | 'task' | 'analysis' | 'automation';
  status: 'active' | 'inactive' | 'training' | 'error';
  model: string;
  capabilities: string[];
  createdAt: string;
  lastActive: string;
  messagesCount: number;
  successRate: number;
  avgResponseTime: number;
  version: string;
  workspaceId: string;
  workspaceName: string;
  owner: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('lastActive');

  // Mock data - replace with API call
  useEffect(() => {
    setTimeout(() => {
      setAgents([
        {
          id: '1',
          name: 'CustomerSupport AI',
          description: 'Handles customer inquiries and provides support solutions',
          type: 'chat',
          status: 'active',
          model: 'GPT-4',
          capabilities: ['Natural Language Processing', 'Knowledge Base', 'Ticket Creation'],
          createdAt: '2024-01-01T00:00:00Z',
          lastActive: '2024-01-16T10:30:00Z',
          messagesCount: 1247,
          successRate: 94.5,
          avgResponseTime: 1.2,
          version: '2.1.0',
          workspaceId: 'ws1',
          workspaceName: 'Customer Success',
          owner: 'Alice Johnson'
        },
        {
          id: '2',
          name: 'DataAnalyst Bot',
          description: 'Analyzes data patterns and generates insights',
          type: 'analysis',
          status: 'active',
          model: 'Claude-3',
          capabilities: ['Data Analysis', 'Report Generation', 'Visualization'],
          createdAt: '2024-01-05T00:00:00Z',
          lastActive: '2024-01-16T09:45:00Z',
          messagesCount: 892,
          successRate: 98.1,
          avgResponseTime: 2.8,
          version: '1.5.2',
          workspaceId: 'ws2',
          workspaceName: 'Analytics Team',
          owner: 'Bob Wilson'
        },
        {
          id: '3',
          name: 'TaskAutomator',
          description: 'Automates repetitive tasks and workflows',
          type: 'automation',
          status: 'training',
          model: 'GPT-3.5',
          capabilities: ['Workflow Automation', 'Task Scheduling', 'Integration'],
          createdAt: '2024-01-10T00:00:00Z',
          lastActive: '2024-01-15T14:20:00Z',
          messagesCount: 234,
          successRate: 87.3,
          avgResponseTime: 0.8,
          version: '1.0.1',
          workspaceId: 'ws3',
          workspaceName: 'Operations',
          owner: 'Carol Brown'
        },
        {
          id: '4',
          name: 'CodeReviewer AI',
          description: 'Reviews code and provides suggestions for improvements',
          type: 'task',
          status: 'active',
          model: 'GPT-4',
          capabilities: ['Code Analysis', 'Security Review', 'Best Practices'],
          createdAt: '2024-01-08T00:00:00Z',
          lastActive: '2024-01-16T11:15:00Z',
          messagesCount: 567,
          successRate: 91.7,
          avgResponseTime: 3.2,
          version: '1.8.0',
          workspaceId: 'ws1',
          workspaceName: 'Development',
          owner: 'David Lee'
        },
        {
          id: '5',
          name: 'SalesAssistant',
          description: 'Assists with lead qualification and sales processes',
          type: 'chat',
          status: 'inactive',
          model: 'GPT-3.5',
          capabilities: ['Lead Scoring', 'CRM Integration', 'Email Automation'],
          createdAt: '2024-01-12T00:00:00Z',
          lastActive: '2024-01-14T16:30:00Z',
          messagesCount: 156,
          successRate: 89.4,
          avgResponseTime: 1.8,
          version: '1.2.3',
          workspaceId: 'ws4',
          workspaceName: 'Sales Team',
          owner: 'Eve Martinez'
        },
        {
          id: '6',
          name: 'ContentGenerator',
          description: 'Generates marketing content and copy',
          type: 'task',
          status: 'error',
          model: 'Claude-3',
          capabilities: ['Content Creation', 'SEO Optimization', 'Social Media'],
          createdAt: '2024-01-14T00:00:00Z',
          lastActive: '2024-01-15T12:45:00Z',
          messagesCount: 89,
          successRate: 76.8,
          avgResponseTime: 4.1,
          version: '0.9.5',
          workspaceId: 'ws5',
          workspaceName: 'Marketing',
          owner: 'Frank Garcia'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusBadge = (status: Agent['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'training':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeBadge = (type: Agent['type']) => {
    switch (type) {
      case 'chat':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'task':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'analysis':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'automation':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: Agent['status']) => {
    switch (status) {
      case 'active': return '🟢';
      case 'inactive': return '⚫';
      case 'training': return '🔵';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  const getTypeIcon = (type: Agent['type']) => {
    switch (type) {
      case 'chat': return '💬';
      case 'task': return '⚡';
      case 'analysis': return '📊';
      case 'automation': return '🤖';
      default: return '🔧';
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || agent.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const sortedAgents = [...filteredAgents].sort((a, b) => {
    switch (sortBy) {
      case 'lastActive':
        return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
      case 'name':
        return a.name.localeCompare(b.name);
      case 'successRate':
        return b.successRate - a.successRate;
      case 'messagesCount':
        return b.messagesCount - a.messagesCount;
      default:
        return 0;
    }
  });

  const handleAgentAction = (agentId: string, action: string) => {
    // Instead of logging to console, we'll update state or call an API
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Update the agent status based on action
      setAgents(prev => prev.map(agent => 
        agent.id === agentId && action === 'start' 
          ? {...agent, status: 'active' as const} 
          : agent.id === agentId && action === 'stop'
          ? {...agent, status: 'inactive' as const}
          : agent
      ));
      
      setLoading(false);
    }, 500);
    
    // TODO: Implement actual API calls for agent actions
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🤖 AI Agents</h1>
            <p className="text-gray-600">Manage and monitor all your AI agents across workspaces</p>
          </div>
          <div className="flex space-x-3">
            <Link
              to="/agents/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Create Agent
            </Link>
            <Link
              to="/dashboard/agents"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              📊 Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="text-2xl text-blue-600 mr-3">🤖</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{agents.length}</p>
              <p className="text-sm text-gray-600">Total Agents</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="text-2xl text-green-600 mr-3">🟢</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{agents.filter(a => a.status === 'active').length}</p>
              <p className="text-sm text-gray-600">Active Agents</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="text-2xl text-orange-600 mr-3">💬</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{agents.reduce((sum, a) => sum + a.messagesCount, 0).toLocaleString()}</p>
              <p className="text-sm text-gray-600">Total Messages</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="text-2xl text-purple-600 mr-3">📈</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{(agents.reduce((sum, a) => sum + a.successRate, 0) / agents.length).toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Avg Success Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div>
              <input
                type="text"
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="Filter by type"
                title="Filter by type"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="chat">Chat</option>
                <option value="task">Task</option>
                <option value="analysis">Analysis</option>
                <option value="automation">Automation</option>
 </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                title="Filter by status"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
 </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort agents by"
                title="Sort agents by"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Name</option>
                <option value="successRate">Success Rate</option>
                <option value="messagesCount">Messages</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">View:</span>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ⬜ Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📋 List
            </button>
          </div>
        </div>
      </div>

      {/* Agents Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAgents.map((agent) => (
            <div key={agent.id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">{getTypeIcon(agent.type)}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                      <p className="text-sm text-gray-500">v{agent.version}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full border ${getStatusBadge(agent.status)}`}>
                      {getStatusIcon(agent.status)}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full border ${getTypeBadge(agent.type)}`}>
                      {agent.type}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4">{agent.description}</p>

                {/* Model & Owner */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Model</p>
                    <p className="text-sm font-medium">{agent.model}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Owner</p>
                    <p className="text-sm font-medium">{agent.owner}</p>
                  </div>
                </div>

                {/* Capabilities */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Capabilities</p>
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities.slice(0, 3).map((capability, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        {capability}
                      </span>
                    ))}
                    {agent.capabilities.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        +{agent.capabilities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500">Messages</p>
                    <p className="text-sm font-bold text-blue-600">{agent.messagesCount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Success Rate</p>
                    <p className="text-sm font-bold text-green-600">{agent.successRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Avg Response</p>
                    <p className="text-sm font-bold text-purple-600">{agent.avgResponseTime}s</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Link
                    to={`/agents/${agent.id}`}
                    className="flex-1 bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => handleAgentAction(agent.id, agent.status === 'active' ? 'stop' : 'start')}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      agent.status === 'active'
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                  >
                    {agent.status === 'active' ? 'Stop' : 'Start'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Messages</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="text-xl mr-3">{getTypeIcon(agent.type)}</div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                          <div className="text-sm text-gray-500">{agent.description}</div>
                          <div className="text-xs text-gray-400">Owner: {agent.owner}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeBadge(agent.type)}`}>
                        {agent.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(agent.status)}`}>
                        {getStatusIcon(agent.status)} {agent.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {agent.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {agent.messagesCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${agent.successRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{agent.successRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(agent.lastActive).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/agents/${agent.id}`}
                          className="text-blue-600 hover:text-blue-900 px-2 py-1 text-xs"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleAgentAction(agent.id, 'edit')}
                          className="text-green-600 hover:text-green-900 px-2 py-1 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleAgentAction(agent.id, agent.status === 'active' ? 'stop' : 'start')}
                          className={`px-2 py-1 text-xs ${
                            agent.status === 'active' 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {agent.status === 'active' ? 'Stop' : 'Start'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sortedAgents.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🤖</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No agents found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria.</p>
          <Link
            to="/agents/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Agent
          </Link>
        </div>
      )}
    </div>
  );
}

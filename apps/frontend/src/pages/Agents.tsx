import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  lastActive: string;
  description: string;
  capabilities: string[];
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading agents from API
    setTimeout(() => {
      setAgents([
        {
          id: '1',
          name: 'Data Analyst Agent',
          type: 'Analytics',
          status: 'active',
          lastActive: '2 minutes ago',
          description: 'Specialized in data analysis and reporting',
          capabilities: ['Data Processing', 'Report Generation', 'Chart Creation']
        },
        {
          id: '2', 
          name: 'Customer Support Agent',
          type: 'Support',
          status: 'active',
          lastActive: '5 minutes ago',
          description: 'Handles customer inquiries and support tickets',
          capabilities: ['Chat Support', 'Ticket Management', 'FAQ Assistance']
        },
        {
          id: '3',
          name: 'Code Review Agent',
          type: 'Development',
          status: 'inactive',
          lastActive: '1 hour ago',
          description: 'Reviews code for quality and security issues',
          capabilities: ['Code Analysis', 'Security Scanning', 'Best Practices']
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🤖 AI Agents</h1>
              <p className="text-gray-600 mt-2">Manage and monitor your AI agents</p>
            </div>
            <Link to="/agents/new">
              <Button className="bg-blue-600 hover:bg-blue-700">
                ➕ Create New Agent
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">🤖</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Agents</p>
                  <p className="text-2xl font-bold text-gray-900">{agents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {agents.filter(a => a.status === 'active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <span className="text-2xl">⏸️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {agents.filter(a => a.status === 'inactive').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <span className="text-2xl">❌</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Errors</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {agents.filter(a => a.status === 'error').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agents List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`}></div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{agent.type}</Badge>
                  <span className="text-sm text-gray-500">{agent.lastActive}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{agent.description}</p>
                
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Capabilities:</p>
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities.map((capability, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link to={`/agents/${agent.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Button 
                    variant={agent.status === 'active' ? 'destructive' : 'default'}
                    className="flex-1"
                  >
                    {agent.status === 'active' ? 'Stop' : 'Start'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🚀 Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/agents/new">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <span className="text-2xl mb-2">➕</span>
                <span>Create Agent</span>
              </Button>
            </Link>
            <Link to="/dashboard/agents">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <span className="text-2xl mb-2">📊</span>
                <span>View Analytics</span>
              </Button>
            </Link>
            <Link to="/multi-agent-chat">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <span className="text-2xl mb-2">💬</span>
                <span>Multi-Agent Chat</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

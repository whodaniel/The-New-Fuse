import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  Bot, 
  Code, 
  FileText, 
  Database, 
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
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
  const filteredAgents = mockAgents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || agent.type === filterType;
    const matchesStatus = filterStatus === 'All' || agent.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });
  
  // Get unique agent types for filter
  const agentTypes = ['All', ...new Set(mockAgents.map(agent => agent.type))];
  
  // Get unique agent statuses for filter
  const agentStatuses = ['All', ...new Set(mockAgents.map(agent => agent.status))];
  
  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      case 'Inactive':
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            <Clock className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      case 'Maintenance':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <AlertCircle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Agents</h1>
              <p className="text-muted-foreground">Manage and monitor your AI agents</p>
            </div>
            <Button onClick={() => navigate('/agents/new')}>
              <Plus className="mr-2 h-4 w-4"/> Create Agent
            </Button>
          </div>
          
          {/* Search and filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search agents..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <select
                  className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  {agentTypes.map(typ(e: any) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              </div>
              <div className="relative">
                <select
                  className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  {agentStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              </div>
            </div>
          </div>
          
          {/* Agents grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map(agent => (
              <Card key={agent.id} className="overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <agent.icon className="h-6 w-6 text-primary"/>
                    </div>
                    <div className="flex items-center">
                      {getStatusBadge(agent.status)}
                      <button className="ml-2 text-gray-500 hover:text-gray-700">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{agent.name}</h3>
                  <p className="text-muted-foreground mb-4">{agent.description}</p>
                  <div className="flex justify-between text-sm">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium">{agent.type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tasks</p>
                      <p className="font-medium">{agent.tasks}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Success</p>
                      <p className="font-medium">{agent.successRate}</p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-muted/50 flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Last active: {agent.lastActive}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/agents/${agent.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Empty state */}
          {filteredAgents.length === 0 && (
            <div className="text-center py-12">
              <Bot className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No agents found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterType !== 'All' || filterStatus !== 'All'
                  ? "Try adjusting your search or filters"
                  : "Create your first agent to get started"}
              </p>
              <Button onClick={() => navigate('/agents/new')}>
                <Plus className="mr-2 h-4 w-4"/> Create Agent
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Agents;

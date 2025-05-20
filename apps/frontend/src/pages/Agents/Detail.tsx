import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bot,
  Code,
  FileText,
  Database,
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
  Activity,
  List,
  MessageSquare,
  History,
  Edit,
  Trash2,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';

// Mock data for agent details
const mockAgentDetails = {
  id: 1,
  name: 'CodeAssistant',
  description: 'Helps with coding tasks and code reviews',
  type: 'Development',
  status: 'Active',
  lastActive: '2 minutes ago',
  tasks: 42,
  successRate: '98%',
  icon: Code,
  createdAt: '2023-04-15',
  createdBy: 'John Doe',
  capabilities: [
    'Code generation',
    'Code review',
    'Bug fixing',
    'Documentation',
    'Refactoring'
  ],
  configuration: {
    model: 'GPT-4',
    temperature: 0.7,
    maxTokens: 4096,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0
  },
  recentTasks: [
    {
      id: 1,
      title: 'Implement new API endpoint',
      status: 'Completed',
      completedAt: '2023-06-10'
    },
    {
      id: 2,
      title: 'Fix authentication bug',
      status: 'In Progress',
      startedAt: '2023-06-12'
    },
    {
      id: 3,
      title: 'Optimize database queries',
      status: 'Pending',
      assignedAt: '2023-06-11'
    }
  ],
  logs: [
    {
      timestamp: '2023-06-12T14:30:00Z',
      level: 'INFO',
      message: 'Agent started task #2: Fix authentication bug'
    },
    {
      timestamp: '2023-06-12T14:35:22Z',
      level: 'INFO',
      message: 'Analyzing authentication flow'
    },
    {
      timestamp: '2023-06-12T14:40:15Z',
      level: 'WARNING',
      message: 'Detected potential security issue in token validation'
    },
    {
      timestamp: '2023-06-12T14:45:30Z',
      level: 'INFO',
      message: 'Implementing fix for token validation'
    }
  ]
};

/**
 * Agent Detail page component
 */
const AgentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  
  // In a real app, we would fetch the agent details based on the ID
  const agent = mockAgentDetails;
  
  // Get status badge
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
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    });
  };
  
  // Get log level badge
  const getLogLevelBadge = (level: string) => {
    switch (level) {
      case 'INFO':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{level}</Badge>;
      case 'WARNING':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{level}</Badge>;
      case 'ERROR':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{level}</Badge>;
      case 'DEBUG':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">{level}</Badge>;
      default:
        return <Badge>{level}</Badge>;
    }
  };
  
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-primary/10 mr-4">
                <agent.icon className="h-8 w-8 text-primary"/>
              </div>
              <div>
                <h1 className="text-3xl font-bold">{agent.name}</h1>
                <p className="text-muted-foreground">{agent.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {agent.status === 'Active' ? (
                <Button variant="outline" size="sm">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Agent
                </Button>
              ) : (
                <Button variant="outline" size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Activate Agent
                </Button>
              )}
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Restart
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                {getStatusBadge(agent.status)}
              </div>
              <div className="text-2xl font-bold">{agent.status}</div>
              <p className="text-sm text-muted-foreground">Last active: {agent.lastActive}</p>
            </Card>
            
            <Card className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Tasks Completed</h3>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{agent.tasks}</div>
              <p className="text-sm text-muted-foreground">Success rate: {agent.successRate}</p>
            </Card>
            
            <Card className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                <History className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{formatDate(agent.createdAt)}</div>
              <p className="text-sm text-muted-foreground">By: {agent.createdBy}</p>
            </Card>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">
                <Bot className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="tasks">
                <List className="h-4 w-4 mr-2" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="logs">
                <Activity className="h-4 w-4 mr-2" />
                Logs
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Agent Capabilities</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {agent.capabilities.map((capability, index) => (
                      <Badge key={index} variant="outline">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-muted-foreground">
                    This agent is designed to assist with various coding tasks, including code generation,
                    code review, bug fixing, documentation, and refactoring. It uses advanced AI models
                    to understand code context and provide helpful suggestions.
                  </p>
                </div>
              </Card>
              
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {agent.recentTasks.map((task) => (
                      <div key={task.id} className="flex justify-between items-center p-3 border rounded-md">
                        <div>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {task.status === 'Completed' ? `Completed on ${task.completedAt}` :
                             task.status === 'In Progress' ? `Started on ${task.startedAt}` :
                             `Assigned on ${task.assignedAt}`}
                          </div>
                        </div>
                        <Badge
                          className={
                            task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }
                        >
                          {task.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="tasks" className="space-y-6">
              <Card>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Task History</h3>
                    <Button variant="outline" size="sm">
                      <List className="h-4 w-4 mr-2" />
                      View All Tasks
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {/* This would be a more comprehensive task list in a real app */}
                    <p className="text-muted-foreground">
                      Detailed task history would be displayed here, including all tasks assigned to this agent,
                      their status, completion time, and performance metrics.
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="logs" className="space-y-6">
              <Card>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Agent Logs</h3>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Logs
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {agent.logs.map((log, index) => (
                      <div key={index} className="flex items-start p-2 border-b last:border-0">
                        <div className="w-40 shrink-0 text-sm text-muted-foreground">
                          {formatTimestamp(log.timestamp)}
                        </div>
                        <div className="w-20 shrink-0">
                          {getLogLevelBadge(log.level)}
                        </div>
                        <div className="flex-1 text-sm">
                          {log.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Agent Configuration</h3>
                  <div className="space-y-4">
                    {Object.entries(agent.configuration).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center p-3 border rounded-md">
                        <div className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                        <div className="text-muted-foreground">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
              
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Advanced Settings</h3>
                  <p className="text-muted-foreground mb-4">
                    Advanced settings would be displayed here, including API keys, integration settings,
                    permissions, and other configuration options.
                  </p>
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Configuration
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AgentDetail;

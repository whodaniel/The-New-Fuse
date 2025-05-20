import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentNetwork } from './agent-network.js';
import { AgentSelector } from './agent-selector.js';
import AgentPersonalityCustomizer from './agent-personality-customizer.js';
import { webSocketService } from '../services/websocket.js';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
export const AgentCollaborationDashboard = () => {
    interface Agent {
        id: string;
        name: string;
        // Add other properties as needed
    }

    interface Task {
        id: string;
        title: string;
        status: string;
        assignedTo: string;
        // Add other properties as needed
    }

    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [collaborationData, setCollaborationData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        const handleAgentUpdate = (updatedAgents: Agent[]) => {
            setAgents(updatedAgents);
        };
        const handleTaskUpdate = (updatedTasks: Task[]) => {
            setTasks(updatedTasks);
        };
        const handleCollaborationUpdate = (data: any[]) => {
            setCollaborationData(data);
            setIsLoading(false);
        };
        const handleError = (err: { message: string }) => {
            setError(err.message);
            setIsLoading(false);
        };
        webSocketService.on('agentsUpdate', handleAgentUpdate);
        webSocketService.on('tasksUpdate', handleTaskUpdate);
        webSocketService.on('collaborationMetricsUpdate', handleCollaborationUpdate);
        webSocketService.on('error', handleError);
        webSocketService.send('getAgents', {});
        webSocketService.send('getTasks', {});
        webSocketService.send('getCollaborationMetrics', {});
        return () => {
            webSocketService.off('agentsUpdate', handleAgentUpdate);
            webSocketService.off('tasksUpdate', handleTaskUpdate);
            webSocketService.off('collaborationMetricsUpdate', handleCollaborationUpdate);
            webSocketService.off('error', handleError);
        };
    }, []);
    if (isLoading) {
        return (<div className="container mx-auto p-4">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle>Agent Collaboration Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"/>
          </CardContent>
        </Card>
      </div>);
    }
    if (error) {
        return (<div className="container mx-auto p-4">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle>Agent Collaboration Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[400px] text-red-500">
            {error}
          </CardContent>
        </Card>
      </div>);
    }
    const handleNodeClick = (node: { id: string }) => {
        const agent = agents.find(agent => agent.id === node.id);
        if (agent) {
            setSelectedAgent(agent);
        }
    };
    const handleAgentSelect = (agent: Agent) => {
        setSelectedAgent(agent);
    };
    return (
      <div className="p-6">
        <div className="grid gap-6">
          <Tabs defaultValue="network" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="network">Network View</TabsTrigger>
              <TabsTrigger value="agents">Agent Management</TabsTrigger>
              <TabsTrigger value="tasks">Task Overview</TabsTrigger>
              <TabsTrigger value="collaboration">Collaboration Metrics</TabsTrigger>
            </TabsList>

            <TabsContent value="network" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Agent Collaboration Network</CardTitle>
                </CardHeader>
                <CardContent>
                  <AgentNetwork agents={agents} tasks={tasks} onNodeClick={handleNodeClick}/>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agents" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Agent Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <AgentSelector agents={agents} selectedAgent={selectedAgent} onSelect={handleAgentSelect}/>
                    {selectedAgent && (<AgentPersonalityCustomizer agentId={selectedAgent.id}/>)}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Task Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tasks.map((task) => {
                      const assignedAgent = agents.find(a => a.id === task.assignedTo);
                      return (
                        <Card key={task.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="font-medium">{task.title}</h3>
                                <p className="text-sm text-gray-500">
                                  Assigned to: {assignedAgent?.name}
                                </p>
                              </div>
                              <span
                                className="px-2 py-1 rounded-full text-xs capitalize"
                                style={{ // Dynamic styles based on task status
                                  backgroundColor: task.status === 'completed' ? '#4ade80' :
                                    task.status === 'in_progress' ? '#fbbf24' : '#e5e7eb',
                                  color: task.status === 'completed' ? '#166534' :
                                    task.status === 'in_progress' ? '#92400e' : '#374151'
                                }}
                              >
                                {task.status.replace('_', ' ')}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="collaboration" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Collaboration Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <LineChart width={800} height={400} data={collaborationData}>
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="timestamp"/>
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" name="Collaboration Score"/>
                  </LineChart>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
};

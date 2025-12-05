import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import React, { useState } from 'react';

interface Agent {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'error' | 'offline';
  type: string;
}

// Mock data - replace with actual store integration
const mockAgents: Agent[] = [
  { id: '1', name: 'Assistant Agent', status: 'active', type: 'assistant' },
  { id: '2', name: 'Research Agent', status: 'idle', type: 'research' },
  { id: '3', name: 'Code Agent', status: 'active', type: 'developer' },
];

export const AgentHub: React.FC = () => {
  const [agents] = useState<Agent[]>(mockAgents);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState<string>('details');

  const getStatusColor = (status: Agent['status']): string => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'idle':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      case 'offline':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Agent List */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Available Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`p-3 rounded-md cursor-pointer border transition-colors ${
                      selectedAgent?.id === agent.id
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-transparent'
                    }`}
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <div className="font-medium">{agent.name}</div>
                    <div className={`text-sm ${getStatusColor(agent.status)}`}>
                      Status: {agent.status}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Details */}
        <div className="md:col-span-2">
          <Card>
            <CardContent className="pt-6">
              {selectedAgent ? (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="personality">Personality</TabsTrigger>
                    <TabsTrigger value="skills">Skills</TabsTrigger>
                    <TabsTrigger value="training">Training</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details">
                    <div className="space-y-3">
                      <div>
                        <strong>Name:</strong> {selectedAgent.name}
                      </div>
                      <div>
                        <strong>Type:</strong> {selectedAgent.type}
                      </div>
                      <div>
                        <strong>Status:</strong>{' '}
                        <span className={getStatusColor(selectedAgent.status)}>
                          {selectedAgent.status}
                        </span>
                      </div>
                      <div>
                        <strong>ID:</strong> {selectedAgent.id}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="personality">
                    <p>Personality customization for {selectedAgent.name}</p>
                  </TabsContent>

                  <TabsContent value="skills">
                    <p>Skills marketplace for {selectedAgent.name}</p>
                  </TabsContent>

                  <TabsContent value="training">
                    <p>Training arena for {selectedAgent.name}</p>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Select an agent or create a new one to begin</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgentHub;

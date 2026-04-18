import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import React, { useEffect, useState } from 'react';

interface Agent {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'error' | 'offline';
  type: string;
}

export const AgentHub: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState<string>('details');

  useEffect(() => {
    let isMounted = true;

    const loadAgents = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const response = await fetch('/api/agents');
        if (!response.ok) {
          throw new Error(`Agent directory unavailable (${response.status})`);
        }

        const payload = await response.json();
        const rows = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
        const mapped: Agent[] = rows.map((row: any, index: number) => {
          const rawStatus = String(row?.status || 'offline').toLowerCase();
          const status: Agent['status'] =
            rawStatus === 'active' || rawStatus === 'idle' || rawStatus === 'error'
              ? rawStatus
              : 'offline';

          return {
            id: String(row?.id || row?.name || `agent-${index}`),
            name: String(row?.name || 'Unnamed Agent'),
            status,
            type: String(row?.type || row?.role || 'agent'),
          };
        });

        if (!isMounted) return;
        setAgents(mapped);
      } catch (error: any) {
        if (!isMounted) return;
        setAgents([]);
        setLoadError(error?.message || 'Agent directory unavailable');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAgents();
    return () => {
      isMounted = false;
    };
  }, []);

  const getStatusColor = (status: Agent['status']): string => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'idle':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      case 'offline':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Agent List */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Available Agents</CardTitle>
            </CardHeader>
            <CardContent>
              {loadError && (
                <div className="mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {loadError}
                </div>
              )}
              {loading && <div className="text-sm text-muted-foreground">Loading agents...</div>}
              {!loading && !loadError && agents.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No agents are currently available.
                </div>
              )}
              <div className="space-y-2">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`p-3 rounded-md cursor-pointer border transition-colors ${
                      selectedAgent?.id === agent.id
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-transparent hover:bg-muted/30 border-transparent'
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
                  <p className="text-muted-foreground mb-4">
                    Select an agent or create a new one to begin
                  </p>
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

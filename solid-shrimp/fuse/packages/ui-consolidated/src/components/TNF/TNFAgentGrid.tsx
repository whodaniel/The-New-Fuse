import React from 'react';
import { Badge } from '../components/Badge/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card/Card';
import { AGENT_EMOJIS, STATUS_COLORS, useTNFAgentStatus } from '../hooks/useTNFAgentStatus';

export const TNFAgentGrid: React.FC = () => {
  const { data, loading, error } = useTNFAgentStatus(5000);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-32" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-500">
        <CardContent className="text-red-500 p-4">
          Failed to connect to TNF Agent Registry
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Fleet Summary */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>🤖 {data?.totalAgents} Agents</span>
        <span>⚡ {data?.activeSessions} Active</span>
        <span>📋 {data?.queuedTasks} Queued Tasks</span>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data?.agents.map((agent) => (
          <Card key={agent.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-2xl">{AGENT_EMOJIS[agent.name] || '🤖'}</span>
                  {agent.name}
                </CardTitle>
                <div
                  className={`w-3 h-3 rounded-full ${STATUS_COLORS[agent.status] || 'bg-gray-500'}`}
                  title={agent.status}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={agent.status === 'idle' ? 'success' : 'warning'}>
                  {agent.status}
                </Badge>
                {agent.currentTask && (
                  <span className="text-xs text-gray-500 truncate">{agent.currentTask}</span>
                )}
              </div>

              {agent.capabilities.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {agent.capabilities.slice(0, 3).map((cap) => (
                    <span
                      key={cap}
                      className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded"
                    >
                      {cap}
                    </span>
                  ))}
                  {agent.capabilities.length > 3 && (
                    <span className="text-xs text-gray-400">+{agent.capabilities.length - 3}</span>
                  )}
                </div>
              )}

              <div className="text-xs text-gray-400">
                Last seen: {new Date(agent.lastHeartbeat).toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TNFAgentGrid;

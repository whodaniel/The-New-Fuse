import { useState, useCallback } from 'react';

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
}

export function useA2AAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);

  const refreshAgents = useCallback(async () => {
    // Mock implementation - in real scenario this would fetch from A2A service
    setAgents([]);
  }, []);

  const findAgentsByType = useCallback((type: string) => {
    return agents.filter(agent => agent.type === type);
  }, [agents]);

  return {
    agents,
    refreshAgents,
    findAgentsByType
  };
}
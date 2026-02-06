import { useCallback, useState } from 'react';

export interface DiscoveredAgent {
  id: string;
  name: string;
  capabilities: string[];
}

export function useA2ADiscovery() {
  const [discoveredAgents, setDiscoveredAgents] = useState<DiscoveredAgent[]>([]);

  const discoverAgents = useCallback(async (criteria?: any) => {
    // Mock implementation - in real scenario this would discover via A2A service
    setDiscoveredAgents([]);
  }, []);

  return {
    discoveredAgents,
    discoverAgents,
  };
}

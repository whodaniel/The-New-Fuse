import {
  agentService,
  type LocalAICapabilityStatus,
  type SwarmCapabilityStatus,
} from '@/services/AgentService';
import { useCallback, useEffect, useState } from 'react';

type FeatureCapabilities = {
  swarm: SwarmCapabilityStatus | null;
  localAI: LocalAICapabilityStatus | null;
};

export function useFeatureCapabilities() {
  const [capabilities, setCapabilities] = useState<FeatureCapabilities>({
    swarm: null,
    localAI: null,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [swarm, localAI] = await Promise.all([
        agentService.getSwarmCapabilityStatus(),
        agentService.getLocalAICapabilityStatus(),
      ]);
      setCapabilities({ swarm, localAI });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { capabilities, loading, refresh };
}

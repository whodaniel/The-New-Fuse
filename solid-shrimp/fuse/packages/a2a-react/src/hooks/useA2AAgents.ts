import { A2AMessageType, AgentRegistration } from '@the-new-fuse/a2a-core';
import { useCallback } from 'react';
import { useA2AContext } from '../A2AProvider';

export function useA2AAgents() {
  const { agents: rawAgents, sendMessage } = useA2AContext();

  const agents = (rawAgents || []) as AgentRegistration[];

  const refreshAgents = useCallback(async () => {
    if (sendMessage) {
      await sendMessage({
        type: A2AMessageType.REQUEST,
        payload: { action: 'list_agents' },
      });
    }
  }, [sendMessage]);

  const findAgentsByType = useCallback(
    (type: string) => {
      return agents.filter((agent) => agent.type === type);
    },
    [agents]
  );

  return {
    agents,
    refreshAgents,
    findAgentsByType,
  };
}

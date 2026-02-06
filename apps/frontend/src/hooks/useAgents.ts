import { useState } from 'react';

interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
}

const DEFAULT_AGENTS: Agent[] = [
  { id: '1', name: 'Assistant', type: 'general', status: 'active' },
  { id: '2', name: 'Code Expert', type: 'specialist', status: 'active' },
  { id: '3', name: 'Data Analyst', type: 'specialist', status: 'active' },
];

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const selectAgent = (agentId: string) => {
    setSelectedAgent(agentId);
  };

  const clearConversation = () => {
    setConversationId(null);
  };

  return {
    agents,
    selectedAgent,
    conversationId,
    selectAgent,
    clearConversation,
  };
}

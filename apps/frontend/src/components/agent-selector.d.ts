import { Agent } from '@/hooks/useAgents';
import React from 'react';
interface AgentSelectorProps {
  onSelect: (agent: Agent) => void;
  selectedAgent?: Agent | null;
}
export declare const AgentSelector: React.FC<AgentSelectorProps>;
export {};

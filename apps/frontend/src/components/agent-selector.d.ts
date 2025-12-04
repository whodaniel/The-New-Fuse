import React from 'react';
import { Agent } from '@/hooks/useAgents';
interface AgentSelectorProps {
    onSelect: (agent: Agent) => void;
    selectedAgent?: Agent | null;
}
export declare const AgentSelector: React.React.FC<AgentSelectorProps>;
export {};

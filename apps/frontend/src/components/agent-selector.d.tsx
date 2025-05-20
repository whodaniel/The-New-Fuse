import React from 'react';
import { Agent } from '@the-new-fuse/types';
interface AgentSelectorProps {
    agents: Agent[];
    onSelect: (agent: Agent) => void;
    selectedAgent?: Agent;
}
export declare const AgentSelector: React.React.FC<AgentSelectorProps>;
export {};

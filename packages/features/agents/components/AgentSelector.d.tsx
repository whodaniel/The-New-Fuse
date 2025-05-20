import { FC } from "react";
interface Agent {
    id: string;
    name: string;
    avatar?: string;
    status: online' | 'offline' | 'busy';
    type: string;
    capabilities: string[];
}
interface AgentSelectorProps {
    agents: Agent[];
    selectedAgent: Agent | null;
    onSelect: (agent: Agent) => void;
}
export declare const AgentSelector: FC<AgentSelectorProps>;
export {};
